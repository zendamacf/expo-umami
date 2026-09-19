export declare const Platform: {
    OS: string;
    select: import("vitest").Mock<(obj: any) => any>;
};
export declare const Dimensions: {
    get: import("vitest").Mock<() => {
        width: number;
        height: number;
    }>;
};
export declare const AppState: {
    addEventListener: import("vitest").Mock<() => {
        remove: import("vitest").Mock<import("@vitest/spy").Procedure>;
    }>;
    currentState: string;
};
//# sourceMappingURL=react-native.d.ts.map