export interface Session {
  id: string;
  userId: string;
  organizationId: string;
  role: string;
  tokenHash: string;
  expiresAt: Date;
  lastSeenAt: Date | null;
  activeOrganizationId: string | null;
  createdAt: Date;
}

export interface AuthContext {
  userId: string;
  organizationId: string;
  role: string;
  requestId: string;
}
