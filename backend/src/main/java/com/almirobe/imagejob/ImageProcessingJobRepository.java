package com.almirobe.imagejob;

import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ImageProcessingJobRepository extends JpaRepository<ImageProcessingJobEntity, UUID> {
    @Query("""
            select j from ImageProcessingJobEntity j
            where j.tagsStatus in :pending or j.cutoutStatus in :pending
            """)
    List<ImageProcessingJobEntity> findPending(@Param("pending") List<String> pending);
}
