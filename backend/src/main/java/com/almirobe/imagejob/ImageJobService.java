package com.almirobe.imagejob;

import com.almirobe.auth.AuthenticatedUser;
import com.almirobe.common.ApiException;
import com.almirobe.idempotency.IdempotencyService;
import com.almirobe.imagejob.dto.ImageJobDtos.CreateImageJobRequest;
import com.almirobe.imagejob.dto.ImageJobDtos.ImageJobResponse;
import com.almirobe.media.MediaService;
import com.almirobe.queue.JobQueue;
import com.almirobe.storage.ObjectStorage;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ImageJobService {

    private static final List<String> PENDING = List.of(TrackStatus.QUEUED, TrackStatus.RUNNING);

    private final ImageProcessingJobRepository jobs;
    private final ObjectStorage objectStorage;
    private final JobQueue jobQueue;
    private final IdempotencyService idempotencyService;
    private final ObjectMapper objectMapper;

    public ImageJobService(
            ImageProcessingJobRepository jobs,
            ObjectStorage objectStorage,
            JobQueue jobQueue,
            IdempotencyService idempotencyService,
            ObjectMapper objectMapper
    ) {
        this.jobs = jobs;
        this.objectStorage = objectStorage;
        this.jobQueue = jobQueue;
        this.idempotencyService = idempotencyService;
        this.objectMapper = objectMapper;
    }

    @Transactional
    public ImageJobResponse create(AuthenticatedUser user, CreateImageJobRequest request, String idempotencyKey) {
        var cached = idempotencyService.find(user.userId(), "image-jobs", idempotencyKey);
        if (cached.isPresent()) {
            return objectMapper.convertValue(cached.get().body(), ImageJobResponse.class);
        }
        MediaService.assertOwnsKey(user.userId(), request.objectKey());
        if (!objectStorage.exists(request.objectKey())) {
            throw new ApiException("NOT_FOUND", "Upload the original image before creating a job", HttpStatus.NOT_FOUND);
        }
        ImageProcessingJobEntity job = new ImageProcessingJobEntity();
        job.setUserId(user.userId());
        job.setProfileId(user.profileId());
        job.setOriginalObjectKey(request.objectKey());
        job.setTagsStatus(TrackStatus.QUEUED);
        job.setCutoutStatus(TrackStatus.QUEUED);
        jobs.save(job);
        String processedKey = objectStorage.processedKey(user.userId(), job.getId());
        jobQueue.enqueue(job.getId(), user.userId(), request.objectKey(), processedKey);
        ImageJobResponse response = toResponse(job);
        idempotencyService.save(user.userId(), "image-jobs", idempotencyKey, 202, response);
        return response;
    }

    @Transactional
    public ImageJobResponse get(AuthenticatedUser user, UUID jobId) {
        ImageProcessingJobEntity job = jobs.findById(jobId)
                .orElseThrow(() -> new ApiException("NOT_FOUND", "Job not found", HttpStatus.NOT_FOUND));
        if (!job.getUserId().equals(user.userId())) {
            throw new ApiException("NOT_FOUND", "Job not found", HttpStatus.NOT_FOUND);
        }
        applyQueueResult(job);
        return toResponse(job);
    }

    @Transactional
    public void syncPending() {
        jobs.findPending(PENDING).forEach(this::applyQueueResult);
    }

    private void applyQueueResult(ImageProcessingJobEntity job) {
        jobQueue.readResult(job.getId()).ifPresent(hash -> applyHash(job, hash));
    }

    private void applyHash(ImageProcessingJobEntity job, Map<String, String> hash) {
        String tagsStatus = hash.get("tags_status");
        if (tagsStatus != null && !isTerminal(job.getTagsStatus())) {
            job.setTagsStatus(tagsStatus);
        }
        String cutoutStatus = hash.get("cutout_status");
        if (cutoutStatus != null && !isTerminal(job.getCutoutStatus())) {
            job.setCutoutStatus(cutoutStatus);
        }
        String tagsJson = hash.get("tags_json");
        if (tagsJson != null && !tagsJson.isBlank()) {
            try {
                JsonNode tags = objectMapper.readTree(tagsJson);
                job.setTags(tags);
                if (tags.has("candidates")) {
                    job.setCandidates(tags.get("candidates"));
                }
            } catch (Exception ignored) {
                // keep previous tags
            }
        }
        String processed = hash.get("processed_object_key");
        if (processed != null && !processed.isBlank() && TrackStatus.SUCCEEDED.equals(hash.get("cutout_status"))) {
            job.setProcessedObjectKey(processed);
        }
        String error = hash.get("error");
        if (error != null && !error.isBlank()) {
            job.setErrorMessage(error);
        }
        jobs.save(job);
    }

    private static boolean isTerminal(String status) {
        return TrackStatus.SUCCEEDED.equals(status) || TrackStatus.FAILED.equals(status);
    }

    private ImageJobResponse toResponse(ImageProcessingJobEntity job) {
        String originalUrl = objectStorage.publicGetUrl(job.getOriginalObjectKey());
        String processedUrl = job.getProcessedObjectKey() == null
                ? null
                : objectStorage.publicGetUrl(job.getProcessedObjectKey());
        return new ImageJobResponse(
                job.getId(),
                job.getOriginalObjectKey(),
                originalUrl,
                processedUrl,
                job.getTagsStatus(),
                job.getCutoutStatus(),
                job.getTags(),
                job.getErrorMessage(),
                job.getCreatedAt(),
                job.getUpdatedAt(),
                jobQueue.readResult(job.getId())
                        .map(hash -> "true".equalsIgnoreCase(hash.get("needs_review")))
                        .orElse(false));
    }
}
