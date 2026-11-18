/*
 * This is free software, licensed under the GNU General Public License v3.
 * See /LICENSE for more information.
 */

import React, { useEffect, useState } from "react";

import {
    API_STATE,
    RichTable,
    Select,
    useAPIGet,
    withErrorMessage,
    withSpinnerOnSending,
} from "foris";
import PropTypes from "prop-types";

import API_URLs from "../API";
import LibreSpeed from "../LibreSpeed";
import { RANGES, formatNumber, formatTime } from "../utils";

const now = () => Math.floor(Date.now() / 1000);

/* Over daily averages, each day counts as many times as it was measured. */
export function average(entries, key, daily) {
    let sum = 0;
    let weight = 0;
    entries.forEach((e) => {
        if (typeof e[key] !== "number") {
            return;
        }
        const w = daily && e.samples > 0 ? e.samples : 1;
        sum += e[key] * w;
        weight += w;
    });
    return weight ? sum / weight : null;
}

HistoryTable.propTypes = {
    entries: PropTypes.arrayOf(PropTypes.object).isRequired,
    daily: PropTypes.bool.isRequired,
};

function HistoryTable({ entries, daily }) {
    if (entries.length === 0) {
        return (
            <p className="text-muted text-center mb-0">
                {_("No measurements in this range.")}
            </p>
        );
    }
    const number =
        (digits) =>
        ({ getValue }) =>
            formatNumber(getValue(), digits);
    const columns = [
        {
            accessorKey: "epoch",
            header: daily ? _("Day") : _("Date and time"),
            cell: ({ row }) =>
                daily ? row.original.timestamp : formatTime(row.original.epoch),
        },
        {
            accessorKey: "download_mbps",
            header: _("Download [Mb/s]"),
            cell: number(2),
        },
        {
            accessorKey: "upload_mbps",
            header: _("Upload [Mb/s]"),
            cell: number(2),
        },
        { accessorKey: "ping_ms", header: _("Ping [ms]"), cell: number(1) },
        { accessorKey: "jitter_ms", header: _("Jitter [ms]"), cell: number(1) },
        { accessorKey: "interface", header: _("Interface") },
        ...(daily
            ? [{ accessorKey: "samples", header: _("Measurements") }]
            : [{ accessorKey: "server", header: _("Server") }]),
    ];
    const data = entries
        .map((e) => ({
            ...e,
            interface: e.interface || "?",
            server: e.server ? e.server.name : "",
        }))
        .sort((a, b) => b.epoch - a.epoch);
    return <RichTable columns={columns} data={data} withPagination />;
}

const HistoryTableWithErrorAndSpinner = withSpinnerOnSending(
    withErrorMessage(HistoryTable)
);

/* Recorded results. A range within the raw retention lists each measurement.
 * A range reaching further back, when an archive is kept, lists daily
 * averages instead, and the page says so. */
export default function History() {
    const ranges = RANGES();
    const [range, setRange] = useState(ranges[1].seconds);
    const [from, setFrom] = useState(() => now() - ranges[1].seconds);
    const [iface, setIface] = useState("");
    const [historyState, getHistory] = useAPIGet(
        `${API_URLs.history}?from=${from}`
    );

    useEffect(() => {
        getHistory();
    }, [getHistory]);

    const pick = (seconds) => {
        setRange(seconds);
        setFrom(now() - seconds);
    };

    const loaded = historyState.state === API_STATE.SUCCESS;
    const all = loaded ? historyState.data.entries : [];
    const daily = loaded && historyState.data.resolution === "1d";
    const interfaces = Array.from(
        new Set(all.map((e) => e.interface || "?"))
    ).sort();
    // A filter on an interface this range does not have is no filter: the
    // select is gone, so nothing could clear it.
    const filter = interfaces.includes(iface) ? iface : "";
    const entries = filter
        ? all.filter((e) => (e.interface || "?") === filter)
        : all;
    const choices = { "": _("All interfaces") };
    interfaces.forEach((name) => {
        choices[name] = name;
    });

    return (
        <LibreSpeed>
            <div className="card p-4 mb-4">
                <h2>{_("History")}</h2>
                <div className="d-flex flex-wrap gap-2 align-items-end mb-3">
                    <div
                        className="btn-group"
                        role="group"
                        aria-label={_("Range")}
                    >
                        {ranges.map((r) => (
                            <button
                                key={r.seconds}
                                type="button"
                                className={`btn btn-sm ${
                                    r.seconds === range
                                        ? "btn-primary"
                                        : "btn-outline-primary"
                                }`}
                                aria-pressed={r.seconds === range}
                                onClick={() => pick(r.seconds)}
                                // One range at a time: a slower earlier reply
                                // would otherwise replace the later one.
                                disabled={
                                    historyState.state === API_STATE.SENDING
                                }
                            >
                                {r.label}
                            </button>
                        ))}
                    </div>
                    {interfaces.length > 1 && (
                        <div className="ms-auto">
                            <Select
                                label={_("Interface")}
                                choices={choices}
                                value={filter}
                                onChange={(event) =>
                                    setIface(event.target.value)
                                }
                            />
                        </div>
                    )}
                </div>
                {daily && (
                    <p className="text-muted">
                        {_(
                            "This range reaches past the kept measurements, so it shows daily averages from the archive. Today is not in it yet."
                        )}
                    </p>
                )}
                {loaded && entries.length > 0 && (
                    <p>
                        {babel.format(
                            _(
                                "Average: %(download)s Mb/s down, %(upload)s Mb/s up, %(ping)s ms ping."
                            ),
                            {
                                download: formatNumber(
                                    average(entries, "download_mbps", daily)
                                ),
                                upload: formatNumber(
                                    average(entries, "upload_mbps", daily)
                                ),
                                ping: formatNumber(
                                    average(entries, "ping_ms", daily),
                                    1
                                ),
                            }
                        )}
                    </p>
                )}
                <HistoryTableWithErrorAndSpinner
                    apiState={historyState.state}
                    entries={entries}
                    daily={daily}
                />
            </div>
        </LibreSpeed>
    );
}
