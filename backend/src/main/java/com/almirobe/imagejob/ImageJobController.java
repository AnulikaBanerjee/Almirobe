package com.almirobe.imagejob;

import com.almirobe.auth.AuthenticatedUser;
import com.almirobe.imagejob.dto.ImageJobDtos.CreateImageJobRequest;
import com.almirobe.imagejob.dto.ImageJobDtos.ImageJobResponse;
import jakarta.validation.Valid;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/image-jobs")
public class ImageJobController {

    private final ImageJobService imageJobService;

    public ImageJobController(ImageJobService imageJobService) {
        this.imageJobService = imageJobService;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.ACCEPTED)
    public ImageJobResponse create(
            @AuthenticationPrincipal AuthenticatedUser user,
            @Valid @RequestBody CreateImageJobRequest request,
            @RequestHeader(value = "Idempotency-Key", required = false) String idempotencyKey
    ) {
        return imageJobService.create(user, request, idempotencyKey);
    }

    @GetMapping("/{jobId}")
    public ImageJobResponse get(
            @AuthenticationPrincipal AuthenticatedUser user, @PathVariable UUID jobId
    ) {
        return imageJobService.get(user, jobId);
    }
}
