export type Request = (params: {
    method: string;
    params?: unknown;
}) => Promise<unknown | null>;
/**
 * Utility hook to consume the provider `request` method with the available provider.
 *
 * @returns The `request` function.
 */
export declare const useRequest: () => Request;
//# sourceMappingURL=useRequest.d.ts.map