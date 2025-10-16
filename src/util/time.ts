export function timeToOffset(eaTime: string) {
    const [hours, minutes] = eaTime.split(":").map((x) => parseInt(x, 10));

    return (hours * 60 + minutes) * 60_000;
}
