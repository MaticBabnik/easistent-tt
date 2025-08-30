import slugify from "slugify";
import { Fetcher } from "./fetcher";
import {
    Option,
    ParseResult,
    ParsedEvent,
    Parser,
    Period,
    TeacherOption,
} from "./parser";
import { NotFoundError } from "elysia";
import { EventFlag } from "./eventFlags";
import { type Event as IcalEvent, generateCalendar } from "../util/ical";
import { Lang, getDescription, getFlagString } from "../util/lang";

export type SchoolError = {
    where: string;
    what: string;
    when: Date;
};

export type CacheEntry<T> = {
    since: number;
    ttl: number;
    data: T;
};

export type OutEvent = {
    title: {
        long: string;
        short: string;
    };
    classKey: string;
    flags: EventFlag[];
    teacherKey?: string;
    classroomKey?: string;
    groupName?: string;
    dayIndex: number;
    periodIndex: number;
};

export type WeekData = {
    week: number;
    dates: Date[];
    hourOffsets: Period[];
    events: OutEvent[];
    scrapedAt: number;
};

// type IcalFilterData = {
//     teachers?: string;
//     rooms?: string;
//     classes?: string;
// };

// type IcalEvent = IcalFilterData & Event;

const DEFAULT_TTL = 30 * 60 * 1000;
const SCRAPE_INTERVAL = DEFAULT_TTL - 30_000;

export class School {
    public errors: SchoolError[] = [];

    protected schoolYearEpoch: Date = new Date(0);

    protected parser = new Parser();
    protected fetcher: Fetcher;

    protected classesByKey = new Map<string, Option>();
    protected classesByName = new Map<string, Option>();

    protected roomsByKey = new Map<string, Option>();
    protected roomsByName = new Map<string, Option>();

    protected teachersByKey = new Map<string, TeacherOption>();
    protected teachersByName = new Map<string, TeacherOption>();

    protected cache = new Map<number, CacheEntry<WeekData>>();

    protected name = "";

    public get Name() {
        return this.name;
    }

    public get Classes() {
        return [...this.classesByKey.values()];
    }

    public get Rooms() {
        return [...this.roomsByKey.values()];
    }

    public get Teachers() {
        return [...this.teachersByKey.values()];
    }

    public async scrapeWeek(n: number): Promise<WeekData> {
        console.time(`School.scrapeWeek(${n})`);
        const scrapedAt = Date.now();
        const timetablesRequests = await Promise.all(
            [...this.classesByKey.values()].map(async ({ key, id }) => {
                const html = await this.fetcher.getTimetable({
                    classId: id,
                    week: n,
                });

                const result = this.parser.parseTimetable(html, key);

                return { key, result };
            })
        );

        const successful = timetablesRequests
            .filter((x) => typeof x.result !== "string")
            .map((x) => x.result as ParseResult);

        timetablesRequests
            .filter((x) => typeof x.result === "string")
            .forEach((fail) => {
                const { display } = this.classesByKey.get(fail.key)!;
                this.classesByKey.delete(fail.key);
                this.classesByName.delete(display);

                this.errors.push({
                    what: fail.result as string,
                    when: new Date(),
                    where: `Fetching data for class '${fail.key}' (week ${n})`,
                });
            });

        const weekEvents = successful.flatMap((x) => x.events);
        this.mergeTeachers(weekEvents);

        const events = weekEvents
            .map<OutEvent | undefined>((evt) => {
                return {
                    periodIndex: evt.periodIndex,
                    dayIndex: evt.dayIndex,

                    classKey: evt.class,
                    title: {
                        long: evt.longTitle ?? evt.shortTitle,
                        short: evt.shortTitle,
                    },
                    flags: evt.flags,
                    classroomKey: evt.classroom
                        ? this.roomsByName.get(evt.classroom)?.key
                        : undefined,
                    groupName: evt.group,
                    teacherKey: evt.teacherShort
                        ? this.teachersByName.get(evt.teacherShort)?.key
                        : undefined,
                };
            })
            .filter((x) => !!x) as OutEvent[];

        console.timeEnd(`School.scrapeWeek(${n})`);

        return {
            week: n,
            dates: successful[0].dates,
            events,
            hourOffsets: successful[0].hourOffsets,
            scrapedAt,
        };
    }

    protected convertToIcalEvents(
        w: WeekData,
        filter: (e: OutEvent) => boolean,
        lang: Lang = "en"
    ): IcalEvent[] {
        const iCalTimeSlots = w.dates.map((date) =>
            w.hourOffsets.map(({ startOffset, endOffset }) => ({
                startDate: new Date(date.valueOf() + startOffset),
                endDate: new Date(date.valueOf() + endOffset),
            }))
        );
        let i = 0;
        return w.events.filter(filter).map((ev) => {
            const teacher = this.teachersByKey.get(ev.teacherKey ?? ""),
                room = this.roomsByKey.get(ev.classroomKey ?? ""),
                sclass = this.classesByKey.get(ev.classKey);

            return {
                // Unique identifier
                uid: `eatt-${this.id}-${w.week}-${ev.dayIndex}-${ev.periodIndex
                    }-${ev.title.short}-${i++}`,

                // Start and end time
                ...iCalTimeSlots[ev.dayIndex][ev.periodIndex],

                status: ev.flags.includes(EventFlag.Canceled)
                    ? "CANCELLED"
                    : "CONFIRMED",

                title: ev.title.short + getFlagString(ev.flags, lang),

                location: room?.display,

                categories: [
                    teacher?.fullName,
                    sclass?.display,
                    room?.display,
                ].filter((x) => !!x) as string[],

                description: getDescription(
                    ev,
                    teacher?.fullName,
                    sclass?.display,
                    room?.display,
                    lang
                ),
            };
        });
    }

