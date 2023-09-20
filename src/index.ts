import { setTimeZone } from "bun:jsc";
import { School } from "./school";

setTimeZone("Europe/Ljubljana"); // For now easistent is only available in Slovenia

const s = new School(process.env.SCHOOL_ID!, process.env.SCHOOL_KEY!);
await s.init();
s.startAutoscrape();

import { Elysia, t } from "elysia";
import { swagger } from "@elysiajs/swagger";

new Elysia()
    .use(
        swagger({
            exclude: ["/", "/docs", "/docs/json"],
            path: "/docs",
            documentation: {
                info: {
                    title: "easistent-tt",
                    version: "4.0.0",
                    contact: {
                        name: "Matic Babnik",
                        email: "matic@babnik.io",
                        url: "https://babnik.io",
                    },
                    description: `A nice-ish API for easistent's public timetables`,
                },
            },
        })
    )
    .get("/week", ({ query: { week } }) => s.getWeek(week), {
        query: t.Object({
            week: t.Optional(
                t.Integer({
                    minimum: 1,
                    maximum: 53,
                })
            ),
        }),
        transform({ query }) {
            if (query.week) query.week = +query.week;
        },
    })
    .get("/errors", () => s.errors)
    .get("/teachers", () => s.Teachers)
    .get("/classes", () => s.Classes)
    .get("/classrooms", () => s.Rooms)
    .get(
        "/all",
        async ({ query: { week } }) => ({
            teachers: s.Teachers,
            rooms: s.Rooms,
            classes: s.Classes,
            ...(await s.getWeek(week)),
        }),
        {
            query: t.Object({
                week: t.Optional(
                    t.Integer({
                        minimum: 1,
                        maximum: 53,
                    })
                ),
            }),
            transform({ query }) {
                if (query.week) query.week = +query.week;
            },
        }
    )
    .get("/", ({ set }) => {
        set.redirect = "/docs";
    })
    .listen({
        port: process.env.PORT ?? 3000,
    });
