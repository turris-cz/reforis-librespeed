/*
 * This is free software, licensed under the GNU General Public License v3.
 * See /LICENSE for more information.
 */

import { config, links } from "../../__tests__/__fixtures__/librespeed";
import {
    STORAGE_ARCHIVE,
    duplicateLinks,
    prepData,
    prepDataToSubmit,
    validator,
} from "../settingsData";

describe("settings data", () => {
    it("submits only what the page shows", () => {
        const submitted = prepDataToSubmit(prepData(config));
        expect(submitted).toEqual({
            interface: config.interface,
            schedule: config.schedule,
            interface_schedules: config.interface_schedules,
            history: { enabled: true, retention_days: 30, archive_path: "" },
        });
    });

    it("never sends what is left to LuCI", () => {
        const form = prepData(config);
        form.history.retention_days = "90";
        form.history.archive_path = STORAGE_ARCHIVE;
        const submitted = prepDataToSubmit(form);
        ["server", "scheme", "server_list"].forEach((key) =>
            expect(submitted).not.toHaveProperty(key)
        );
        expect(submitted.history).toEqual({
            enabled: true,
            retention_days: 90,
            archive_path: STORAGE_ARCHIVE,
        });
    });

    it.each([0, 5000])(
        "leaves a retention the module would not take (%i) alone",
        (days) => {
            const form = prepData({
                ...config,
                history: { ...config.history, retention_days: days },
            });
            expect(prepDataToSubmit(form).history).toEqual({
                enabled: true,
                archive_path: "",
            });
        }
    );

    it("sends the default interface as null and days in order", () => {
        const form = prepData(config);
        form.schedule.interface = "";
        form.schedule.days = [3, 1];
        const submitted = prepDataToSubmit(form);
        expect(submitted.schedule.interface).toBeNull();
        expect(submitted.schedule.days).toEqual([1, 3]);
    });

    it("finds nothing wrong with a valid config", () => {
        expect(validator(prepData(config))).toBeUndefined();
    });

    it("refuses what the module refuses", () => {
        const form = prepData(config);
        form.schedule.interval = "90m";
        form.interface_schedules[0].hours = { from: 22, to: 4 };
        const errors = validator(form);
        expect(Object.keys(errors).sort()).toEqual([
            "interface_schedules",
            "schedule",
        ]);
        expect(errors.schedule.interval).toBeDefined();
        expect(errors.interface_schedules[0].hours).toBeDefined();
    });

    it("finds two enabled schedules on one link", () => {
        const form = prepData(config);
        expect(duplicateLinks(form, links.interfaces)).toEqual([]);
        form.interface_schedules[0].interface = "wan6";
        expect(duplicateLinks(form, links.interfaces)).toEqual(["wan"]);
        form.interface_schedules[0].enabled = false;
        expect(duplicateLinks(form, links.interfaces)).toEqual([]);
    });
});
