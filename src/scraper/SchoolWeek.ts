import School from "./School";
import { delayStart, getTimetable, Timetable } from "./parser";
import { ClassWeeklyTimetable, TeacherWeeklyTimetable, RoomWeeklyTimetable, Day, ClassLesson, TeacherLesson, RoomLesson } from "./ttTypes"
import { slugifyTeacher } from "./util";

interface TimetableBatch {
    classroomTimetables: Timetable[],
    classTimetables: Timetable[],
    t: number
}

export class SchoolWeek {

    public classTimetables = new Map<string, ClassWeeklyTimetable>();
    public teacherTimetables = new Map<string, TeacherWeeklyTimetable>();
    public classroomTimetables = new Map<string, RoomWeeklyTimetable>();
    public rebuildTime = Date.now();

    constructor(protected readonly school: School, public readonly week: number) {
    }

    protected async fetch(): Promise<TimetableBatch> {
        const startTime = Date.now();
        const roomList = Object.values(this.school.classrooms);
        const classList = Object.values(this.school.classes);

        const id = this.school.id;

        const r = await Promise.allSettled([
            Promise.allSettled(roomList.map((roomId, i) => delayStart(getTimetable, i * 100, 0, roomId, id, this.week))),
            Promise.allSettled(classList.map(((classId, i) => delayStart(getTimetable, i * 100 + 50, classId, 0, id, this.week))))
        ]);

        if (r[0].status == 'rejected' || r[1].status == 'rejected') throw `Couldn't fetch timetables for ${this.school.id} week ${this.week}`;
        const rr = r as PromiseFulfilledResult<PromiseSettledResult<Timetable>[]>[]
        console.log(`[${id},${this.week}] Settled all promises in: ${Date.now() - startTime}ms`);
        console.log(`\tClasses:    [ ${r[1].value.filter(x => x.status == 'fulfilled').length} / ${classList.length} ]`)
        console.log(`\tClassrooms: [ ${r[0].value.filter(x => x.status == 'fulfilled').length} / ${roomList.length} ]`)

        const [classroomTimetables, classTimetables] = rr.map(
            ttCategory => (ttCategory.value.filter((tt) => tt.status === 'fulfilled') as PromiseFulfilledResult<Timetable>[])
                .map(resTt => resTt.value));

        return {
            classroomTimetables,
            classTimetables,
            t: Date.now()
        }
    }

    public registerTeachers(data: TimetableBatch) {
        const teachersNames =
            [...new Set(
                data.classTimetables.flatMap(tt => tt.days.flatMap(day => day.lessons.flatMap(period => period.flatMap(lesson => lesson.teacher))))
            )].filter(x => x !== undefined) as string[];

        const teachers = teachersNames.reduce<Record<string, string>>((p, c) => {
            p[slugifyTeacher(c)] = c;
            return p;
        }, {});
        this.school.mergeTeachers(teachers);
    }

    protected buildClassTimetables(data: TimetableBatch) {
        this.classTimetables = new Map(data.classTimetables.map(tt => {
            const { scheduleDefinitions, week } = tt

            const className = this.school.resolveClassName(tt.classId ?? -1)

            const days: Day<ClassLesson>[] = tt.days.map(day => ({
                date: day.date,
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
    }

    protected buildClassroomTimetables(data: TimetableBatch) {
        //parse the classroom timetables
        this.classroomTimetables = new Map(data.classroomTimetables.map(tt => {
            const { scheduleDefinitions, week } = tt;

            const room = this.school.resolveClassroomName(tt.classroomId ?? -1);

            const days: Day<RoomLesson>[] = tt.days.map((day, dayIndex) => ({
                date: day.date,
                lessons:
                    day.lessons.map((period, periodIndex) =>
                        period.map(lesson => {
                            //find the lesson in the classTimetable map

                            const fullLessonObj = this.classTimetables
                                .get(lesson.name ?? "")
                                ?.days?.[dayIndex]
                                ?.lessons?.[periodIndex]
                                ?.find(x => x.teacher === lesson.teacher);

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
        }));
    }

    protected buildTeacherTimetables(data: TimetableBatch, teachers: Record<string, string>) {
        const { scheduleDefinitions } = data.classTimetables[0];
        const nDays = data.classTimetables[0]?.days?.length ?? 5;
        const teacherNames = Object.values(teachers);
        this.teacherTimetables = new Map<string, TeacherWeeklyTimetable>();
        teacherNames.forEach(teacher => { //construct the teacher timetables
            this.teacherTimetables.set(teacher, {
                teacher: teacher,
                week: this.week,
                scheduleDefinitions,
                days: [...Array(nDays)].map((d, di) => ({ date: [...this.classTimetables.values()][0].days[di].date, lessons: [...Array(scheduleDefinitions.length)].map(x => Array()) }))
            })
        });

        this.classTimetables.forEach(classtt => { //fill in the teacher timetables
            classtt.days.forEach((day, dayIndex) => {
                day.lessons.forEach((period, periodIndex) => {
                    period.forEach(lesson => {
                        if (teacherNames.includes(lesson.teacher)) {
                            const { name, room, flags } = lesson
                            this.teacherTimetables
                                .get(lesson.teacher)
                                ?.days[dayIndex]?.lessons[periodIndex]
                                ?.push({ name, flags, room, className: classtt.className });
                        }
                    })
                });
            });
        });
    }

    public async rebuild() {
        console.log(`Rebuilding ${this.week}`)
        const data = await this.fetch();
        this.rebuildTime = data.t;
        this.registerTeachers(data);

        const { teachers } = this.school;

        this.buildClassTimetables(data);
        this.buildClassroomTimetables(data);
        this.buildTeacherTimetables(data, teachers);
        console.log(`Rebuilt ${this.week}`)

        return this;
    }

    public getTeacherTimteableBySlug(slug:string) {
        const teacher = this.school.teachers[slug];
        if (!teacher) throw "Invalid teacher";
        return this.teacherTimetables.get(teacher);
    }
}