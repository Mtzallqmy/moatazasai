import {
  pgTable, uuid, text, timestamp, integer, boolean, jsonb, index, uniqueIndex,
  pgEnum,
} from "drizzle-orm/pg-core";

// ===== Enums =====

export const roleEnum = pgEnum("role", [
  "owner", "admin", "developer", "operator", "viewer", "member",
]);

export const providerKindEnum = pgEnum("provider_kind", [
  "openai", "anthropic", "gemini", "openai_compatible",
]);

export const runStatusEnum = pgEnum("run_status", [
  "queued", "running", "completed", "failed", "cancelled", "waiting_approval",
]);

export const agentStatusEnum = pgEnum("agent_status", ["draft", "published", "archived"]);

// ===== Feature-Flag Enums =====

export const jobStatusEnum = pgEnum("job_status", [
  "queued", "running", "completed", "failed", "cancelled",
]);

export const approvalStatusEnum = pgEnum("approval_status", [
  "pending", "approved", "rejected", "expired",
]);

export const toolRiskEnum = pgEnum("tool_risk", ["low", "medium", "high", "critical"]);

// ===== Core Tables =====

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  name: text("name"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const organizations = pgTable("organizations", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  publicRegistrationEnabled: boolean("public_registration_enabled").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const organizationMembers = pgTable("organization_members", {
  id: uuid("id").defaultRandom().primaryKey(),
  organizationId: uuid("organization_id").notNull().references(() => organizations.id),
  userId: uuid("user_id").notNull().references(() => users.id),
  role: roleEnum("role").notNull().default("member"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (t) => [
  uniqueIndex("org_member_unique_idx").on(t.organizationId, t.userId),
]);

export const sessions = pgTable("sessions", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").notNull().references(() => users.id),
  tokenHash: text("token_hash").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  activeOrganizationId: uuid("active_organization_id"),
  lastSeenAt: timestamp("last_seen_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const mobileSessions = pgTable("mobile_sessions", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").notNull().references(() => users.id),
  organizationId: uuid("organization_id").notNull().references(() => organizations.id),
  deviceName: text("device_name"),
  deviceId: text("device_id").notNull(),
  accessHash: text("access_hash").notNull(),
  refreshHash: text("refresh_hash").notNull(),
  accessExpiresAt: timestamp("access_expires_at").notNull(),
  refreshExpiresAt: timestamp("refresh_expires_at").notNull(),
  scopes: text("scopes").array().default([]).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const platformApiKeys = pgTable("platform_api_keys", {
  id: uuid("id").defaultRandom().primaryKey(),
  organizationId: uuid("organization_id").notNull().references(() => organizations.id),
  name: text("name").notNull(),
  keyHash: text("key_hash").notNull().unique(),
  prefix: text("prefix").notNull(),
  scopes: text("scopes").array().default([]).notNull(),
  lastUsedAt: timestamp("last_used_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ===== Provider Credentials =====

export const providerCredentials = pgTable("provider_credentials", {
  id: uuid("id").defaultRandom().primaryKey(),
  organizationId: uuid("organization_id").notNull().references(() => organizations.id),
  provider: providerKindEnum("provider").notNull(),
  name: text("name").notNull(),
  apiKeyEnvelope: text("api_key_envelope").notNull(),
  baseUrl: text("base_url"),
  validationStatus: text("validation_status").default("pending").notNull(),
  discoveredModels: jsonb("discovered_models").default([]).notNull(),
  enabled: boolean("enabled").default(true).notNull(),
  lastVerifiedAt: timestamp("last_verified_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ===== Agents =====

export const agents = pgTable("agents", {
  id: uuid("id").defaultRandom().primaryKey(),
  organizationId: uuid("organization_id").notNull().references(() => organizations.id),
  name: text("name").notNull(),
  description: text("description"),
  systemPrompt: text("system_prompt"),
  status: agentStatusEnum("status").default("draft").notNull(),
  currentVersionId: uuid("current_version_id"),
  createdById: uuid("created_by_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const agentVersions = pgTable("agent_versions", {
  id: uuid("id").defaultRandom().primaryKey(),
  agentId: uuid("agent_id").notNull().references(() => agents.id),
  version: integer("version").notNull(),
  providerCredentialId: uuid("provider_credential_id").references(() => providerCredentials.id),
  model: text("model").notNull(),
  temperature: text("temperature").default("0.7"),
  maxTokens: integer("max_tokens"),
  config: jsonb("config").default({}).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (t) => [uniqueIndex("agent_version_unique_idx").on(t.agentId, t.version)]);

// ===== Conversations =====

export const conversations = pgTable("conversations", {
  id: uuid("id").defaultRandom().primaryKey(),
  organizationId: uuid("organization_id").notNull(),
  agentId: uuid("agent_id").notNull().references(() => agents.id),
  title: text("title"),
  archivedAt: timestamp("archived_at"),
  pinnedAt: timestamp("pinned_at"),
  createdById: uuid("created_by_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (t) => [index("conv_org_updated_idx").on(t.organizationId, t.updatedAt)]);

export const messages = pgTable("messages", {
  id: uuid("id").defaultRandom().primaryKey(),
  conversationId: uuid("conversation_id").notNull().references(() => conversations.id),
  role: text("role").notNull(),
  content: text("content").notNull(),
  model: text("model"),
  tokensIn: integer("tokens_in"),
  tokensOut: integer("tokens_out"),
  clientRequestId: text("client_request_id"),
  deletedAt: timestamp("deleted_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (t) => [
  index("messages_conv_created_idx").on(t.conversationId, t.createdAt),
  uniqueIndex("messages_client_request_unique_idx").on(t.conversationId, t.clientRequestId),
]);

// ===== Runs =====

export const runs = pgTable("runs", {
  id: uuid("id").defaultRandom().primaryKey(),
  organizationId: uuid("organization_id").notNull(),
  agentId: uuid("agent_id").notNull(),
  conversationId: uuid("conversation_id").references(() => conversations.id),
  status: runStatusEnum("status").default("queued").notNull(),
  model: text("model"),
  usage: jsonb("usage"),
  durationMs: integer("duration_ms"),
  clientRequestId: text("client_request_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
}, (t) => [index("runs_org_created_idx").on(t.organizationId, t.createdAt)]);

export const runEvents = pgTable("run_events", {
  id: uuid("id").defaultRandom().primaryKey(),
  runId: uuid("run_id").notNull().references(() => runs.id),
  kind: text("kind").notNull(),
  payload: jsonb("payload").default({}).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (t) => [index("run_events_run_idx").on(t.runId)]);

// ===== Attachments =====

export const attachments = pgTable("attachments", {
  id: uuid("id").defaultRandom().primaryKey(),
  organizationId: uuid("organization_id").notNull(),
  conversationId: uuid("conversation_id"),
  uploadedById: uuid("uploaded_by_id").notNull().references(() => users.id),
  filename: text("filename").notNull(),
  mimeType: text("mime_type").notNull(),
  sizeBytes: integer("size_bytes").notNull(),
  sha256: text("sha256").notNull(),
  content: jsonb("content"),
  indexedText: text("indexed_text"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ===== Integrations =====

export const integrations = pgTable("integrations", {
  id: uuid("id").defaultRandom().primaryKey(),
  organizationId: uuid("organization_id").notNull(),
  kind: text("kind").notNull(),
  name: text("name").notNull(),
  status: text("status").default("active").notNull(),
  config: jsonb("config").default({}).notNull(),
  secretEnvelope: text("secret_envelope"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const auditLogs = pgTable("audit_logs", {
  id: uuid("id").defaultRandom().primaryKey(),
  organizationId: uuid("organization_id").notNull(),
  userId: uuid("user_id"),
  action: text("action").notNull(),
  target: text("target"),
  requestId: text("request_id"),
  meta: jsonb("meta").default({}).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (t) => [index("audit_org_created_idx").on(t.organizationId, t.createdAt)]);

export const userPreferences = pgTable("user_preferences", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").notNull().references(() => users.id).unique(),
  chatTheme: text("chat_theme").default("moataz").notNull(),
  chatWallpaper: text("chat_wallpaper").default("soft-grid").notNull(),
  themeMode: text("theme_mode").default("system").notNull(),
});

// ===== MCP =====

export const mcpServers = pgTable("mcp_servers", {
  id: uuid("id").defaultRandom().primaryKey(),
  organizationId: uuid("organization_id").notNull(),
  name: text("name").notNull(),
  endpoint: text("endpoint").notNull(),
  bearerTokenEnvelope: text("bearer_token_envelope"),
  lastSyncedAt: timestamp("last_synced_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const mcpTools = pgTable("mcp_tools", {
  id: uuid("id").defaultRandom().primaryKey(),
  serverId: uuid("server_id").notNull().references(() => mcpServers.id),
  name: text("name").notNull(),
  description: text("description"),
  inputSchema: jsonb("input_schema"),
  fingerprint: text("fingerprint"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ===== Agent Teams =====

export const agentTeams = pgTable("agent_teams", {
  id: uuid("id").defaultRandom().primaryKey(),
  organizationId: uuid("organization_id").notNull(),
  name: text("name").notNull(),
  supervisorAgentId: uuid("supervisor_agent_id").references(() => agents.id),
  enabled: boolean("enabled").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const agentTeamMembers = pgTable("agent_team_members", {
  id: uuid("id").defaultRandom().primaryKey(),
  teamId: uuid("team_id").notNull().references(() => agentTeams.id),
  agentId: uuid("agent_id").notNull().references(() => agents.id),
  role: text("role").default("worker").notNull(),
});

export const agentTeamRuns = pgTable("agent_team_runs", {
  id: uuid("id").defaultRandom().primaryKey(),
  teamId: uuid("team_id").notNull().references(() => agentTeams.id),
  status: text("status").default("queued").notNull(),
  result: jsonb("result"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const agentTeamRunSteps = pgTable("agent_team_run_steps", {
  id: uuid("id").defaultRandom().primaryKey(),
  teamRunId: uuid("team_run_id").notNull().references(() => agentTeamRuns.id),
  agentId: uuid("agent_id"),
  runId: uuid("run_id").references(() => runs.id),
  stepKind: text("step_kind").notNull(),
  output: jsonb("output"),
  durationMs: integer("duration_ms"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ===== Feature-Flag: Memory (AI_MEMORY_ENABLED) =====

export const agentMemories = pgTable("agent_memories", {
  id: uuid("id").defaultRandom().primaryKey(),
  organizationId: uuid("organization_id").notNull(),
  agentId: uuid("agent_id").notNull().references(() => agents.id),
  userId: uuid("user_id"), // null للمؤسسة، UUID للمستخدم
  kind: text("kind").notNull().default("note"), // note | preference | fact | skill
  content: text("content").notNull(),
  // رفض أنماط المفاتيح/التوكنات/كلمات المرور قبل الحفظ (يُطبّق في service)
  redacted: boolean("redacted").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (t) => [index("mem_org_agent_idx").on(t.organizationId, t.agentId)]);

// ===== Feature-Flag: RAG / Knowledge (AI_RAG_ENABLED) =====

export const knowledgeBases = pgTable("knowledge_bases", {
  id: uuid("id").defaultRandom().primaryKey(),
  organizationId: uuid("organization_id").notNull(),
  name: text("name").notNull(),
  description: text("description"),
  embeddingModel: text("embedding_model").default("text-embedding-3-small"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (t) => [index("kb_org_idx").on(t.organizationId)]);

export const knowledgeDocuments = pgTable("knowledge_documents", {
  id: uuid("id").defaultRandom().primaryKey(),
  knowledgeBaseId: uuid("knowledge_base_id").notNull().references(() => knowledgeBases.id),
  attachmentId: uuid("attachment_id").references(() => attachments.id), // يعيد استخدام تخزين المرفقات
  filename: text("filename").notNull(),
  mimeType: text("mime_type").notNull(),
  sizeBytes: integer("size_bytes").notNull(),
  sha256: text("sha256").notNull(),
  status: text("status").default("pending").notNull(), // pending | parsing | ready | failed
  chunksCount: integer("chunks_count").default(0).notNull(),
  failureReason: text("failure_reason"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  processedAt: timestamp("processed_at"),
}, (t) => [index("kdoc_kb_idx").on(t.knowledgeBaseId)]);

export const knowledgeChunks = pgTable("knowledge_chunks", {
  id: uuid("id").defaultRandom().primaryKey(),
  documentId: uuid("document_id").notNull().references(() => knowledgeDocuments.id),
  ordinal: integer("ordinal").notNull(), // ترتيب القطعة داخل الوثيقة
  content: text("content").notNull(),
  // متجه embedding اختياري (pgvector في الإنتاج؛ هنا JSONB للتوافق مع PostgreSQL عادي)
  embedding: jsonb("embedding"),
  tokens: integer("tokens"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (t) => [
  index("kchunk_doc_idx").on(t.documentId),
  uniqueIndex("kchunk_doc_ordinal_unique").on(t.documentId, t.ordinal),
]);

// ===== Feature-Flag: Tools (AI_TOOLS_ENABLED) =====

export const toolsRegistry = pgTable("tools_registry", {
  id: uuid("id").defaultRandom().primaryKey(),
  organizationId: uuid("organization_id").notNull(),
  name: text("name").notNull(),
  description: text("description"),
  kind: text("kind").notNull(), // http | mcp | function | shell
  risk: toolRiskEnum("risk").default("medium").notNull(),
  inputSchema: jsonb("input_schema").default({}).notNull(),
  // قائمة السماح: ما لم يكن enabled=true يُرفض الاستدعاء
  enabled: boolean("enabled").default(false).notNull(),
  // للـshell/http: قيود SSRF والمنافذ والـhosts
  constraints: jsonb("constraints"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (t) => [
  index("tools_org_name_idx").on(t.organizationId, t.name),
  uniqueIndex("tools_org_name_unique").on(t.organizationId, t.name),
]);

export const toolApprovals = pgTable("tool_approvals", {
  id: uuid("id").defaultRandom().primaryKey(),
  organizationId: uuid("organization_id").notNull(),
  toolId: uuid("tool_id").notNull().references(() => toolsRegistry.id),
  runId: uuid("run_id").references(() => runs.id),
  status: approvalStatusEnum("status").default("pending").notNull(),
  // مدخلات منقحة — لا تحوي أسرارًا، تُحفظ للمراجعة فقط
  inputRedacted: jsonb("input_redacted").notNull(),
  // TTL يُطبّق في service؛ الموافقة المنتهية تُعالج كـexpired
  expiresAt: timestamp("expires_at").notNull(),
  decidedAt: timestamp("decided_at"),
  decidedBy: uuid("decided_by").references(() => users.id),
  decidedReason: text("decided_reason"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (t) => [index("tool_approval_org_status_idx").on(t.organizationId, t.status)]);

// ===== Feature-Flag: Background Jobs / Worker (AI_WORKER_ENABLED) =====

export const backgroundJobs = pgTable("background_jobs", {
  id: uuid("id").defaultRandom().primaryKey(),
  organizationId: uuid("organization_id").notNull(),
  kind: text("kind").notNull(), // rag.parse | rag.embed | memory.redact | tool.call | team.run
  status: jobStatusEnum("status").default("queued").notNull(),
  payload: jsonb("payload").default({}).notNull(),
  result: jsonb("result"),
  failureReason: text("failure_reason"),
  attempts: integer("attempts").default(0).notNull(),
  maxAttempts: integer("max_attempts").default(3).notNull(),
  lockToken: text("lock_token"), // claim ذري عبر FOR UPDATE SKIP LOCKED
  lockExpiresAt: timestamp("lock_expires_at"),
  runId: uuid("run_id").references(() => runs.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
}, (t) => [
  index("jobs_org_status_idx").on(t.organizationId, t.status),
  index("jobs_lock_idx").on(t.lockExpiresAt),
  index("jobs_kind_status_idx").on(t.kind, t.status),
]);

// worker قيود على العقد
export const workerHeartbeats = pgTable("worker_heartbeats", {
  id: uuid("id").defaultRandom().primaryKey(),
  workerId: text("worker_id").notNull(),
  hostname: text("hostname"),
  status: text("status").default("idle").notNull(), // idle | busy | crashed
  lastJobId: uuid("last_job_id"),
  lastSeenAt: timestamp("last_seen_at").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (t) => [uniqueIndex("worker_id_unique").on(t.workerId)]);
