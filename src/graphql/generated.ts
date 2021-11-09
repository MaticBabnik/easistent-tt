import type { GraphQLResolveInfo } from "graphql";
import type { MercuriusContext } from "mercurius";
export type Maybe<T> = T | null;
export type Exact<T extends { [key: string]: unknown }> = {
  [K in keyof T]: T[K];
};
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & {
  [SubKey in K]?: Maybe<T[SubKey]>;
};
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & {
  [SubKey in K]: Maybe<T[SubKey]>;
};
export type ResolverFn<TResult, TParent, TContext, TArgs> = (
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo
) =>
  | Promise<import("mercurius-codegen").DeepPartial<TResult>>
  | import("mercurius-codegen").DeepPartial<TResult>;
export type RequireFields<T, K extends keyof T> = {
  [X in Exclude<keyof T, K>]?: T[X];
} & { [P in K]-?: NonNullable<T[P]> };
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: string;
  String: string;
  Boolean: boolean;
  Int: number;
  Float: number;
  _FieldSet: any;
};

export type Query = {
  __typename?: "Query";
  hello: Scalars["String"];
  timetable: Timetable;
};

export type QueryhelloArgs = {
  name: Scalars["String"];
};

export type QuerytimetableArgs = {
  schoolId: Scalars["Int"];
  classId: Scalars["Int"];
  week?: Maybe<Scalars["Int"]>;
};

export type TimeSpan = {
  __typename?: "TimeSpan";
  from?: Maybe<Scalars["String"]>;
  to?: Maybe<Scalars["String"]>;
};

export enum LessonFlag {
  SUBSTITUTE = "SUBSTITUTE",
  REPLACEMENT = "REPLACEMENT",
  CANCELED = "CANCELED",
  NOTDONE = "NOTDONE",
  EVENT = "EVENT",
  OFFICEHOURS = "OFFICEHOURS",
  HALFTIME = "HALFTIME",
  CLUB = "CLUB",
  ONLINE = "ONLINE",
  EXAM = "EXAM",
}

export type Lesson = {
  __typename?: "Lesson";
  name: Scalars["String"];
  teacher?: Maybe<Scalars["String"]>;
  room?: Maybe<Scalars["String"]>;
  flags?: Maybe<Array<Maybe<LessonFlag>>>;
};

export type Day = {
  __typename?: "Day";
  lessons?: Maybe<Array<Maybe<Array<Maybe<Lesson>>>>>;
};

export type Timetable = {
  __typename?: "Timetable";
  schoolId: Scalars["Int"];
  classId: Scalars["Int"];
  week: Scalars["Int"];
  scheduleDefinitions?: Maybe<Array<Maybe<TimeSpan>>>;
  days?: Maybe<Array<Maybe<Day>>>;
};

export type ResolverTypeWrapper<T> = Promise<T> | T;

export type ResolverWithResolve<TResult, TParent, TContext, TArgs> = {
  resolve: ResolverFn<TResult, TParent, TContext, TArgs>;
};
export type Resolver<TResult, TParent = {}, TContext = {}, TArgs = {}> =
  | ResolverFn<TResult, TParent, TContext, TArgs>
  | ResolverWithResolve<TResult, TParent, TContext, TArgs>;

export type SubscriptionSubscribeFn<TResult, TParent, TContext, TArgs> = (
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo
) => AsyncIterator<TResult> | Promise<AsyncIterator<TResult>>;

export type SubscriptionResolveFn<TResult, TParent, TContext, TArgs> = (
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo
) => TResult | Promise<TResult>;

export interface SubscriptionSubscriberObject<
  TResult,
  TKey extends string,
  TParent,
  TContext,
  TArgs
> {
  subscribe: SubscriptionSubscribeFn<
    { [key in TKey]: TResult },
    TParent,
    TContext,
    TArgs
  >;
  resolve?: SubscriptionResolveFn<
    TResult,
    { [key in TKey]: TResult },
    TContext,
    TArgs
  >;
}

