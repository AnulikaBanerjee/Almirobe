package com.almirobe.auth;

import com.almirobe.auth.dto.AuthDtos.AuthTokensResponse;
import com.almirobe.auth.dto.AuthDtos.GoogleLoginRequest;
import com.almirobe.auth.dto.AuthDtos.LoginRequest;
import com.almirobe.auth.dto.AuthDtos.LogoutRequest;
import com.almirobe.auth.dto.AuthDtos.MeResponse;
import com.almirobe.auth.dto.AuthDtos.PhoneOtpRequest;
import com.almirobe.auth.dto.AuthDtos.PhoneOtpSendResponse;
import com.almirobe.auth.dto.AuthDtos.PhoneOtpVerifyRequest;
import com.almirobe.auth.dto.AuthDtos.RefreshRequest;
import com.almirobe.auth.dto.AuthDtos.RegisterRequest;
import jakarta.validation.Valid;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/register")
    public AuthTokensResponse register(@Valid @RequestBody RegisterRequest request) {
        return authService.register(request);
    }

    @PostMapping("/login")
    public AuthTokensResponse login(@Valid @RequestBody LoginRequest request) {
        return authService.login(request);
    }

    @PostMapping("/otp/send")
    public PhoneOtpSendResponse sendOtp(@Valid @RequestBody PhoneOtpRequest request) {
        return authService.sendPhoneOtp(request);
    }

    @PostMapping("/otp/verify")
    public AuthTokensResponse verifyOtp(@Valid @RequestBody PhoneOtpVerifyRequest request) {
        return authService.verifyPhoneOtp(request);
    }

    @PostMapping("/google")
    public AuthTokensResponse google(@Valid @RequestBody GoogleLoginRequest request) {
        return authService.loginWithGoogle(request);
    }

    @PostMapping("/refresh")
    public AuthTokensResponse refresh(@Valid @RequestBody RefreshRequest request) {
        return authService.refresh(request);
    }

    @PostMapping("/logout")
    public void logout(@Valid @RequestBody LogoutRequest request) {
        authService.logout(request);
    }

    @GetMapping("/me")
    public MeResponse me(@AuthenticationPrincipal AuthenticatedUser principal) {
        return authService.me(principal);
    }
}
