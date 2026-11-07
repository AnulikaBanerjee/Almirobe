package com.almirobe.imagejob;

import static org.hamcrest.Matchers.is;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.Base64;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class ImageJobIntegrationTest {

    private static final byte[] TINY_PNG = Base64.getDecoder().decode(
            "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==");

    @Autowired
    MockMvc mockMvc;

    @Autowired
    ObjectMapper objectMapper;

    @Test
    void catalogUploadAndImageJobStayNonBlocking() throws Exception {
        String email = "week2-" + UUID.randomUUID() + "@almirobe.local";
        MvcResult register = mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "email": "%s",
                                  "password": "secret12",
                                  "name": "Week Two"
                                }
                                """.formatted(email)))
                .andExpect(status().isOk())
                .andReturn();
        String accessToken = read(register, "accessToken");

        mockMvc.perform(get("/api/v1/catalog/tags").header("Authorization", "Bearer " + accessToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.types[0].value").isNotEmpty())
                .andExpect(jsonPath("$.autoSelectMinConfidence").value(0.55));

        MvcResult upload = mockMvc.perform(post("/api/v1/media/upload-url")
                        .header("Authorization", "Bearer " + accessToken)
                        .header("Idempotency-Key", "upload-1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                { "contentType": "image/png", "fileName": "shirt.png" }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.objectKey").isNotEmpty())
                .andExpect(jsonPath("$.method").value("PUT"))
                .andReturn();
        String objectKey = read(upload, "objectKey");

        mockMvc.perform(put("/api/v1/media/objects")
                        .param("key", objectKey)
                        .header("Authorization", "Bearer " + accessToken)
                        .contentType(MediaType.IMAGE_PNG)
                        .content(TINY_PNG))
                .andExpect(status().isNoContent());

        mockMvc.perform(post("/api/v1/image-jobs")
                        .header("Authorization", "Bearer " + accessToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                { "objectKey": "%s" }
                                """.formatted(objectKey)))
                .andExpect(status().isAccepted())
                .andExpect(jsonPath("$.tagsStatus", is("queued")))
                .andExpect(jsonPath("$.cutoutStatus", is("queued")))
                .andExpect(jsonPath("$.id").isNotEmpty());
    }

    @Test
    void speechFallbackIsNotImplemented() throws Exception {
        String email = "speech-" + UUID.randomUUID() + "@almirobe.local";
        MvcResult register = mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "email": "%s",
                                  "password": "secret12"
                                }
                                """.formatted(email)))
                .andExpect(status().isOk())
                .andReturn();
        String accessToken = read(register, "accessToken");

        mockMvc.perform(multipart("/api/v1/speech/transcribe")
                        .file("audio", TINY_PNG)
                        .param("locale", "en-IN")
                        .header("Authorization", "Bearer " + accessToken))
                .andExpect(status().isNotImplemented());
    }

    private String read(MvcResult result, String field) throws Exception {
        JsonNode node = objectMapper.readTree(result.getResponse().getContentAsString());
        return node.get(field).asText();
    }
}
