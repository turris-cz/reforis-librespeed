/*
 * This is free software, licensed under the GNU General Public License v3.
 * See /LICENSE for more information.
 */

import React, { useEffect } from "react";

import { API_STATE, useAPIGet } from "foris";
import PropTypes from "prop-types";

import API_URLs from "../API";
import { formatTime } from "../utils";

/* librespeed-common rewrites the cron lines once the router has reloaded its
 * configuration, a moment after a save answers. */
export const RECHECK_MS = [2000, 6000, 15000];

AppliedSchedules.propTypes = {
    applied: PropTypes.arrayOf(
        PropTypes.shape({
            interface: PropTypes.string.isRequired,
            next_runs: PropTypes.arrayOf(PropTypes.number).isRequired,
        })
    ),
    saves: PropTypes.number,
};

/* When measurements will actually run: what cron holds, not the form. The
 * form loads it once, so after each save it is asked for again. */
export default function AppliedSchedules({ applied, saves }) {
    const [configState, getConfig] = useAPIGet(API_URLs.config);
    useEffect(() => {
        if (!saves) {
            return undefined;
        }
        const timers = RECHECK_MS.map((ms) => setTimeout(getConfig, ms));
        return () => timers.forEach(clearTimeout);
    }, [saves, getConfig]);
    const shown =
        saves && configState.state === API_STATE.SUCCESS
            ? configState.data.applied_schedules
            : applied;
    return (
        <div className="mb-3">
            <h3 className="h5">{_("Upcoming measurements")}</h3>
            {shown && shown.length > 0 ? (
                <ul className="list-unstyled mb-1">
                    {shown.map((a) => (
                        <li key={a.interface}>
                            <strong>{a.interface}</strong>:{" "}
                            {a.next_runs.map(formatTime).join(", ")}
                        </li>
                    ))}
                </ul>
            ) : (
                <p className="text-muted mb-1">
                    {_("No measurement is scheduled.")}
                </p>
            )}
            <div className="form-text">
                {_(
                    "The list updates within a few seconds after saving. A daily measurement gets a new random time whenever the settings change. A weekly one keeps its day and time while they still match the settings."
                )}
            </div>
        </div>
    );
}
