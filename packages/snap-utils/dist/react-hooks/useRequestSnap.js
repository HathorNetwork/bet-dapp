"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useRequestSnap = void 0;
const config_1 = require("../config");
const MetamaskContext_1 = require("./MetamaskContext");
const useRequest_1 = require("./useRequest");
/**
 * Utility hook to wrap the `wallet_requestSnaps` method.
 *
 * @param snapId - The requested Snap ID. Defaults to the snap ID specified in the
 * config.
 * @param version - The requested version.
 * @returns The `wallet_requestSnaps` wrapper.
 */
const useRequestSnap = (snapId = config_1.defaultSnapOrigin, version) => {
    const request = (0, useRequest_1.useRequest)();
    const { setInstalledSnap } = (0, MetamaskContext_1.useMetaMaskContext)();
    /**
     * Request the Snap.
     */
    const requestSnap = async () => {
        const snaps = (await request({
            method: 'wallet_requestSnaps',
            params: {
                [snapId]: version ? { version } : {},
            },
        }));
        // Updates the `installedSnap` context variable since we just installed the Snap.
        setInstalledSnap(snaps?.[snapId] ?? null);
    };
    return requestSnap;
};
exports.useRequestSnap = useRequestSnap;
//# sourceMappingURL=useRequestSnap.js.map