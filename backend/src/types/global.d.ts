declare global {
  interface Request {
    json(): Promise<any>;
  }
}
export {};
