import { EventFlag } from "../easistent/eventFlags";
import { OutEvent } from "../easistent/school";

export type Lang = "si" | "en";

export function getFlagName(
    flag: EventFlag,
    lang: Lang = "en",
    short: boolean
): string {
    const FLAGNAMES: Record<Lang, Record<EventFlag, Record<1 | 0, string>>> = {
        en: {
            CANCELED: ["Canceled", "X"],
            CLUB: ["Club", "Club"],
            EVENT: ["Event", "Evt"],
            HALFTIME: ["Half time", "1/2"],
            NOTDONE: ["Not done", "ND"],
            OFFICEHOURS: ["Office hours", "Office"],
            REPLACEMENT: ["Replacement", "Rep"],
            SUBSTITUTE: ["Substitute", "Sub"],
        },
        si: {
            CANCELED: ["Odpade", "X"],
            CLUB: ["Krožek", "Krožek"],
            EVENT: ["Dogodek", "Dog."],
            HALFTIME: ["Polovična ura", "1/2"],
            NOTDONE: ["Ni opravljeno", "N.O."],
            OFFICEHOURS: ["Govorilne ure", "Gov."],
            REPLACEMENT: ["Zaposlitev", "Zap."],
            SUBSTITUTE: ["Nadomeščanje", "Nad."],
        },
    };

    return FLAGNAMES[lang][flag][short ? 1 : 0];
}

export function getFlagString(
    f: EventFlag[],
    lang: Lang = "en",
    short = true
): string {
    if (f.length == 0) return "";

    return " (" + f.map((x) => getFlagName(x, lang, short)).join(", ") + ")";
}

export function getDescription(
    ev: OutEvent,
    teacher: string | undefined,
    sclass: string | undefined,
    room: string | undefined,
    lang: Lang = "en"
) {
    const S = {
        en: {
            group: "Group: ",
            teacher: "Teacher: ",
            class: "Class: ",
            room: "Classroom: ",
        },
        si: {
            group: "Skupina: ",
            teacher: "Učitelj: ",
            class: "Razred: ",
            room: "Učilnica: ",
        },
    } satisfies Record<Lang, Record<string, string>>;
    const lines = [ev.title.long + getFlagString(ev.flags, lang, false)];

    if (teacher) {
        lines.push(S[lang].teacher + teacher);
    }
    if (room) {
        lines.push(S[lang].room + room);
    }
    if (sclass) {
        lines.push(S[lang].class + sclass);
    }
    if (ev.groupName) {
        lines.push(S[lang].group + ev.groupName);
    }

    return lines.join("\n");
}
