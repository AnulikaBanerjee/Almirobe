package com.almirobe.config;

import java.time.Duration;
import java.util.List;
import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "almirobe")
public record AlmirobeProperties(
        CorsProperties cors,
        JwtProperties jwt,
        GoogleProperties google,
        RedisProperties redis,
        StorageProperties storage
) {
    public record CorsProperties(List<String> allowedOrigins) {}

    public record JwtProperties(String issuer, Duration accessTokenTtl, Duration refreshTokenTtl, String secret) {}

    public record GoogleProperties(String clientId) {}

    public record RedisProperties(
            boolean enabled,
            String host,
            int port,
            String queueTags,
            String queueExtract,
            String resultPrefix
    ) {}

    public record StorageProperties(
            boolean enabled,
            String endpoint,
            String region,
            String bucket,
            String accessKey,
            String secretKey,
            Duration presignTtl
    ) {}
}
