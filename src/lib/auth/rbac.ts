import type { Session } from "./session-store";

export type Role = "owner" | "admin" | "developer" | "operator" | "viewer" | "member";

const ADMIN_ROLES: Role[] = ["owner", "admin"];
const WRITE_ROLES: Role[] = ["owner", "admin", "developer"];
const RUN_ROLES: Role[] = ["owner", "admin", "developer", "operator"];

export function canManageProviders(role: Role): boolean { return WRITE_ROLES.includes(role); }
export function canManageAgents(role: Role): boolean { return WRITE_ROLES.includes(role); }
export function canRunAgents(role: Role): boolean { return RUN_ROLES.includes(role); }
export function canManageMembers(role: Role): boolean { return ADMIN_ROLES.includes(role); }
export function canReadAudit(role: Role): boolean { return ADMIN_ROLES.includes(role); }

export function assertCan(role: Role, fn: (r: Role) => boolean, message = "لا تملك الصلاحية."): void {
  if (!fn(role)) {
    const e = new Error(message) as Error & { status?: number; code?: string };
    e.status = 403; e.code = "FORBIDDEN";
    throw e;
  }
}

// suppress unused
export type { Session };
