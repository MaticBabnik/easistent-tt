/**
 * Strings slightly differ from names:
 * - string values are my guesses from a couple years ago.
 * - names are stolen from the new `wl-tag-` classes.
 */
export enum EventFlag {
    Substitution = "SUBSTITUTE",
    Babysitting = "REPLACEMENT",
    /**
     * Typo lol
     */
    Cancelled = "CANCELED",
    NoLesson = "NOTDONE",
    Event = "EVENT",
    ParentTeacher = "OFFICEHOURS",
    HalfHour = "HALFTIME",
    Activity = "CLUB",
}

export const FLAG_MAP: Readonly<Record<string, EventFlag | undefined>> = Object.freeze({
    "wl-tag-substitution": EventFlag.Substitution,
    "wl-tag-babysitting": EventFlag.Babysitting,
    "wl-tag-cancelled": EventFlag.Cancelled,
    "wl-tag-no-lesson": EventFlag.NoLesson,
    "wl-tag-event": EventFlag.Event,
    "wl-tag-parent-teacher": EventFlag.ParentTeacher,
    "wl-tag-half-hour": EventFlag.HalfHour,
    "wl-tag-activity": EventFlag.Activity,
});
