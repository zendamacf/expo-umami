"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initUmami = initUmami;
exports.isInitialized = isInitialized;
exports.flush = flush;
exports.getQueueSize = getQueueSize;
exports.trackEvent = trackEvent;
exports.trackScreenView = trackScreenView;
exports.trackClick = trackClick;
exports.trackImpression = trackImpression;
exports.trackCustomEvent = trackCustomEvent;
exports.identifyUser = identifyUser;
exports.clearUser = clearUser;
const umami_client_1 = require("./umami-client");
// Initialization
async function initUmami(config) {
    const client = umami_client_1.UmamiClient.getInstance();
    await client.init(config);
}
function isInitialized() {
    const client = umami_client_1.UmamiClient.getInstance();
    return client.isInitialized();
}
// Queue handling
async function flush() {
    const client = umami_client_1.UmamiClient.getInstance();
    await client.flush();
}
function getQueueSize() {
    const client = umami_client_1.UmamiClient.getInstance();
    return client.getQueueSize();
}
// Event tracking
async function trackEvent(screenName, options) {
    const client = umami_client_1.UmamiClient.getInstance();
    await client.trackEvent(screenName, options);
}
async function trackScreenView(screenName, options) {
    return trackEvent(screenName, options);
}
async function trackClick(elementName, options) {
    const client = umami_client_1.UmamiClient.getInstance();
    await client.trackEvent(elementName, {
        ...options,
        eventName: "click",
    });
}
async function trackImpression(elementName, options) {
    const client = umami_client_1.UmamiClient.getInstance();
    await client.trackEvent(elementName, {
        ...options,
        eventName: "impression",
    });
}
async function trackCustomEvent(url, eventName, options) {
    const client = umami_client_1.UmamiClient.getInstance();
    await client.trackEvent(url, {
        ...options,
        eventName: eventName,
    });
}
// User identification
async function identifyUser(userId) {
    const client = umami_client_1.UmamiClient.getInstance();
    await client.identifyUser(userId);
}
function clearUser() {
    umami_client_1.UmamiClient.getInstance().clearUser();
}
