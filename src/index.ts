import needle from 'needle'
import { JSDOM } from 'jsdom'
import settings from './settings.json'

const apiAddress = 'https://www.easistent.com/urniki/ajax_urnik';
const headers = { user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/74.0.3729.169 Safari/537.36'};

async function Scrape(razred: number, sola: number, week?: number) {
    try {
        const formData: any = {
            "id_sola": sola,
            "id_razred": razred,
            "id_profesor": 0,
            "id_dijak": 0,
            "id_ucilnica": 0,
            "id_interesna_dejavnost": 0,
            "qversion": 1
        }
        if (typeof week === 'number')
            formData['teden'] = week;

        const response = await needle('post', apiAddress, formData, headers);
        const timetable: HTMLTableElement | null = new JSDOM(response.body).window.document.querySelector('table.ednevnik-seznam_ur_teden');
        if (!timetable) return { error: "Selector 'table.ednevnik-seznam_ur_teden' failed" };

        //@ts-ignore
        const timerangeElements: Array<HTMLDivElement>  = [...timetable.querySelectorAll('.ednevnik-seznam_ur_teden-ura>.text10.gray')];
        console.log(timerangeElements.map(x=>x.innerHTML.split(" - ")));
        //timerangeElements.map(x=>);

        console.log(parseTable(timetable));



    } catch (error: any) {
        return { error };
    }


}

function parseTable(table: HTMLTableElement) {
    console.log(table);
}


Scrape(settings.classes.R3A, settings.school.id).then(x=>console.log(x)).catch(e=>console.error(e));

const timetable: Timetable = {
    schoolId: 182,
    sclassId: 13221,
    week: 3,
    scheduleDefinitions: [
        { from: "7:30", to: "8:15", fromEpoch: 312414, toEpoch: 1321241241 },
        { from: "8:20", to: "9:05", fromEpoch: 3124514, toEpoch: 13212541241 },
    ],
    days: [
        {
            lessons: [
                [{ name: "MAT", teacher: "L. Vintar", room: "213", flags: ['online'] }],
                [{ name: "RPAv", teacher: "M. Kompolsek", room: "K12", flags: ['substitute'] }, { name: "RPAv", teacher: "D. Toth", room: "K5", flags: [] }]
            ]
        }
    ]
}

interface Timetable {
    schoolId: number,
    sclassId: number,
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