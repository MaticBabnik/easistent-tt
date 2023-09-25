export class Fetcher {
    private static readonly fetchOptions: RequestInit = {
        method: "GET",
        headers: {
            "user-agent": "Mozilla/5.0 (easistent-tt, matic says hi)",
            "content-type": "application/x-www-form-urlencoded; charset=UTF-8",
            accept: "text/html",
        },
        redirect: "error",
    };

    constructor(protected id: string, protected key: string) {}

    private checkStatus(r: Response) {
        return r.status != 200;
    }

    private async genericGet(url: string) {
        let response: Response;
        try {
            response = await fetch(url, Fetcher.fetchOptions);
            if (!this.checkStatus) throw new Error(`Fetch failed for ${url}`);
        } catch {
            throw new Error(`Fetch failed for ${url}`);
        }

        return await response.text(); // can this fail?
    }

    public async getClassesPage() {
        return this.genericGet(`https://www.easistent.com/urniki/${this.key}`);
    }

    public async getRoomsPage() {
        return this.genericGet(
            `https://www.easistent.com/urniki/${this.key}/ucilnice`
        );
    }

    public async getTimetable(options: {
        week: number;
        roomId?: number;
        classId?: number;
    }) {
        let response: Response;
        const body = new URLSearchParams({
            id_sola: this.id,
            id_razred: options.classId?.toString() ?? "0",
            id_profesor: "0",
            id_dijak: "0",
            id_ucilnica: options.roomId?.toString() ?? "0",
            id_interesna_dejavnost: "0",
            teden: options.week?.toString(),
            qversion: "1",
        }).toString();

        try {
            response = await fetch(
                "https://www.easistent.com/urniki/ajax_urnik",
                {
                    ...Fetcher.fetchOptions,
                    method: "POST",
                    body,
                }
            );

            if (!this.checkStatus) throw 1;
        } catch {
            throw new Error(`Fetch failed for ${options}`);
        }

        return await response.text();
    }
}
