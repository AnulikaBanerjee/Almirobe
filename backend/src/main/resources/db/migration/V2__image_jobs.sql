CREATE TABLE image_processing_jobs (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    profile_id UUID NOT NULL REFERENCES profiles (id) ON DELETE CASCADE,
    original_object_key VARCHAR(512) NOT NULL,
    processed_object_key VARCHAR(512),
    tags_status VARCHAR(32) NOT NULL DEFAULT 'queued',
    cutout_status VARCHAR(32) NOT NULL DEFAULT 'queued',
    tags JSON,
    candidates JSON,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_image_jobs_user_created ON image_processing_jobs (user_id, created_at DESC);
CREATE INDEX idx_image_jobs_pending ON image_processing_jobs (tags_status, cutout_status);

CREATE TABLE idempotency_keys (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    scope VARCHAR(64) NOT NULL,
    "key" VARCHAR(128) NOT NULL,
    response_status INT NOT NULL,
    response_body JSON NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    UNIQUE (user_id, scope, "key")
);

CREATE INDEX idx_idempotency_user_scope ON idempotency_keys (user_id, scope);
