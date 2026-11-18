/*
 * This is free software, licensed under the GNU General Public License v3.
 * See /LICENSE for more information.
 */

import React, { useEffect } from "react";

import { API_STATE, Button, Select, Switch, useAPIGet } from "foris";
import PropTypes from "prop-types";

import AppliedSchedules from "./AppliedSchedules";
import DailyArchive from "./DailyArchive";
import ScheduleFields, { at } from "./ScheduleFields";
import { duplicateLinks, newSchedule } from "./settingsData";
import API_URLs from "../API";

SettingsForm.propTypes = {
    formData: PropTypes.object,
    formErrors: PropTypes.object,
    setFormValue: PropTypes.func,
    disabled: PropTypes.bool,
    saves: PropTypes.number,
};

function retentionChoices(days) {
    const choices = {
        7: _("7 days"),
        30: _("30 days"),
        90: _("90 days"),
        365: _("1 year"),
    };
    if (!choices[days]) {
        // 0: a retention LuCI set in other units than days.
        choices[days] = days
            ? babel.format(_("%(days)s days"), { days })
            : _("As set in LuCI");
    }
    return choices;
}

/* Choices with the stored value kept, even when it is not among them. */
function withCurrent(choices, value) {
    const key = String(value);
    return choices[key] ? choices : { ...choices, [key]: key };
}

export default function SettingsForm({
    formData,
    formErrors,
    setFormValue,
    disabled,
    saves,
}) {
    const [linksState, getLinks] = useAPIGet(API_URLs.links);
    useEffect(() => {
        getLinks();
    }, [getLinks]);

    const errors = formErrors || {};
    const links =
        linksState.state === API_STATE.SUCCESS ? linksState.data : null;
    const offered = {};
    (links ? links.links : []).forEach((name) => {
        offered[name] = name;
    });
    const set = (path) => setFormValue((value) => at(path, { $set: value }));
    const duplicates = duplicateLinks(formData, links && links.interfaces);
    // A new schedule starts on a link no schedule measures yet. With every
    // link taken, or the links not loaded, there is none to add.
    const linkOf = (name) =>
        (links && links.interfaces && links.interfaces[name]) || name;
    const scheduled = new Set(
        formData.interface_schedules.map((row) => linkOf(row.interface))
    );
    if (formData.schedule) {
        scheduled.add(
            linkOf(formData.schedule.interface || formData.interface)
        );
    }
    const unscheduled =
        Object.keys(offered).find((name) => !scheduled.has(name)) || "";

    return (
        <>
            <div className="mb-5">
                <h2>{_("Measurement")}</h2>
                <Select
                    label={_("Default interface")}
                    choices={withCurrent(offered, formData.interface)}
                    value={formData.interface}
                    onChange={set(["interface"])}
                    helpText={_(
                        "The speed test measures this interface unless you choose another one, and so does the schedule for the default interface."
                    )}
                />
                {errors.interface && (
                    <div className="text-danger small mb-2">
                        {errors.interface}
                    </div>
                )}
            </div>

            <div className="mb-5">
                <h2>{_("Scheduled measurements")}</h2>
                <p className="text-muted">
                    {_(
                        "A measurement uses the full capacity of its connection while it runs, so each connection can have only one enabled schedule. IPv4 and IPv6 on the same device count as one connection."
                    )}
                </p>
                {duplicates.length > 0 && (
                    <p className="text-danger" role="alert">
                        {babel.format(
                            _(
                                "Two enabled schedules measure the same connection (%(connections)s). The router will not save this."
                            ),
                            { connections: duplicates.join(", ") }
                        )}
                    </p>
                )}
                <h3 className="h5">
                    {_("Schedule for the default interface")}
                </h3>
                {formData.schedule ? (
                    <ScheduleFields
                        row={formData.schedule}
                        path={["schedule"]}
                        errors={errors.schedule}
                        // It measures the default interface unless LuCI set
                        // another. Only then is there a choice to show.
                        showInterface={!!formData.schedule.interface}
                        interfaceChoices={{
                            "": _("Default interface"),
                            ...offered,
                        }}
                        setFormValue={setFormValue}
                        disabled={disabled}
                    />
                ) : (
                    <Button
                        className="btn-outline-primary mb-3"
                        onClick={setFormValue(() => ({
                            schedule: {
                                $set: { ...newSchedule(), enabled: false },
                            },
                        }))}
                        disabled={disabled}
                    >
                        {_("Set up a schedule for the default interface")}
                    </Button>
                )}
                {formData.interface_schedules.map((row, i) => (
                    // Rows have no identity of their own: their place is it.
                    // eslint-disable-next-line react/no-array-index-key
                    <div key={i} className="border-top pt-3 mt-3">
                        <div className="d-flex justify-content-between align-items-center">
                            <h3 className="h5 mb-0">
                                {babel.format(_("Schedule %(number)s"), {
                                    number: i + 2,
                                })}
                            </h3>
                            <Button
                                className="btn-sm btn-outline-danger"
                                onClick={setFormValue(() => ({
                                    interface_schedules: { $splice: [[i, 1]] },
                                }))}
                                disabled={disabled}
                            >
                                {_("Remove")}
                            </Button>
                        </div>
                        <ScheduleFields
                            row={row}
                            path={["interface_schedules", i]}
                            errors={
                                errors.interface_schedules &&
                                errors.interface_schedules[i]
                            }
                            interfaceChoices={offered}
                            setFormValue={setFormValue}
                            disabled={disabled}
                        />
                    </div>
                ))}
                <div className="mt-3 mb-4">
                    <Button
                        className="btn-outline-primary"
                        onClick={setFormValue(() => ({
                            interface_schedules: {
                                $push: [
                                    {
                                        ...newSchedule(),
                                        interface: unscheduled,
                                    },
                                ],
                            },
                        }))}
                        disabled={disabled || !unscheduled}
                    >
                        {_("Add a schedule for another interface")}
                    </Button>
                </div>
                <AppliedSchedules
                    applied={formData.applied_schedules}
                    saves={saves}
                />
            </div>

            <div className="mb-3">
                <h2>{_("History")}</h2>
                <Switch
                    label={_("Keep the history of results")}
                    checked={formData.history.enabled}
                    onChange={set(["history", "enabled"])}
                    disabled={disabled}
                />
                {formData.history.enabled && (
                    <>
                        <Select
                            label={_("Keep results for")}
                            choices={retentionChoices(
                                formData.history.retention_days
                            )}
                            value={String(formData.history.retention_days)}
                            onChange={set(["history", "retention_days"])}
                        />
                        <DailyArchive
                            archivePath={formData.history.archive_path}
                            setFormValue={setFormValue}
                            disabled={disabled}
                        />
                    </>
                )}
            </div>
        </>
    );
}
