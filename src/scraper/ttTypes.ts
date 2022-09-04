import { LessonFlag, TimeSpan, } from './parser'

export interface BaseLesson {
    name: string,
    flags: LessonFlag[]
}

export interface RoomLesson extends BaseLesson {
    className: string,
    teacher: string,
}
export interface ClassLesson extends BaseLesson {
    room: string,
    teacher: string,
}
export interface TeacherLesson extends BaseLesson {
    room: string,
    className: string
}

export interface Day<T> {
    date: string,
    lessons: T[][]
}
export interface ClassWeeklyTimetable {
    className: string,
    week: number,
    scheduleDefinitions: TimeSpan[],
    days: Day<ClassLesson>[]
}

export interface RoomWeeklyTimetable {
    room: string,
    week: number,
    scheduleDefinitions: TimeSpan[],
    days: Day<RoomLesson>[]
}

export interface TeacherWeeklyTimetable {
    teacher: string,
    week: number,
    scheduleDefinitions: TimeSpan[],
    days: Day<TeacherLesson>[]
}
