package com.almirobe.storage;

import java.util.UUID;

public interface ObjectStorage {
    String allocateOriginalKey(UUID userId, String contentType);

    String processedKey(UUID userId, UUID jobId);

    boolean exists(String objectKey);

    void put(String objectKey, byte[] body, String contentType);

    byte[] get(String objectKey);

    String contentType(String objectKey);

    /** Browser-loadable GET URL (presigned S3 or empty for in-memory). */
    String publicGetUrl(String objectKey);
}
