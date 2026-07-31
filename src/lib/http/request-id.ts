import { randomUUID } from "node:crypto";

const HEADER = "x-request-id";

export const getRequestId = (headers: Headers): string =>
  headers.get(HEADER) ?? randomUUID();

export const REQUEST_ID_HEADER = HEADER;
