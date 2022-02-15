import Fastify, { FastifyRequest, FastifyReply } from 'fastify'
import mercurius, { IResolvers } from 'mercurius'
import mercuriusCodegen, { gql } from 'mercurius-codegen'
import { loadSchemaFiles } from 'mercurius-codegen/dist/schema'
import School from './School'

const app = Fastify()
const ea = new School(182, '30a1b45414856e5598f2d137a5965d5a4ad36826');
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
    },
    timezone(root, args, ctx, info) {
      return Intl.DateTimeFormat().resolvedOptions().timeZone;
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
  // Commonly relative to your root package.json
  targetPath: './src/graphql/generated.ts',

}).catch(console.error)

app.listen(process.env.PORT ?? 8080, "0.0.0.0").then(console.log);