/** biome-ignore-all lint/suspicious/noConsole: Testing */

/**
 * Quick and dirty client for testing
 */

const r = await fetch("http://localhost:3000/teachers");
const w = (await r.json());

console.log(w);
