package com.almirobe.auth;

import com.almirobe.common.ApiException;
import com.almirobe.config.AlmirobeProperties;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdTokenVerifier;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.gson.GsonFactory;
import java.util.Collections;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

@Component
public class GoogleTokenVerifier {

    private final GoogleIdTokenVerifier verifier;

    public GoogleTokenVerifier(AlmirobeProperties properties) {
        String clientId = properties.google().clientId();
        if (!StringUtils.hasText(clientId)) {
            this.verifier = null;
            return;
        }
        this.verifier = new GoogleIdTokenVerifier.Builder(new NetHttpTransport(), GsonFactory.getDefaultInstance())
                .setAudience(Collections.singletonList(clientId))
                .build();
    }

    public GoogleIdToken.Payload verify(String idToken) {
        if (verifier == null) {
            throw new ApiException("GOOGLE_NOT_CONFIGURED", "Google sign-in is not configured", HttpStatus.SERVICE_UNAVAILABLE);
        }
        try {
            GoogleIdToken token = verifier.verify(idToken);
            if (token == null) {
                throw new ApiException("INVALID_GOOGLE_TOKEN", "Invalid Google ID token", HttpStatus.UNAUTHORIZED);
            }
            return token.getPayload();
        } catch (ApiException ex) {
            throw ex;
        } catch (Exception ex) {
            throw new ApiException("INVALID_GOOGLE_TOKEN", "Could not verify Google ID token", HttpStatus.UNAUTHORIZED);
        }
    }
}
