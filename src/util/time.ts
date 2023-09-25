// if month > this, it means that it's a start of a new year
// also true for (monthIndex) >= this
// this might be fucky in August but IDGAFG
const EASISTENT_YEAR_END = 7;

export function easistentDateParse(eaDate: string) {
    // extract date/month
    const matches = eaDate.match(/\d+/g);
    if (matches?.length !== 2)
        throw new Error("String is not an easistent date");
    const [date, month] = matches.map((x) => parseInt(x));

    // Since a school year is split over two "real" years we have to check
    // in which year we currently are and in which year the parsed date is
    const now = new Date();
    let year = now.getFullYear();
    const yoffNow = now.getUTCMonth() > EASISTENT_YEAR_END ? 0 : 1,
        yoffThen = month > EASISTENT_YEAR_END ? 0 : 1;
    year += yoffThen - yoffNow;

    return new Date(year, month - 1, date);
}

export function timeToOffset(eaTime: string) {
    let [hours, minutes] = eaTime.split(":").map((x) => parseInt(x));

    return (hours * 60 + minutes) * 60_000;
}
