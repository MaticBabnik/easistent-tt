/** biome-ignore-all lint/suspicious/noConsole: Startup logging */

const STATE_FILE = globalThis.process.env.BACKOFF_STATE_FILE ?? ".backoff-state.json";

const BASE_DELAY_MS = 5_000;
const MAX_DELAY_MS = 15 * 60_000;
// launches closer together than this count as part of the same crash loop
const RESET_AFTER_MS = 10 * 60_000;

type BackoffState = {
    lastLaunch: number;
    attempt: number;
};

async function readState(): Promise<BackoffState | undefined> {
    try {
        const file = Bun.file(STATE_FILE);
        if (!(await file.exists())) return undefined;
        return (await file.json()) as BackoffState;
    } catch {
        return undefined;
    }
}

/**
 * If we were (re)launched shortly after our last launch (eg. a process
 * manager restarting us after a crash), wait with exponential backoff
 * before touching the eAsistent API, so a crash loop doesn't get us banned.
 */
export async function applyStartupBackoff() {
    const now = Date.now();
    const previous = await readState();

    const attempt =
        previous && now - previous.lastLaunch < RESET_AFTER_MS ? previous.attempt + 1 : 1;

    // persist before delaying, so a crash mid-backoff is still counted
    await Bun.write(STATE_FILE, JSON.stringify({ lastLaunch: now, attempt } satisfies BackoffState));

    if (attempt <= 1) return;

    const delayMs = Math.min(BASE_DELAY_MS * 2 ** (attempt - 2), MAX_DELAY_MS);
    console.log(
        `[backoff] Detected ${attempt - 1} rapid restart(s); waiting ${(delayMs / 1000).toFixed(1)}s before contacting the API`
    );
    await new Promise((res) => setTimeout(res, delayMs));
}
