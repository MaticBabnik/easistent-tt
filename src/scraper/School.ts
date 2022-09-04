import { dateToSchoolWeek, delayStart, getClasses, getClassrooms, getTimetable, LessonFlag, TimeSpan, Timetable, } from './parser'
import { } from "./ttTypes"

export default class School {
    private _classes: Record<string, number>
    private _teachers: Record<string, string>
    private _classrooms: Record<string, number>

    public resolveClassName(id: number) {
        for (let cname in this._classes) {
            if (this._classes[cname] === id) {
                return cname;
            }
        }
        return "UNKNOWN";
    }
    public resolveClassroomName(id: number) {
        for (let cname in this._classrooms) {
            if (this._classrooms[cname] === id) {
                return cname;
            }
        }
        return "UNKNOWN";
    }

    private resolveTeacherName(slug: string) {
        for (let tname in this._teachers) {
            if (this._teachers[tname] === slug) {
                return tname;
            }
        }
        return "UNKNOWN";
    }

    /**
     * Gets called by the SchoolWeek class to add newly encountered teachers to the list
     */
    public mergeTeachers(teachers: Record<string, string>) {
        this._teachers = { ...this._teachers, ...teachers };
    }

    constructor(public readonly id: number, public readonly key: string) {
        this._classes = {};
        this._classrooms = {};
        this._teachers = {};
    }

    public async setup() {
        let st = Date.now();

        //fetch classes and classrooms
        this._classes = await getClasses(this.key);
        this._classrooms = await getClassrooms(this.key);

        console.log(`Added ${Object.keys(this._classes).length} classes and ${Object.keys(this._classrooms).length} classrooms in ${Date.now() - st}ms`);
    }

    public get currentWeek() {
        return dateToSchoolWeek(new Date());
    }
    public get classrooms() {
        return this._classrooms;
    }
    public get classes() {
        return this._classes;
    }
    public get teachers() {
        return this._teachers;
    }
}