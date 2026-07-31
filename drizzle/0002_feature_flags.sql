-- 0002_feature_flags.sql: Memory, RAG, Tools, Background Jobs, Worker heartbeats
-- تُفعّل عبر Feature Flags في .env (AI_MEMORY_ENABLED, AI_RAG_ENABLED, AI_TOOLS_ENABLED, AI_WORKER_ENABLED).

CREATE TYPE job_status AS ENUM ('queued','running','completed','failed','cancelled');
CREATE TYPE approval_status AS ENUM ('pending','approved','rejected','expired');
CREATE TYPE tool_risk AS ENUM ('low','medium','high','critical');

-- ===== Memory (AI_MEMORY_ENABLED) =====
CREATE TABLE agent_memories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL,
  agent_id uuid NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  user_id uuid REFERENCES users(id),
  kind text NOT NULL DEFAULT 'note',
  content text NOT NULL,
  redacted boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX mem_org_agent_idx ON agent_memories(organization_id, agent_id);

-- ===== Knowledge Bases / RAG (AI_RAG_ENABLED) =====
CREATE TABLE knowledge_bases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL,
  name text NOT NULL,
  description text,
  embedding_model text DEFAULT 'text-embedding-3-small',
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX kb_org_idx ON knowledge_bases(organization_id);

CREATE TABLE knowledge_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  knowledge_base_id uuid NOT NULL REFERENCES knowledge_bases(id) ON DELETE CASCADE,
  attachment_id uuid REFERENCES attachments(id),
  filename text NOT NULL,
  mime_type text NOT NULL,
  size_bytes integer NOT NULL,
  sha256 text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  chunks_count integer NOT NULL DEFAULT 0,
  failure_reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  processed_at timestamptz
);
CREATE INDEX kdoc_kb_idx ON knowledge_documents(knowledge_base_id);

CREATE TABLE knowledge_chunks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id uuid NOT NULL REFERENCES knowledge_documents(id) ON DELETE CASCADE,
  ordinal integer NOT NULL,
  content text NOT NULL,
  embedding jsonb,
  tokens integer,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX kchunk_doc_idx ON knowledge_chunks(document_id);
CREATE UNIQUE INDEX kchunk_doc_ordinal_unique ON knowledge_chunks(document_id, ordinal);

-- ===== Tools Registry / Approvals (AI_TOOLS_ENABLED) =====
CREATE TABLE tools_registry (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL,
  name text NOT NULL,
  description text,
  kind text NOT NULL,
  risk tool_risk NOT NULL DEFAULT 'medium',
  input_schema jsonb NOT NULL DEFAULT '{}',
  enabled boolean NOT NULL DEFAULT false,
  constraints jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX tools_org_name_idx ON tools_registry(organization_id, name);
CREATE UNIQUE INDEX tools_org_name_unique ON tools_registry(organization_id, name);

CREATE TABLE tool_approvals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL,
  tool_id uuid NOT NULL REFERENCES tools_registry(id) ON DELETE CASCADE,
  run_id uuid REFERENCES runs(id) ON DELETE SET NULL,
  status approval_status NOT NULL DEFAULT 'pending',
  input_redacted jsonb NOT NULL,
  expires_at timestamptz NOT NULL,
  decided_at timestamptz,
  decided_by uuid REFERENCES users(id),
  decided_reason text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX tool_approval_org_status_idx ON tool_approvals(organization_id, status);

-- ===== Background Jobs / Worker (AI_WORKER_ENABLED) =====
CREATE TABLE background_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL,
  kind text NOT NULL,
  status job_status NOT NULL DEFAULT 'queued',
  payload jsonb NOT NULL DEFAULT '{}',
  result jsonb,
  failure_reason text,
  attempts integer NOT NULL DEFAULT 0,
  max_attempts integer NOT NULL DEFAULT 3,
  lock_token text,
  lock_expires_at timestamptz,
  run_id uuid REFERENCES runs(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  started_at timestamptz,
  completed_at timestamptz
);
CREATE INDEX jobs_org_status_idx ON background_jobs(organization_id, status);
CREATE INDEX jobs_lock_idx ON background_jobs(lock_expires_at);
CREATE INDEX jobs_kind_status_idx ON background_jobs(kind, status);

CREATE TABLE worker_heartbeats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  worker_id text NOT NULL,
  hostname text,
  status text NOT NULL DEFAULT 'idle',
  last_job_id uuid,
  last_seen_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX worker_id_unique ON worker_heartbeats(worker_id);
