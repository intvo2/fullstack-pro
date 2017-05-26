import { ConsoleLogger, Logger, IConsoleLoggerSettings } from 'cdm-logger';

const settings: IConsoleLoggerSettings = {
    level: 'debug',
}

export const logger: Logger = ConsoleLogger.create('sample-graphql-server', settings);

