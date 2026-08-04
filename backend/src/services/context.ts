import { AsyncLocalStorage } from 'async_hooks';
import { Request } from 'express';

export interface RequestContext {
  req: Request;
  nextRequest: any;
}

export const requestContextStorage = new AsyncLocalStorage<RequestContext>();
