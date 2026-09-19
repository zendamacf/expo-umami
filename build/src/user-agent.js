"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildUserAgent = buildUserAgent;
const react_native_1 = require("react-native");
const Device = __importStar(require("expo-device"));
const Application = __importStar(require("expo-application"));
const expo_constants_1 = __importDefault(require("expo-constants"));
function buildUserAgent() {
    const isIOS = react_native_1.Platform.OS === 'ios';
    const osVersion = Device.osVersion || '0.0';
    const model = Device.modelName || 'Device';
    const appVersion = Application.nativeApplicationVersion || '0.0.0';
    if (isIOS) {
        return `Mozilla/5.0 (${model}; CPU iPhone OS ${osVersion.replace(/\./g, '_')} like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/${appVersion} Mobile/15E148 Safari/605.1.15`;
    }
    else {
        const appName = expo_constants_1.default.expoConfig?.name || Application.applicationName || 'ExpoApp';
        const expoVersion = expo_constants_1.default.expoVersion || 'unknown';
        // Use app-specific format for Android to fix Chrome detection
        return `${appName}/${appVersion} (Linux; Android ${osVersion}; ${model}) Expo/${expoVersion}`;
    }
}
