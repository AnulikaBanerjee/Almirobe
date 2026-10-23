package com.almirobe.media;

import com.almirobe.auth.AuthenticatedUser;
import com.almirobe.common.ApiException;
import com.almirobe.idempotency.IdempotencyService;
import com.almirobe.imagejob.dto.ImageJobDtos.CreateUploadUrlRequest;
import com.almirobe.imagejob.dto.ImageJobDtos.CreateUploadUrlResponse;
import com.almirobe.storage.ObjectStorage;
import jakarta.servlet.http.HttpServletRequest;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.util.Map;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

@Service
public class MediaService {

    private static final int MAX_BYTES = 10 * 1024 * 1024;

    private final ObjectStorage objectStorage;
    private final IdempotencyService idempotencyService;

    public MediaService(ObjectStorage objectStorage, IdempotencyService idempotencyService) {
        this.objectStorage = objectStorage;
        this.idempotencyService = idempotencyService;
    }

    public CreateUploadUrlResponse createUploadUrl(
            AuthenticatedUser user, CreateUploadUrlRequest request, String idempotencyKey, String apiBase
    ) {
        var cached = idempotencyService.find(user.userId(), "media-upload-url", idempotencyKey);
        if (cached.isPresent()) {
            return new CreateUploadUrlResponse(
                    cached.get().body().get("uploadUrl").asText(),
                    cached.get().body().get("objectKey").asText(),
                    "PUT",
                    Map.of("Content-Type", request.contentType()));
        }
        String objectKey = objectStorage.allocateOriginalKey(user.userId(), request.contentType());
        String uploadUrl = apiBase.replaceAll("/$", "") + "/api/v1/media/objects?key="
                + java.net.URLEncoder.encode(objectKey, StandardCharsets.UTF_8);
        var response = new CreateUploadUrlResponse(
                uploadUrl, objectKey, "PUT", Map.of("Content-Type", request.contentType()));
        idempotencyService.save(user.userId(), "media-upload-url", idempotencyKey, 200, response);
        return response;
    }

    public void putObject(AuthenticatedUser user, String objectKey, HttpServletRequest request) throws Exception {
        assertOwnsKey(user.userId(), objectKey);
        byte[] body = request.getInputStream().readAllBytes();
        if (body.length == 0) {
            throw new ApiException("VALIDATION_ERROR", "Empty file", HttpStatus.BAD_REQUEST);
        }
        if (body.length > MAX_BYTES) {
            throw new ApiException("VALIDATION_ERROR", "Image must be under 10MB", HttpStatus.BAD_REQUEST);
        }
        String contentType = request.getContentType();
        if (contentType == null || contentType.isBlank()) {
            contentType = "image/jpeg";
        }
        objectStorage.put(objectKey, body, contentType.split(";")[0].trim());
    }

    public static String decodeKey(String key) {
        return URLDecoder.decode(key, StandardCharsets.UTF_8);
    }

    public static void assertOwnsKey(UUID userId, String objectKey) {
        String originals = "originals/" + userId + "/";
        String processed = "processed/" + userId + "/";
        if (!objectKey.startsWith(originals) && !objectKey.startsWith(processed)) {
            throw new ApiException("FORBIDDEN", "Object does not belong to this user", HttpStatus.FORBIDDEN);
        }
    }
}
