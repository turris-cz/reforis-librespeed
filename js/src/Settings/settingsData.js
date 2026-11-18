/*
 * This is free software, licensed under the GNU General Public License v3.
 * See /LICENSE for more information.
 */

/* get_config's reply as form data, the form data as an update_config request,
 * and the rules the module applies, so the form refuses what it would.
 *
 * The page offers only part of the settings. The server, the protocol and
 * where the history is kept are left to LuCI. update_config changes only what
 * it is given, so what the page does not show is never sent, and a save here
 * keeps what was set there. A retention LuCI set in other units than days
 * reads as 0, and one set by hand may exceed what the module takes: either
 * is sent only once a value is chosen here. */

export const INTERVAL_RE =
    /^(([1-9]|[1-5][0-9])m|([1-9]|1[0-9]|2[0-3])h|1d|7d)$/;
const IFACE_RE = /^[A-Za-z0-9_]+$/;

export const newSchedule = () => ({
    enabled: true,
    interface: "",
    interval: "1d",
    days: [],
    hours: { from: 2, to: 5 },
});

/* Daily averages go here when kept on the drive the Storage plugin set up. */
export const STORAGE_ARCHIVE = "/srv/librespeed/daily.jsonl";

/* The longest retention update_config takes. */
const MAX_RETENTION_DAYS = 3650;

export function prepData(config) {
    return {
        interface: config.interface,
        // The original schedule's "default interface" is null in the API and
        // "" in the form, which a select can hold.
        schedule: config.schedule && {
            ...config.schedule,
            interface: config.schedule.interface || "",
        },
        interface_schedules: config.interface_schedules,
        history: {
            enabled: config.history.enabled,
            retention_days: config.history.retention_days,
            archive_path: config.history.archive_path,
        },
        applied_schedules: config.applied_schedules,
    };
}

function scheduleToSubmit(row, original) {
    return {
        enabled: row.enabled,
        interface: original ? row.interface || null : row.interface,
        interval: row.interval,
        days: [...row.days].map(Number).sort((a, b) => a - b),
        hours: row.hours
            ? { from: Number(row.hours.from), to: Number(row.hours.to) }
            : null,
    };
}

export function prepDataToSubmit(form) {
    const history = {
        enabled: form.history.enabled,
        archive_path: form.history.archive_path,
    };
    const retention = Number(form.history.retention_days);
    if (retention >= 1 && retention <= MAX_RETENTION_DAYS) {
        history.retention_days = retention;
    }
    return {
        interface: form.interface,
        schedule: form.schedule ? scheduleToSubmit(form.schedule, true) : null,
        interface_schedules: form.interface_schedules.map((row) =>
            scheduleToSubmit(row, false)
        ),
        history,
    };
}

function scheduleErrors(row, original) {
    const errors = {};
    if (!original && !IFACE_RE.test(row.interface)) {
        errors.interface = _("Choose the interface this schedule measures.");
    }
    if (!INTERVAL_RE.test(row.interval)) {
        errors.interval = _(
            "This interval cannot be scheduled. Choose one from the list."
        );
    }
    if (row.hours && Number(row.hours.from) > Number(row.hours.to)) {
        errors.hours = _("The time window must not cross midnight.");
    }
    return Object.keys(errors).length ? errors : null;
}

export function validator(form) {
    const errors = {};
    if (!IFACE_RE.test(form.interface)) {
        errors.interface = _("Choose an interface.");
    }
    if (form.schedule) {
        const e = scheduleErrors(form.schedule, true);
        if (e) {
            errors.schedule = e;
        }
    }
    const rows = {};
    form.interface_schedules.forEach((row, i) => {
        const e = scheduleErrors(row, false);
        if (e) {
            rows[i] = e;
        }
    });
    if (Object.keys(rows).length) {
        errors.interface_schedules = rows;
    }
    return Object.keys(errors).length ? errors : undefined;
}

/* Links two enabled schedules would both measure. The module refuses that. */
export function duplicateLinks(form, linkOf) {
    const measured = [];
    if (form.schedule && form.schedule.enabled) {
        measured.push(form.schedule.interface || form.interface);
    }
    form.interface_schedules.forEach((row) => {
        if (row.enabled) {
            measured.push(row.interface);
        }
    });
    const seen = new Set();
    const duplicates = new Set();
    measured.forEach((name) => {
        const link = (linkOf && linkOf[name]) || name;
        if (seen.has(link)) {
            duplicates.add(link);
        }
        seen.add(link);
    });
    return Array.from(duplicates);
}
