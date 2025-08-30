import { setTimeZone } from "bun:jsc";
import { swagger } from "@elysiajs/swagger";
import { Elysia } from "elysia";
import pkg from "../package.json" with { type: "json" };
import api from "./api";
import { Dev } from "./apiTypes";
import { getBuildInfo } from "./util/buildInfo" with { type: "macro" };

setTimeZone("Europe/Ljubljana"); // For now easistent is only available in Slovenia

new Elysia()
    .use(
        swagger({
            exclude: ["/", "/docs", "/docs/json"],
            path: "/docs",
            documentation: {
                info: {
                    title: "easistent-tt",
                    version: pkg.version,
                    contact: {
                        name: "Matic Babnik",
                        url: "https://babnik.io",
                    },
                    description: `
A nice-ish API for easistent's public timetables.

[Github repo](https://github.com/MaticBabnik/easistent-tt)
`,
                },
                tags: [
                    {
                        name: "Main",
                        description: "The most useful endpoints",
                    },
                    {
                        name: "Components",
                        description: "'/all' split up if thats your thing",
                    },
                    {
                        name: "Developer",
                        description: "For nerds",
                    },
                    {
                        name: "Calendar",
                        description: "ICAL endpoint",
                    },
                ],
            },
        })
    )
    .use(api)
    .get("/", ({ set }) => {
        set.redirect = "/docs";
    })
    .get(
        "/dev",
        () => ({
            buildInfo: getBuildInfo(),
            runtime: {
                bun: Bun.version,
                os: process.platform,
            },
            apiVersion: pkg.version,
        }),
        {
            detail: {
                summary: "Information about the deployment",
                tags: ["Developer"],
            },
            response: Dev,
        }
    )
    .listen({
        port: globalThis.process.env.PORT ?? 3000,
    });
