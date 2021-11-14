import { Timetable } from './graphql/generated';
import { delayStart, getClasses, getClassrooms, getTimetable } from './parser'

export default class School {
    public readonly id: number;
    public readonly publicUrlId: string;

    private classrooms: { [index: string]: number };
    private classes: { [index: string]: number } | Object;
    private classTimetables: Map<string, Timetable>;
    private classroomTimetables: Map<string, Timetable>;

    constructor(id: number, publicUrlId: string) {
        this.id = id;
        this.publicUrlId = publicUrlId;

        this.classes = {};
        this.classrooms = {};

        this.classTimetables = new Map<string, Timetable>();
        this.classroomTimetables = new Map<string, Timetable>();
    }

    public async setup() {
        let st = Date.now();

        //fetch classes and classrooms
        this.classes = await getClasses(this.publicUrlId);
        this.classrooms = await getClassrooms(this.publicUrlId);

        console.log(`Added ${Object.keys(this.classes).length} classes and ${Object.keys(this.classrooms).length} classrooms in ${Date.now() - st}ms`)

        //run the initial scrape
        await this.scrapeAll();

        //schedule next scrape
        console.log('Set to re-scrape every 5 minutes');
        setInterval(this.scrapeAll, 5 * 60 * 1000);
    }

    private parseToUsable() {
        return;
    }

    private async scrapeAll() {
        let st = Date.now();

        let cr = Object.values(this.classrooms);
        let cs = Object.values(this.classes);

        const r = await Promise.allSettled([
            Promise.allSettled(cr.map((classroom, i) => delayStart(getTimetable, i * 100, 0, classroom, this.id))),
            Promise.allSettled(cs.map(((sClass, i) => delayStart(getTimetable, i * 100 + 50, sClass, 0, this.id))))
        ]);

        if (r[0].status == 'rejected' || r[1].status=='rejected') return;

        console.log(`Settled all promises in: ${Date.now() - st}ms`);
        console.log(`\tClasses:    [ ${r[1].value.filter(x=>x.status='fulfilled').length} / ${cs.length} ]`)
        console.log(`\tClassrooms: [ ${r[0].value.filter(x=>x.status='fulfilled').length} / ${cr.length} ]`)

        this.parseToUsable();
    }
}