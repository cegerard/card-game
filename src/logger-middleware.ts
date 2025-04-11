import { Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

export function loggerMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const { method, path, ip } = req;
  const message = `${method} ${path} ${ip}`;

  Logger.log(message, 'Incoming Request');

  res.on('finish', () => {
    Logger.log(JSON.stringify(req.body), 'Request Payload');

    const { statusCode } = res;
    const responseMessage = `${method} ${path} ${statusCode} ${ip}`;
    Logger.log(responseMessage, 'Outgoing Response');
  });

  next();
}
