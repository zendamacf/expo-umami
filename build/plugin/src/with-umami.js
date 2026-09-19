"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const config_plugins_1 = require("@expo/config-plugins");
const withUmami = (config, props) => {
    if (!props) {
        throw new Error('[@bitte-kaufen/expo-umami] Plugin requires configuration. Please provide websiteId and hostUrl.');
    }
    if (!props.websiteId || !props.hostUrl) {
        throw new Error('[@bitte-kaufen/expo-umami] Both websiteId and hostUrl are required.');
    }
    if (!config.extra) {
        config.extra = {};
    }
    config.extra.umami = {
        websiteId: props.websiteId,
        hostUrl: props.hostUrl,
        disabled: props.disabled ?? false,
        batchSize: props.batchSize || 10,
        batchInterval: props.batchInterval || 30000,
        persistEvents: props.persistEvents ?? false,
        debug: props.debug ?? false,
    };
    return config;
};
const pkg = {
    name: '@bitte-kaufen/expo-umami',
    version: '0.1.0',
};
exports.default = (0, config_plugins_1.createRunOncePlugin)(withUmami, pkg.name, pkg.version);
