import { AsyncLocalStorage } from "node:async_hooks";

const store = new AsyncLocalStorage<Request>();

export function runWithRequest<T>(request: Request, fn: () => Promise<T>) {
  return store.run(request, fn);
}

export function getCurrentRequest(): Request | undefined {
  return store.getStore();
}

export function getRequestHeaders(): Headers {
  const request = getCurrentRequest();
  if (!request) {
    throw new Error("No active HTTP request in context");
  }
  return request.headers;
}
