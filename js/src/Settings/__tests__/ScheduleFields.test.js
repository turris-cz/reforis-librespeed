/*
 * This is free software, licensed under the GNU General Public License v3.
 * See /LICENSE for more information.
 */

import React from "react";

import { render } from "foris/testUtils/customTestRender";

import ScheduleFields from "../ScheduleFields";

const row = {
    enabled: false,
    interface: "lte",
    interval: "1d",
    days: [],
    hours: { from: 2, to: 5 },
};

function renderRow(props) {
    return render(
        <ScheduleFields
            row={row}
            path={["interface_schedules", 0]}
            interfaceChoices={{ lte: "lte", wan: "wan" }}
            setFormValue={() => () => undefined}
            {...props}
        />
    );
}

describe("<ScheduleFields />", () => {
    it("shows only the interface of a disabled schedule", () => {
        const { getByText, queryByText } = renderRow({});
        expect(getByText("Interface")).toBeTruthy();
        expect(queryByText("Interval")).toBeNull();
        expect(queryByText("Days")).toBeNull();
    });

    it("shows the timing of an enabled schedule", () => {
        const { getByText } = renderRow({ row: { ...row, enabled: true } });
        expect(getByText("Interval")).toBeTruthy();
        expect(getByText("From")).toBeTruthy();
    });

    it("shows a disabled schedule's timing when it has an error", () => {
        const { getByText } = renderRow({
            errors: { hours: "A time window must not end before it starts." },
        });
        expect(
            getByText("A time window must not end before it starts.")
        ).toBeTruthy();
    });
});
