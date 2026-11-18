/*
 * This is free software, licensed under the GNU General Public License v3.
 * See /LICENSE for more information.
 */

import React from "react";

import { fireEvent, render, wait } from "foris/testUtils/customTestRender";
import mockAxios from "jest-mock-axios";

import API_URLs from "../../API";
import DailyArchive from "../DailyArchive";

async function renderWith(storage, archivePath = "", setFormValue) {
    const utils = render(
        <DailyArchive
            archivePath={archivePath}
            setFormValue={setFormValue || (() => () => undefined)}
        />
    );
    mockAxios.mockResponseFor({ url: API_URLs.storage }, { data: storage });
    await wait(() => expect(mockAxios.get).toHaveBeenCalled());
    return utils;
}

describe("<DailyArchive />", () => {
    afterEach(() => {
        mockAxios.reset();
    });

    it("offers daily averages on an external drive", async () => {
        const { findByText } = await renderWith({
            installed: true,
            using_external: true,
        });
        expect(await findByText("Keep daily averages")).toBeTruthy();
    });

    it("points to the Storage plugin without one", async () => {
        const { findByText, queryByText } = await renderWith({
            installed: true,
            using_external: false,
        });
        expect(await findByText("Storage plugin")).toBeTruthy();
        expect(queryByText("Keep daily averages")).toBeNull();
    });

    it("lets an archive kept elsewhere be switched off", async () => {
        const { findByText } = await renderWith(
            { installed: false, using_external: false },
            "/mnt/data/daily.jsonl"
        );
        // The test babel.format returns the message as it is.
        expect(
            await findByText("Daily averages are kept in %(path)s.")
        ).toBeTruthy();
        expect(document.querySelector("input[type=checkbox]").checked).toBe(
            true
        );
    });

    it("switches an archive set in LuCI off and back to its place", async () => {
        const rules = [];
        const setFormValue = (rule) => (event) =>
            rules.push(rule(event.target.checked));
        const storage = { installed: false, using_external: false };
        const { container, rerender, findByText } = await renderWith(
            storage,
            "/mnt/data/daily.jsonl",
            setFormValue
        );
        await findByText("Keep daily averages");
        fireEvent.click(container.querySelector("input[type=checkbox]"));
        expect(rules[0].history.archive_path.$set).toBe("");
        rerender(<DailyArchive archivePath="" setFormValue={setFormValue} />);
        const box = container.querySelector("input[type=checkbox]");
        expect(box.checked).toBe(false);
        fireEvent.click(box);
        expect(rules[1].history.archive_path.$set).toBe(
            "/mnt/data/daily.jsonl"
        );
    });

    it("says nothing without the storage module", async () => {
        const { container } = await renderWith({
            installed: false,
            using_external: false,
        });
        await wait(() => expect(container.textContent).toBe(""));
    });
});
