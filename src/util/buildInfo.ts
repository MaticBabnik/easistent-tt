interface BuildInfo {
    remote: string;
    commitHash: string;
    commitMessage: string;
    ref: string;
    time: string;
}

function hasGit() {
    return Bun.which("git") !== null;
}

function getCommitInfo() {
    const proc = Bun.spawnSync({
        cmd: ["git", "log", "-n", "1", "--abbrev=-1", "--format=tformat:'%D\n%h\n%s"],
        stdout: "pipe",
    });
    return proc.stdout
        .toString()
        .split("\n")
        .map((x: string) => x.trim())
        .filter((x: string) => x.length > 0);
}

function getOrignInfo() {
    const proc = Bun.spawnSync({
        cmd: ["git", "remote", "get-url", "origin"],
        stdout: "pipe",
    });

    if (proc.exitCode !== 0) return "?";
    return proc.stdout.toString().trim();
}

export function getBuildInfo() {
    const out: BuildInfo = {
        ref: "?",
        commitHash: "?",
        commitMessage: "?",
        remote: "?",
        time: new Date().toUTCString(),
    };

    if (hasGit()) {
        const dhs = getCommitInfo();
        out.ref = dhs[0];
        out.commitHash = dhs[1];
        out.commitMessage = dhs[2];

        out.remote = getOrignInfo();
    }

    return out;
}
