CREATE TABLE IF NOT EXISTS d1_migrations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT UNIQUE,
  applied_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT OR IGNORE INTO d1_migrations (name) VALUES
('0001_initial_schema.sql'),
('0002_editorial_auth.sql'),
('0003_auth_rate_limits.sql'),
('0004_migration_history_baseline.sql');
