package com.almirobe.wardrobe;

import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface WardrobeSnapshotRepository extends JpaRepository<WardrobeSnapshotEntity, UUID> {
    Optional<WardrobeSnapshotEntity> findByUserIdAndProfileId(UUID userId, UUID profileId);
}

