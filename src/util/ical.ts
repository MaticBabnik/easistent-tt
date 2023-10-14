/*
    ! This *IS NOT* fully compliant with RFC5545
    it only implements what this app needs, and disregards some recommendations
    It seems to work with Google Calendar and Mozilla Thunderbird
*/

import { getBuildInfo } from "./buildInfo" assert { type: "macro" };
const bi = getBuildInfo();

const ICAL_HEADER = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    `PRODID:${escapeContent(`${bi.remote} ${bi.commitHash}`)}`,
    "CALSCALE:GREGORIAN",
];
const ICAL_END = "END:VCALENDAR";

type EventStatus = "TENTATIVE" | "CONFIRMED" | "CANCELLED";

export type Event = {
    uid: string;
    startDate: Date;
    endDate: Date;
    title: string;
    description?: string;
    categories: string[];
    status?: EventStatus;
    location?: string;
};

function escapeContent(text: string) {
    return text
        .replace(/[\\;,]/g, (x) => `\\${x}`)
        .replace(/(\n|\r\n)/g, "\\n");
}

function addEvent(lines: string[], event: Event) {
    lines.push("BEGIN:VEVENT");

    lines.push(`UID:${event.uid}`);

    lines.push(generateDateProperty("DTSTAMP", new Date()));
    lines.push(generateDateProperty("DTSTART", event.startDate));
    lines.push(generateDateProperty("DTEND", event.endDate));

    lines.push(`SUMMARY:${escapeContent(event.title)}`);
    if (event.description)
        lines.push(`DESCRIPTION:${escapeContent(event.description)}`);

    if (event.categories) {
        lines.push(
            `CATEGORIES:${event.categories
                .map((x) => escapeContent(x))
                .join(",")}`
        );
    }

    if (event.status) {
        lines.push(`STATUS:${event.status}`);
    }

    if (event.location) {
        lines.push(`LOCATION:${escapeContent(event.location)}`);
    }

    lines.push("END:VEVENT");
}

function padTo(n: number, to: number) {
    const str = n.toString();
    return "0".repeat(Math.max(to - str.length, 0)) + str;
}

function generateDateProperty(prop: string, d: Date) {
    const year = padTo(d.getFullYear(), 4),
        month = padTo(d.getMonth() + 1, 2),
        date = padTo(d.getDate(), 2),
        hour = padTo(d.getHours(), 2),
        minute = padTo(d.getMinutes(), 2),
        seconds = padTo(d.getSeconds(), 2);

    const dt = `${year}${month}${date}T${hour}${minute}${seconds}`;

    const tzid = Intl.DateTimeFormat().resolvedOptions().timeZone;

    return `${prop};TZID=${tzid};VALUE=DATE-TIME:${dt}`;
}

export function generateCalendar<TEv extends Event>(e: TEv[]): string {
    const l = [...ICAL_HEADER];

    e.forEach((x) => addEvent(l, x));

    l.push(ICAL_END);

    return l.join("\r\n");
}
