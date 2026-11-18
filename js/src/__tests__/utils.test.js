/*
 * This is free software, licensed under the GNU General Public License v3.
 * See /LICENSE for more information.
 */

import {
    failureMessage,
    formatElapsed,
    intlLocale,
    overallProgress,
    startErrorMessage,
} from "../utils";

describe("overallProgress", () => {
    it("places a stage's percent within the whole run", () => {
        expect(overallProgress({ phase: "download", phase_progress_percent: 0 })).toBe(10);
        expect(overallProgress({ phase: "download", phase_progress_percent: 100 })).toBe(55);
        expect(overallProgress({ phase: "upload", phase_progress_percent: 50 })).toBe(78);
    });

    it("is unknown without a percent, except a little while pinging", () => {
        expect(overallProgress({ phase: "download" })).toBeNull();
        expect(overallProgress({ phase: "ping" })).toBe(5);
        expect(overallProgress({ phase: "" })).toBeNull();
    });

    it("never goes past the stage's end", () => {
        expect(overallProgress({ phase: "upload", phase_progress_percent: 140 })).toBe(100);
    });
});

describe("startErrorMessage", () => {
    it("explains a known refusal", () => {
        expect(startErrorMessage("interface_down", "interface is down")).toBe(
            "This interface is down."
        );
    });

    it("falls back to librespeed's words, then to a general message", () => {
        expect(startErrorMessage("something_new", "raw words")).toBe("raw words");
        expect(startErrorMessage(undefined, undefined)).toBe(
            "The measurement could not be started."
        );
    });
});

describe("failureMessage", () => {
    it("translates what librespeed-run words itself", () => {
        expect(failureMessage("interface is down")).toBe("This interface is down.");
        expect(
            failureMessage("skipped: another measurement held the lock for 3 minutes")
        ).toBe(
            "Skipped: another measurement was still running after 3 minutes of waiting."
        );
    });

    it("keeps the exit code of a failed client", () => {
        const format = jest.spyOn(global.babel, "format");
        try {
            // The test babel.format returns the message as it is.
            expect(failureMessage("measurement failed (exit 2)")).toBe(
                "The LibreSpeed client failed with exit code %(code)s."
            );
            expect(format).toHaveBeenCalledWith(
                "The LibreSpeed client failed with exit code %(code)s.",
                { code: "2" }
            );
        } finally {
            format.mockRestore();
        }
    });

    it("shows what the client printed as it is", () => {
        expect(failureMessage("Selected server Down is not responding")).toBe(
            "Selected server Down is not responding"
        );
        expect(failureMessage("constructor")).toBe("constructor");
    });
});

it("formats elapsed seconds as minutes and seconds", () => {
    expect(formatElapsed(0)).toBe("0:00");
    expect(formatElapsed(75)).toBe("1:15");
});

describe("intlLocale", () => {
    const original = global.ForisTranslations;
    afterEach(() => {
        global.ForisTranslations = original;
    });

    it("gives Intl a tag it takes, also for nb_NO", () => {
        global.ForisTranslations = { ...original, locale: "nb_NO" };
        expect(intlLocale()).toBe("nb-NO");
        expect(() => (1.5).toLocaleString(intlLocale())).not.toThrow();
    });
});
