"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppState = exports.Dimensions = exports.Platform = void 0;
const vitest_1 = require("vitest");
exports.Platform = {
    OS: 'ios',
    select: vitest_1.vi.fn((obj) => obj.ios),
};
exports.Dimensions = {
    get: vitest_1.vi.fn(() => ({ width: 390, height: 844 })),
};
exports.AppState = {
    addEventListener: vitest_1.vi.fn(() => ({ remove: vitest_1.vi.fn() })),
    currentState: 'active',
};
