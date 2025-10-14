import { Elysia, t } from "elysia";
import { at } from "./apiTypes";
import { School, type WeekData } from "./easistent/school";
import type { Lang } from "./util/lang";

const schoolId = globalThis.process.env.SCHOOL_ID;
const schoolKey = globalThis.process.env.SCHOOL_KEY;
if (!schoolId || !schoolKey) {
    throw new Error("Missing env vars");
}

const s = new School(schoolId, schoolKey);
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
    transform({ query }: { query: Record<PropertyKey, unknown> }) {
        switch (typeof query.week) {
            case "string": {
                const int = parseInt(query.week, 10);
                if (!Number.isNaN(int)) query.week = int;
                else query.week = undefined;
                break;
            }
            case "number":
            case "undefined":
                break;
            default:
                query.week = undefined;
        }
    },
    // biome-ignore lint/suspicious/noExplicitAny: CBA
    afterHandle: ({ response, set }: any) => {
        const when = (response as { week: WeekData }).week?.scrapedAt;
        if (when) {
            // get relative age, convert to seconds
            set.headers.age = ((Date.now() - when) / 1000).toFixed(0);
        }
    },
};

export default new Elysia()
    .get("/health", () => "OK", {
        detail: {
            summary: "Healtcheck endpoint",
            tags: ["Developer"],
        },
    })
    .get(
        "/all",
        async ({ query: { week } }) => ({
            classes: s.Classes,
            name: s.Name,
            rooms: s.Rooms,
            teachers: s.Teachers,
            week: await s.getWeek(week),
            currentWeek: s.getWeekForDate(),
        }),
        {
            ...weekHook,
            detail: {
                summary: "A combination of almost all endpoints",
                tags: ["Main"],
            },
            response: t.Object({
                week: at.WeekData,
                currentWeek: t.Number(),
                teachers: t.Array(at.TeacherOption),
                classes: t.Array(at.Option),
                rooms: t.Array(at.Option),
                name: t.String(),
            }),
        }
    )
    .get(
        "/week",
        async ({ query: { week } }) => ({
            week: await s.getWeek(week),
            currentWeek: s.getWeekForDate(),
        }),
        {
            ...weekHook,
            detail: {
                summary: "Get all information for a given (or current) week",
                tags: ["Main"],
            },
            response: t.Object({ week: at.WeekData, currentWeek: t.Number() }),
        }
    )
    .get("/errors", () => ({ errors: s.errors }), {
        detail: {
            summary: "Lists all parser errors",
            tags: ["Developer"],
        },
        response: t.Object({ errors: t.Array(at.MError) }),
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
    })
    .get(
        "/ical/:type/:id",
        ({ params: { type, id }, query: { lang } }) => {
            return s.ical(type as "teachers" | "classes" | "rooms", id, lang as Lang | undefined);
        },
        {
            detail: {
                summary: "iCal",
                tags: ["Other"],
            },
            params: t.Object({
                type: t.Enum({
                    teachers: "teachers",
                    classes: "classes",
                    rooms: "rooms",
                }),
                id: t.String(),
            }),
            query: t.Object({
                lang: t.Optional(t.Enum({ en: "en", si: "si" })),
            }),
        }
    );
