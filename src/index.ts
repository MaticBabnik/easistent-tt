import Fastify, { FastifyRequest, FastifyReply } from 'fastify'
import mercurius, { IResolvers } from 'mercurius'
import mercuriusCodegen from 'mercurius-codegen'
import { loadSchemaFiles } from 'mercurius-codegen/dist/schema'
import School from './School'

const app = Fastify()
const ea = new School(
  parseInt(process.env.SCHOOL_ID ?? ""),
  process.env.SCHOOL_PUBLIC_KEY ?? "");

ea.setup();

const buildContext = async (req: FastifyRequest, _reply: FastifyReply) => {
  return {
    authorization: req.headers.authorization
  }
}

type PromiseType<T> = T extends PromiseLike<infer U> ? U : T
declare module 'mercurius' {
  interface MercuriusContext extends PromiseType<ReturnType<typeof buildContext>> { }
}

const { schema } = loadSchemaFiles('./src/graphql/schema/*')

const resolvers: IResolvers = {
  Query: {
    classTimetable(root, { className }, ctx, info) {
      return ea.classTimetables.get(className);
    },
    classroomTimetable(root, { classroomName }, ctx, info) {
      return ea.classroomTimetables.get(classroomName);
    },
    teacherTimetable(root, { teacherName }, ctx, info) {
      return ea.teacherTimetables.get(teacherName);
    },
    teachers(root, args, ctx, info) {
      return ea.getTeachers();
    },
    classes(root, args, ctx, info) {
      return ea.getClasses();
    },
    classrooms(root, args, ctx, info) {
      return ea.getClassrooms();
    }
  }
}
app.register(mercurius, {
  schema,
  resolvers,
  context: buildContext,
  graphiql: true,
  ide: true,
})

mercuriusCodegen(app, {
  targetPath: './src/graphql/generated.ts',
}).catch(console.error)

app.listen(process.env.PORT ?? 8080, "0.0.0.0").then(console.log);