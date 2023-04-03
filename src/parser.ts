import axios, { AxiosRequestConfig } from "axios";
import { JSDOM } from "jsdom";

const apiAddress = "https://www.easistent.com/urniki/ajax_urnik";
const headers = {
    "user-agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/74.0.3729.169 Safari/537.36",
};
const requestOptions: AxiosRequestConfig<any> = { headers, maxRedirects: 5 };

export interface Timetable {
    schoolId: number;
    classId?: number;
    classroomId?: number;
    week: number;
    scheduleDefinitions: TimeSpan[];
    days: Day[];
}

export interface TimeSpan {
    from: string;
    to: string;
}

export interface Day {
    date: string;
    lessons: Lesson[][];
}

export interface Lesson {
    name?: string;
    teacher?: string;
    room?: string | number;
    flags: LessonFlag[];
}

//the 'multiple groups/vec skupin' flag is useless
//TODO: some flags have crappy names (notdone = neopravljena ura, club = interesna dejavnost, officehours = govorilne ure)
export type LessonFlag =
    | "SUBSTITUTE"
    | "REPLACEMENT"
    | "CANCELED"
    | "NOTDONE"
    | "EVENT"
    | "OFFICEHOURS"
    | "HALFTIME"
    | "CLUB"
    | "ONLINE"
    | "EXAM";

export enum Days {
    Sunday = 0,
    Monday,
    Tuesday,
    Wednesday,
    Thursday,
    Friday,
    Saturday,
}

const DAY = 24 * 60 * 60 * 1_000;

export function dateToSchoolWeek(date: Date) {
    if (!date) date = new Date();
    let schoolStart: Date;
    if (date.getMonth() < 8)
        schoolStart = new Date(date.getFullYear() - 1, 8, 1);
    //september first of last year
    else schoolStart = new Date(date.getFullYear(), 8, 1); //september first, current year

    // In javascript the week starts on Sunday
    // This switch sets the date to the first sunday before school. (day 0 of week 1)
    switch (schoolStart.getDay()) {
        case Days.Saturday:
            schoolStart.setDate(2);
            break;
        case Days.Sunday:
            //already on day 0
            break;
        default:
            schoolStart.setDate(-schoolStart.getDay() + 1);
    }

    const daysSinceSchoolStart = Math.floor(
        (date.getTime() - schoolStart.getTime()) / DAY
    );
    return Math.floor(daysSinceSchoolStart / 7) + 1;
}

const flagTranslator2ElectricBoogaloo: { [index: string]: LessonFlag } = {
    "https://www.easistent.com/images/icons/ednevnik_seznam_ur_nadomescanje.png":
        "REPLACEMENT",
    "https://www.easistent.com/images/icons/ednevnik_seznam_ur_zaposlitev.png":
        "SUBSTITUTE",
    "https://www.easistent.com/images/icons/ednevnik_seznam_ur_odpadlo.png":
        "CANCELED",
    "https://www.easistent.com/images/icons/ednevnik_seznam_ur_neopravljeno.png":
        "NOTDONE",
    "https://www.easistent.com/images/icons/ednevnik_seznam_ur_dogodek.png":
        "EVENT",
    "https://www.easistent.com/images/icons/ednevnik_seznam_ur_govorilne.png":
        "OFFICEHOURS",
    "https://www.easistent.com/images/icons/ednevnik_seznam_ur_polovicna_ura.png":
        "HALFTIME",
    "https://www.easistent.com/images/icons/ednevnik_seznam_ur_id.png": "CLUB",
};

/**
 * This won't pick up <span> based flags. Too bad!
 */
function parseFlags(lessonElement: HTMLDivElement): LessonFlag[] {
    const flagElements = [
        ...lessonElement.querySelectorAll("td[align=right]>img"),
    ] as HTMLImageElement[];

    return flagElements
        .map((x) => flagTranslator2ElectricBoogaloo[x.src.toLowerCase()])
        .filter((x) => !!x);
}

function parseLesson(lessonElement: HTMLDivElement): Lesson {
    const nameElement =
        lessonElement.querySelector(".text14.bold>span") ??
        lessonElement.querySelector(".text14.bold");
    const name = nameElement?.innerHTML?.trim() || "???";
    const [teacher, room] = lessonElement
        .querySelector(".text11")
        ?.innerHTML?.split(",")
        ?.map((x) => x.trim()) ?? [,];
    const flags = parseFlags(lessonElement);

    return { name, teacher, room, flags };
}

function parseCell(cell: HTMLTableCellElement): Lesson[] {
    return [...cell.children].map((x) => parseLesson(x as HTMLDivElement));
}

