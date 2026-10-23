package com.almirobe.media;

import com.almirobe.auth.AuthenticatedUser;
import com.almirobe.imagejob.dto.ImageJobDtos.CreateUploadUrlRequest;
import com.almirobe.imagejob.dto.ImageJobDtos.CreateUploadUrlResponse;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/v1/media")
public class MediaController {

    private final MediaService mediaService;
    private final RemoteImageImporter remoteImageImporter;
    private final GhostExtractService ghostExtractService;

    public MediaController(
            MediaService mediaService,
            RemoteImageImporter remoteImageImporter,
            GhostExtractService ghostExtractService
    ) {
        this.mediaService = mediaService;
        this.remoteImageImporter = remoteImageImporter;
        this.ghostExtractService = ghostExtractService;
    }

    public record ImportUrlRequest(@jakarta.validation.constraints.NotBlank String url) {}

    @PostMapping("/import-url")
    public ResponseEntity<byte[]> importUrl(
            @AuthenticationPrincipal AuthenticatedUser user,
            @Valid @RequestBody ImportUrlRequest request
    ) {
        if (user == null) {
            throw new com.almirobe.common.ApiException(
                    "UNAUTHORIZED", "Sign in required", org.springframework.http.HttpStatus.UNAUTHORIZED);
        }
        byte[] image = remoteImageImporter.importImage(request.url());
        return ResponseEntity.ok().contentType(MediaType.IMAGE_JPEG).body(image);
    }

    @PostMapping(value = "/extract-garment", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<byte[]> extractGarment(
            @AuthenticationPrincipal AuthenticatedUser user,
            @RequestPart("file") MultipartFile file
    ) throws Exception {
        if (user == null) {
            throw new com.almirobe.common.ApiException(
                    "UNAUTHORIZED", "Sign in required", org.springframework.http.HttpStatus.UNAUTHORIZED);
        }
        byte[] png = ghostExtractService.extract(file.getBytes(), file.getContentType());
        return ResponseEntity.ok().contentType(MediaType.IMAGE_PNG).body(png);
    }

    @PostMapping("/upload-url")
    public CreateUploadUrlResponse uploadUrl(
            @AuthenticationPrincipal AuthenticatedUser user,
            @Valid @RequestBody CreateUploadUrlRequest request,
            @RequestHeader(value = "Idempotency-Key", required = false) String idempotencyKey,
            HttpServletRequest httpRequest
    ) {
        String base = httpRequest.getScheme() + "://" + httpRequest.getServerName() + ":" + httpRequest.getServerPort();
        return mediaService.createUploadUrl(user, request, idempotencyKey, base);
    }

    @PutMapping("/objects")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void putObject(
            @AuthenticationPrincipal AuthenticatedUser user,
            @RequestParam("key") String key,
            HttpServletRequest request
    ) throws Exception {
        mediaService.putObject(user, MediaService.decodeKey(key), request);
    }
}
