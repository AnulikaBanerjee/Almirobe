package com.almirobe.auth;

import java.util.UUID;

public record AuthenticatedUser(UUID userId, String email, UUID profileId) {}
