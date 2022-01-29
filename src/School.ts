import { delayStart, getClasses, getClassrooms, getTimetable, LessonFlag, TimeSpan, Timetable, } from './parser'

interface baseLesson {
    name: string,
    teacher: string,
    flags: LessonFlag[]
}

interface RoomLesson extends baseLesson {
    className: string
}
interface ClassLesson extends baseLesson {
    room: string
}

interface Day<T> {
    lessons: T[][]
}
interface ClassWeeklyTimetable {
    className: string,
    week: number,
    scheduleDefinitions: TimeSpan[],
    days: Day<ClassLesson>[]
}

interface RoomWeeklyTimetable {
    room: string,
    week: number,
    scheduleDefinitions: TimeSpan[],
    days: Day<RoomLesson>[]
}

export default class School {
    public readonly id: number;
    public readonly publicUrlId: string;

    private classrooms: { [index: string]: number };
    private classes: { [index: string]: number };
    public classTimetables: Map<string, ClassWeeklyTimetable>;
    public classroomTimetables: Map<string, RoomWeeklyTimetable>;

    private classNameFromId(id: number) {
        for (let cname in this.classes) {
            if (this.classes[cname] === id) {
                return cname;
            }
        }
        return "UNKNOWN";
    }
    private roomNameFromId(id: number) {
        for (let cname in this.classrooms) {
            if (this.classrooms[cname] === id) {
                return cname;
            }
        }
        return "UNKNOWN";
    }

    constructor(id: number, publicUrlId: string) {
        this.id = id;
        this.publicUrlId = publicUrlId;

        this.classes = {};
        this.classrooms = {};

        this.classTimetables = new Map<string, ClassWeeklyTimetable>();
        this.classroomTimetables = new Map<string, RoomWeeklyTimetable>();
    }

    public async setup() {
        let st = Date.now();

        //fetch classes and classrooms
        this.classes = await getClasses(this.publicUrlId);
        this.classrooms = await getClassrooms(this.publicUrlId);

        console.log(`Added ${Object.keys(this.classes).length} classes and ${Object.keys(this.classrooms).length} classrooms in ${Date.now() - st}ms`)

        //run the initial scrape
        await this.scrapeAll();

        //schedule next scrape
        console.log('Set to re-scrape every 5 minutes');
        setInterval(() => { this.scrapeAll() }, 5 * 60 * 1000);
    }

    private parseToUsable(classtt: Timetable[], clasroomtt: Timetable[]) {
        this.classTimetables = new Map(classtt.map(tt => {
            const { scheduleDefinitions, week } = tt

            const className = this.classNameFromId(tt.classId ?? -1)

            const days: Day<ClassLesson>[] = tt.days.map(day => ({
                lessons:
                    day.lessons.map(period =>
                        period.map(lesson => ({
                            name: lesson.name ?? "?",
                            teacher: lesson.teacher ?? "?",
                            flags: lesson.flags,
                            room: (lesson.room as string) ?? "?"
                        }))
                    )
            }));

            const ctt: ClassWeeklyTimetable = {
                className,
                scheduleDefinitions,
                week,
                days
            };

            return [className, ctt];
        }));

        this.classroomTimetables = new Map(clasroomtt.map(tt => {
            const { scheduleDefinitions, week } = tt;

            const room = this.roomNameFromId(tt.classroomId ?? -1);

            const days: Day<RoomLesson>[] = tt.days.map((day, dayIndex) => ({
                lessons:
                    day.lessons.map((period, periodIndex) =>
                        period.map(lesson => {
                            //find the lesson in the classTimetable map

                            const fullLessonObj = this.classTimetables
                                .get(lesson.name ?? "")
                                ?.days?.[dayIndex]
                                ?.lessons?.[periodIndex]
                                .find(x => x.teacher === lesson.teacher);

                            return {
                                name: fullLessonObj?.name ?? "UNKNOWN",
                                teacher: lesson.teacher ?? "?", // teacher is in the same field
                                flags: lesson.flags, //flags are the same for both rooms and classes
                                className: lesson.name ?? "???" //the name is actually the title element
                            };
                        })
                    )
            }));

            const rtt: RoomWeeklyTimetable = {
                room,
                scheduleDefinitions,
                week,
                days
            }

            return [room, rtt]
        }))

        return;
    }

    private async scrapeAll() {
        let st = Date.now();

        let cr = Object.values(this.classrooms);
        let cs = Object.values(this.classes);

        const r = await Promise.allSettled([
            Promise.allSettled(cr.map((classroom, i) => delayStart(getTimetable, i * 100, 0, classroom, this.id))),
            Promise.allSettled(cs.map(((sClass, i) => delayStart(getTimetable, i * 100 + 50, sClass, 0, this.id))))
        ]);

        if (r[0].status == 'rejected' || r[1].status == 'rejected') return;
        const rr = r as PromiseFulfilledResult<PromiseSettledResult<Timetable>[]>[]
        console.log(`Settled all promises in: ${Date.now() - st}ms`);
        console.log(`\tClasses:    [ ${r[1].value.filter(x => x.status == 'fulfilled').length} / ${cs.length} ]`)
        console.log(`\tClassrooms: [ ${r[0].value.filter(x => x.status == 'fulfilled').length} / ${cr.length} ]`)

        const [clasroomtt, classtt] = rr.map(
            ttCategory => (ttCategory.value.filter((tt) => tt.status === 'fulfilled') as PromiseFulfilledResult<Timetable>[])
                .map(resTt => resTt.value));

        this.parseToUsable(classtt, clasroomtt);
    }
}