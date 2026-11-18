/*
 * This is free software, licensed under the GNU General Public License v3.
 * See /LICENSE for more information.
 */

import React from "react";

import { CheckBox, Select, Switch } from "foris";
import PropTypes from "prop-types";

import { DAYS, INTERVALS } from "../utils";

/* An immutability-helper rule for the value at path. */
export const at = (path, rule) =>
    path.reduceRight((acc, key) => ({ [key]: acc }), rule);

const HOURS = Array.from({ length: 24 }, (_unused, h) => String(h));

ScheduleFields.propTypes = {
    row: PropTypes.object.isRequired,
    path: PropTypes.array.isRequired,
    errors: PropTypes.object,
    interfaceChoices: PropTypes.object.isRequired,
    setFormValue: PropTypes.func.isRequired,
    disabled: PropTypes.bool,
    showInterface: PropTypes.bool,
};

/* One automatic measurement: what it measures, how often, on which days and
 * within which hours. */
export default function ScheduleFields({
    row,
    path,
    errors,
    interfaceChoices,
    setFormValue,
    disabled,
    showInterface = true,
}) {
    const set = (key) =>
        setFormValue((value) => at([...path, key], { $set: value }));
    const intervals = INTERVALS();
    if (!intervals[row.interval]) {
        // A hand-set value stays shown, or a save would replace it unseen.
        intervals[row.interval] = row.interval;
    }
    let ifaceChoices = { ...interfaceChoices };
    if (row.interface && !ifaceChoices[row.interface]) {
        ifaceChoices[row.interface] = row.interface;
    } else if (!row.interface && !("" in ifaceChoices)) {
        // Shown first and chosen, so picking any interface is a change.
        ifaceChoices = { "": _("Choose an interface"), ...ifaceChoices };
    }
    const hourChoices = {};
    HOURS.forEach((h) => {
        hourChoices[h] = `${h.padStart(2, "0")}:00`;
    });
    const untilChoices = {};
    HOURS.forEach((h) => {
        untilChoices[h] = `${h.padStart(2, "0")}:59`;
    });
    // A disabled schedule shows only what it would measure, unless its
    // timing has an error to fix.
    const details =
        row.enabled || !!(errors && (errors.interval || errors.hours));
    const error = (key) =>
        errors && errors[key] ? (
            <div className="text-danger small mb-2">{errors[key]}</div>
        ) : null;

    return (
        <fieldset disabled={disabled}>
            <Switch
                label={_("Enabled")}
                checked={row.enabled}
                onChange={set("enabled")}
            />
            <div className="row g-3">
                {showInterface && (
                    <div className="col-md-6">
                        <Select
                            label={_("Interface")}
                            choices={ifaceChoices}
                            value={row.interface}
                            onChange={set("interface")}
                        />
                        {error("interface")}
                    </div>
                )}
                {details && (
                    <div className="col-md-6">
                        <Select
                            label={_("Interval")}
                            choices={intervals}
                            value={row.interval}
                            onChange={set("interval")}
                        />
                        {error("interval")}
                    </div>
                )}
            </div>
            {details && (
                <ScheduleTiming
                    row={row}
                    path={path}
                    error={error}
                    hourChoices={hourChoices}
                    untilChoices={untilChoices}
                    setFormValue={setFormValue}
                />
            )}
        </fieldset>
    );
}

ScheduleTiming.propTypes = {
    row: PropTypes.object.isRequired,
    path: PropTypes.array.isRequired,
    error: PropTypes.func.isRequired,
    hourChoices: PropTypes.object.isRequired,
    untilChoices: PropTypes.object.isRequired,
    setFormValue: PropTypes.func.isRequired,
};

/* The days and hours a schedule runs within. */
function ScheduleTiming({
    row,
    path,
    error,
    hourChoices,
    untilChoices,
    setFormValue,
}) {
    return (
        <>
            <div className="mb-3">
                <div className="form-label">{_("Days")}</div>
                <div className="d-flex flex-wrap gap-3">
                    {DAYS().map(([day, label]) => (
                        <CheckBox
                            key={day}
                            label={label}
                            checked={row.days.includes(day)}
                            onChange={setFormValue((checked) =>
                                at([...path, "days"], {
                                    $set: checked
                                        ? [...row.days, day]
                                        : row.days.filter((d) => d !== day),
                                })
                            )}
                        />
                    ))}
                </div>
                <div className="form-text">
                    {row.interval === "7d"
                        ? _(
                              "A weekly measurement runs on one of the chosen days, or on any day if none is chosen."
                          )
                        : _("None chosen means every day.")}
                </div>
            </div>
            <Switch
                label={_("At any time of day")}
                checked={row.hours === null}
                onChange={setFormValue((anyTime) =>
                    at([...path, "hours"], {
                        $set: anyTime ? null : { from: 2, to: 5 },
                    })
                )}
                helpText={_(
                    "A daily or weekly measurement runs at a random time within these hours, chosen when the settings are saved. More frequent measurements run only within them."
                )}
            />
            {row.hours !== null && (
                <div className="row g-3">
                    <div className="col-6">
                        <Select
                            label={_("From")}
                            choices={hourChoices}
                            value={String(row.hours.from)}
                            onChange={setFormValue((value) =>
                                at([...path, "hours", "from"], {
                                    $set: Number(value),
                                })
                            )}
                        />
                    </div>
                    <div className="col-6">
                        <Select
                            label={_("Until")}
                            choices={untilChoices}
                            value={String(row.hours.to)}
                            onChange={setFormValue((value) =>
                                at([...path, "hours", "to"], {
                                    $set: Number(value),
                                })
                            )}
                        />
                    </div>
                    <div className="col-12">{error("hours")}</div>
                </div>
            )}
        </>
    );
}
