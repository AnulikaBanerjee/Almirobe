package com.almirobe.imagejob;

import com.fasterxml.jackson.databind.JsonNode;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.UUID;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

@Entity
@Table(name = "image_processing_jobs")
public class ImageProcessingJobEntity {

    @Id
    private UUID id;

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Column(name = "profile_id", nullable = false)
    private UUID profileId;

    @Column(name = "original_object_key", nullable = false, length = 512)
    private String originalObjectKey;

    @Column(name = "processed_object_key", length = 512)
    private String processedObjectKey;

    @Column(name = "tags_status", nullable = false, length = 32)
    private String tagsStatus;

    @Column(name = "cutout_status", nullable = false, length = 32)
    private String cutoutStatus;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb")
    private JsonNode tags;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb")
    private JsonNode candidates;

    @Column(name = "error_message")
    private String errorMessage;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @PrePersist
    void onCreate() {
        if (id == null) {
            id = UUID.randomUUID();
        }
        Instant now = Instant.now();
        createdAt = now;
        updatedAt = now;
        if (tagsStatus == null) {
            tagsStatus = TrackStatus.QUEUED;
        }
        if (cutoutStatus == null) {
            cutoutStatus = TrackStatus.QUEUED;
        }
    }

    @PreUpdate
    void onUpdate() {
        updatedAt = Instant.now();
    }

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public UUID getUserId() {
        return userId;
    }

    public void setUserId(UUID userId) {
        this.userId = userId;
    }

    public UUID getProfileId() {
        return profileId;
    }

    public void setProfileId(UUID profileId) {
        this.profileId = profileId;
    }

    public String getOriginalObjectKey() {
        return originalObjectKey;
    }

    public void setOriginalObjectKey(String originalObjectKey) {
        this.originalObjectKey = originalObjectKey;
    }

    public String getProcessedObjectKey() {
        return processedObjectKey;
    }

    public void setProcessedObjectKey(String processedObjectKey) {
        this.processedObjectKey = processedObjectKey;
    }

    public String getTagsStatus() {
        return tagsStatus;
    }

    public void setTagsStatus(String tagsStatus) {
        this.tagsStatus = tagsStatus;
    }

    public String getCutoutStatus() {
        return cutoutStatus;
    }

    public void setCutoutStatus(String cutoutStatus) {
        this.cutoutStatus = cutoutStatus;
    }

    public JsonNode getTags() {
        return tags;
    }

    public void setTags(JsonNode tags) {
        this.tags = tags;
    }

    public JsonNode getCandidates() {
        return candidates;
    }

    public void setCandidates(JsonNode candidates) {
        this.candidates = candidates;
    }

    public String getErrorMessage() {
        return errorMessage;
    }

    public void setErrorMessage(String errorMessage) {
        this.errorMessage = errorMessage;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }
}
