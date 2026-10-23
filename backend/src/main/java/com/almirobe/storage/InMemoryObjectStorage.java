package com.almirobe.storage;

import com.almirobe.common.ApiException;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;

@Component
@ConditionalOnProperty(prefix = "almirobe.storage", name = "enabled", havingValue = "false", matchIfMissing = true)
public class InMemoryObjectStorage implements ObjectStorage {

    private record StoredObject(byte[] body, String contentType) {}

    private final Map<String, StoredObject> objects = new ConcurrentHashMap<>();

    @Override
    public String allocateOriginalKey(UUID userId, String contentType) {
        String ext = extensionFor(contentType);
        String key = "originals/%s/%s.%s".formatted(userId, UUID.randomUUID(), ext);
        objects.putIfAbsent(key, new StoredObject(new byte[0], contentType));
        return key;
    }

    @Override
    public String processedKey(UUID userId, UUID jobId) {
        return "processed/%s/%s.png".formatted(userId, jobId);
    }

    @Override
    public boolean exists(String objectKey) {
        StoredObject stored = objects.get(objectKey);
        return stored != null && stored.body.length > 0;
    }

    public boolean isAllocated(String objectKey) {
        return objects.containsKey(objectKey);
    }

    @Override
    public void put(String objectKey, byte[] body, String contentType) {
        objects.put(objectKey, new StoredObject(body, contentType));
    }

    @Override
    public byte[] get(String objectKey) {
        StoredObject stored = objects.get(objectKey);
        if (stored == null || stored.body.length == 0) {
            throw new ApiException("NOT_FOUND", "Object not found", HttpStatus.NOT_FOUND);
        }
        return stored.body;
    }

    @Override
    public String contentType(String objectKey) {
        StoredObject stored = objects.get(objectKey);
        return stored == null ? "application/octet-stream" : stored.contentType;
    }

    @Override
    public String publicGetUrl(String objectKey) {
        return null;
    }

    static String extensionFor(String contentType) {
        return switch (contentType) {
            case "image/png" -> "png";
            case "image/webp" -> "webp";
            default -> "jpg";
        };
    }
}
