/*
 * Copyright (C) 2019-2023 CZ.NIC z.s.p.o. (https://www.nic.cz/)
 *
 * This is free software, licensed under the GNU General Public License v3.
 * See /LICENSE for more information.
 */

import React, { useEffect, useRef, useState } from "react";

import {
    API_STATE,
    Button,
    Select,
    useAlert,
    useAPIGet,
    useAPIPost,
} from "foris";

import Failures from "./Failures";
import LastResult from "./LastResult";
import Progress from "./Progress";
import API_URLs from "../API";
import LibreSpeed from "../LibreSpeed";
import useStatus from "../useStatus";
import { startErrorMessage } from "../utils";
import "./SpeedTest.css";

/* The interfaces to offer: the links librespeed would measure, the default
 * one even when it is not among them, and which of them are down. Without a
 * choice made yet, a prompt comes first, so the select shows what is chosen. */
function interfaceChoices(links, defaultInterface, selected) {
    const names = links ? [...links.links] : [];
    if (defaultInterface && !names.includes(defaultInterface)) {
        names.unshift(defaultInterface);
    }
    const down = (links && links.down) || [];
    const choices = selected ? {} : { "": _("Choose an interface") };
    names.forEach((name) => {
        let label = name;
        if (name === defaultInterface) {
            label = babel.format(_("%(interface)s (default)"), {
                interface: name,
            });
        }
        if (down.includes(name)) {
            label = babel.format(_("%(interface)s – down"), {
                interface: label,
            });
        }
        choices[name] = label;
    });
    return { choices, down };
}

export default function SpeedTest() {
    /* From a click on Start until a status shows how it went: running, or a
     * last_finished other than at the click (a run that failed at once). A
     * poll already under way at the click must not end it. */
    const [starting, setStarting] = useState(false);
    const { status, failed, refresh } = useStatus(starting);
    const [linksState, getLinks] = useAPIGet(API_URLs.links);
    // The last links read: they are read again now and then, and the choices
    // must not blink while they are.
    const [links, setLinks] = useState(null);
    const [configState, getConfig] = useAPIGet(API_URLs.config);
    const [resultState, getResult] = useAPIGet(API_URLs.result);
    const [startState, postStart] = useAPIPost(API_URLs.start);
    const [stopState, postStop] = useAPIPost(API_URLs.stop);
    const [setAlert, dismissAlert] = useAlert();
    const [iface, setIface] = useState("");
    const finishedAtClick = useRef(undefined);
    const seenStatus = useRef(false);
    const lastFinished = useRef(undefined);

    useEffect(() => {
        getLinks();
        getConfig();
        getResult();
    }, [getLinks, getConfig, getResult]);

    useEffect(() => {
        if (linksState.state === API_STATE.SUCCESS) {
            setLinks(linksState.data);
        }
    }, [linksState]);

    const defaultInterface =
        configState.state === API_STATE.SUCCESS
            ? configState.data.interface
            : "";
    useEffect(() => {
        if (!iface && defaultInterface) {
            setIface(defaultInterface);
        }
    }, [iface, defaultInterface]);

    useEffect(() => {
        if (startState.state === API_STATE.SUCCESS) {
            if (startState.data.started) {
                refresh();
            } else {
                setStarting(false);
                setAlert(
                    startErrorMessage(
                        startState.data.error,
                        startState.data.message
                    )
                );
            }
        } else if (startState.state === API_STATE.ERROR) {
            setStarting(false);
            setAlert(startState.data);
        }
    }, [startState, refresh, setAlert]);

    useEffect(() => {
        if (stopState.state === API_STATE.SUCCESS) {
            refresh();
        } else if (stopState.state === API_STATE.ERROR) {
            setAlert(stopState.data);
        }
    }, [stopState, refresh, setAlert]);

    /* A finished run, however it was started, brings its result, even one
     * that began and ended between two polls. While idle, each poll also reads
     * the links again, so a link that comes back can be measured. */
    useEffect(() => {
        if (!status) {
            return;
        }
        if (
            status.running ||
            status.last_finished !== finishedAtClick.current
        ) {
            setStarting(false);
        }
        if (seenStatus.current) {
            if (status.last_finished !== lastFinished.current) {
                getResult();
            }
            if (!status.running) {
                getLinks();
            }
        }
        seenStatus.current = true;
        lastFinished.current = status.last_finished;
    }, [status, getResult, getLinks]);

    useEffect(() => {
        if (!starting) {
            return undefined;
        }
        const timeout = setTimeout(() => setStarting(false), 10000);
        return () => clearTimeout(timeout);
    }, [starting]);

    const { choices, down } = interfaceChoices(links, defaultInterface, iface);
    const running = !!(status && status.running);
    const ifaceDown = down.includes(iface);
    const canStart =
        !!status && !running && !starting && !failed && !!iface && !ifaceDown;

    const onStart = () => {
        dismissAlert();
        finishedAtClick.current = status ? status.last_finished : undefined;
        setStarting(true);
        postStart({ data: { interface: iface } });
    };
    const onStop = () => {
        dismissAlert();
        postStop();
    };

    return (
        <LibreSpeed>
            <div className="card p-4 mb-4">
                <h2>{_("Speed Test")}</h2>
                {failed && (
                    <p className="text-danger" role="alert">
                        {_(
                            "The measurement backend does not answer, so the status shown may be out of date."
                        )}
                    </p>
                )}
                <div className="row g-3">
                    <div className="col-sm-6">
                        <Select
                            label={_("Interface")}
                            choices={choices}
                            value={iface}
                            onChange={(event) => setIface(event.target.value)}
                            disabled={running || starting}
                            helpText={
                                ifaceDown
                                    ? _(
                                          "This interface is down, so it cannot be measured now."
                                      )
                                    : _(
                                          "The connection to measure. A measurement uses its full capacity while it runs."
                                      )
                            }
                        />
                    </div>
                    <div className="col-sm-6 d-flex align-items-start gap-2 mb-3 librespeed-actions">
                        <Button
                            className="btn-primary librespeed-button"
                            onClick={onStart}
                            disabled={!canStart}
                            loading={starting}
                        >
                            {_("Start")}
                        </Button>
                        {running && (
                            <Button
                                className="btn-outline-danger librespeed-button"
                                onClick={onStop}
                                loading={stopState.state === API_STATE.SENDING}
                            >
                                {_("Stop")}
                            </Button>
                        )}
                    </div>
                </div>
                {running ? (
                    <Progress status={status} />
                ) : (
                    <LastResult
                        status={status}
                        result={
                            resultState.state === API_STATE.SUCCESS
                                ? resultState.data.measurement
                                : null
                        }
                    />
                )}
            </div>
            {status && !running && <Failures failures={status.failures} />}
        </LibreSpeed>
    );
}

export { interfaceChoices };