export interface SubscriptionResolverObject<TResult, TParent, TContext, TArgs> {
  subscribe: SubscriptionSubscribeFn<any, TParent, TContext, TArgs>;
  resolve: SubscriptionResolveFn<TResult, any, TContext, TArgs>;
}

export type SubscriptionObject<
  TResult,
  TKey extends string,
  TParent,
  TContext,
  TArgs
> =
  | SubscriptionSubscriberObject<TResult, TKey, TParent, TContext, TArgs>
  | SubscriptionResolverObject<TResult, TParent, TContext, TArgs>;

export type SubscriptionResolver<
  TResult,
  TKey extends string,
  TParent = {},
  TContext = {},
  TArgs = {}
> =
  | ((
      ...args: any[]
    ) => SubscriptionObject<TResult, TKey, TParent, TContext, TArgs>)
  | SubscriptionObject<TResult, TKey, TParent, TContext, TArgs>;

export type TypeResolveFn<TTypes, TParent = {}, TContext = {}> = (
  parent: TParent,
  context: TContext,
  info: GraphQLResolveInfo
) => Maybe<TTypes> | Promise<Maybe<TTypes>>;

export type IsTypeOfResolverFn<T = {}, TContext = {}> = (
  obj: T,
  context: TContext,
  info: GraphQLResolveInfo
) => boolean | Promise<boolean>;

export type NextResolverFn<T> = () => Promise<T>;

export type DirectiveResolverFn<
  TResult = {},
  TParent = {},
  TContext = {},
  TArgs = {}
> = (
  next: NextResolverFn<TResult>,
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo
) => TResult | Promise<TResult>;

/** Mapping between all available schema types and the resolvers types */
export type ResolversTypes = {
  Query: ResolverTypeWrapper<{}>;
  String: ResolverTypeWrapper<Scalars["String"]>;
  Int: ResolverTypeWrapper<Scalars["Int"]>;
  TimeSpan: ResolverTypeWrapper<TimeSpan>;
  LessonFlag: LessonFlag;
  Lesson: ResolverTypeWrapper<Lesson>;
  Day: ResolverTypeWrapper<Day>;
  Timetable: ResolverTypeWrapper<Timetable>;
  Boolean: ResolverTypeWrapper<Scalars["Boolean"]>;
};

/** Mapping between all available schema types and the resolvers parents */
export type ResolversParentTypes = {
  Query: {};
  String: Scalars["String"];
  Int: Scalars["Int"];
  TimeSpan: TimeSpan;
  Lesson: Lesson;
  Day: Day;
  Timetable: Timetable;
  Boolean: Scalars["Boolean"];
};

export type QueryResolvers<
  ContextType = MercuriusContext,
  ParentType extends ResolversParentTypes["Query"] = ResolversParentTypes["Query"]
> = {
  hello?: Resolver<
    ResolversTypes["String"],
    ParentType,
    ContextType,
    RequireFields<QueryhelloArgs, "name">
  >;
  timetable?: Resolver<
    ResolversTypes["Timetable"],
    ParentType,
    ContextType,
    RequireFields<QuerytimetableArgs, "schoolId" | "classId">
  >;
};

export type TimeSpanResolvers<
  ContextType = MercuriusContext,
  ParentType extends ResolversParentTypes["TimeSpan"] = ResolversParentTypes["TimeSpan"]
