const fs = require('fs');
const path = require('path');
const ip = require('ip');

export const initLogsFile = () => {
  const logFile = './logs/app.log';
  fs.mkdirSync(path.dirname(logFile), { recursive: true });
  fs.closeSync(fs.openSync(logFile, 'a'));
};

export function convertToLocalhost(address: string) {
  // Check if the address is a loopback address
  if (address === '127.0.0.1' || address === '::1' || ip.isLoopback(address)) {
    return 'localhost';
  }
  return address;
}