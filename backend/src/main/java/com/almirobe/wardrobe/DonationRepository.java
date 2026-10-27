package com.almirobe.wardrobe;

import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface DonationRepository extends JpaRepository<DonationEntity, UUID> {
    List<DonationEntity> findByUserIdAndProfileIdOrderByCreatedAtAsc(UUID userId, UUID profileId);
}

