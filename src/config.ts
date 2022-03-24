export interface Config {
    schoolId?: number,
    schoolPublicId?: string,

    mode?: "master" | "worker",
    secret?: string,
    masterUrl?: string,
};

export function getConfig() {
    const cfg: Config = {};
    cfg.schoolId = parseInt(process.env.SCHOOL_ID ?? "error");
    cfg.schoolPublicId = process.env.SCHOOL_PUBLIC_KEY;

    if (isNaN(cfg.schoolId) || !cfg.schoolPublicId) {
        throw "Invalid school info";
    }

    const m = process.env.MODE?.toLowerCase() ?? '';
    if (m === 'master') {
        cfg.mode = m;
        cfg.secret = process.env.SECRET;

        if (!cfg.secret) {
            throw "Invalid master info";
        }

    } else if (m === 'worker') {
        cfg.mode = m;
        cfg.secret = process.env.SECRET;
        cfg.masterUrl = process.env.MASTER_URL;

        if (!cfg.secret || !cfg.masterUrl) {
            throw "Invalid worker info";
        }
    } else {
        throw "Invalid mode";
    }
    return cfg;
}