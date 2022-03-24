import { Config } from "./config";
import Fastify, { FastifyRequest, FastifyReply } from 'fastify'
import mercurius, { IResolvers } from 'mercurius'
import mercuriusCodegen from 'mercurius-codegen'
import { loadSchemaFiles } from 'mercurius-codegen/dist/schema'
import * as School from './School'

const buildContext = async (req: FastifyRequest, _reply: FastifyReply) => {
    return {
        authorization: req.headers.authorization
    }
}

type PromiseType<T> = T extends PromiseLike<infer U> ? U : T
declare module 'mercurius' {
    interface MercuriusContext extends PromiseType<ReturnType<typeof buildContext>> { }
}

interface Data {
    classes: string[],
    classrooms: string[],
    teachers: string[],
    classTimetables: { [index: string]: School.ClassWeeklyTimetable },
    classroomTimetables: { [index: string]: School.RoomWeeklyTimetable },
    teacherTimetables: { [index: string]: School.TeacherWeeklyTimetable },
}

const cache: Data = {
    classes: [],
    classrooms: [],
    teachers: [],
    classTimetables: {},
    classroomTimetables: {},
    teacherTimetables: {}
};

export default function main(cfg: Config) {
    console.log(`Starting server`);
    const app = Fastify()

    const { schema } = loadSchemaFiles('./src/graphql/schema/*')

    const resolvers: IResolvers = {
        Query: {
            classTimetable(root, { className }, ctx, info) {
                return cache.classTimetables[className];
            },
            classroomTimetable(root, { classroomName }, ctx, info) {
                return cache.classroomTimetables[classroomName];
            },
            teacherTimetable(root, { teacherName }, ctx, info) {
                return cache.teacherTimetables[teacherName];
            },
            teachers(root, args, ctx, info) {
                return cache.teachers;
            },
            classes(root, args, ctx, info) {
                return cache.classes;
            },
            classrooms(root, args, ctx, info) {
                return cache.classrooms;
            },
            timezone(root, args, ctx, info) {
                return Intl.DateTimeFormat().resolvedOptions().timeZone;
            }
        },
        Mutation: {
            sendData(root, { data, secret }, ctx, info) {
                if (secret !== cfg.secret)
                    return false;

                const parsedData = JSON.parse(data ?? "{}");
                if (!parsedData.classes || !parsedData.classrooms || !parsedData.teachers ||
                    parsedData.classes.length === 0 ||
                    parsedData.classrooms.length === 0 ||
                    parsedData.teachers.length === 0) {
                    return false;
                }

                if (typeof parsedData.classTimetables !== 'object' ||
                    typeof parsedData.classroomTimetables !== 'object' ||
                    typeof parsedData.teacherTimetables !== 'object') {
                    return false;
                }

                cache.classes = parsedData.classes;
                cache.classrooms = parsedData.classrooms;
                cache.teachers = parsedData.teachers;

                cache.classTimetables = parsedData.classTimetables;
                cache.classroomTimetables = parsedData.classroomTimetables;
                cache.teacherTimetables = parsedData.teacherTimetables;
                return true;
            }
        }
    };
    app.register(mercurius, {
            schema,
            resolvers,
            context: buildContext,
            graphiql: true,
            ide: true,
        })

    mercuriusCodegen(app, {
            targetPath: './src/graphql/generated.ts'
    }).catch(console.error)

    app.listen(process.env.PORT ?? 8080, "0.0.0.0").then(console.log);
    }