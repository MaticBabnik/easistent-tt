class ScuffedMap<K, V> implements Map<K, V> {
    private map: Object;
    constructor() {
        this.map = {};
    }
    public get(key: K): V | undefined {
        //@ts-ignore
        return this.map[key];
    }
    public set(key: K, value: V): this {
        //@ts-ignore
        this.map[key] = value;
        return this;
    }
    public delete(key: K): boolean {
        //@ts-ignore
        delete this.map[key];
        return true;
    }
    //@ts-ignore
    public entries(): [K, V][] {
        //@ts-ignore
        return Object.entries(this.map);
    }
}



export function Cacheify<T, A extends any[]>(fn: (...args: A) => T, lifetime: number, clearInterval: number = -1, debug: boolean = false): (...args: A) => T | undefined {

    let cacheMap: ScuffedMap<A, { t: number, result: T }> = new ScuffedMap();

    if (clearInterval > 0) {
        setInterval(() => {
            if (debug) console.log("[Cacheify] Clearing outdated cache");
            const deleteTime = Date.now() - clearInterval;

            [...cacheMap.entries()].forEach(([key, val]) => {
                if (val.t < deleteTime)
                    cacheMap.delete(key);
            });
        }, clearInterval)
    }

    return (...args: A) => {

        if (!args) throw "Missing or Invalid arguments";

        let cached = cacheMap.get(args);

        if (!cached) {
            // not cached
            if (debug) console.log("[Cacheify] Value was not cached.");
            cached = { result: fn(...args), t: Date.now() };
            cacheMap.set(args, cached);


        } else if ((Date.now() - cached.t) > lifetime) {
            if (debug) console.log("[Cacheify] Value from cache is outdated.");
            //invalid cache
            cached = { result: fn(...args), t: Date.now() };
            cacheMap.set(args, cached);
        } else if (debug) console.log("[Cacheify] Got value from cache.");

        return cached.result;
    }
}