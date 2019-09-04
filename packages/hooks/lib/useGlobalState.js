import { error, warn } from "@spax/debug";
import EventEmitter from "events";
import { useEffect, useState } from "react";
const emitter = new EventEmitter();
emitter.setMaxListeners(Number.MAX_VALUE);
const memoryStorage = {
    __value: {},
    getItem(key) {
        return this.__value.hasOwnProperty(key) ? this.__value[key] : null;
    },
    setItem(key, value) {
        this.__value[key] = value;
    },
};
export const prefix = "@spax&hooks&global&";
export function useGlobalState(key, initialState, storage = localStorage) {
    const storageKey = `${prefix}${key}`;
    if (storage === null) {
        storage = memoryStorage;
    }
    const [state, setState] = useState(() => {
        const value = getState(initialState);
        // use storage first
        if (storage) {
            const storageValue = storage.getItem(storageKey);
            if (storageValue !== null) {
                try {
                    return JSON.parse(storageValue);
                }
                catch (error) {
                    /* istanbul ignore next */
                    if (process.env.NODE_ENV === "development") {
                        warn("Invalid value of %s: %O", key, storageValue);
                    }
                }
            }
            // update storage value
            storage.setItem(storageKey, JSON.stringify(value));
        }
        return value;
    });
    const setStateSynchronously = (value) => {
        // dispatch event
        emitter.emit(key, value);
        // synchronize
        if (storage) {
            storage.setItem(storageKey, JSON.stringify(value));
        }
    };
    useEffect(() => {
        // use storage first
        if (storage) {
            const storageValue = storage.getItem(storageKey);
            if (storageValue !== null) {
                try {
                    setState(JSON.parse(storageValue));
                }
                catch (error) {
                    /* istanbul ignore next */
                    if (process.env.NODE_ENV === "development") {
                        warn("Invalid value of %s: %O", key, storageValue);
                    }
                }
            }
        }
        // add listener on mounted
        emitter.on(key, setState);
        return () => {
            // remove listener on unmounted
            emitter.off(key, setState);
        };
    }, [key]);
    return [
        state,
        setStateSynchronously,
    ];
}
export function setGlobalState(key, initialState, storage = localStorage) {
    if (storage === null) {
        storage = memoryStorage;
    }
    if (storage) {
        const storageKey = `${prefix}${key}`;
        if (storage.getItem(storageKey) === null) {
            storage.setItem(storageKey, JSON.stringify(getState(initialState)));
        }
        else {
            /* istanbul ignore next */
            if (process.env.NODE_ENV === "development") {
                warn("Storage `%s` is exists, now skip overriding.", key);
            }
        }
    }
    else {
        /* istanbul ignore next */
        if (process.env.NODE_ENV === "development") {
            error("Parameter `storage` is required");
        }
    }
}
function getState(initialState) {
    return typeof initialState === "function" ? initialState() : initialState;
}
