import { getConfig } from "./config";
import client from "./client";
import server from "./server";

const cfg = getConfig();

switch (cfg.mode) {
    case "master":
        server(cfg);
        break;
    case "worker":
        client(cfg);
        break;
}
