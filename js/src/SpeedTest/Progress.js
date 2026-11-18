/*
 * This is free software, licensed under the GNU General Public License v3.
 * See /LICENSE for more information.
 */

import React from "react";

import PropTypes from "prop-types";

import {
    PHASES,
    formatElapsed,
    formatNumber,
    intlLocale,
    overallProgress,
} from "../utils";

Progress.propTypes = {
    status: PropTypes.shape({
        phase: PropTypes.string,
        interface: PropTypes.string,
        elapsed_seconds: PropTypes.number,
        speed_mbps: PropTypes.number,
        phase_progress_percent: PropTypes.number,
    }).isRequired,
};

/* A running measurement: its stages, how far it is, and the speed so far. */
export default function Progress({ status }) {
    const percent = overallProgress(status);
    const index = PHASES.findIndex((p) => p.phase === status.phase);
    const stage = index >= 0 ? PHASES[index].label() : _("Connecting");
    const speed =
        typeof status.speed_mbps === "number"
            ? `${formatNumber(status.speed_mbps)} Mb/s`
            : "";

    return (
        <div className="librespeed-progress">
            <ol className="librespeed-steps" aria-label={_("Stages")}>
                {PHASES.map((p, i) => {
                    let state = "";
                    if (i === index) {
                        state = "librespeed-step-active";
                    } else if (index > i) {
                        state = "librespeed-step-done";
                    }
                    return (
                        <li
                            key={p.phase}
                            className={`librespeed-step ${state}`}
                            aria-current={i === index ? "step" : undefined}
                        >
                            {p.label()}
                        </li>
                    );
                })}
            </ol>
            <div
                className="progress mb-2"
                role="progressbar"
                aria-label={_("Measurement progress")}
                aria-valuemin="0"
                aria-valuemax="100"
                aria-valuenow={percent === null ? undefined : percent}
            >
                <div
                    className={
                        percent === null
                            ? "progress-bar progress-bar-striped progress-bar-animated w-100"
                            : "progress-bar"
                    }
                    style={
                        percent === null ? undefined : { width: `${percent}%` }
                    }
                >
                    {percent === null
                        ? ""
                        : (percent / 100).toLocaleString(intlLocale(), {
                              style: "percent",
                          })}
                </div>
            </div>
            {/* Announced per stage, not per second. */}
            <p className="mb-1" aria-live="polite">
                {status.interface
                    ? babel.format(_("%(interface)s: %(stage)s…"), {
                          interface: status.interface,
                          stage,
                      })
                    : `${stage}…`}
            </p>
            <p className="text-muted mb-0">
                {speed && <span className="me-3">{speed}</span>}
                {typeof status.elapsed_seconds === "number" &&
                    babel.format(_("%(time)s elapsed"), {
                        time: formatElapsed(status.elapsed_seconds),
                    })}
            </p>
        </div>
    );
}
