const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Add resolver configuration for web compatibility
config.resolver.platforms = ['web', 'native', 'ios', 'android'];

// Block native binaries from being resolved on web
config.resolver.blockList = [
  // Block all native libsql binaries
  /.*@libsql\/.*-(darwin|linux|win32)-.*/,
];

// Custom resolver to handle platform-specific modules
config.resolver.resolveRequest = (context, moduleName, platform) => {
  // Use web-compatible client for web builds
  if (moduleName === '@libsql/client' && platform === 'web') {
    return context.resolveRequest(context, '@libsql/client/web', platform);
  }
  
  // Use default resolution for other cases
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;