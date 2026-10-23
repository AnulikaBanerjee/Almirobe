package com.almirobe.queue;

import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

@Component
@ConditionalOnProperty(prefix = "almirobe.redis", name = "enabled", havingValue = "false", matchIfMissing = true)
public class NoopJobQueue implements JobQueue {
    @Override
    public void enqueue(UUID jobId, UUID userId, String originalObjectKey, String processedObjectKey) {}

    @Override
    public Optional<Map<String, String>> readResult(UUID jobId) {
        return Optional.empty();
    }
}