function parseTable(tableElement: HTMLTableElement): Day[] {
    const rows = [
        ...tableElement.querySelectorAll(
            ".ednevnik-seznam_ur_teden tr:not(:first-child)"
        ),
    ];
    const table = rows.map((row) => [
        ...row.querySelectorAll(
            ".ednevnik-seznam_ur_teden-td:not(.ednevnik-seznam_ur_teden-ura)"
        ),
    ]);

    const rotatedTable: Day[] = [];

    for (let i = 0; i < 5; i++) {
        //TODO: is week always 5 days?
        const arr = [];
        for (let j = 0; j < rows.length; j++) {
            arr.push(parseCell(table[j][i] as HTMLTableCellElement));
        }
        rotatedTable.push({ date: "", lessons: arr });
    }
    return rotatedTable;
}

function parseTimeRange(timeRangeElement: HTMLDivElement) {
    const [from, to] = timeRangeElement.innerHTML
        .split("-")
        .map((x) => x.trim());

    return { from, to };
}

//30a1b45414856e5598f2d137a5965d5a4ad36826
export async function getClasses(
    schoolPublicTimetableID: string,
    fullUrl?: boolean
) {
    const url = fullUrl
        ? schoolPublicTimetableID
        : `https://www.easistent.com/urniki/${schoolPublicTimetableID}`; //TODO: full url is kinda useless

    const response = await axios.get(
        `https://urnik.vegova.si/`,
        requestOptions
    );

    const doc = new JSDOM(response.data).window.document;
    const classElements = doc.querySelectorAll(
        "select#id_parameter>option"
    ) as NodeListOf<HTMLOptionElement>;

    if (!classElements || classElements.length == 0) throw "No classes found";

    const classMap: { [key: string]: number } = {};

    classElements.forEach(
        (x) => (classMap[x.innerHTML.trim()] = parseInt(x.value))
    );

    return classMap;
}
export async function getClassrooms(schoolPublicTimetableID: string) {
    const url = `https://www.easistent.com/urniki/${schoolPublicTimetableID}/ucilnice`;

    const response = await axios.get(url, requestOptions);

    const doc = new JSDOM(response.data).window.document;
    const classroomElements = doc.querySelectorAll(
        "select#id_parameter>option"
    ) as NodeListOf<HTMLOptionElement>;
    if (!classroomElements || classroomElements.length == 0)
        throw "No classrooms found";

    const classroomMap: { [key: string]: number } = {};

    classroomElements.forEach(
        (x) => (classroomMap[x.innerHTML.trim()] = parseInt(x.value))
    );

    return classroomMap;
}

function getDates(table: HTMLTableElement): string[] {
    return [
        ...table.querySelectorAll<HTMLDivElement>(
            "table.ednevnik-seznam_ur_teden>tbody>tr:nth-child(1)>*:not(:nth-child(1))>div:nth-child(2)"
        ),
    ].map((dateElement) => dateElement.innerHTML);
}

export async function getTimetable(
    classId: number,
    classroomId: number,
    schoolId: number,
    week?: number
): Promise<Timetable> {
    if (typeof week !== "number") week = dateToSchoolWeek(new Date());
    const formData: any = {
        id_sola: schoolId,
        id_razred: classId,
        id_profesor: 0,
        id_dijak: 0,
        id_ucilnica: classroomId,
        id_interesna_dejavnost: 0,
        teden: week,
        qversion: 1,
    };

    const timetable: Timetable = {
        scheduleDefinitions: [],
        days: [],
        schoolId,
        week: week,
    };
    if (classroomId != 0) timetable.classroomId = classroomId;
    if (classId != 0) timetable.classId = classId;

    let response;
    try {
        const body = new URLSearchParams(formData);
        response = await axios.post(apiAddress, body, requestOptions);
    } catch (e) {
        console.error(`Error in ${schoolId}-${classId}/${classroomId}`);
        throw e;
    }
    const timetableElement: HTMLTableElement | null = new JSDOM(
        response?.data
    ).window.document.querySelector("table.ednevnik-seznam_ur_teden");

    if (!timetableElement)
        throw "Selector 'table.ednevnik-seznam_ur_teden' failed";

    const timerangeElements = [
        ...timetableElement.querySelectorAll(
            ".ednevnik-seznam_ur_teden-ura>div.text10.gray"
        ),
    ] as HTMLDivElement[];

    timetable.scheduleDefinitions = timerangeElements.map(parseTimeRange);
    const dates = getDates(timetableElement);
    timetable.days = parseTable(timetableElement);
    dates.forEach(
        (date, index) =>
            !!timetable.days[index] && (timetable.days[index].date = date)
    );

    if (classroomId != 0 && !!classroomId)
        timetable.days.forEach((day) =>
            day.lessons.forEach((slot) =>
                slot.forEach((lesson) => (lesson.room = classroomId))
            )
        );

    return timetable;
}

function ms(n: number) {
    return new Promise((r) => setTimeout(r, n));
}

export function delayStart<P extends Array<any>, R>(
    func: (...args: P) => Promise<R>,
    delay: number,
    ...args: P
): Promise<R> {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            func(...args)
                .then(resolve)
                .catch(reject);
        }, delay);
    });
}
