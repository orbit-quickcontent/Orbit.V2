import { Request as ExpressRequest, Response as ExpressResponse } from 'express';
import { requestContextStorage } from './context';

export function nextToExpress(handler: any) {
  return async (req: ExpressRequest, res: ExpressResponse) => {
    try {
      // 1. Construct a mock URL
      const url = `${req.protocol}://${req.get('host')}${req.originalUrl}`;
      
      // 2. Set up headers using the native Headers class
      const headers = new Headers();
      Object.entries(req.headers).forEach(([k, v]) => {
        if (Array.isArray(v)) {
          v.forEach(val => headers.append(k, val));
        } else if (v) {
          headers.append(k, v);
        }
      });

      // 3. Setup JSON/Raw body for NextRequest to consume
      const body = ['POST', 'PUT', 'PATCH'].includes(req.method || '') && req.body 
        ? (req.body instanceof Buffer ? req.body : JSON.stringify(req.body))
        : undefined;

      // 4. Create native Request object (resolves to global fetch Request class)
      const nextRequest = new Request(url, {
        method: req.method,
        headers,
        body
      });

      // Mock nextUrl field for NextRequest (used to read search parameters)
      (nextRequest as any).nextUrl = new URL(url);
      
      // Override read-only json/arrayBuffer properties safely via defineProperty
      if (req.body) {
        if (req.body instanceof Buffer) {
          Object.defineProperty(nextRequest, 'arrayBuffer', {
            value: async () => {
              const arrayBuf = req.body.buffer.slice(req.body.byteOffset, req.body.byteOffset + req.body.byteLength);
              return arrayBuf;
            },
            writable: true,
            configurable: true
          });
        } else {
          Object.defineProperty(nextRequest, 'json', {
            value: async () => req.body,
            writable: true,
            configurable: true
          });
        }
      }

      // 5. Gather route parameters (Express merges params into req.params)
      const params = { ...req.params };

      // 6. Execute within context run block to allow getSessionUser access
      let nextResponse: any;
      await requestContextStorage.run({ req, nextRequest }, async () => {
        nextResponse = await handler(nextRequest, { params });
      });

      // 7. Extract status and body from Next.js response
      const status = nextResponse.status || 200;
      
      // Attempt to read as json
      let responseBody: any = {};
      try {
        responseBody = await nextResponse.json();
      } catch (_) {
        try {
          responseBody = await nextResponse.text();
        } catch (__) {}
      }

      res.status(status).json(responseBody);
    } catch (err: any) {
      console.error("[Next-Express Adapter Error]:", err);
      res.status(500).json({ error: "Internal Server Error", details: err.message });
    }
  };
}
