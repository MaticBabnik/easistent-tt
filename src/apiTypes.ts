import { t } from "elysia";

const tDate = t.Date({
    default: "2023-09-24T22:00:00.000Z",
});

export const Period = t.Object({
    startOffset: t.Number(),
    endOffset: t.Number(),
});

export const EventFlag = t.Enum({
    Substitute: "SUBSTITUTE",
    Replacement: "REPLACEMENT",
    Canceled: "CANCELED",
    Notdone: "NOTDONE",
    Event: "EVENT",
    Officehours: "OFFICEHOURS",
    Halftime: "HALFTIME",
    Club: "CLUB",
});

export const Event = t.Object({
    title: t.Object({
        long: t.String(),
        short: t.String(),
    }),
    classKey: t.String(),
    flags: t.Array(EventFlag),
    teacherKey: t.Optional(t.String()),
    classroomKey: t.Optional(t.String()),
    groupName: t.Optional(t.String()),
    dayIndex: t.Number(),
    periodIndex: t.Number(),
});

export const WeekData = t.Object({
    week: t.Number(),
    dates: t.Array(tDate),
    hourOffsets: t.Array(Period),
    events: t.Array(Event),
    scrapedAt: t.Number(),
});

export const Option = t.Object({
    display: t.String(),
    key: t.String(),
    id: t.Number(),
});

export const TeacherOption = t.Object({
    key: t.String(),
    short: t.String(),
    initials: t.String(),
    fullName: t.String(),
});

export const MError = t.Object({
    where: t.String(),
    what: t.String(),
    when: tDate,
});

export const Dev = t.Object({
    buildInfo: t.Object({
        ref: t.String(),
        commitHash: t.String(),
        commitMessage: t.String(),
        remote: t.String(),
        time: t.String(),
    }),
    runtime: t.Object({
        bun: t.String(),
        os: t.String(),
    }),
    apiVersion: t.String(),
});

export const at = {
    Period,
    EventFlag,
    Event,
    WeekData,
    Option,
    TeacherOption,
    MError,
    Dev,
} as const;
