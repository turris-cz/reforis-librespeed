/*
 * Copyright (C) 2019-2023 CZ.NIC z.s.p.o. (https://www.nic.cz/)
 *
 * This is free software, licensed under the GNU General Public License v3.
 * See /LICENSE for more information.
 */

import React, { useCallback, useState } from "react";

import { ForisForm } from "foris";
import PropTypes from "prop-types";

import { prepData, prepDataToSubmit, validator } from "./settingsData";
import SettingsForm from "./SettingsForm";
import API_URLs from "../API";
import LibreSpeed from "../LibreSpeed";

Settings.propTypes = {
    ws: PropTypes.object.isRequired,
};

export default function Settings({ ws }) {
    // Counts saves. ForisForm wants a callback that keeps its identity.
    const [saves, setSaves] = useState(0);
    const onSaved = useCallback(() => setSaves((n) => n + 1), []);
    return (
        <LibreSpeed>
            <p className="text-muted">
                {_(
                    "More settings, such as the server or the protocol, are in LuCI under Network → LibreSpeed."
                )}
            </p>
            <ForisForm
                ws={ws}
                forisConfig={{
                    endpoint: API_URLs.config,
                    wsModule: "librespeed",
                    wsAction: "update_config",
                }}
                prepData={prepData}
                prepDataToSubmit={prepDataToSubmit}
                validator={validator}
                postCallback={onSaved}
            >
                <SettingsForm saves={saves} />
            </ForisForm>
        </LibreSpeed>
    );
}
