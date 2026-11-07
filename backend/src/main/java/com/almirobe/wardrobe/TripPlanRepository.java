package com.almirobe.wardrobe;

import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TripPlanRepository extends JpaRepository<TripPlanEntity, UUID> {
    List<TripPlanEntity> findByUserIdAndProfileIdOrderByCreatedAtAsc(UUID userId, UUID profileId);
}

