/*
 * This is free software, licensed under the GNU General Public License v3.
 * See /LICENSE for more information.
 */

import React, { useEffect, useRef } from "react";

import { API_STATE, Switch, useAPIGet } from "foris";
import PropTypes from "prop-types";
import { Link } from "react-router-dom";

import { at } from "./ScheduleFields";
import { STORAGE_ARCHIVE } from "./settingsData";
import API_URLs from "../API";

DailyArchive.propTypes = {
    archivePath: PropTypes.string.isRequired,
    setFormValue: PropTypes.func.isRequired,
    disabled: PropTypes.bool,
};

/* Daily averages outlive the raw history, which librespeed keeps in /tmp, only
 * on persistent storage. They are therefore offered once the Storage plugin
 * has put /srv on an external drive, which spares the router's flash. An
 * archive kept elsewhere, set in LuCI, can be switched off here and on again,
 * back to where it was. */
export default function DailyArchive({ archivePath, setFormValue, disabled }) {
    const [storageState, getStorage] = useAPIGet(API_URLs.storage);
    const loaded = useRef(archivePath);
    useEffect(() => {
        getStorage();
    }, [getStorage]);

    if (storageState.state !== API_STATE.SUCCESS) {
        return null;
    }
    const storage = storageState.data;
    const kept = archivePath !== "";

    let help;
    if (storage.using_external) {
        help = _(
            "Each finished day is reduced to its averages and kept on the external drive, so it outlasts restarts and the raw history."
        );
    } else if (kept) {
        help = babel.format(_("Daily averages are kept in %(path)s."), {
            path: archivePath,
        });
    }

    if (storage.using_external || kept || loaded.current !== "") {
        return (
            <Switch
                label={_("Keep daily averages")}
                checked={kept}
                onChange={setFormValue((checked) =>
                    at(["history", "archive_path"], {
                        $set: checked ? loaded.current || STORAGE_ARCHIVE : "",
                    })
                )}
                disabled={disabled}
                helpText={help}
            />
        );
    }
    if (storage.installed) {
        return (
            <p className="form-text">
                {_(
                    "To keep daily averages across restarts, set up an external drive in the"
                )}{" "}
                <Link to="/storage">{_("Storage plugin")}</Link>.
            </p>
        );
    }
    return null;
}
