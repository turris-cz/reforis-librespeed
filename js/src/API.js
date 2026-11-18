/*
 * Copyright (C) 2020-2023 CZ.NIC z.s.p.o. (https://www.nic.cz/)
 *
 * This is free software, licensed under the GNU General Public License v3.
 * See /LICENSE for more information.
 */

import { REFORIS_URL_PREFIX } from "foris";

const API_URL_PREFIX = `${REFORIS_URL_PREFIX}/librespeed/api`;

/* One endpoint per action of the foris-controller librespeed module. */
const API_URLs = new Proxy(
    {
        status: "/status",
        start: "/start",
        stop: "/stop",
        result: "/result",
        history: "/history",
        config: "/config",
        links: "/links",
        storage: "/storage",
    },
    {
        get: (target, name) => `${API_URL_PREFIX}${target[name]}`,
    }
);

export default API_URLs;
