-- Phone OTP login support
ALTER TABLE users ADD COLUMN phone_e164 VARCHAR(20) UNIQUE;

ALTER TABLE users DROP CONSTRAINT users_auth_method_check;
ALTER TABLE users ADD CONSTRAINT users_auth_method_check
    CHECK (password_hash IS NOT NULL OR google_sub IS NOT NULL OR phone_e164 IS NOT NULL);

-- Phone-only accounts may use a synthetic email; keep email NOT NULL for existing code paths.
CREATE INDEX idx_users_phone_e164 ON users (phone_e164) WHERE phone_e164 IS NOT NULL;
