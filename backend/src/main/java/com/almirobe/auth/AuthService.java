package com.almirobe.auth;

import com.almirobe.auth.dto.AuthDtos.AuthTokensResponse;
import com.almirobe.auth.dto.AuthDtos.GoogleLoginRequest;
import com.almirobe.auth.dto.AuthDtos.LoginRequest;
import com.almirobe.auth.dto.AuthDtos.LogoutRequest;
import com.almirobe.auth.dto.AuthDtos.MeResponse;
import com.almirobe.auth.dto.AuthDtos.PhoneOtpRequest;
import com.almirobe.auth.dto.AuthDtos.PhoneOtpSendResponse;
import com.almirobe.auth.dto.AuthDtos.PhoneOtpVerifyRequest;
import com.almirobe.auth.dto.AuthDtos.ProfileDto;
import com.almirobe.auth.dto.AuthDtos.RefreshRequest;
import com.almirobe.auth.dto.AuthDtos.RegisterRequest;
import com.almirobe.auth.dto.AuthDtos.UserDto;
import com.almirobe.common.ApiException;
import com.almirobe.config.AlmirobeProperties;
import com.almirobe.profile.ProfileEntity;
import com.almirobe.profile.ProfileService;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.time.Instant;
import java.util.HexFormat;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final ProfileService profileService;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final GoogleTokenVerifier googleTokenVerifier;
    private final AlmirobeProperties.JwtProperties jwtProperties;
    private final EmailDeliverabilityValidator emailDeliverabilityValidator;
    private final OtpService otpService;
    private final SecureRandom secureRandom = new SecureRandom();

    public AuthService(
            UserRepository userRepository,
            RefreshTokenRepository refreshTokenRepository,
            ProfileService profileService,
            PasswordEncoder passwordEncoder,
            JwtService jwtService,
            GoogleTokenVerifier googleTokenVerifier,
            AlmirobeProperties properties,
            EmailDeliverabilityValidator emailDeliverabilityValidator,
            OtpService otpService
    ) {
        this.userRepository = userRepository;
        this.refreshTokenRepository = refreshTokenRepository;
        this.profileService = profileService;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.googleTokenVerifier = googleTokenVerifier;
        this.jwtProperties = properties.jwt();
        this.emailDeliverabilityValidator = emailDeliverabilityValidator;
        this.otpService = otpService;
    }

    @Transactional
    public AuthTokensResponse register(RegisterRequest request) {
        String email = normalizeEmail(request.email());
        emailDeliverabilityValidator.validateForRegistration(email);
        if (userRepository.findByEmailIgnoreCase(email).isPresent()) {
            throw new ApiException("EMAIL_EXISTS", "An account with this email already exists", HttpStatus.CONFLICT);
        }
        UserEntity user = new UserEntity();
        user.setEmail(email);
        user.setPasswordHash(passwordEncoder.encode(request.password()));
        user.setDisplayName(resolveDisplayName(request.name(), email));
        userRepository.save(user);
        ProfileEntity profile = profileService.ensureDefaultProfile(user);
        return issueTokens(user, profile);
    }

    @Transactional
    public AuthTokensResponse login(LoginRequest request) {
        String email = normalizeEmail(request.email());
        UserEntity user = userRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new ApiException("INVALID_CREDENTIALS", "Invalid email or password", HttpStatus.UNAUTHORIZED));
        if (!StringUtils.hasText(user.getPasswordHash())
                || !passwordEncoder.matches(request.password(), user.getPasswordHash())) {
            throw new ApiException("INVALID_CREDENTIALS", "Invalid email or password", HttpStatus.UNAUTHORIZED);
        }
        ProfileEntity profile = profileService.ensureDefaultProfile(user);
        return issueTokens(user, profile);
    }

    @Transactional
    public AuthTokensResponse loginWithGoogle(GoogleLoginRequest request) {
        GoogleIdToken.Payload payload = googleTokenVerifier.verify(request.idToken());
        String googleSub = payload.getSubject();
        String email = normalizeEmail(payload.getEmail());
        String name = payload.get("name") != null ? payload.get("name").toString() : null;

        UserEntity user = userRepository.findByGoogleSub(googleSub)
                .or(() -> userRepository.findByEmailIgnoreCase(email))
                .orElseGet(() -> {
                    UserEntity created = new UserEntity();
                    created.setEmail(email);
                    created.setGoogleSub(googleSub);
                    created.setDisplayName(name);
                    return userRepository.save(created);
                });

        if (user.getGoogleSub() == null) {
            user.setGoogleSub(googleSub);
        }
        if (!StringUtils.hasText(user.getDisplayName()) && StringUtils.hasText(name)) {
            user.setDisplayName(name);
        }
        userRepository.save(user);

        ProfileEntity profile = profileService.ensureDefaultProfile(user);
        return issueTokens(user, profile);
    }

    public PhoneOtpSendResponse sendPhoneOtp(PhoneOtpRequest request) {
        OtpService.SendResult sent = otpService.sendLoginOtp(request.phone());
        return new PhoneOtpSendResponse(sent.phone(), sent.expiresInSeconds(), sent.debugCode());
    }

    @Transactional
    public AuthTokensResponse verifyPhoneOtp(PhoneOtpVerifyRequest request) {
        String phone = OtpService.normalizePhone(request.phone());
        otpService.verifyOrThrow(phone, request.code());

        UserEntity user = userRepository.findByPhoneE164(phone).orElseGet(() -> {
            UserEntity created = new UserEntity();
            created.setPhoneE164(phone);
            created.setEmail("phone." + phone.replace("+", "") + "@phone.almirobe.local");
            created.setDisplayName("Mobile user");
            return userRepository.save(created);
        });

        ProfileEntity profile = profileService.ensureDefaultProfile(user);
        return issueTokens(user, profile);
    }

    @Transactional
    public AuthTokensResponse refresh(RefreshRequest request) {
        RefreshTokenEntity stored = refreshTokenRepository.findByTokenHash(hashToken(request.refreshToken()))
                .filter(RefreshTokenEntity::isActive)
                .orElseThrow(() -> new ApiException("INVALID_REFRESH_TOKEN", "Invalid refresh token", HttpStatus.UNAUTHORIZED));

        stored.setRevokedAt(Instant.now());
        refreshTokenRepository.save(stored);

        UserEntity user = stored.getUser();
        ProfileEntity profile = profileService.getDefaultProfile(user.getId());
        return issueTokens(user, profile);
    }

    @Transactional
    public void logout(LogoutRequest request) {
        refreshTokenRepository.findByTokenHash(hashToken(request.refreshToken()))
                .ifPresent(token -> {
                    token.setRevokedAt(Instant.now());
                    refreshTokenRepository.save(token);
                });
    }

    @Transactional(readOnly = true)
    public MeResponse me(AuthenticatedUser principal) {
        UserEntity user = userRepository.findById(principal.userId())
                .orElseThrow(() -> new ApiException("USER_NOT_FOUND", "User not found", HttpStatus.NOT_FOUND));
        ProfileEntity profile = profileService.getDefaultProfile(user.getId());
        return new MeResponse(toUserDto(user), toProfileDto(profile));
    }

    private AuthTokensResponse issueTokens(UserEntity user, ProfileEntity profile) {
        String accessToken = jwtService.createAccessToken(user, profile.getId());
        String refreshToken = createRefreshToken(user);
        return new AuthTokensResponse(
                accessToken,
                refreshToken,
                toUserDto(user),
                toProfileDto(profile)
        );
    }

    private String createRefreshToken(UserEntity user) {
        byte[] bytes = new byte[32];
        secureRandom.nextBytes(bytes);
        String rawToken = HexFormat.of().formatHex(bytes);
        RefreshTokenEntity entity = new RefreshTokenEntity();
        entity.setUser(user);
        entity.setTokenHash(hashToken(rawToken));
        entity.setExpiresAt(Instant.now().plus(jwtProperties.refreshTokenTtl()));
        refreshTokenRepository.save(entity);
        return rawToken;
    }

    private String hashToken(String rawToken) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hashed = digest.digest(rawToken.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(hashed);
        } catch (Exception ex) {
            throw new IllegalStateException("Could not hash refresh token", ex);
        }
    }

    private static String normalizeEmail(String email) {
        return email.trim().toLowerCase();
    }

    private static String resolveDisplayName(String name, String email) {
        if (StringUtils.hasText(name)) {
            return name.trim();
        }
        int at = email.indexOf('@');
        return at > 0 ? email.substring(0, at) : email;
    }

    private static UserDto toUserDto(UserEntity user) {
        return new UserDto(user.getId().toString(), user.getEmail(), user.getDisplayName());
    }

    private static ProfileDto toProfileDto(ProfileEntity profile) {
        return new ProfileDto(profile.getId().toString(), profile.getLabel(), profile.getDisplayName());
    }
}
