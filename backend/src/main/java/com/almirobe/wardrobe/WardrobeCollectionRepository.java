package com.almirobe.wardrobe;

import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface WardrobeCollectionRepository extends JpaRepository<WardrobeCollectionEntity, UUID> {
    List<WardrobeCollectionEntity> findByUserIdAndProfileIdOrderByCreatedAtAsc(UUID userId, UUID profileId);
}

