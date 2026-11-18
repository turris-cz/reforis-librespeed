/*
 * This is free software, licensed under the GNU General Public License v3.
 * See /LICENSE for more information.
 */

import React from "react";

import PropTypes from "prop-types";

import { failureMessage, formatTime } from "../utils";

Failures.propTypes = {
    failures: PropTypes.arrayOf(
        PropTypes.shape({
            interface: PropTypes.string.isRequired,
            error: PropTypes.string.isRequired,
            finished: PropTypes.number.isRequired,
        })
    ),
};

/* Each interface's last failure, scheduled runs included, kept until a
 * measurement on its connection succeeds. */
export default function Failures({ failures }) {
    if (!failures || failures.length === 0) {
        return null;
    }
    return (
        <div className="card p-4 mb-4">
            <h2>{_("Failed measurements")}</h2>
            <p className="text-muted">
                {_(
                    "Each interface's last failure, including scheduled measurements, until a measurement of it succeeds."
                )}
            </p>
            <ul className="list-unstyled mb-0">
                {failures.map((f) => (
                    <li key={f.interface} className="mb-1">
                        <strong>{f.interface}</strong>:{" "}
                        {failureMessage(f.error)}{" "}
                        <span className="text-muted">
                            ({formatTime(f.finished)})
                        </span>
                    </li>
                ))}
            </ul>
        </div>
    );
}
