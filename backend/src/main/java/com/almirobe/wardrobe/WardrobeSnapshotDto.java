package com.almirobe.wardrobe;

import com.fasterxml.jackson.databind.JsonNode;

public record WardrobeSnapshotDto(
        String activeCollectionId,
        JsonNode collections,
        JsonNode items,
        JsonNode looks,
        JsonNode loftBoxes,
        JsonNode gifts
) {}