> = {
  from?: Resolver<Maybe<ResolversTypes["String"]>, ParentType, ContextType>;
  to?: Resolver<Maybe<ResolversTypes["String"]>, ParentType, ContextType>;
  isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type LessonResolvers<
  ContextType = MercuriusContext,
  ParentType extends ResolversParentTypes["Lesson"] = ResolversParentTypes["Lesson"]
> = {
  name?: Resolver<ResolversTypes["String"], ParentType, ContextType>;
  teacher?: Resolver<Maybe<ResolversTypes["String"]>, ParentType, ContextType>;
  room?: Resolver<Maybe<ResolversTypes["String"]>, ParentType, ContextType>;
  flags?: Resolver<
    Maybe<Array<Maybe<ResolversTypes["LessonFlag"]>>>,
    ParentType,
    ContextType
  >;
  isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type DayResolvers<
  ContextType = MercuriusContext,
  ParentType extends ResolversParentTypes["Day"] = ResolversParentTypes["Day"]
> = {
  lessons?: Resolver<
    Maybe<Array<Maybe<Array<Maybe<ResolversTypes["Lesson"]>>>>>,
    ParentType,
    ContextType
  >;
  isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type TimetableResolvers<
  ContextType = MercuriusContext,
  ParentType extends ResolversParentTypes["Timetable"] = ResolversParentTypes["Timetable"]
> = {
  schoolId?: Resolver<ResolversTypes["Int"], ParentType, ContextType>;
  classId?: Resolver<ResolversTypes["Int"], ParentType, ContextType>;
  week?: Resolver<ResolversTypes["Int"], ParentType, ContextType>;
  scheduleDefinitions?: Resolver<
    Maybe<Array<Maybe<ResolversTypes["TimeSpan"]>>>,
    ParentType,
    ContextType
  >;
  days?: Resolver<
    Maybe<Array<Maybe<ResolversTypes["Day"]>>>,
    ParentType,
    ContextType
  >;
  isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type Resolvers<ContextType = MercuriusContext> = {
  Query?: QueryResolvers<ContextType>;
  TimeSpan?: TimeSpanResolvers<ContextType>;
  Lesson?: LessonResolvers<ContextType>;
  Day?: DayResolvers<ContextType>;
  Timetable?: TimetableResolvers<ContextType>;
};

type Loader<TReturn, TObj, TParams, TContext> = (
  queries: Array<{
    obj: TObj;
    params: TParams;
  }>,
  context: TContext & {
    reply: import("fastify").FastifyReply;
  }
) => Promise<Array<import("mercurius-codegen").DeepPartial<TReturn>>>;
type LoaderResolver<TReturn, TObj, TParams, TContext> =
  | Loader<TReturn, TObj, TParams, TContext>
  | {
      loader: Loader<TReturn, TObj, TParams, TContext>;
      opts?: {
        cache?: boolean;
      };
    };
export interface Loaders<
  TContext = import("mercurius").MercuriusContext & {
    reply: import("fastify").FastifyReply;
  }
> {
  TimeSpan?: {
    from?: LoaderResolver<Maybe<Scalars["String"]>, TimeSpan, {}, TContext>;
    to?: LoaderResolver<Maybe<Scalars["String"]>, TimeSpan, {}, TContext>;
  };

  Lesson?: {
    name?: LoaderResolver<Scalars["String"], Lesson, {}, TContext>;
    teacher?: LoaderResolver<Maybe<Scalars["String"]>, Lesson, {}, TContext>;
    room?: LoaderResolver<Maybe<Scalars["String"]>, Lesson, {}, TContext>;
    flags?: LoaderResolver<
      Maybe<Array<Maybe<LessonFlag>>>,
      Lesson,
      {},
      TContext
    >;
  };

  Day?: {
    lessons?: LoaderResolver<Maybe<Array<Maybe<Lesson>>>, Day, {}, TContext>;
  };

  Timetable?: {
    schoolId?: LoaderResolver<Scalars["Int"], Timetable, {}, TContext>;
    classId?: LoaderResolver<Scalars["Int"], Timetable, {}, TContext>;
    week?: LoaderResolver<Scalars["Int"], Timetable, {}, TContext>;
    scheduleDefinitions?: LoaderResolver<
      Maybe<Array<Maybe<TimeSpan>>>,
      Timetable,
      {},
      TContext
    >;
    days?: LoaderResolver<Maybe<Array<Maybe<Day>>>, Timetable, {}, TContext>;
  };
}
declare module "mercurius" {
  interface IResolvers
    extends Resolvers<import("mercurius").MercuriusContext> {}
  interface MercuriusLoaders extends Loaders {}
}
