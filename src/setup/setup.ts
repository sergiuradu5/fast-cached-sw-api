const fs = require('fs');
const path = require('path');

export const initLogsFile = () => {
  const logFile = './logs/app.log';
  fs.mkdirSync(path.dirname(logFile), { recursive: true });
  fs.closeSync(fs.openSync(logFile, 'a'));
};
