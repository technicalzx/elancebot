CREATE TABLE experiments (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  project_id TEXT REFERENCES projects(id) ON DELETE CASCADE,
  plan_json TEXT NOT NULL,
  observations_json TEXT NOT NULL DEFAULT '{"baseline":null,"followUp":null}',
  version INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
CREATE INDEX experiments_owner ON experiments(user_id,updated_at DESC);
CREATE INDEX experiments_project ON experiments(project_id);
