package com.almirobe.auth.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public final class AuthDtos {

    private AuthDtos() {}

    public record RegisterRequest(
            @NotBlank @Email String email,
            @NotBlank @Size(min = 6, max = 128) String password,
            String name
    ) {}

    public record LoginRequest(
            @NotBlank @Email String email,
            @NotBlank String password
    ) {}

    public record GoogleLoginRequest(@NotBlank String idToken) {}

    public record RefreshRequest(@NotBlank String refreshToken) {}

    public record LogoutRequest(@NotBlank String refreshToken) {}

    public record PhoneOtpRequest(@NotBlank @Size(min = 8, max = 20) String phone) {}

    public record PhoneOtpVerifyRequest(
            @NotBlank @Size(min = 8, max = 20) String phone,
            @NotBlank @Size(min = 4, max = 8) String code
    ) {}

    public record PhoneOtpSendResponse(String phone, int expiresInSeconds, String debugCode) {}

    public record UserDto(String id, String email, String displayName) {}

    public record ProfileDto(String id, String label, String displayName) {}

    public record AuthTokensResponse(
            String accessToken,
            String refreshToken,
            UserDto user,
            ProfileDto profile
    ) {}

    public record MeResponse(UserDto user, ProfileDto profile) {}
}
