package com.almirobe.profile;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ProfileRepository extends JpaRepository<ProfileEntity, UUID> {
    List<ProfileEntity> findByUser_IdOrderByCreatedAtAsc(UUID userId);

    Optional<ProfileEntity> findFirstByUser_IdOrderByCreatedAtAsc(UUID userId);
}
