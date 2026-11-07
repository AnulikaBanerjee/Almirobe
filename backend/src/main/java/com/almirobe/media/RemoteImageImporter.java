package com.almirobe.media;

import com.almirobe.common.ApiException;
import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.net.InetAddress;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.Locale;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;

/** Fetches a product page or image URL and returns the garment image bytes. */
@Component
public class RemoteImageImporter {

    private static final int MAX_BYTES = 8 * 1024 * 1024;
    private static final Pattern PRODUCT_IMAGE = Pattern.compile(
            "\"imageURL\"\\s*:\\s*\"(https?://[^\"]+)\"",
            Pattern.CASE_INSENSITIVE);
    private static final Pattern OG_IMAGE = Pattern.compile(
            "<meta[^>]+(?:property|name)=[\"'](?:og:image(?::secure_url)?|twitter:image)[\"'][^>]+content=[\"']([^\"']+)[\"']",
            Pattern.CASE_INSENSITIVE);
    private static final Pattern OG_IMAGE_REVERSED = Pattern.compile(
            "<meta[^>]+content=[\"']([^\"']+)[\"'][^>]+(?:property|name)=[\"'](?:og:image(?::secure_url)?|twitter:image)[\"']",
            Pattern.CASE_INSENSITIVE);

    private final HttpClient httpClient = HttpClient.newBuilder()
            .followRedirects(HttpClient.Redirect.NORMAL)
            .connectTimeout(Duration.ofSeconds(8))
            .build();

    public byte[] importImage(String rawUrl) {
        URI uri = parsePublicHttpUrl(rawUrl);
        Fetched fetched = fetch(uri);
        if (isImage(fetched.contentType(), fetched.body())) {
            return fetched.body();
        }
        String html = new String(fetched.body(), java.nio.charset.StandardCharsets.UTF_8);
        String imageUrl = firstImageUrl(html);
        if (imageUrl == null || imageUrl.isBlank()) {
            throw new ApiException("NO_IMAGE", "No product image found at that link", HttpStatus.UNPROCESSABLE_ENTITY);
        }
        URI imageUri = parsePublicHttpUrl(resolve(uri, imageUrl));
        Fetched image = fetch(imageUri);
        if (!isImage(image.contentType(), image.body())) {
            throw new ApiException("NO_IMAGE", "The link did not return an image", HttpStatus.UNPROCESSABLE_ENTITY);
        }
        return image.body();
    }

    private Fetched fetch(URI uri) {
        try {
            HttpRequest request = HttpRequest.newBuilder(uri)
                    .timeout(Duration.ofSeconds(12))
                    .header("User-Agent", "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36")
                    .header("Accept", "text/html,image/avif,image/webp,image/apng,image/*,*/*;q=0.8")
                    .GET()
                    .build();
            HttpResponse<InputStream> response = httpClient.send(request, HttpResponse.BodyHandlers.ofInputStream());
            if (response.statusCode() >= 400) {
                throw new ApiException("FETCH_FAILED", "Could not open that link", HttpStatus.BAD_GATEWAY);
            }
            byte[] body = readLimited(response.body());
            String type = response.headers().firstValue("content-type").orElse("");
            return new Fetched(type, body);
        } catch (ApiException ex) {
            throw ex;
        } catch (Exception ex) {
            throw new ApiException("FETCH_FAILED", "Could not open that link", HttpStatus.BAD_GATEWAY);
        }
    }

    private static byte[] readLimited(InputStream input) throws Exception {
        try (input) {
            ByteArrayOutputStream out = new ByteArrayOutputStream();
            byte[] buf = new byte[8192];
            int n;
            int total = 0;
            while ((n = input.read(buf)) >= 0) {
                total += n;
                if (total > MAX_BYTES) {
                    throw new ApiException("TOO_LARGE", "That image is too large", HttpStatus.PAYLOAD_TOO_LARGE);
                }
                out.write(buf, 0, n);
            }
            return out.toByteArray();
        }
    }

    private static URI parsePublicHttpUrl(String raw) {
        URI uri;
        try {
            uri = URI.create(raw.trim());
        } catch (Exception ex) {
            throw new ApiException("BAD_URL", "That does not look like a valid link", HttpStatus.BAD_REQUEST);
        }
        String scheme = uri.getScheme() == null ? "" : uri.getScheme().toLowerCase(Locale.ROOT);
        if (!scheme.equals("http") && !scheme.equals("https")) {
            throw new ApiException("BAD_URL", "Use an http or https link", HttpStatus.BAD_REQUEST);
        }
        String host = uri.getHost();
        if (host == null || host.isBlank()) {
            throw new ApiException("BAD_URL", "That link has no host", HttpStatus.BAD_REQUEST);
        }
        try {
            for (InetAddress address : InetAddress.getAllByName(host)) {
                if (address.isAnyLocalAddress()
                        || address.isLoopbackAddress()
                        || address.isLinkLocalAddress()
                        || address.isSiteLocalAddress()
                        || address.isMulticastAddress()) {
                    throw new ApiException("BAD_URL", "That link cannot be imported", HttpStatus.BAD_REQUEST);
                }
            }
        } catch (ApiException ex) {
            throw ex;
        } catch (Exception ex) {
            throw new ApiException("BAD_URL", "Could not resolve that link", HttpStatus.BAD_REQUEST);
        }
        return uri;
    }

    private static String resolve(URI page, String imageUrl) {
        if (imageUrl.startsWith("//")) {
            return page.getScheme() + ":" + imageUrl;
        }
        try {
            return page.resolve(imageUrl).toString();
        } catch (Exception ex) {
            return imageUrl;
        }
    }

    private static String firstImageUrl(String html) {
        String decoded = html.replace("\\u002F", "/").replace("\\/", "/");
        Matcher product = PRODUCT_IMAGE.matcher(decoded);
        while (product.find()) {
            String url = unescapeUrl(product.group(1));
            if (isProductPhoto(url)) return url;
        }
        Matcher matcher = OG_IMAGE.matcher(html);
        if (matcher.find()) return unescapeUrl(matcher.group(1));
        matcher = OG_IMAGE_REVERSED.matcher(html);
        if (matcher.find()) return unescapeUrl(matcher.group(1));
        return null;
    }

    private static String unescapeUrl(String raw) {
        String url = raw.replace("\\u002F", "/")
                .replace("\\/", "/")
                .replace("&amp;", "&");
        if (url.startsWith("http://")) {
            url = "https://" + url.substring("http://".length());
        }
        return url;
    }

    private static boolean isProductPhoto(String url) {
        String lower = url.toLowerCase(Locale.ROOT);
        if (lower.contains("($") || lower.contains("banner") || lower.contains("logo") || lower.contains("icon")) {
            return false;
        }
        return lower.contains("/assets/images/")
                && (lower.endsWith(".jpg") || lower.endsWith(".jpeg") || lower.endsWith(".png") || lower.endsWith(".webp"));
    }

    private static boolean isImage(String contentType, byte[] body) {
        String type = contentType.toLowerCase(Locale.ROOT);
        if (type.startsWith("image/")) return true;
        if (body.length >= 3 && body[0] == (byte) 0xFF && body[1] == (byte) 0xD8) return true;
        if (body.length >= 8 && body[0] == (byte) 0x89 && body[1] == 'P') return true;
        if (body.length >= 12 && body[0] == 'R' && body[1] == 'I') return true;
        return false;
    }

    private record Fetched(String contentType, byte[] body) {}
}
