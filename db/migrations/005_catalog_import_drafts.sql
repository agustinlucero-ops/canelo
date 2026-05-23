CREATE TABLE IF NOT EXISTS catalog_import_batches (
  id TEXT PRIMARY KEY,
  status TEXT NOT NULL CHECK (status IN ('draft', 'published', 'discarded')),
  source_filename TEXT,
  import_mode TEXT NOT NULL CHECK (import_mode IN ('full_catalog', 'new_products_only')),
  options JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  published_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS catalog_import_items (
  id TEXT PRIMARY KEY,
  batch_id TEXT NOT NULL REFERENCES catalog_import_batches(id) ON DELETE CASCADE,
  action TEXT NOT NULL CHECK (action IN ('create', 'update')),
  sort_order INT NOT NULL,
  payload JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS catalog_import_batches_status_idx
  ON catalog_import_batches (status, created_at DESC);

CREATE INDEX IF NOT EXISTS catalog_import_items_batch_id_idx
  ON catalog_import_items (batch_id, sort_order ASC);
