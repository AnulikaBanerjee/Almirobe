package com.almirobe.imagejob.dto;

import com.fasterxml.jackson.databind.JsonNode;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import java.time.Instant;
import java.util.Map;
import java.util.UUID;

public final class ImageJobDtos {
    private ImageJobDtos() {}

    public record CreateUploadUrlRequest(
            @NotBlank
            @Pattern(regexp = "image/(jpeg|png|webp)")
            String contentType,
            String fileName
    ) {}

    public record CreateUploadUrlResponse(
            String uploadUrl,
            String objectKey,
            String method,
            Map<String, String> headers
    ) {}

    public record CreateImageJobRequest(@NotBlank String objectKey) {}

    public record ImageJobResponse(
            UUID id,
            String objectKey,
            String originalUrl,
            String processedUrl,
            String tagsStatus,
            String cutoutStatus,
            JsonNode tags,
            String errorMessage,
            Instant createdAt,
            Instant updatedAt,
            Boolean needsReview
    ) {}
}
