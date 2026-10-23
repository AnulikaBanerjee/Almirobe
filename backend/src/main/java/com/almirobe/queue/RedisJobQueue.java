package com.almirobe.queue;

import com.almirobe.config.AlmirobeProperties;
import io.lettuce.core.RedisClient;
import io.lettuce.core.api.StatefulRedisConnection;
import jakarta.annotation.PreDestroy;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

@Component
@ConditionalOnProperty(prefix = "almirobe.redis", name = "enabled", havingValue = "true")
public class RedisJobQueue implements JobQueue {

    private final RedisClient client;
    private final StatefulRedisConnection<String, String> connection;
    private final String queueTags;
    private final String queueExtract;
    private final String resultPrefix;

    public RedisJobQueue(AlmirobeProperties properties) {
        var redis = properties.redis();
        this.queueTags = redis.queueTags();
        this.queueExtract = redis.queueExtract();
        this.resultPrefix = redis.resultPrefix();
        this.client = RedisClient.create("redis://%s:%d".formatted(redis.host(), redis.port()));
        this.connection = client.connect();
    }

    @Override
    public void enqueue(UUID jobId, UUID userId, String originalObjectKey, String processedObjectKey) {
        String hash = resultPrefix + jobId;
        var commands = connection.sync();
        commands.hset(hash, Map.of(
                "job_id", jobId.toString(),
                "user_id", userId.toString(),
                "original_object_key", originalObjectKey,
                "processed_object_key", processedObjectKey,
                "tags_status", "queued",
                "cutout_status", "queued"));
        commands.lpush(queueTags, jobId.toString());
        commands.lpush(queueExtract, jobId.toString());
    }

    @Override
    public Optional<Map<String, String>> readResult(UUID jobId) {
        Map<String, String> all = connection.sync().hgetall(resultPrefix + jobId);
        if (all == null || all.isEmpty()) {
            return Optional.empty();
        }
        return Optional.of(all);
    }

    @PreDestroy
    void close() {
        connection.close();
        client.shutdown();
    }
}
