import { Elysia, t } from "elysia";
import { School } from "./easistent/school";
import * as at from "./apiTypes";

const s = new School(process.env.SCHOOL_ID!, process.env.SCHOOL_KEY!);
await s.init();
s.startAutoscrape();

const weekHook = {
    query: t.Object({
        week: t.Optional(
            t.Integer({
                description: "The week you want to fetch data for. (optional)",
                minimum: 1,
                maximum: 53,
            })
        ),
    }),
    transform({ query }: { query: any }) {
        if (query.week) query.week = +query.week;
    },
    afterHandle: ({ set }: any, response: any) => {
        const when = response.week?.scrapedAt;

        if (when) {
            // get relative age, convert to seconds, cast to int
            set.headers["age"] = ((Date.now() - when) / 1000) << 0;
        }
    },
};

export default new Elysia()
    .get(
        "/all",
        async ({ query: { week } }) => ({
            classes: s.Classes,
            name: s.Name,
            rooms: s.Rooms,
            teachers: s.Teachers,
            week: await s.getWeek(week),
        }),
        {
            ...weekHook,
            detail: {
                summary: "A combination of almost all endpoints",
                tags: ["Main"],
            },
            response: t.Object({
                week: at.WeekData,
                teachers: t.Array(at.TeacherOption),
                classes: t.Array(at.Option),
                rooms: t.Array(at.Option),
                name: t.String(),
            }),
        }
    )
    .get(
        "/week",
        async ({ query: { week } }) => ({ week: await s.getWeek(week) }),
        {
            ...weekHook,
            detail: {
                summary: "Get all information for a given (or current) week",
                tags: ["Main"],
            },
            response: t.Object({ week: at.WeekData }),
        }
    )
    .get("/errors", () => ({ errors: s.errors }), {
        detail: {
            summary: "Lists all parser errors",
            tags: ["Developer"],
        },
        response: t.Object({ errors: t.Array(at.Error) }),
    })
    .get("/teachers", () => ({ teachers: s.Teachers }), {
        detail: {
            summary: "Lists all teachers",
            tags: ["Components"],
        },
        response: t.Object({ teachers: t.Array(at.TeacherOption) }),
    })
    .get("/classes", () => ({ classes: s.Classes }), {
        detail: {
            summary: "Lists all classes",
            tags: ["Components"],
        },
        response: t.Object({ classes: t.Array(at.Option) }),
    })
    .get("/classrooms", () => ({ rooms: s.Rooms }), {
        detail: {
            summary: "Lists all classrooms",
            tags: ["Components"],
        },
        response: t.Object({ rooms: t.Array(at.Option) }),
    })
    .get("/info", () => ({ name: s.Name }), {
        detail: {
            summary: "Information about the school",
            tags: ["Components"],
        },
        response: t.Object({ name: t.String() }),
    });
