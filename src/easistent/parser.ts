import { type HTMLElement, type HTMLOptionElement, parseHTML } from "linkedom";
import slugify from "slugify";
import { timeToOffset } from "../util/time";
import { type EventFlag, FLAG_MAP } from "./eventFlags";
import { strcan } from "../util";

export type Option = {
    display: string;
    key: string;
    id: number;
};

export type TeacherOption = {
    key: string;
    short: string;
    initials: string;
    fullName: string;
};

export type Period = {
    startOffset: number;
    endOffset: number;
};

export type Event = {
    periodIndex: number;
    dayIndex: number;
};

export type RawEvent = Event & {
    target: HTMLElement;
    key: string;
};

export type ParsedEvent = {
    class: string;
    flags: EventFlag[];
    shortTitle: string;
    longTitle?: string;
    teacherLong?: string;
    teacherShort?: string;
    classroom?: string;
    groups: string[];
} & Event;

export type ParseResult = {
    dates: Date[];
    hourOffsets: Period[];
    events: ParsedEvent[];
};

function makeOption(k: string, v: number): Option {
    return {
        display: k,
        key: slugify(k, { lower: true }),
        id: v,
    };
}

function* childrenInRange(el: HTMLElement, start = 0, end = 0) {
    const max = el.childElementCount;

    if (start > max || start < 0) throw new Error("start is out of bounds");
    if (end >= max) throw new Error("end is out of bounds");
    if (end <= 0) end = max - 1 - end;

    for (let i = start; i <= end; i++) {
        yield el.children[i];
    }
}

export class Parser {
    public parseOptions(html: string): Option[] {
        const { document } = parseHTML(html);

        const options = [
            ...document.querySelectorAll("#id_parameter>option"),
        ] as unknown as HTMLOptionElement[];

        if (options.length === 0) throw new Error("Error parsing options");

        return options.map((x) => makeOption(x.innerHTML.trim(), parseInt(x.value, 10)));
    }

    public parseName(html: string): string {
        const { document } = parseHTML(html);
        const schoolNameElement = document.querySelector(
            "#okvir_glavni > .urnik_title"
        ) as unknown as HTMLSpanElement;

        return schoolNameElement.innerText.trim();
    }

    private static parseDates(mainTable: HTMLElement, startDate: Date): Date[] {
        return [...mainTable.querySelectorAll("thead .date")].map(
            (_, i) =>
                new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate() + i)
        );
    }

    private static parseHours(mainTable: HTMLElement): Period[] {
        return [...mainTable.querySelectorAll(".potek-ure")].map((x) => {
            const [start, end] = x.innerHTML.trim().split(" - ");

            return {
                startOffset: timeToOffset(start),
                endOffset: timeToOffset(end),
            };
        });
    }

    private static getEvents(mainTable: HTMLElement, key: string): RawEvent[] {
        return childrenInRange(mainTable, 1)
            .flatMap((row, periodIndex) =>
                childrenInRange(row, 1).flatMap((cell, dayIndex) =>
                    [...cell.querySelectorAll(".ednevnik-seznam_ur_teden-urnik")].map((target) => ({
                        periodIndex,
                        dayIndex,
                        target: target,
                        key,
                    }))
                )
            )
            .toArray();
    }

    private static parseEventHtml(e: RawEvent): ParsedEvent {
        // le cursed
        const { dayIndex, key, periodIndex, target } = e;

        const flagElements = [...target.querySelectorAll(".wl-tag-xs")] as HTMLDivElement[];

        const titleElement =
            target.querySelector(".ednevnik-title>span") ?? target.querySelector(".ednevnik-title");

        const shortTitle = strcan(titleElement?.innerText) ?? "Unknown";
        const longTitle = strcan(titleElement?.attributes?.title?.value) ?? shortTitle;

        let teacherShort: string | undefined;
        let classroom: string | undefined;
        let teacherLong: string | undefined;

        const subtitleElements = [
            ...target.querySelectorAll(".ednevnik-subtitle"),
        ] as HTMLDivElement[];

        const teacherAndRoomElement = subtitleElements.at(0);
        const groupElements = subtitleElements.slice(1);

        const teacherAndClassroom = teacherAndRoomElement?.innerText
            ?.split(", ")
            ?.map((x) => x.trim()) ?? [];

        if (teacherAndClassroom.length === 2) {
            teacherShort = strcan(teacherAndClassroom?.[0]);
            classroom = strcan(teacherAndClassroom?.[1]);
            teacherLong = strcan(teacherAndRoomElement?.title);
        } else if (teacherAndRoomElement) {
            // **Ucilnice** ${ucilnice} workaround for "dogodek"
            const olderSibling = teacherAndRoomElement.previousElementSibling as HTMLDivElement;
            
            if (olderSibling?.className === 'ednevnik-title') {
                const potentialClassrooms = teacherAndRoomElement.innerText.split(',').map(x => x.trim()).filter(x => x && x.length > 0);

                if (potentialClassrooms.length === 1) {
                    classroom = strcan(potentialClassrooms[0]);
                } else {
                    console.error("Could not parse classroom for", { dayIndex, key, periodIndex });
                }
            }
        }

        const flags = new Set(flagElements.flatMap((x) => [...x.classList]))
            .values()
            .map((x) => FLAG_MAP[x])
            .filter<EventFlag>((x) => !!x)
            .toArray();

        const groups = groupElements.map((x) => strcan(x.innerText)).filter((x) => typeof x === "string");

        return {
            dayIndex,
            periodIndex,
            class: key,
            flags,
            shortTitle,
            longTitle,
            teacherLong,
            teacherShort,
            classroom,
            groups,
        };
    }

    // biome-ignore lint/suspicious/noControlCharactersInRegex: u001f is used as seperator
    static readonly DATE_HEADER_REGEX = /^(\d+)\u001f(\d+)\.\s*(\d+)\.\s*(\d+)\u001f/u;

    protected parseWeek(html: string): { startDate: Date; number: number } {
        const match = html.match(Parser.DATE_HEADER_REGEX);

        if (match === null) {
            throw new Error("HTML is missing the week header");
        }

        const [week, day, month, year] = match.slice(1, 5).map((x) => parseInt(x, 10));

        return {
            startDate: new Date(year, month - 1, day),
            number: week,
        };
    }

    public parseTimetable(html: string, key: string): ParseResult | string {
        const { document } = parseHTML(html);

        const week = this.parseWeek(html);

        const mainTable = document.querySelector(
            "table.ednevnik-seznam_ur_teden"
        ) as unknown as HTMLElement;

        if (!mainTable) return "Could not find main table!";

        const dates = Parser.parseDates(mainTable, week.startDate);
        const hourOffsets = Parser.parseHours(mainTable);
        const events = Parser.getEvents(mainTable, key).map((x) => Parser.parseEventHtml(x));

        return {
            dates,
            hourOffsets,
            events,
        };
    }
}
