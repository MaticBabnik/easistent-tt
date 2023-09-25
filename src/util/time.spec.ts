import { describe, expect, test, setSystemTime } from "bun:test";

import * as time from "./time";
import {} from "bun:test";

const YR_START_DATE = new Date("2023-09-01T00:00:00.000Z");
const YR_END_DATE = new Date("2024-06-01T00:00:00.000Z");

describe("date parser", () => {
    test("start of school year, parsing current dates", () => {
        setSystemTime(YR_START_DATE);
        expect(time.easistentDateParse("1. 9.")).toEqual(YR_START_DATE);
    });

    test("start of school year, parsing end of school year dates", () => {
        setSystemTime(YR_START_DATE);
        expect(time.easistentDateParse("1. 6.")).toEqual(YR_END_DATE);
    });

    test("end of school year, parsing current dates", () => {
        setSystemTime(YR_END_DATE);
        expect(time.easistentDateParse("1. 6.")).toEqual(YR_END_DATE);
    });

    test("end of school year, parsing start of school year dates", () => {
        setSystemTime(YR_END_DATE);
        expect(time.easistentDateParse("1. 9.")).toEqual(YR_START_DATE);
    });
});

describe("time parser", () => {
    test("midnight", () => {
        expect(time.timeToOffset("0:00")).toEqual(0);
    });
    test("9:05 AM", () => {
        expect(time.timeToOffset("9:05")).toEqual(32_700_000);
    });
    test("7:35 PM", () => {
        expect(time.timeToOffset("19:35")).toEqual(70_500_000);
    });
});
