import * as winston from "winston";

const tsFormat = () => new Date().toISOString();
export const logger = new (winston.Logger)({
  transports: [
    // colorize the output to the console
    new (winston.transports.Console)({
      colorize: false,
      timestamp: tsFormat
    })
  ]
});
