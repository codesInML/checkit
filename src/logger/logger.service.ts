import { ConsoleLogger, Injectable } from '@nestjs/common';
import * as fs from 'fs';
import { promises as fsPromises } from 'fs';
import * as path from 'path';

@Injectable()
export class LoggerService extends ConsoleLogger {
  async logToFile(entry: string) {
    const formattedEntry = `${Intl.DateTimeFormat('en-US', { dateStyle: 'short', timeStyle: 'short', timeZone: 'Africa/Lagos' }).format(new Date())}\t${entry}\n`;

    try {
      if (!fs.existsSync(path.join(__dirname, '../../logs'))) {
        await fsPromises.mkdir(path.join(__dirname, '../../logs'));
      }
      await fsPromises.appendFile(
        path.join(__dirname, '../../logs/app.log'),
        formattedEntry,
      );
    } catch (error) {
      if (error instanceof Error) {
        console.error(error.message);
      }
    }
  }

  log(message: any, context?: string) {
    const entry = `${context ? `[${context}] ` : ''}\t${message}`;
    this.logToFile(entry);
    super.log(message, context);
  }

  error(message: any, context?: string) {
    const entry = `${context ? `[${context}] ` : ''}\t${message}`;
    this.logToFile(entry);
    super.error(message, context);
  }
}
