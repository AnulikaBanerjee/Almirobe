CREATE TABLE IF NOT EXISTS wardrobe_collections (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL,
    profile_id UUID NOT NULL,
    name VARCHAR(128) NOT NULL,
    icon VARCHAR(64) NOT NULL,
    categories_json JSON NOT NULL,
    display_mode VARCHAR(32),
    shelf_count INTEGER,
    enable_season_filter BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_wardrobe_collections_profile
    ON wardrobe_collections (user_id, profile_id, created_at);

CREATE TABLE IF NOT EXISTS wardrobe_items (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL,
    profile_id UUID NOT NULL,
    collection_id VARCHAR(128) NOT NULL,
    name VARCHAR(256) NOT NULL,
    category_id VARCHAR(128),
    color VARCHAR(128),
    color_hex VARCHAR(32),
    brand VARCHAR(128),
    size VARCHAR(64),
    season VARCHAR(32),
    notes TEXT,
    image_url VARCHAR(2048),
    original_image_url VARCHAR(2048),
    image_job_id VARCHAR(128),
    product_type VARCHAR(128),
    subtype VARCHAR(128),
    pattern VARCHAR(128),
    occasion VARCHAR(128),
    weather VARCHAR(128),
    shelf_index INTEGER,
    favorite BOOLEAN NOT NULL DEFAULT FALSE,
    in_laundry BOOLEAN NOT NULL DEFAULT FALSE,
    marked_for_donation BOOLEAN NOT NULL DEFAULT FALSE,
    donation_marked_at BIGINT,
    loft_box_id VARCHAR(128),
    lent_status VARCHAR(32),
    lent_party VARCHAR(128),
    lent_date BIGINT,
    lent_notes TEXT,
    is_gift BOOLEAN NOT NULL DEFAULT FALSE,
    gift_from VARCHAR(128),
    gift_occasion VARCHAR(128),
    purchase_price DOUBLE PRECISION,
    purchase_date BIGINT,
    last_worn_at BIGINT,
    wear_count INTEGER,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_wardrobe_items_profile
    ON wardrobe_items (user_id, profile_id, created_at);

CREATE TABLE IF NOT EXISTS wardrobe_looks (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL,
    profile_id UUID NOT NULL,
    name VARCHAR(128) NOT NULL,
    primary_item_id VARCHAR(128) NOT NULL,
    item_ids_json JSON NOT NULL,
    notes TEXT,
    layout_json JSON,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_wardrobe_looks_profile
    ON wardrobe_looks (user_id, profile_id, created_at);

CREATE TABLE IF NOT EXISTS wardrobe_loft_boxes (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL,
    profile_id UUID NOT NULL,
    name VARCHAR(128) NOT NULL,
    image_url VARCHAR(2048),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_wardrobe_loft_boxes_profile
    ON wardrobe_loft_boxes (user_id, profile_id, created_at);

CREATE TABLE IF NOT EXISTS wardrobe_donations (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL,
    profile_id UUID NOT NULL,
    item_id VARCHAR(128) NOT NULL,
    name VARCHAR(256) NOT NULL,
    direction VARCHAR(32),
    person_name VARCHAR(128),
    occasion VARCHAR(128),
    notes TEXT,
    image_url VARCHAR(2048),
    donation_date BIGINT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_wardrobe_donations_profile
    ON wardrobe_donations (user_id, profile_id, created_at);

CREATE TABLE IF NOT EXISTS wardrobe_trip_plans (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL,
    profile_id UUID NOT NULL,
    trip_name VARCHAR(128) NOT NULL,
    destination VARCHAR(256),
    start_date BIGINT,
    end_date BIGINT,
    itinerary_json JSON NOT NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_wardrobe_trip_plans_profile
    ON wardrobe_trip_plans (user_id, profile_id, created_at);