    public async getWeek(n?: number, force = false): Promise<WeekData> {
        if (typeof n !== "number") n = this.getWeekForDate();
        if (n === 0) n = 1;

        if (!force) {
            const cached = this.cache.get(n);
            if (cached && Date.now() - cached.since <= cached.ttl) {
                return cached.data;
            }
        }

        // cache is outdated or non-existent
        const data = await this.scrapeWeek(n);

        this.cache.set(n, {
            since: Date.now(),
            ttl: DEFAULT_TTL,
            data,
        });

        return data;
    }

    constructor(protected id: string, protected key: string) {
        this.fetcher = new Fetcher(id, key);
    }

    private mergeTeachers(from: ParsedEvent[]) {
        for (const ev of from) {
            if (!ev.teacherShort) continue;
            if (this.teachersByName.has(ev.teacherShort)) continue;

            let longestName = ev.teacherLong ?? ev.teacherShort;

            if (longestName === "Aiken Tine Ahac") {
                longestName = "Tine Ahac"; // Zivjo Aiken :)
            }

            const key = slugify(longestName, { lower: true });
            const initials = longestName
                .split(" ")
                .map((x) => `${x.substring(0, 1)}.`)
                .join(" ");

            const teacher: TeacherOption = {
                key,
                short: ev.teacherShort,
                fullName: longestName,
                initials,
            };

            this.teachersByKey.set(key, teacher);
            this.teachersByName.set(ev.teacherShort, teacher);
        }
    }

    private static readonly WEEK = 1000 * 60 * 60 * 24 * 7;

    /**
        This achieves two things: \
            + 1 to start with week 1 \
            + 1/7 to switch timetables early (on sunday, instead of monday) 
    */
    private static readonly FLOOR_OFFSET = 8 / 7;

    public getWeekForDate(date = new Date()) {
        const now = date.valueOf();
        const then = this.schoolYearEpoch.valueOf();
        const week = (now - then) / School.WEEK + School.FLOOR_OFFSET;

        return Math.floor(week);
    }

    public ical(
        type: "teachers" | "rooms" | "classes",
        key: string,
        lang: Lang = "en"
    ) {
        const MAPNAME_TO_EVENTKEY: Record<typeof type, keyof OutEvent> = {
            classes: "classKey",
            rooms: "classroomKey",
            teachers: "teacherKey",
        };

        const repo = this[`${type}ByKey`];
        if (!repo.has(key)) throw new NotFoundError();

        const icalEvents = [...this.cache.values()]
            .filter((x) => Date.now() - x.since <= x.ttl)
            .flatMap((x) =>
                this.convertToIcalEvents(
                    x.data,
                    (x) => x[MAPNAME_TO_EVENTKEY[type]] == key,
                    lang
                )
            );

        return generateCalendar(icalEvents);
    }

    public async init() {
        console.time("School.init");
        const [classes, rooms] = await Promise.all([
            this.fetcher.getClassesPage(),
            this.fetcher.getRoomsPage(),
        ]);

        this.name = this.parser.parseName(classes);

        console.log(`School ${this.id}:${this.key} is "${this.name}"`);

        this.parser.parseOptions(classes).forEach((x) => {
            this.classesByKey.set(x.key, x);
            this.classesByName.set(x.display, x);
        });

        this.parser.parseOptions(rooms).forEach((x) => {
            this.roomsByKey.set(x.key, x);
            this.roomsByName.set(x.display, x);
        });

        const timetablesRequests = await Promise.all(
            [...this.classesByKey.values()].map(async ({ key, id }) => {
                const html = await this.fetcher.getTimetable({
                    classId: id,
                    week: 1,
                });

                const result = this.parser.parseTimetable(html, key);

                return { key, result };
            })
        );

        const successful = timetablesRequests
            .filter((x) => typeof x.result !== "string")
            .map((x) => x.result as ParseResult);

        timetablesRequests
            .filter((x) => typeof x.result === "string")
            .forEach((fail) => {
                const { display } = this.classesByKey.get(fail.key)!;
                this.classesByKey.delete(fail.key);
                this.classesByName.delete(display);

                this.errors.push({
                    what: fail.result as string,
                    when: new Date(),
                    where: `Fetching/parsing initial data for class '${fail.key}'`,
                });
            });

        const weekEvents = successful.flatMap((x) => x.events);

        this.mergeTeachers(weekEvents);

        // ASSUMPTION: WEEKS ALWAYS START WITH MONDAY (i hate mondays)
        this.schoolYearEpoch = successful[0].dates[0];
        console.log("School year epoch is:", this.schoolYearEpoch);
        console.log("Current week is: ", this.getWeekForDate());
        console.timeEnd("School.init");
    }

    protected asRunning = false;
    public startAutoscrape() {
        if (this.asRunning) return;
        this.asRunning = true;

        const as = () => {
            console.log("Refreshing cache");
            const week = this.getWeekForDate();

            const from = Math.max(1, week - 1);
            const to = Math.min(52, week + 1);

            for (let i = from; i <= to; i++) {
                this.getWeek(i, true);
            }
        };
        setInterval(as, SCRAPE_INTERVAL);
        as();
    }
}
