import needle from 'needle'
import { JSDOM } from 'jsdom'
import settings from './settings.json'
import {inspect} from 'util'

const apiAddress = 'https://www.easistent.com/urniki/ajax_urnik';
const headers = { user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/74.0.3729.169 Safari/537.36' };

interface Timetable {
    schoolId: number,
    classId: number,
    week: number,
    scheduleDefinitions: TimeSpan[]
    days: Day[]
}

interface TimeSpan {
    from: string,
    to: string
}

interface Day {
    lessons: Lesson[][]
}

interface Lesson {
    name: string,
    teacher?: string,
    room?: string,
    flags: LessonFlag[]
}

//the 'multiple groups/vec skupin' flag is useless
//some flags have cancer names (notdone = neopravljena ura, club = interesna dejavnost, officehours = govorilne ure)
type LessonFlag = "substitute" | "replacement" | "canceled" | "notdone" | "event" | "officehours" | "halftime" | "club" | "online" | "exam"


enum Days {
    Sunday = 0,
    Monday,
    Tuesday,
    Wednesday,
    Thursday,
    Friday,
    Saturday
}

const DAY = 24 * 60 * 60 * 1_000;

function dateToSchoolWeek(date: Date) {
    if (!date) date = new Date();
    let schoolStart: Date;

    if (date.getMonth() < 8) schoolStart = new Date(date.getFullYear() - 1, 9, 1); //september first of last year
    else schoolStart = new Date(date.getFullYear(), 9, 0) //september first, current year


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


    const daysSinceSchoolStart = Math.floor((date.getTime() - schoolStart.getTime()) / DAY);

    return Math.floor(daysSinceSchoolStart / 7) + 1;
}




const flagTranslator: {[index:string]:LessonFlag} = {
    'dogodek':'event',
    'nadomeščanje':'replacement',
    'zaposlitev':'substitute',
    'izpiti':'exam',
    'odpadla ura':'canceled',
    'neopravljena ura':'notdone',
    'polovična ura':'halftime',
    'interesna dejavnost':'club',
    'govorilne ure':'officehours',
    'videokonferenca':'online'
}

function parseFlags(lessonElement: HTMLDivElement):LessonFlag[] {
    const flagElements = [...lessonElement.querySelectorAll('td[align=right]>img')] as HTMLImageElement[];
    return flagElements.map(x=>flagTranslator[x.title?.toLowerCase()]).filter(x=>!!x);
}

function parseLesson(lessonElement: HTMLDivElement):Lesson {

    const nameElement = lessonElement.querySelector('.text14.bold>span') ?? lessonElement.querySelector('.text14.bold');
    const name = nameElement?.innerHTML?.trim() || "???";
    const [teacher,room] = lessonElement.querySelector('.text11')?.innerHTML?.split(',')?.map(x=>x.trim()) ?? [,];
    const flags = parseFlags(lessonElement);

    return {name,teacher,room,flags};
}

function parseCell(cell: HTMLTableCellElement): Lesson[] {
    return [...cell.children].map(x=>parseLesson(x as HTMLDivElement));
}

function parseTable(tableElement: HTMLTableElement): Day[] {
    const rows = [...tableElement.querySelectorAll('.ednevnik-seznam_ur_teden tr:not(:first-child)')];
    const table = rows.map(row => [...row.querySelectorAll('.ednevnik-seznam_ur_teden-td:not(.ednevnik-seznam_ur_teden-ura)')]);

    const rotatedTable: Day[] = [];

    for (let i = 0; i < 5; i++) { //TODO: is week always 5 days?
        const arr = [];
        for (let j = 0; j < rows.length; j++) {
            arr.push(parseCell(table[j][i] as HTMLTableCellElement));
        }
        
        rotatedTable.push({lessons:arr});
    }

    return rotatedTable;
}

function parseTimeRange(timeRangeElement: HTMLDivElement) {
    const [from,to] = timeRangeElement.innerHTML.split('-').map(x=>x.trim());

    return {from,to};
}

async function getTimetable(classId: number, schoolId: number, week?: number) {
        if (typeof week !== 'number')
            week = dateToSchoolWeek(new Date());

        const formData: any = {
            "id_sola": schoolId,
            "id_razred": classId,
            "id_profesor": 0,
            "id_dijak": 0,
            "id_ucilnica": 0,
            "id_interesna_dejavnost": 0,
            "teden": week,
            "qversion": 1
        }

        const timetable: Timetable = { scheduleDefinitions: [], days: [], schoolId, classId, week: week ?? 0 };

        const response = await needle('post', apiAddress, formData, headers);
        const timetableElement: HTMLTableElement | null = new JSDOM(response.body).window.document.querySelector('table.ednevnik-seznam_ur_teden');


        if (!timetableElement) throw "Selector 'table.ednevnik-seznam_ur_teden' failed";

        
        const timerangeElements = [...timetableElement.querySelectorAll('.ednevnik-seznam_ur_teden-ura>div.text10.gray')] as HTMLDivElement[];

        timetable.scheduleDefinitions = timerangeElements.map(parseTimeRange);

        timetable.days = parseTable(timetableElement);

        return timetable;
}

getTimetable(settings.classes.R3A, settings.school.id,1).then(x => {
    console.log(inspect(x,false,null,true))

})
