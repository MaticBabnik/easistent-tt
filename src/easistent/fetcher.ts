export type TimetableRequestParams = {
    schoolId?: number;
    classId?: number;
    teacherId?: number;
    studentId?: number;
    roomId?: number;
    week?: number;
    activityId?: number;
    qversion?: number;
};

export class Fetcher {
    private static readonly fetchOptions: RequestInit = {
        method: "GET",
        headers: {
            "user-agent": "Mozilla/5.0 (easistent-tt, matic says hi)",
            "content-type": "application/x-www-form-urlencoded; charset=UTF-8",
            accept: "text/html",
        },
        redirect: "error",
        // ...({ verbose: true } as unknown as RequestInit),
    };

    constructor(
        protected id: string,
        protected key: string
    ) {}

    private checkStatus(r: Response, context?: Record<string, string | number>) {
        if (r.ok) return;

        const c = context
            ? Object.entries(context)
                  .map(([k, v]) => `${k}:${v}`)
                  .join(",")
            : "";

        throw new Error(`Failed to fetch, got ${r.status} ${r.statusText} | ${c}`);
    }

    private async genericGet(url: string) {
        let response: Response;
        try {
            response = await fetch(url, Fetcher.fetchOptions);
            this.checkStatus(response);
        } catch (cause) {
            throw new Error(`Fetch failed for ${url}`, { cause });
        }

        return await response.text(); // can this fail?
    }

    public async getClassesPage() {
        return await this.genericGet(`https://urniki.easistent.com/urniki/${this.key}`);
    }

    public async getRoomsPage() {
        return await this.genericGet(`https://urniki.easistent.com/urniki/${this.key}/ucilnice/0`);
    }

    public async getTimetable(params: TimetableRequestParams) {
        const url = [
            "https://urniki.easistent.com/urniki/ajax_urnik",
            params.schoolId ?? this.id,
            params.classId ?? 0,
            params.teacherId ?? 0,
            params.studentId ?? 0,
            params.roomId ?? 0,
            params.week ?? 0,
            params.activityId ?? 0,
            params.qversion ? `?_=${params.qversion}` : "",
        ].join("/");

        const response = await fetch(url, Fetcher.fetchOptions);

        this.checkStatus(response, params);

        return await response.text();
    }
}
