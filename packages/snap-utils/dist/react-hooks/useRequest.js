"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useRequest = void 0;
const MetamaskContext_1 = require("./MetamaskContext");
/**
 * Utility hook to consume the provider `request` method with the available provider.
 *
 * @returns The `request` function.
 */
const useRequest = () => {
    const { provider, setError } = (0, MetamaskContext_1.useMetaMaskContext)();
    /**
     * `provider.request` wrapper.
     *
     * @param params - The request params.
     * @param params.method - The method to call.
     * @param params.params - The method params.
     * @returns The result of the request.
     * @throws Will throw an error if the request fails.
     */
    const request = async ({ method, params }) => {
        try {
            setError(null);
            const data = (await provider?.request({
                method,
                params: params,
            })) ?? null;
            return data;
        }
        catch (requestError) {
            // Set error in context for UI notifications
            setError(requestError);
            // Re-throw the error so callers can distinguish between
            // null response vs error. This allows proper error handling
            // instead of treating all errors as null responses.
            throw requestError;
        }
    };
    return request;
};
exports.useRequest = useRequest;
//# sourceMappingURL=useRequest.js.map