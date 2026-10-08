-- Add plataformas table
CREATE TABLE IF NOT EXISTS plataformas (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  platform TEXT NOT NULL,
  channel_id TEXT,
  channel_name TEXT,
  channel_handle TEXT,
  verification_code TEXT,
  bio_link_code TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  verified_at TEXT,
  unlinked_at TEXT,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_plataformas_user_id ON plataformas(user_id);
CREATE INDEX IF NOT EXISTS idx_plataformas_status ON plataformas(status);
