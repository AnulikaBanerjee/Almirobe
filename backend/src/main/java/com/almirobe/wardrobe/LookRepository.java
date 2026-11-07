package com.almirobe.wardrobe;

import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface LookRepository extends JpaRepository<LookEntity, UUID> {
    List<LookEntity> findByUserIdAndProfileIdOrderByCreatedAtAsc(UUID userId, UUID profileId);
}

