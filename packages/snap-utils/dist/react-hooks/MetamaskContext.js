"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useMetaMaskContext = exports.MetaMaskProvider = exports.MetaMaskContext = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const utils_1 = require("../utils");
exports.MetaMaskContext = (0, react_1.createContext)({
    provider: null,
    installedSnap: null,
    error: null,
    setInstalledSnap: () => {
        /* no-op */
    },
    setError: () => {
        /* no-op */
    },
});
/**
 * MetaMask context provider to handle MetaMask and snap status.
 *
 * @param props - React Props.
 * @param props.children - React component to be wrapped by the Provider.
 * @returns JSX.
 */
const MetaMaskProvider = ({ children }) => {
    const [provider, setProvider] = (0, react_1.useState)(null);
    const [installedSnap, setInstalledSnap] = (0, react_1.useState)(null);
    const [error, setError] = (0, react_1.useState)(null);
    (0, react_1.useEffect)(() => {
        // @ts-ignore
        (0, utils_1.getSnapsProvider)().then(setProvider).catch(console.error);
    }, []);
    return ((0, jsx_runtime_1.jsx)(exports.MetaMaskContext.Provider, { value: { provider, error, setError, installedSnap, setInstalledSnap }, children: children }));
};
exports.MetaMaskProvider = MetaMaskProvider;
/**
 * Utility hook to consume the MetaMask context.
 *
 * @returns The MetaMask context.
 */
function useMetaMaskContext() {
    return (0, react_1.useContext)(exports.MetaMaskContext);
}
exports.useMetaMaskContext = useMetaMaskContext;
//# sourceMappingURL=MetamaskContext.js.map