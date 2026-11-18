/*
 * This is free software, licensed under the GNU General Public License v3.
 * See /LICENSE for more information.
 */

/* Replies of the foris-controller librespeed module, built from what
 * librespeed-common answered on OpenWrt 25.12. */

export const idleStatus = {
    running: false,
    phase: "",
    last_error: "",
    last_finished: 1794850066,
    failures: [
        { interface: "lte", error: "interface is down", finished: 1794850000 },
    ],
};

export const runningStatus = {
    running: true,
    phase: "download",
    interface: "wan",
    started: 1794850035,
    elapsed_seconds: 2,
    speed_mbps: 3189.32,
    phase_progress_percent: 6,
    last_error: "",
    failures: [],
};

export const links = {
    links: ["lte", "wan"],
    interfaces: { lan: "lan", lte: "lte", wan: "wan", wan6: "wan" },
    down: ["lte"],
};

export const result = {
    measurement: {
        timestamp: "2026-11-16T17:25:47.544403708Z",
        started: 1794849916,
        finished: 1794849947,
        interface: "wan",
        server: { name: "Local", url: "http://192.0.2.2:8080/cgi-bin/" },
        client: { ip: "192.0.2.10", org: "Example Networks" },
        family: "ipv4",
        proto: "http",
        download_mbps: 3121.33,
        upload_mbps: 11319.05,
        ping_ms: 0.55,
        jitter_ms: 0.08,
        bytes_sent: 22084059136,
        bytes_received: 6086854415,
        share: "",
    },
};

export const config = {
    interface: "wan",
    server: "auto",
    scheme: "auto",
    server_list: "https://librespeed.turris.cz/servers.json",
    schedule: {
        enabled: true,
        interface: null,
        interval: "1d",
        days: [],
        hours: { from: 2, to: 5 },
    },
    interface_schedules: [
        { enabled: true, interface: "lte", interval: "7d", days: [1, 3], hours: { from: 2, to: 5 } },
    ],
    applied_schedules: [
        { interface: "wan", cron: "5 4 * * * /usr/libexec/librespeed-run", next_runs: [1794888300, 1794974700, 1795061100] },
        { interface: "lte", cron: "45 5 * * 3 /usr/libexec/librespeed-run lte", next_runs: [1794980700, 1795585500, 1796190300] },
    ],
    history: {
        enabled: true,
        path: "/tmp/librespeed/history.jsonl",
        retention_days: 30,
        archive_path: "",
        archive_retention_days: 365,
    },
};

export const rawHistory = {
    resolution: "raw",
    entries: [
        {
            timestamp: "2026-11-16T17:25:47.544403708Z",
            epoch: 1794849947,
            interface: "wan",
            server: { name: "Local", url: "http://192.0.2.2:8080/cgi-bin/" },
            proto: "http",
            download_mbps: 3121.33,
            upload_mbps: 11319.05,
            ping_ms: 0.55,
            jitter_ms: 0.08,
        },
    ],
};

export const dailyHistory = {
    resolution: "1d",
    entries: [
        {
            timestamp: "2026-11-14",
            epoch: 1794614400,
            interface: "wan",
            samples: 3,
            download_mbps: 901.5,
            download_mbps_min: 900.5,
            download_mbps_max: 902.5,
            upload_mbps: 401.25,
            ping_ms: 1.1,
            jitter_ms: 0.1,
        },
    ],
};
