package com.almirobe.wardrobe;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
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
class WardrobeIntegrationTest {

    @Autowired
    MockMvc mockMvc;

    @Autowired
    ObjectMapper objectMapper;

    @Test
    void wardrobeSnapshotAndResourceEndpointsPersistAndReturnData() throws Exception {
        String email = "wardrobe-" + UUID.randomUUID() + "@almirobe.local";
        String accessToken = registerUser(email);
        String collectionId = UUID.randomUUID().toString();
        String itemId = UUID.randomUUID().toString();
        String lookId = UUID.randomUUID().toString();
        String loftBoxId = UUID.randomUUID().toString();
        String donationId = UUID.randomUUID().toString();
        String tripPlanId = UUID.randomUUID().toString();

        String payload = """
                {
                  "activeCollectionId": "%s",
                  "collections": [{
                    "id": "%s",
                    "name": "Summer Capsule",
                    "icon": "sun",
                    "categories": ["tops", "bottoms"],
                    "displayMode": "category",
                    "shelfCount": 3,
                    "enableSeasonFilter": true
                  }],
                  "items": [{
                    "id": "%s",
                    "collectionId": "%s",
                    "name": "Linen Shirt",
                    "categoryId": "tops",
                    "color": "Cream",
                    "colorHex": "#F5F1E6",
                    "brand": "Almirobe",
                    "size": "M",
                    "season": "summer",
                    "favorite": true,
                    "markedForDonation": false,
                    "isGift": false,
                    "purchasePrice": 49.99,
                    "createdAt": 1710000000000
                  }],
                  "looks": [{
                    "id": "%s",
                    "name": "City Weekend",
                    "primaryItemId": "%s",
                    "itemIds": ["%s"],
                    "notes": "Light and airy"
                  }],
                  "loftBoxes": [{
                    "id": "%s",
                    "name": "Winter Transitional",
                    "notes": "Keep for cold evenings"
                  }],
                  "gifts": [{
                    "id": "%s",
                    "itemId": "%s",
                    "name": "Gifted Shirt",
                    "direction": "inbound",
                    "personName": "Ava",
                    "occasion": "Birthday",
                    "date": 1710000000000
                  }]
                }
                """.formatted(
                collectionId,
                collectionId,
                itemId,
                collectionId,
                lookId,
                itemId,
                itemId,
                loftBoxId,
                donationId,
                itemId
        );

        mockMvc.perform(post("/api/v1/wardrobe")
                        .header("Authorization", "Bearer " + accessToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.activeCollectionId").value(collectionId))
                .andExpect(jsonPath("$.collections[0].name").value("Summer Capsule"))
                .andExpect(jsonPath("$.items[0].name").value("Linen Shirt"));

        mockMvc.perform(get("/api/v1/wardrobe")
                        .header("Authorization", "Bearer " + accessToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.collections[0].id").value(collectionId))
                .andExpect(jsonPath("$.items[0].id").value(itemId));

        mockMvc.perform(get("/api/v1/items")
                        .header("Authorization", "Bearer " + accessToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].name").value("Linen Shirt"));

        mockMvc.perform(get("/api/v1/looks")
                        .header("Authorization", "Bearer " + accessToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].name").value("City Weekend"));

        mockMvc.perform(get("/api/v1/lofts")
                        .header("Authorization", "Bearer " + accessToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].name").value("Winter Transitional"));

        mockMvc.perform(get("/api/v1/donations")
                        .header("Authorization", "Bearer " + accessToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].itemId").value(itemId));

        mockMvc.perform(get("/api/v1/trip-plans")
                        .header("Authorization", "Bearer " + accessToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray());
    }

    @Test
    void itemLookLoftDonationAndTripPlanEndpointsCreatePersistedResources() throws Exception {
        String email = "wardrobe-trip-" + UUID.randomUUID() + "@almirobe.local";
        String accessToken = registerUser(email);

        String itemId = UUID.randomUUID().toString();
        String lookId = UUID.randomUUID().toString();
        String loftBoxId = UUID.randomUUID().toString();
        String donationId = UUID.randomUUID().toString();
        String tripPlanId = UUID.randomUUID().toString();

        mockMvc.perform(post("/api/v1/items")
                        .header("Authorization", "Bearer " + accessToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "id": "%s",
                                  "collectionId": "collection-1",
                                  "name": "Travel Blazer",
                                  "categoryId": "outerwear",
                                  "color": "Navy",
                                  "size": "L",
                                  "favorite": true,
                                  "markedForDonation": false
                                }
                                """.formatted(itemId)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Travel Blazer"));

        mockMvc.perform(post("/api/v1/looks")
                        .header("Authorization", "Bearer " + accessToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "id": "%s",
                                  "name": "Boardroom Ready",
                                  "primaryItemId": "%s",
                                  "itemIds": ["%s"],
                                  "notes": "Sharp and polished"
                                }
                                """.formatted(lookId, itemId, itemId)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Boardroom Ready"));

        mockMvc.perform(post("/api/v1/lofts")
                        .header("Authorization", "Bearer " + accessToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "id": "%s",
                                  "name": "Spring Storage",
                                  "notes": "Rotate seasonally"
                                }
                                """.formatted(loftBoxId)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Spring Storage"));

        mockMvc.perform(post("/api/v1/donations")
                        .header("Authorization", "Bearer " + accessToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "id": "%s",
                                  "itemId": "%s",
                                  "name": "Donation pickup",
                                  "direction": "outbound",
                                  "personName": "Renee",
                                  "occasion": "Clearance",
                                  "date": 1710000000000
                                }
                                """.formatted(donationId, itemId)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.itemId").value(itemId));

        mockMvc.perform(post("/api/v1/trip-plans")
                        .header("Authorization", "Bearer " + accessToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "id": "%s",
                                  "tripName": "Lisbon Weekend",
                                  "destination": "Lisbon",
                                  "startDate": 1710000000000,
                                  "endDate": 1711000000000,
                                  "itinerary": [{"day": 1, "plan": "Pack light layers"}]
                                }
                                """.formatted(tripPlanId)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.tripName").value("Lisbon Weekend"));

        mockMvc.perform(get("/api/v1/items")
                        .header("Authorization", "Bearer " + accessToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].name").value("Travel Blazer"));

        mockMvc.perform(get("/api/v1/trip-plans")
                        .header("Authorization", "Bearer " + accessToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].tripName").value("Lisbon Weekend"));
    }

    private String registerUser(String email) throws Exception {
        MvcResult result = mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "email": "%s",
                                  "password": "secret12",
                                  "name": "Wardrobe User"
                                }
                                """.formatted(email)))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode response = objectMapper.readTree(result.getResponse().getContentAsString());
        return response.get("accessToken").asText();
    }
}

