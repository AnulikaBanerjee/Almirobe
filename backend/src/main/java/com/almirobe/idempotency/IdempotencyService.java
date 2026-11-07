package com.almirobe.idempotency;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.Optional;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class IdempotencyService {

    private final IdempotencyKeyRepository repository;
    private final ObjectMapper objectMapper;

    public IdempotencyService(IdempotencyKeyRepository repository, ObjectMapper objectMapper) {
        this.repository = repository;
        this.objectMapper = objectMapper;
    }

    public Optional<Stored> find(UUID userId, String scope, String key) {
        if (key == null || key.isBlank()) {
            return Optional.empty();
        }
        return repository.findByUserIdAndScopeAndKey(userId, scope, key)
                .map(row -> new Stored(row.getResponseStatus(), row.getResponseBody()));
    }

    @Transactional
    public void save(UUID userId, String scope, String key, int status, Object body) {
        if (key == null || key.isBlank()) {
            return;
        }
        if (repository.findByUserIdAndScopeAndKey(userId, scope, key).isPresent()) {
            return;
        }
        IdempotencyKeyEntity entity = new IdempotencyKeyEntity();
        entity.setUserId(userId);
        entity.setScope(scope);
        entity.setKey(key);
        entity.setResponseStatus(status);
        entity.setResponseBody(objectMapper.valueToTree(body));
        repository.save(entity);
    }

    public record Stored(int status, JsonNode body) {}
}
