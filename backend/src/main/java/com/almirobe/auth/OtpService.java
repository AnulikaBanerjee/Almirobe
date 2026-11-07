package com.almirobe.auth;

import com.almirobe.common.ApiException;
import java.security.SecureRandom;
import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

/**
 * Dev-friendly OTP store. Logs codes to the server console.
 * Swap the send path for Twilio/MSG91/etc. in production.
 */
@Service
public class OtpService {

    private static final Logger log = LoggerFactory.getLogger(OtpService.class);
    private static final long TTL_SECONDS = 300;

    private final SecureRandom random = new SecureRandom();
    private final Map<String, OtpEntry> codes = new ConcurrentHashMap<>();
    private final boolean exposeInResponse;

    public OtpService(
            @Value("${almirobe.otp.dev-expose-code:true}") boolean exposeInResponse
    ) {
        this.exposeInResponse = exposeInResponse;
    }

    public record SendResult(String phone, int expiresInSeconds, String debugCode) {}

    public SendResult sendLoginOtp(String rawPhone) {
        String phone = normalizePhone(rawPhone);
        String code = String.format("%06d", random.nextInt(1_000_000));
        codes.put(phone, new OtpEntry(code, Instant.now().plusSeconds(TTL_SECONDS)));
        log.info("[OTP] login code for {} is {} (expires in {}s)", phone, code, TTL_SECONDS);
        return new SendResult(phone, (int) TTL_SECONDS, exposeInResponse ? code : null);
    }

    public void verifyOrThrow(String rawPhone, String code) {
        String phone = normalizePhone(rawPhone);
        OtpEntry entry = codes.get(phone);
        if (entry == null || Instant.now().isAfter(entry.expiresAt())) {
            codes.remove(phone);
            throw new ApiException("OTP_EXPIRED", "Code expired. Request a new one.", HttpStatus.BAD_REQUEST);
        }
        if (!entry.code().equals(code == null ? "" : code.trim())) {
            throw new ApiException("OTP_INVALID", "Incorrect code", HttpStatus.UNAUTHORIZED);
        }
        codes.remove(phone);
    }

    public static String normalizePhone(String raw) {
        if (raw == null || raw.isBlank()) {
            throw new ApiException("INVALID_PHONE", "Enter a mobile number", HttpStatus.BAD_REQUEST);
        }
        String digits = raw.replaceAll("[^0-9+]", "");
        if (digits.startsWith("00")) {
            digits = "+" + digits.substring(2);
        }
        if (!digits.startsWith("+") && digits.length() == 10) {
            digits = "+91" + digits; // default India for this product
        }
        if (!digits.matches("^\\+[1-9][0-9]{7,14}$")) {
            throw new ApiException(
                    "INVALID_PHONE",
                    "Enter a valid mobile number with country code",
                    HttpStatus.BAD_REQUEST);
        }
        return digits;
    }

    private record OtpEntry(String code, Instant expiresAt) {}
}
