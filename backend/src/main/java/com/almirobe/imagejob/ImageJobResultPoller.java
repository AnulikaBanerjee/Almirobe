package com.almirobe.imagejob;

import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
@ConditionalOnProperty(prefix = "almirobe.redis", name = "enabled", havingValue = "true")
public class ImageJobResultPoller {

    private final ImageJobService imageJobService;

    public ImageJobResultPoller(ImageJobService imageJobService) {
        this.imageJobService = imageJobService;
    }

    @Scheduled(fixedDelay = 500)
    public void poll() {
        imageJobService.syncPending();
    }
}
