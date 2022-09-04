import { ObjectType, Field, ClassType, registerEnumType, Int, ArgsType } from "type-graphql"
import { Max, Min } from "class-validator";
import * as Parser from "../scraper/parser"
import * as Timetable from "../scraper/ttTypes"

@ObjectType()
export class FullTeacher {
    @Field()
    name: string;
    @Field()
    slug: string;
}

@ObjectType()
export class TimeSpan implements Parser.TimeSpan {
    @Field()
    from: string;
    @Field()
    to: string;
}

interface Day<TLesson> {
    lessons: TLesson[][];
    date: string;
}

export function BaseDay<TLesson extends Timetable.BaseLesson>(lessonType: ClassType<TLesson>) {
    // `isAbstract` decorator option is mandatory to prevent registering in schema
    @ObjectType({ isAbstract: true })
    abstract class BaseDay implements Day<TLesson> {
        @Field(type => [[lessonType]])
        lessons: TLesson[][];

        @Field()
        date: string;
    }
    return BaseDay;
}

registerEnumType(Parser.LessonFlag, {
    name: "LessonFlag"
})

@ObjectType({ isAbstract: true })
export abstract class BaseLesson {
    @Field()
    name: string;
    @Field(type => [Parser.LessonFlag])
    flags: Parser.LessonFlag[];
}

@ObjectType()
export class TeacherLesson extends BaseLesson implements Timetable.TeacherLesson {
    @Field()
    className: string;
    @Field()
    room: string;
}

@ObjectType()
export class ClassLesson extends BaseLesson implements Timetable.ClassLesson {
    @Field()
    room: string;
    @Field()
    teacher: string;
}

@ObjectType()
export class RoomLesson extends BaseLesson implements Timetable.RoomLesson {
    @Field()
    className: string;
    @Field()
    teacher: string;
}

@ObjectType()
export class TeacherDay {
    @Field(type => [[TeacherLesson]])
    lessons: TeacherLesson[][];
    @Field()
    date: string;
}

@ObjectType()
export class ClassDay {
    @Field(type => [[ClassLesson]])
    lessons: ClassLesson[][];
    @Field()
    date: string;
}

@ObjectType()
export class RoomDay {
    @Field(type => [[RoomLesson]])
    lessons: RoomLesson[][];
    @Field()
    date: string;
}

@ObjectType()
export class TeacherWeek implements Timetable.TeacherWeeklyTimetable {
    @Field(type=> Int)
    week: number;
    @Field(type => [TimeSpan])
    scheduleDefinitions: TimeSpan[];
    @Field(type => [TeacherDay])
    days: TeacherDay[];
    @Field()
    teacher: string;
}

@ObjectType()
export class ClassWeek implements Timetable.ClassWeeklyTimetable {
    @Field(type=> Int)
    week: number;
    @Field(type => [TimeSpan])
    scheduleDefinitions: TimeSpan[];
    @Field(type => [ClassDay])
    days: ClassDay[];
    @Field()
    className: string;
}

@ObjectType()
export class RoomWeek implements Timetable.RoomWeeklyTimetable {
    @Field(type=> Int)
    week: number;
    @Field(type => [TimeSpan])
    scheduleDefinitions: TimeSpan[];
    @Field(type => [RoomDay])
    days: RoomDay[];
    @Field()
    room: string;
}

@ArgsType()
export class WeekArgs {
    @Min(1)
    @Max(52)
    @Field(type => Int, {nullable:true})
    week?: number;
}

export default [
    FullTeacher,
    TimeSpan,
    TeacherLesson,
    ClassLesson,
    RoomLesson,
    TeacherWeek,
    ClassWeek,
    RoomWeek
];