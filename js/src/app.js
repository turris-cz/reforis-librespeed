/*
 * Copyright (C) 2019-2023 CZ.NIC z.s.p.o. (https://www.nic.cz/)
 *
 * This is free software, licensed under the GNU General Public License v3.
 * See /LICENSE for more information.
 */

import React from "react";

import History from "./History/History";
import LibreSpeedIcon from "./LibreSpeedIcon";
import Settings from "./Settings/Settings";
import SpeedTest from "./SpeedTest/SpeedTest";

const LibreSpeedPlugin = {
    name: _("LibreSpeed"),
    weight: 65,
    path: "/librespeed",
    pages: [
        {
            path: "/speed-test",
            name: _("Speed Test"),
            component: SpeedTest,
        },
        {
            path: "/history",
            name: _("History"),
            component: History,
        },
        {
            path: "/settings",
            name: _("Settings"),
            component: Settings,
        },
    ],
    icon: <LibreSpeedIcon />,
};

ForisPlugins.push(LibreSpeedPlugin);
