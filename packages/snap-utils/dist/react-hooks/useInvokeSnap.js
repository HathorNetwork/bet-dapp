"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useInvokeSnap = void 0;
const config_1 = require("../config");
const useRequest_1 = require("./useRequest");
/**
 * Utility hook to wrap the `wallet_invokeSnap` method.
 *
 * @param snapId - The Snap ID to invoke. Defaults to the snap ID specified in the
 * config.
 * @returns The invokeSnap wrapper method.
 */
const useInvokeSnap = (snapId = config_1.defaultSnapOrigin) => {
    const request = (0, useRequest_1.useRequest)();
    /**
     * Invoke the requested Snap method.
     *
     * @param params - The invoke params.
     * @param params.method - The method name.
     * @param params.params - The method params.
     * @returns The Snap response.
     */
    const invokeSnap = async ({ method, params }) => request({
        method: 'wallet_invokeSnap',
        params: {
            snapId,
            request: params ? { method, params } : { method },
        },
    });
    return invokeSnap;
};
exports.useInvokeSnap = useInvokeSnap;
//# sourceMappingURL=useInvokeSnap.js.map