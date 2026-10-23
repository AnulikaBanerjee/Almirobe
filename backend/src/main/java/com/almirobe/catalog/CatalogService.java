package com.almirobe.catalog;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.io.IOException;
import java.io.InputStream;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;

@Service
public class CatalogService {

    private final JsonNode catalog;

    public CatalogService(ObjectMapper objectMapper) throws IOException {
        try (InputStream input = new ClassPathResource("catalog/tags.json").getInputStream()) {
            this.catalog = objectMapper.readTree(input);
        }
    }

    public JsonNode tags() {
        return catalog;
    }
}
