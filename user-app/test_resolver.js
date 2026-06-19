const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

const config = getDefaultConfig(__dirname);

config.resolver.resolveRequest = () => "MY_CUSTOM_RESOLVER";

const finalConfig = withNativeWind(config, { input: "./global.css" });

console.log("Original resolver type:", typeof config.resolver.resolveRequest);
console.log("Final resolver type:", typeof finalConfig.resolver.resolveRequest);
console.log("Is it mine?", finalConfig.resolver.resolveRequest() === "MY_CUSTOM_RESOLVER");
