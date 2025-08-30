/** biome-ignore-all lint/suspicious/noConsole: Testing */

/**
 * Quick and dirty client for testing
 */
import type { WeekData } from "./easistent/school";

const r = await fetch("http://localhost:3000/week");
const w = (await r.json()) as { week: WeekData };

console.log(
    w.week.events.filter(
        (x) =>
            x.classroomKey === "107" && x.dayIndex === 0 && x.periodIndex > 4 && x.periodIndex < 9
    )
);
