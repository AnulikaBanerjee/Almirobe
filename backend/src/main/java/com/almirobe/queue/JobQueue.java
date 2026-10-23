package com.almirobe.queue;

import java.util.Map;
import java.util.Optional;
import java.util.UUID;

public interface JobQueue {
    void enqueue(UUID jobId, UUID userId, String originalObjectKey, String processedObjectKey);

    Optional<Map<String, String>> readResult(UUID jobId);
}
