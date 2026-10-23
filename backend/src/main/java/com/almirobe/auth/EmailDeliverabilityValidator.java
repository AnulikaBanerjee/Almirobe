package com.almirobe.auth;

import com.almirobe.common.ApiException;
import java.util.Locale;
import java.util.Set;
import javax.naming.NamingException;
import javax.naming.directory.Attribute;
import javax.naming.directory.Attributes;
import javax.naming.directory.InitialDirContext;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;

/**
 * Validates that a registration email looks real and that its domain can receive mail (MX / A).
 * Does not prove the mailbox itself exists — that requires a verification email.
 */
@Component
public class EmailDeliverabilityValidator {

    private static final Set<String> DISPOSABLE = Set.of(
            "mailinator.com",
            "guerrillamail.com",
            "guerrillamail.net",
            "10minutemail.com",
            "tempmail.com",
            "temp-mail.org",
            "yopmail.com",
            "trashmail.com",
            "sharklasers.com",
            "getnada.com",
            "discard.email",
            "mailnesia.com"
    );

    public void validateForRegistration(String email) {
        String normalized = email == null ? "" : email.trim().toLowerCase(Locale.ROOT);
        int at = normalized.lastIndexOf('@');
        if (at < 1 || at == normalized.length() - 1) {
            throw new ApiException("INVALID_EMAIL", "Enter a valid email address", HttpStatus.BAD_REQUEST);
        }
        String domain = normalized.substring(at + 1);
        if (DISPOSABLE.contains(domain)) {
            throw new ApiException(
                    "DISPOSABLE_EMAIL",
                    "Please use a permanent email address (not a temporary inbox)",
                    HttpStatus.BAD_REQUEST);
        }
        if (!domainLooksResolvable(domain)) {
            throw new ApiException(
                    "EMAIL_DOMAIN_UNREACHABLE",
                    "That email domain does not appear to accept mail. Check for typos.",
                    HttpStatus.BAD_REQUEST);
        }
    }

    private boolean domainLooksResolvable(String domain) {
        try {
            InitialDirContext ctx = new InitialDirContext();
            Attributes mx = ctx.getAttributes("dns:/" + domain, new String[] {"MX"});
            Attribute mxAttr = mx.get("MX");
            if (mxAttr != null && mxAttr.size() > 0) {
                return true;
            }
            Attributes a = ctx.getAttributes("dns:/" + domain, new String[] {"A"});
            Attribute aAttr = a.get("A");
            return aAttr != null && aAttr.size() > 0;
        } catch (NamingException ex) {
            return false;
        }
    }
}
