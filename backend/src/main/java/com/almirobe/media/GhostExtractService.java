package com.almirobe.media;

import com.almirobe.common.ApiException;
import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

@Service
public class GhostExtractService {

    private final HttpClient httpClient;
    private final String extractUrl;

    public GhostExtractService(
            @Value("${almirobe.ghost-extract.url:}") String extractUrl
    ) {
        this.extractUrl = extractUrl == null ? "" : extractUrl.trim();
        this.httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(30))
                .build();
    }

    public boolean isEnabled() {
        return !extractUrl.isEmpty();
    }

    public byte[] extract(byte[] imageBytes, String contentType) {
        if (!isEnabled()) {
            throw new ApiException(
                    "GHOST_EXTRACT_DISABLED",
                    "Ghost garment extraction is not configured",
                    HttpStatus.SERVICE_UNAVAILABLE);
        }
        String mediaType = contentType == null || contentType.isBlank()
                ? "application/octet-stream"
                : contentType;
        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(extractUrl))
                .timeout(Duration.ofMinutes(15))
                .header("Content-Type", mediaType)
                .POST(HttpRequest.BodyPublishers.ofByteArray(imageBytes))
                .build();
        try {
            HttpResponse<byte[]> response = httpClient.send(
                    request, HttpResponse.BodyHandlers.ofByteArray());
            if (response.statusCode() != 200) {
                throw new ApiException(
                        "GHOST_EXTRACT_FAILED",
                        "Ghost extraction failed (" + response.statusCode() + ")",
                        HttpStatus.BAD_GATEWAY);
            }
            return response.body();
        } catch (IOException | InterruptedException e) {
            if (e instanceof InterruptedException) {
                Thread.currentThread().interrupt();
            }
            throw new ApiException(
                    "GHOST_EXTRACT_FAILED",
                    "Could not reach ghost extraction service",
                    HttpStatus.BAD_GATEWAY);
        }
    }
}
