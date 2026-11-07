package com.almirobe.storage;

import com.almirobe.common.ApiException;
import com.almirobe.config.AlmirobeProperties;
import java.net.URI;
import java.time.Duration;
import java.util.UUID;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.S3Configuration;
import software.amazon.awssdk.services.s3.model.CreateBucketRequest;
import software.amazon.awssdk.services.s3.model.GetObjectRequest;
import software.amazon.awssdk.services.s3.model.HeadBucketRequest;
import software.amazon.awssdk.services.s3.model.HeadObjectRequest;
import software.amazon.awssdk.services.s3.model.NoSuchBucketException;
import software.amazon.awssdk.services.s3.model.NoSuchKeyException;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;
import software.amazon.awssdk.services.s3.presigner.S3Presigner;
import software.amazon.awssdk.services.s3.presigner.model.GetObjectPresignRequest;

@Component
@ConditionalOnProperty(prefix = "almirobe.storage", name = "enabled", havingValue = "true")
public class S3ObjectStorage implements ObjectStorage {

    private final S3Client s3;
    private final S3Presigner presigner;
    private final String bucket;
    private final Duration presignTtl;

    public S3ObjectStorage(AlmirobeProperties properties) {
        var storage = properties.storage();
        this.bucket = storage.bucket();
        this.presignTtl = storage.presignTtl() == null ? Duration.ofMinutes(15) : storage.presignTtl();
        var credentials = StaticCredentialsProvider.create(
                AwsBasicCredentials.create(storage.accessKey(), storage.secretKey()));
        var endpoint = URI.create(storage.endpoint());
        var region = Region.of(storage.region());
        var s3Config = S3Configuration.builder().pathStyleAccessEnabled(true).build();
        this.s3 = S3Client.builder()
                .endpointOverride(endpoint)
                .region(region)
                .credentialsProvider(credentials)
                .serviceConfiguration(s3Config)
                .build();
        this.presigner = S3Presigner.builder()
                .endpointOverride(endpoint)
                .region(region)
                .credentialsProvider(credentials)
                .serviceConfiguration(s3Config)
                .build();
        ensureBucket();
    }

    private void ensureBucket() {
        try {
            s3.headBucket(HeadBucketRequest.builder().bucket(bucket).build());
        } catch (NoSuchBucketException ex) {
            s3.createBucket(CreateBucketRequest.builder().bucket(bucket).build());
        } catch (Exception ex) {
            try {
                s3.createBucket(CreateBucketRequest.builder().bucket(bucket).build());
            } catch (Exception ignored) {
                // bucket may already exist with a different error shape from MinIO
            }
        }
    }

    @Override
    public String allocateOriginalKey(UUID userId, String contentType) {
        return "originals/%s/%s.%s".formatted(
                userId, UUID.randomUUID(), InMemoryObjectStorage.extensionFor(contentType));
    }

    @Override
    public String processedKey(UUID userId, UUID jobId) {
        return "processed/%s/%s.png".formatted(userId, jobId);
    }

    @Override
    public boolean exists(String objectKey) {
        try {
            s3.headObject(HeadObjectRequest.builder().bucket(bucket).key(objectKey).build());
            return true;
        } catch (NoSuchKeyException ex) {
            return false;
        } catch (Exception ex) {
            return false;
        }
    }

    @Override
    public void put(String objectKey, byte[] body, String contentType) {
        s3.putObject(
                PutObjectRequest.builder()
                        .bucket(bucket)
                        .key(objectKey)
                        .contentType(contentType)
                        .build(),
                RequestBody.fromBytes(body));
    }

    @Override
    public byte[] get(String objectKey) {
        try {
            return s3.getObjectAsBytes(GetObjectRequest.builder().bucket(bucket).key(objectKey).build())
                    .asByteArray();
        } catch (NoSuchKeyException ex) {
            throw new ApiException("NOT_FOUND", "Object not found", HttpStatus.NOT_FOUND);
        }
    }

    @Override
    public String contentType(String objectKey) {
        try {
            String type = s3.headObject(HeadObjectRequest.builder().bucket(bucket).key(objectKey).build())
                    .contentType();
            return type == null ? "application/octet-stream" : type;
        } catch (Exception ex) {
            return "application/octet-stream";
        }
    }

    @Override
    public String publicGetUrl(String objectKey) {
        var request = GetObjectPresignRequest.builder()
                .signatureDuration(presignTtl)
                .getObjectRequest(GetObjectRequest.builder().bucket(bucket).key(objectKey).build())
                .build();
        return presigner.presignGetObject(request).url().toString();
    }
}
