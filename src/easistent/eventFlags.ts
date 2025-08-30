import type { HTMLImageElement } from "linkedom";

export enum EventFlag {
    Substitute = "SUBSTITUTE",
    Replacement = "REPLACEMENT",
    Canceled = "CANCELED",
    Notdone = "NOTDONE",
    Event = "EVENT",
    Officehours = "OFFICEHOURS",
    Halftime = "HALFTIME",
    Club = "CLUB",
}

const flagMap = new Map(
    Object.entries({
        "https://www.easistent.com/images/icons/ednevnik_seznam_ur_zaposlitev.png":
            EventFlag.Replacement,
        "https://www.easistent.com/images/icons/ednevnik_seznam_ur_nadomescanje.png":
            EventFlag.Substitute,
        "https://www.easistent.com/images/icons/ednevnik_seznam_ur_odpadlo.png": EventFlag.Canceled,
        "https://www.easistent.com/images/icons/ednevnik_seznam_ur_neopravljeno.png":
            EventFlag.Notdone,
        "https://www.easistent.com/images/icons/ednevnik_seznam_ur_dogodek.png": EventFlag.Event,
        "https://www.easistent.com/images/icons/ednevnik_seznam_ur_govorilne.png":
            EventFlag.Officehours,
        "https://www.easistent.com/images/icons/ednevnik_seznam_ur_polovicna_ura.png":
            EventFlag.Halftime,
        "https://www.easistent.com/images/icons/ednevnik_seznam_ur_id.png": EventFlag.Club,
    })
);

export function getFlags(imgs: HTMLImageElement[]): EventFlag[] {
    return imgs.map((x) => flagMap.get(x.src)).filter((x) => x !== undefined) as EventFlag[];
}
