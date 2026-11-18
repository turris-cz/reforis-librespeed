/*
 * This is free software, licensed under the GNU General Public License v3.
 * See /LICENSE for more information.
 */

import React from "react";

import { render, wait } from "foris/testUtils/customTestRender";
import mockAxios from "jest-mock-axios";

import API_URLs from "../../API";
import { config } from "../../__tests__/__fixtures__/librespeed";
import AppliedSchedules, { RECHECK_MS } from "../AppliedSchedules";

describe("<AppliedSchedules />", () => {
    afterEach(() => {
        mockAxios.reset();
        jest.useRealTimers();
    });

    it("shows what the form loaded until a save", () => {
        const { getByText } = render(
            <AppliedSchedules applied={[]} saves={0} />
        );
        expect(getByText("No measurement is scheduled.")).toBeTruthy();
        expect(mockAxios.get).not.toHaveBeenCalled();
    });

    it("asks the router again after a save", async () => {
        jest.useFakeTimers();
        const { getByText, rerender } = render(
            <AppliedSchedules applied={[]} saves={0} />
        );
        rerender(<AppliedSchedules applied={[]} saves={1} />);
        jest.advanceTimersByTime(RECHECK_MS[0]);
        expect(mockAxios.get).toHaveBeenCalledWith(
            API_URLs.config,
            expect.anything()
        );
        jest.useRealTimers();
        mockAxios.mockResponseFor({ url: API_URLs.config }, { data: config });
        await wait(() => getByText("lte"));
        expect(getByText("wan")).toBeTruthy();
    });
});
