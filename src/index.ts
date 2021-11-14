import Fastify, { FastifyRequest, FastifyReply } from 'fastify'
import mercurius, { IResolvers } from 'mercurius'
import mercuriusCodegen, { gql } from 'mercurius-codegen'
import { loadSchemaFiles } from 'mercurius-codegen/dist/schema'
import { Cacheify } from './cache'
import {getTimetable} from './parser'
import School from './School'

const app = Fastify()
const ea = new School(182,'30a1b45414856e5598f2d137a5965d5a4ad36826');
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

const {schema} = loadSchemaFiles('./src/graphql/schema/*')
const MINUTE = 60_000;
const timetable = Cacheify(getTimetable,15*MINUTE,-1,true);

const resolvers: IResolvers = {
  Query: {
    hello(root, { name }, ctx, info) {
      return 'hello ' + name
    },
    //@ts-ignore
    async timetable(root, {schoolId,classId,week},ctx, info) {

      return await timetable(classId,0,schoolId,week ?? 0);
    }
  }
}

app.register(mercurius, {
  schema,
  resolvers,
  context: buildContext,
  graphiql: true,
  ide:true,
})

mercuriusCodegen(app, {
  // Commonly relative to your root package.json
  targetPath: './src/graphql/generated.ts',

}).catch(console.error)

app.listen(process.env.PORT ?? 8080).then(console.log);