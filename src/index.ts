import needle from 'needle'
import { JSDOM } from 'jsdom'
import settings from './settings.json'

const apiAddress = 'https://www.easistent.com/urniki/ajax_urnik';
const headers = { user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/74.0.3729.169 Safari/537.36' };

async function Scrape(classId: number, schoolId: number, week?: number) {
    try {
        const formData: any = {
            "id_sola": schoolId,
            "id_razred": classId,
            "id_profesor": 0,
            "id_dijak": 0,
            "id_ucilnica": 0,
            "id_interesna_dejavnost": 0,
            "qversion": 1
        }
        if (typeof week === 'number')
            formData['teden'] = week;

        const response = await needle('post', apiAddress, formData, headers);
        const tt: Timetable = { scheduleDefinitions: [], days: [], schoolId, classId, week: week ??0 };
        const timetable: HTMLTableElement | null = new JSDOM(response.body).window.document.querySelector('table.ednevnik-seznam_ur_teden');
        if (!timetable) return { error: "Selector 'table.ednevnik-seznam_ur_teden' failed" };

        //@ts-ignore
        const timerangeElements: Array<HTMLDivElement> = [...timetable.querySelectorAll('.ednevnik-seznam_ur_teden-ura>.text10.gray')];
        console.log(timerangeElements.map(x => x.innerHTML.split(" - ")));
        //tt.
            //timerangeElements.map(x=>);

            console.log(parseTable(timetable));



    } catch (error: any) {
        return { error };
    }


}

function parseTable(table: HTMLTableElement) {
    console.log(table);
}

enum Days {
    Sunday=0,
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
    else schoolStart = new Date(date.getFullYear(), 9, 1) //september first, current year


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
            schoolStart.setDate(-schoolStart.getDay());
    }

    
    const daysSinceSchoolStart = Math.floor((date.getTime() - schoolStart.getTime()) / DAY);

    return Math.floor(daysSinceSchoolStart / 7) + 1;
}

console.log(dateToSchoolWeek(new Date('2021-9-1')));
console.log(dateToSchoolWeek(new Date('2021-9-3')));
console.log(dateToSchoolWeek(new Date('2021-9-5')));
console.log(dateToSchoolWeek(new Date('2021-9-7')));
console.log(dateToSchoolWeek(new Date('2021-9-9')));
console.log(dateToSchoolWeek(new Date('2021-9-11')));
console.log(dateToSchoolWeek(new Date('2021-9-13')));
console.log(dateToSchoolWeek(new Date('2021-9-15')));

//Scrape(settings.classes.R3A, settings.school.id).then(x => console.log(x)).catch(e => console.error(e));


interface Timetable {
    schoolId: number,
    classId: number,
    week: number,
    scheduleDefinitions: Array<TimeSpan>
    days: Array<Day>
}

interface TimeSpan {
    from: string,
    to: string,
    fromEpoch: number,
    toEpoch: number
}

interface Day {
    lessons: Array<Array<Lesson>>
}

interface Lesson {
    name: string,
    teacher: string | null,
    room: string | null,
    flags: Array<LessonFlag>
}

//the 'multiple groups/vec skupin' flag is useless
//some flags have cancer names (notdone = neopravljena ura, club = interesna dejavnost, officehours = govorilne ure)
type LessonFlag = "substitute" | "replacement" | "canceled" | "notdone" | "event" | "officehours" | "halftime" | "club" | "online" | "exam"