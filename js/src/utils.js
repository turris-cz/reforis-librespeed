/*
 * This is free software, licensed under the GNU General Public License v3.
 * See /LICENSE for more information.
 */

/* The stages of a measurement and the share of the whole run each covers,
 * as in luci-app-librespeed, so the bar moves on through the run instead of
 * refilling per stage. */
export const PHASES = [
    { phase: "ping", from: 0, to: 10, label: () => _("Ping") },
    { phase: "download", from: 10, to: 55, label: () => _("Download") },
    { phase: "upload", from: 55, to: 100, label: () => _("Upload") },
];

/* Percent of the whole run, or null when the client does not report how far
 * its stage is (the bar is then indeterminate). */
export function overallProgress(status) {
    const span = PHASES.find((p) => p.phase === status.phase);
    if (!span) {
        return null;
    }
    if (typeof status.phase_progress_percent !== "number") {
        return status.phase === "ping" ? 5 : null;
    }
    const share = Math.min(status.phase_progress_percent, 100) / 100;
    return Math.round(span.from + (span.to - span.from) * share);
}

/* The intervals luci-app-librespeed offers, which librespeed-common runs. */
export const INTERVALS = () => ({
    "15m": _("Every 15 minutes"),
    "30m": _("Every 30 minutes"),
    "1h": _("Hourly"),
    "6h": _("Every 6 hours"),
    "12h": _("Every 12 hours"),
    "1d": _("Daily"),
    "7d": _("Weekly"),
});

/* Monday first. The values are cron's, 0 being Sunday. */
export const DAYS = () => [
    [1, _("Mon")],
    [2, _("Tue")],
    [3, _("Wed")],
    [4, _("Thu")],
    [5, _("Fri")],
    [6, _("Sat")],
    [0, _("Sun")],
];

export const RANGES = () => [
    { seconds: 86400, label: _("24 hours") },
    { seconds: 7 * 86400, label: _("7 days") },
    { seconds: 30 * 86400, label: _("30 days") },
    { seconds: 365 * 86400, label: _("1 year") },
];

/* What a refused start means for the user, by the module's error code. */
export function startErrorMessage(code, message) {
    const messages = {
        already_running: _(
            "Another measurement is running. Wait for it to finish."
        ),
        not_installed: _(
            "The LibreSpeed measurement backend is not installed."
        ),
        unknown_interface: _("This interface does not exist."),
        interface_not_configured: _(
            "This interface is disabled or not configured."
        ),
        interface_down: _("This interface is down."),
        netifd_unavailable: _(
            "The router could not tell which interfaces are up. Try again later."
        ),
        backend_unavailable: _("The measurement backend did not answer."),
    };
    return (
        messages[code] || message || _("The measurement could not be started.")
    );
}

/* librespeed-run records its failures in English. Those it words itself are
 * shown translated. What the client printed is shown as it is. */
export function failureMessage(error) {
    const messages = {
        "netifd did not answer": _(
            "The router could not tell which interfaces are up. Try again later."
        ),
        "interface disabled or not configured": _(
            "This interface is disabled or not configured."
        ),
        "interface is down": _("This interface is down."),
        "librespeed-cli is not installed": _(
            "The LibreSpeed client is not installed."
        ),
        "measurement failed": _(
            "The LibreSpeed client failed without saying why."
        ),
        "no output from librespeed-cli": _(
            "The LibreSpeed client gave no output."
        ),
        "unparseable output from librespeed-cli": _(
            "The LibreSpeed client gave output that could not be read."
        ),
        "empty report": _("The LibreSpeed client reported no result."),
        "skipped: another measurement held the lock for 3 minutes": _(
            "Skipped: another measurement was still running after 3 minutes of waiting."
        ),
    };
    if (Object.prototype.hasOwnProperty.call(messages, error)) {
        return messages[error];
    }
    const exit = /^measurement failed \(exit (\d+)\)$/.exec(error);
    if (exit) {
        return babel.format(
            _("The LibreSpeed client failed with exit code %(code)s."),
            { code: exit[1] }
        );
    }
    return error;
}

/* The reForis locale as Intl takes it: nb_NO would throw a RangeError. */
export function intlLocale() {
    return String(ForisTranslations.locale || "en").replace(/_/g, "-");
}

export function formatNumber(value, digits = 2) {
    if (typeof value !== "number") {
        return "–";
    }
    return value.toLocaleString(intlLocale(), {
        minimumFractionDigits: digits,
        maximumFractionDigits: digits,
    });
}

export function formatTime(epoch) {
    if (typeof epoch !== "number") {
        return "";
    }
    return new Date(epoch * 1000).toLocaleString(intlLocale(), {
        dateStyle: "medium",
        timeStyle: "short",
    });
}

export function formatElapsed(seconds) {
    const s = Math.max(0, Math.floor(seconds));
    return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}
