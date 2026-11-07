package com.almirobe.wardrobe;

import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface LoftBoxRepository extends JpaRepository<LoftBoxEntity, UUID> {
    List<LoftBoxEntity> findByUserIdAndProfileIdOrderByCreatedAtAsc(UUID userId, UUID profileId);
}

