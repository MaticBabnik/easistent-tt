import { Resolver, Query, Arg, Args, Int } from "type-graphql"
import { Inject, Service } from "typedi";
import { ConfigService } from "../services/ConfigService";
import { ClassWeek, FullTeacher, RoomWeek, TeacherWeek, WeekArgs } from "../schemas/Types";
import { SchoolService } from "../services/SchoolService";


@Service()
@Resolver()
export class SchoolResolver {
    @Inject()
    protected school: SchoolService;

    @Query(returns => [String])
    async classes() {
        return this.school.classes;
    }

    @Query(returns => [String])
    async classrooms() {
        return this.school.classrooms;
    }

    @Query(returns => [FullTeacher])
    async teachers() {
        return this.school.teachers;
    }

    @Query(returns => TeacherWeek)
    async teacherWeek(
        @Arg("slug") slug: string,
        @Args() week: WeekArgs
    ) {
        const schoolWeek = await this.school.getWeek(week.week);
        const teacherWeek = schoolWeek.teacherTimetables.get(slug);
        if (!teacherWeek)
            throw new Error('Teacher not found');
        return teacherWeek;
    }

    @Query(returns => ClassWeek)
    async classWeek(
        @Arg("name") name: string,
        @Args() week: WeekArgs
    ) {
        const schoolWeek = await this.school.getWeek(week.week);
        const classWeek = schoolWeek.classTimetables.get(name);
        if (!classWeek)
            throw new Error('Class not found');
        console.log(classWeek);
        return classWeek;
    }

    @Query(returns => RoomWeek)
    async roomWeek(
        @Arg("name") name: string,
        @Args() week: WeekArgs
    ) {
        const schoolWeek = await this.school.getWeek(week.week);
        const roomWeek = schoolWeek.classroomTimetables.get(name);
        if (!roomWeek)
            throw new Error('Room not found');
        return roomWeek;
    }

    @Query(returns => Int)
    async currentWeek() {
        return this.school.currentWeek;
    }
}