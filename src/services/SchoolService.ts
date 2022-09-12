import { Service } from "typedi";
import School from "../scraper/School";
import { SchoolWeek } from "../scraper/SchoolWeek";
import { ConfigService } from "./ConfigService";

@Service()
export class SchoolService {
    protected school: School;
    protected weeks = new Map<number, Promise<SchoolWeek>>();
    protected conf;

    constructor(
        protected readonly cfg: ConfigService
    ) {
        const conf = this.cfg.get()
        this.conf = conf;
        this.school = new School(conf.school.id, conf.school.key);
        this.school.setup().then(() => {
            this.refreshNear();
            setInterval(this.refreshNear.bind(this), conf.cache.nearTTL * 1000);
            setInterval(this.clearOutdated.bind(this), conf.cache.TTL * 1000);
        });
    }

    protected clearOutdated() {
        console.log("Clearing outdated cache");
        [...this.weeks.entries()].forEach(async ([week, promise]) => {
            const w = await promise;
            if (w.rebuildTime < Date.now() - this.conf.cache.TTL * 1000) {
                this.weeks.delete(week);
            }
        });
    }

    protected async refreshNear() {
        console.log(`Refreshing current week(s)`);
        const cw = this.currentWeek;

        for (let i = 0; i <= this.conf.cache.nearRange; i++) {
            const w = this.weeks.get(cw + i); // get the week

            if (!w) {
                this.getWeek(cw + i);
                continue;
            }

            const week = await w;
            if (week.rebuildTime < Date.now() - this.conf.cache.nearTTL * 1000) {
                // near TTL expired, rebuild
                week.rebuild();
            }
        }
    }

    public get currentWeek() {
        return this.school.currentWeek;
    }

    public get teachers() {
        return Object.entries(this.school.teachers).map(([slug, name]) => ({ name, slug }));
    }

    public get classes() {
        return Object.keys(this.school.classes);
    }

    public get classrooms() {
        return Object.keys(this.school.classrooms);
    }

    public async getWeek(week?: number) {
        if (!week) week = this.currentWeek;

        const wObj = this.weeks.get(week);
        if (wObj) return wObj;

        const sw = new SchoolWeek(this.school, week);
        const promise = sw.rebuild();

        this.weeks.set(week, promise);

        return promise;
    }
}