
/**
 * String canonicalize - trim non-empty `string?`s, return `undefined` otherwise.
 */
export function strcan(input: string | undefined | null): string | undefined {
    if (typeof input !== "string") return undefined;
    input = input.trim();
    return input.length ? input : undefined;
}