import { Elysia, t } from "elysia";
import { School } from "./easistent/school";

const s = new School(process.env.SCHOOL_ID!, process.env.SCHOOL_KEY!);
await s.init();
s.startAutoscrape();

const weekHook = {
    query: t.Object({
        week: t.Optional(
            t.Integer({
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
        "/week",
        async ({ query: { week } }) => ({ week: await s.getWeek(week) }),
        weekHook
    )
    .get(
        "/all",
        async ({ query: { week } }) => ({
            teachers: s.Teachers,
            rooms: s.Rooms,
            classes: s.Classes,
            week: await s.getWeek(week),
            name: s.Name,
        }),
        weekHook
    )
    .get("/errors", () => ({ errors: s.errors }))
    .get("/teachers", () => ({ teachers: s.Teachers }))
    .get("/classes", () => ({ classes: s.Classes }))
    .get("/classrooms", () => ({ rooms: s.Rooms }))
    .get("/info", () => ({ name: s.Name }));
