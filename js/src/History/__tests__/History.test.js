/*
 * This is free software, licensed under the GNU General Public License v3.
 * See /LICENSE for more information.
 */

import React from "react";

import { fireEvent, render, wait } from "foris/testUtils/customTestRender";
import mockAxios from "jest-mock-axios";

import API_URLs from "../../API";
import {
    dailyHistory,
    rawHistory,
} from "../../__tests__/__fixtures__/librespeed";
import History, { average } from "../History";

describe("<History />", () => {
    afterEach(() => {
        mockAxios.reset();
    });

    it("lists the measurements of the last 7 days", async () => {
        const { getByText } = render(<History />);
        const url = mockAxios.get.mock.calls[0][0];
        const from = Number(url.split("from=")[1]);
        expect(url.startsWith(`${API_URLs.history}?from=`)).toBe(true);
        expect(Math.abs(Date.now() / 1000 - 7 * 86400 - from)).toBeLessThan(60);
        mockAxios.mockResponse({ data: rawHistory });
        await wait(() => getByText("Local"));
        expect(getByText(/^Average:/)).toBeTruthy();
    });

    it("says when it shows daily averages from the archive", async () => {
        const { getByText, getAllByText } = render(<History />);
        mockAxios.mockResponse({ data: dailyHistory });
        await wait(() => getByText(/daily averages from the archive/));
        // The samples column, in the header and in the column picker.
        expect(getAllByText("Measurements").length).toBeGreaterThan(0);
    });

    it("asks again for another range", async () => {
        const { getByText } = render(<History />);
        mockAxios.mockResponse({ data: rawHistory });
        await wait(() => getByText("Local"));
        fireEvent.click(getByText("1 year"));
        await wait(() => expect(mockAxios.get).toHaveBeenCalledTimes(2));
        const from = Number(mockAxios.get.mock.calls[1][0].split("from=")[1]);
        expect(Math.abs(Date.now() / 1000 - 365 * 86400 - from)).toBeLessThan(60);
    });
});

describe("average", () => {
    const days = [
        { download_mbps: 100, samples: 100 },
        { download_mbps: 10, samples: 2 },
    ];

    it("weighs each day by its measurements", () => {
        expect(average(days, "download_mbps", true)).toBeCloseTo(
            10020 / 102
        );
    });

    it("weighs raw measurements equally", () => {
        expect(average(days, "download_mbps", false)).toBe(55);
    });

    it("has nothing to say without numbers", () => {
        expect(average([{}], "download_mbps", true)).toBeNull();
    });
});
