/*
 * This is free software, licensed under the GNU General Public License v3.
 * See /LICENSE for more information.
 */

import React from "react";

import PropTypes from "prop-types";

import { failureMessage, formatNumber, formatTime } from "../utils";

LastResult.propTypes = {
    status: PropTypes.shape({
        last_error: PropTypes.string,
        last_finished: PropTypes.number,
        interface: PropTypes.string,
    }),
    result: PropTypes.object,
};

function Figure({ label, value, unit }) {
    return (
        <div className="col-6 col-md-3">
            <div className="text-muted small">{label}</div>
            <div className="fs-4">
                {value} <span className="fs-6 text-muted">{unit}</span>
            </div>
        </div>
    );
}

Figure.propTypes = {
    label: PropTypes.string.isRequired,
    value: PropTypes.string.isRequired,
    unit: PropTypes.string.isRequired,
};

/* How the last measurement ended, and the last result. */
export default function LastResult({ status, result }) {
    const lastError = status ? status.last_error : "";
    let outcome = null;
    if (lastError === "stopped") {
        outcome = (
            <p className="text-muted">
                {_("The last measurement was stopped.")}
            </p>
        );
    } else if (lastError) {
        outcome = (
            <p className="text-danger" role="alert">
                {status.interface
                    ? babel.format(
                          _(
                              "The last measurement of %(interface)s failed: %(error)s"
                          ),
                          {
                              interface: status.interface,
                              error: failureMessage(lastError),
                          }
                      )
                    : babel.format(
                          _("The last measurement failed: %(error)s"),
                          {
                              error: failureMessage(lastError),
                          }
                      )}
            </p>
        );
    }

    if (!result) {
        return (
            <>
                {outcome}
                <p className="text-muted mb-0">
                    {_("No measurement has been finished yet.")}
                </p>
            </>
        );
    }

    const families = { ipv4: "IPv4", ipv6: "IPv6" };
    const protocols = {
        https: _("encrypted (HTTPS)"),
        http: _("unencrypted (HTTP)"),
    };
    const facts = [
        result.server.name,
        result.interface,
        families[result.family],
        protocols[result.proto],
        formatTime(result.finished),
    ].filter(Boolean);

    return (
        <>
            {outcome}
            <h3 className="h5">{_("Last result")}</h3>
            <div className="row g-3 mb-2">
                <Figure
                    label={_("Download")}
                    value={formatNumber(result.download_mbps)}
                    unit="Mb/s"
                />
                <Figure
                    label={_("Upload")}
                    value={formatNumber(result.upload_mbps)}
                    unit="Mb/s"
                />
                <Figure
                    label={_("Ping")}
                    value={formatNumber(result.ping_ms)}
                    unit="ms"
                />
                <Figure
                    label={_("Jitter")}
                    value={formatNumber(result.jitter_ms)}
                    unit="ms"
                />
            </div>
            <p className="text-muted mb-0">
                {facts.join(" · ")}
                {/^https?:\/\//i.test(result.share) && (
                    <>
                        {" · "}
                        <a
                            href={result.share}
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            {_("Share")}
                        </a>
                    </>
                )}
            </p>
        </>
    );
}
