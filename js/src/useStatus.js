/*
 * This is free software, licensed under the GNU General Public License v3.
 * See /LICENSE for more information.
 */

import { useCallback, useEffect, useRef, useState } from "react";

import { API_STATE, useAPIGet } from "foris";

import API_URLs from "./API";

export const RUNNING_POLL_MS = 2000;
export const IDLE_POLL_MS = 30000;

/* The measurement status, polled: measurements also start from schedules and
 * from LuCI, so polling is what notices them. Every 2 s while one runs, every
 * 30 s otherwise (2 s also while the caller passes fast, as after a start, and
 * after a failed poll during a run), and at once when the page becomes visible
 * again or refresh() is called. One request at a time, so an older answer never overwrites a
 * newer one. A refresh asked for meanwhile follows it. The last good status
 * stays while a request fails, so the page does not flicker. */
export default function useStatus(fast = false) {
    const [getState, get] = useAPIGet(API_URLs.status);
    const [status, setStatus] = useState(null);
    const [failed, setFailed] = useState(false);
    const inFlight = useRef(false);
    const again = useRef(false);
    const timer = useRef(null);
    // Whether the last good status said running, and whether the caller
    // expects a run to begin: either way the next poll comes soon.
    const lastRunning = useRef(false);
    const fastRef = useRef(fast);
    fastRef.current = fast;

    const refresh = useCallback(() => {
        clearTimeout(timer.current);
        if (inFlight.current) {
            again.current = true;
            return;
        }
        inFlight.current = true;
        get();
    }, [get]);

    useEffect(() => {
        if (
            getState.state !== API_STATE.SUCCESS &&
            getState.state !== API_STATE.ERROR
        ) {
            return;
        }
        inFlight.current = false;
        const ok = getState.state === API_STATE.SUCCESS;
        if (ok) {
            setStatus(getState.data);
        }
        setFailed(!ok);
        if (again.current) {
            again.current = false;
            refresh();
            return;
        }
        if (ok) {
            lastRunning.current = !!getState.data.running;
        }
        timer.current = setTimeout(
            refresh,
            lastRunning.current || fastRef.current
                ? RUNNING_POLL_MS
                : IDLE_POLL_MS
        );
    }, [getState, refresh]);

    useEffect(() => {
        refresh();
        const onVisible = () => {
            if (!document.hidden) {
                refresh();
            }
        };
        document.addEventListener("visibilitychange", onVisible);
        return () => {
            clearTimeout(timer.current);
            document.removeEventListener("visibilitychange", onVisible);
        };
    }, [refresh]);

    return { status, failed, refresh };
}
