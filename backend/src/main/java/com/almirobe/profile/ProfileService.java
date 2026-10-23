package com.almirobe.profile;

import com.almirobe.auth.UserEntity;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ProfileService {

    private final ProfileRepository profileRepository;

    public ProfileService(ProfileRepository profileRepository) {
        this.profileRepository = profileRepository;
    }

    @Transactional
    public ProfileEntity ensureDefaultProfile(UserEntity user) {
        return profileRepository.findFirstByUser_IdOrderByCreatedAtAsc(user.getId())
                .orElseGet(() -> {
                    ProfileEntity profile = new ProfileEntity();
                    profile.setUser(user);
                    profile.setLabel("Me");
                    profile.setDisplayName(user.getDisplayName());
                    return profileRepository.save(profile);
                });
    }

    public ProfileEntity getDefaultProfile(UUID userId) {
        return profileRepository.findFirstByUser_IdOrderByCreatedAtAsc(userId)
                .orElseThrow(() -> new IllegalStateException("Default profile missing for user " + userId));
    }
}
