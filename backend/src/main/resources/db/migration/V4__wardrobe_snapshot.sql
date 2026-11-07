CREATE TABLE IF NOT EXISTS wardrobe_snapshots (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL,
    profile_id UUID NOT NULL,
    payload JSON NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    CONSTRAINT uk_wardrobe_snapshot_user_profile UNIQUE (user_id, profile_id)
);

CREATE INDEX IF NOT EXISTS idx_wardrobe_snapshot_user_profile
    ON wardrobe_snapshots (user_id, profile_id);
