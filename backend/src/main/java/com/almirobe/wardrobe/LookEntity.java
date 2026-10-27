package com.almirobe.wardrobe;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.UUID;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

@Entity
@Table(
        name = "wardrobe_looks",
        indexes = {@Index(name = "idx_wardrobe_looks_profile", columnList = "user_id, profile_id")}
)
public class LookEntity {

    @Id
    private UUID id;

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Column(name = "profile_id", nullable = false)
    private UUID profileId;

    @Column(nullable = false, length = 128)
    private String name;

    @Column(name = "primary_item_id", nullable = false, length = 128)
    private String primaryItemId;

    @Column(name = "item_ids_json", nullable = false, columnDefinition = "jsonb")
    @JdbcTypeCode(SqlTypes.JSON)
    private String itemIdsJson;

    @Column(length = 2048)
    private String notes;

    @Column(name = "layout_json", columnDefinition = "jsonb")
    @JdbcTypeCode(SqlTypes.JSON)
    private String layoutJson;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @PrePersist
    @PreUpdate
    void touch() {
        Instant now = Instant.now();
        updatedAt = now;
        if (createdAt == null) {
            createdAt = now;
        }
        if (id == null) {
            id = UUID.randomUUID();
        }
    }

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public UUID getUserId() { return userId; }
    public void setUserId(UUID userId) { this.userId = userId; }

    public UUID getProfileId() { return profileId; }
    public void setProfileId(UUID profileId) { this.profileId = profileId; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getPrimaryItemId() { return primaryItemId; }
    public void setPrimaryItemId(String primaryItemId) { this.primaryItemId = primaryItemId; }

    public String getItemIdsJson() { return itemIdsJson; }
    public void setItemIdsJson(String itemIdsJson) { this.itemIdsJson = itemIdsJson; }

    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }

    public String getLayoutJson() { return layoutJson; }
    public void setLayoutJson(String layoutJson) { this.layoutJson = layoutJson; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }

    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }
}

