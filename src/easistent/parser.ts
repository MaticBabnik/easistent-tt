import { HTMLElement, HTMLOptionElement, parseHTML } from "linkedom";
import slugify from "slugify";
import { easistentDateParse, timeToOffset } from "../util/time";
import { EventFlag, getFlags } from "./eventFlags";

export type Option = {
    display: string;
    key: string;
    id: number;
};

export type TeacherOption = {
    key: string;
    short: string;
    initials: string;
    fullName: string;
};

export type Period = {
    startOffset: number;
    endOffset: number;
};

export type Event = {
    periodIndex: number;
    dayIndex: number;
};

export type RawEvent = Event & {
    target: HTMLElement;
    key: string;
};

export type ParsedEvent = {
    class: string;
    flags: EventFlag[];
    shortTitle: string;
    longTitle?: string;
    teacherLong?: string;
    teacherShort?: string;
    classroom?: string;
    group?: string;
} & Event;

export type ParseResult = {
    dates: Date[];
    hourOffsets: Period[];
    events: ParsedEvent[];
};

function makeOption(k: string, v: number): Option {
    return {
        display: k,
        key: slugify(k, { lower: true }),
        id: v,
    };
}

function childrenInRange(el: HTMLElement, start = 0, end = 0): HTMLElement[] {
    const max = el.childElementCount;

    if (start > max || start < 0) throw new Error("start is out of bounds");
    if (end >= max) throw new Error("end is out of bounds");
    if (end <= 0) end = max - 1 - end;

    const arr = [];

    for (let i = start; i <= end; i++) {
        arr.push(el.children[i]);
    }

    return arr;
}

export class Parser {
    public parseOptions(html: string): Option[] {
        const { document } = parseHTML(html);

        const options = [
            ...document.querySelectorAll("#id_parameter>option"),
        ] as unknown as HTMLOptionElement[];

        if (options.length == 0) throw new Error("Error parsing options");

        return options.map((x) =>
            makeOption(x.innerHTML.trim(), parseInt(x.value))
        );
    }

    public parseName(html: string): string {
        const { document } = parseHTML(html);
        const schoolNameElement = document.querySelector(
            "#okvir_prijava > h1 > span"
        ) as unknown as HTMLSpanElement;

        return schoolNameElement.innerText.trim();
    }

    private static parseDates(mainTable: HTMLElement): Date[] {
        return [
            ...mainTable.querySelectorAll(
                "tr:nth-child(1) > th:not(:nth-child(1)) > div:nth-child(2)"
            ),
        ].map((x) => easistentDateParse(x.innerHTML.trim()));
    }

    private static parseHours(mainTable: HTMLElement): Period[] {
        return [
            ...mainTable.querySelectorAll(
                ".ednevnik-seznam_ur_teden-ura > .gray"
            ),
        ].map((x) => {
            const [start, end] = x.innerHTML.trim().split(" - ");

            return {
                startOffset: timeToOffset(start),
                endOffset: timeToOffset(end),
            };
        });
    }

    private static getEvents(mainTable: HTMLElement, key: string): RawEvent[] {
        return childrenInRange(mainTable, 1).flatMap((row, periodIndex) =>
            childrenInRange(row, 1).flatMap((cell, dayIndex) =>
                [...cell.children].map((target) => ({
                    periodIndex,
                    dayIndex,
                    target: target,
                    key,
                }))
            )
        );
    }

    private static parseEventHtml(e: RawEvent): ParsedEvent {
        // le cursed
        const { dayIndex, key, periodIndex, target } = e;

        const flagElements = [
            ...target.querySelectorAll('td[align="right"] > img'),
        ];
        const titleElement =
            target.querySelector("td.bold > span") ??
            target.querySelector("td.text14.bold"); // fallback for events
        const teacherAndRoomElement = target.querySelector(
            ".text11:not(.gray.bold)"
        );
        const groupElement = target.querySelector("text11.gray.bold");

        const flags = getFlags(flagElements);
        const shortTitle = titleElement?.innerText?.trim();
        const longTitle = titleElement?.attributes?.title?.value?.trim();

        const teacherAndClassroom =
            teacherAndRoomElement?.innerText?.split(", ");

        const teacherShort = teacherAndClassroom?.[0]?.trim();
        const classroom = teacherAndClassroom?.[1]?.trim();
        const teacherLong =
            teacherAndRoomElement?.attributes?.title?.value?.trim();

        const group = groupElement?.innerText;

        return {
            dayIndex,
            periodIndex,
            class: key,
            flags,
            shortTitle,
            longTitle,
            teacherLong,
            teacherShort,
            classroom,
            group,
        };
    }

    public parseTimetable(html: string, key: string): ParseResult | string {
        const { document } = parseHTML(html);

        const mainTable = document.querySelector(
            "table.ednevnik-seznam_ur_teden"
        ) as unknown as HTMLElement;

        if (!mainTable) return "Could not find main table!";

        const dates = Parser.parseDates(mainTable);
        const hourOffsets = Parser.parseHours(mainTable);
        const events = Parser.getEvents(mainTable, key).map((x) =>
            Parser.parseEventHtml(x)
        );

        return {
            dates,
            hourOffsets,
            events,
        };
    }
}
