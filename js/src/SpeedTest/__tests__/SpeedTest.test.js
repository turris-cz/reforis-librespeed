/*
 * Copyright (C) 2020 CZ.NIC z.s.p.o. (http://www.nic.cz/)
 *
 * This is free software, licensed under the GNU General Public License v3.
 * See /LICENSE for more information.
 */

import React from "react";

import { fireEvent, render, wait } from "foris/testUtils/customTestRender";
import { mockSetAlert } from "foris/testUtils/alertContextMock";
import mockAxios from "jest-mock-axios";

import API_URLs from "../../API";
import {
    config,
    idleStatus,
    links,
    result,
    runningStatus,
} from "../../__tests__/__fixtures__/librespeed";
import SpeedTest from "../SpeedTest";

function respond(url, data) {
    mockAxios.mockResponseFor({ url }, { data });
}

async function renderWith(status) {
    const utils = render(<SpeedTest />);
    respond(API_URLs.links, links);
    respond(API_URLs.config, config);
    respond(API_URLs.result, result);
    respond(API_URLs.status, status);
    await wait(() => utils.getByText("Start"));
    return utils;
}

describe("<SpeedTest />", () => {
    afterEach(() => {
        mockAxios.reset();
    });

    it("starts a measurement of the default interface", async () => {
        const { getByText, getByLabelText } = await renderWith(idleStatus);
        expect(getByLabelText("Interface").value).toBe("wan");
        expect(getByText("Last result")).toBeTruthy();
        fireEvent.click(getByText("Start"));
        expect(mockAxios.post).toHaveBeenCalledWith(
            API_URLs.start,
            { interface: "wan" },
            expect.anything()
        );
    });

    it("explains a refused start", async () => {
        const { getByText } = await renderWith(idleStatus);
        fireEvent.click(getByText("Start"));
        respond(API_URLs.start, {
            started: false,
            error: "already_running",
            message: "already running",
        });
        await wait(() =>
            expect(mockSetAlert).toBeCalledWith(
                "Another measurement is running. Wait for it to finish."
            )
        );
    });

    it("fetches the result of a run that ended between two polls", async () => {
        await renderWith(idleStatus);
        const resultCalls = () =>
            mockAxios.get.mock.calls.filter(([url]) => url === API_URLs.result)
                .length;
        expect(resultCalls()).toBe(1);
        document.dispatchEvent(new Event("visibilitychange"));
        respond(API_URLs.status, {
            ...idleStatus,
            last_finished: idleStatus.last_finished + 60,
        });
        await wait(() => expect(resultCalls()).toBe(2));
    });

    it("shows each interface's last failure", async () => {
        const { getByText } = await renderWith(idleStatus);
        expect(getByText("Failed measurements")).toBeTruthy();
        expect(getByText("lte")).toBeTruthy();
    });

    it("shows a running measurement and offers to stop it", async () => {
        const { getByText, container } = await renderWith(runningStatus);
        await wait(() => getByText("Stop"));
        expect(
            getByText("Download").closest("li").getAttribute("aria-current")
        ).toBe("step");
        // 6 % of the download stage: 10 + 45 * 0.06.
        expect(
            container
                .querySelector('[role="progressbar"]')
                .getAttribute("aria-valuenow")
        ).toBe("13");
        expect(getByText("Start").closest("button").disabled).toBe(true);
        fireEvent.click(getByText("Stop"));
        expect(mockAxios.post).toHaveBeenCalledWith(
            API_URLs.stop,
            undefined,
            expect.anything()
        );
    });
});
