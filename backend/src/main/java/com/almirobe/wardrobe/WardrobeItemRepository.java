package com.almirobe.wardrobe;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface WardrobeItemRepository extends JpaRepository<WardrobeItemEntity, UUID> {
    List<WardrobeItemEntity> findByUserIdAndProfileIdOrderByCreatedAtAsc(UUID userId, UUID profileId);
    Optional<WardrobeItemEntity> findByUserIdAndProfileIdAndId(UUID userId, UUID profileId, UUID id);
}

