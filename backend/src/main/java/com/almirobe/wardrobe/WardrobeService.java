package com.almirobe.wardrobe;

import com.almirobe.auth.AuthenticatedUser;
import com.almirobe.common.ApiException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class WardrobeService {

    private final WardrobeSnapshotRepository wardrobeSnapshotRepository;
    private final WardrobeCollectionRepository wardrobeCollectionRepository;
    private final WardrobeItemRepository wardrobeItemRepository;
    private final LookRepository lookRepository;
    private final LoftBoxRepository loftBoxRepository;
    private final DonationRepository donationRepository;
    private final TripPlanRepository tripPlanRepository;
    private final ObjectMapper objectMapper;

    public WardrobeService(
            WardrobeSnapshotRepository wardrobeSnapshotRepository,
            WardrobeCollectionRepository wardrobeCollectionRepository,
            WardrobeItemRepository wardrobeItemRepository,
            LookRepository lookRepository,
            LoftBoxRepository loftBoxRepository,
            DonationRepository donationRepository,
            TripPlanRepository tripPlanRepository,
            ObjectMapper objectMapper
    ) {
        this.wardrobeSnapshotRepository = wardrobeSnapshotRepository;
        this.wardrobeCollectionRepository = wardrobeCollectionRepository;
        this.wardrobeItemRepository = wardrobeItemRepository;
        this.lookRepository = lookRepository;
        this.loftBoxRepository = loftBoxRepository;
        this.donationRepository = donationRepository;
        this.tripPlanRepository = tripPlanRepository;
        this.objectMapper = objectMapper;
    }

    @Transactional(readOnly = true)
    public WardrobeSnapshotDto getSnapshot(AuthenticatedUser user) {
        return toDto(buildSnapshotNode(user));
    }

    @Transactional
    public WardrobeSnapshotDto upsertSnapshot(AuthenticatedUser user, WardrobeSnapshotDto snapshot) {
        UUID profileId = user.profileId();
        WardrobeSnapshotEntity entity = wardrobeSnapshotRepository.findByUserIdAndProfileId(user.userId(), profileId)
                .orElseGet(WardrobeSnapshotEntity::new);

        entity.setUserId(user.userId());
        entity.setProfileId(profileId);
        try {
            entity.setPayload(objectMapper.writeValueAsString(snapshot));
        } catch (Exception e) {
            throw new ApiException("INVALID_WARDROBE_PAYLOAD", "Could not serialize wardrobe snapshot", HttpStatus.BAD_REQUEST);
        }
        wardrobeSnapshotRepository.save(entity);

        replaceCollectionsFromSnapshot(user, snapshot.collections());
        replaceItemsFromSnapshot(user, snapshot.items());
        replaceLooksFromSnapshot(user, snapshot.looks());
        replaceLoftBoxesFromSnapshot(user, snapshot.loftBoxes());
        replaceDonationQueueFromSnapshot(user, snapshot.gifts());
        return snapshot;
    }

    @Transactional(readOnly = true)
    public JsonNode listItems(AuthenticatedUser user) {
        ArrayNode items = objectMapper.createArrayNode();
        for (WardrobeItemEntity entity : wardrobeItemRepository.findByUserIdAndProfileIdOrderByCreatedAtAsc(user.userId(), user.profileId())) {
            items.add(toItemJsonNode(entity));
        }
        return items;
    }

    @Transactional(readOnly = true)
    public JsonNode getItem(AuthenticatedUser user, String itemId) {
        return wardrobeItemRepository.findByUserIdAndProfileIdAndId(user.userId(), user.profileId(), UUID.fromString(itemId))
                .map(this::toItemJsonNode)
                .orElseGet(objectMapper::createObjectNode);
    }

    @Transactional
    public JsonNode upsertItem(AuthenticatedUser user, JsonNode itemPayload) {
        WardrobeItemEntity entity = fromItemNode(itemPayload, user);
        wardrobeItemRepository.save(entity);
        return toItemJsonNode(entity);
    }

    @Transactional(readOnly = true)
    public JsonNode listLooks(AuthenticatedUser user) {
        ArrayNode looks = objectMapper.createArrayNode();
        for (LookEntity entity : lookRepository.findByUserIdAndProfileIdOrderByCreatedAtAsc(user.userId(), user.profileId())) {
            looks.add(toLookJsonNode(entity));
        }
        return looks;
    }

    @Transactional
    public JsonNode saveLook(AuthenticatedUser user, JsonNode lookPayload) {
        LookEntity entity = fromLookNode(lookPayload, user);
        lookRepository.save(entity);
        return toLookJsonNode(entity);
    }

    @Transactional(readOnly = true)
    public JsonNode listLoftBoxes(AuthenticatedUser user) {
        ArrayNode loftBoxes = objectMapper.createArrayNode();
        for (LoftBoxEntity entity : loftBoxRepository.findByUserIdAndProfileIdOrderByCreatedAtAsc(user.userId(), user.profileId())) {
            loftBoxes.add(toLoftBoxJsonNode(entity));
        }
        return loftBoxes;
    }

    @Transactional
    public JsonNode saveLoftBox(AuthenticatedUser user, JsonNode loftBoxPayload) {
        LoftBoxEntity entity = fromLoftBoxNode(loftBoxPayload, user);
        loftBoxRepository.save(entity);
        return toLoftBoxJsonNode(entity);
    }

    @Transactional(readOnly = true)
    public JsonNode listDonationQueue(AuthenticatedUser user) {
        ArrayNode queue = objectMapper.createArrayNode();
        for (DonationEntity entity : donationRepository.findByUserIdAndProfileIdOrderByCreatedAtAsc(user.userId(), user.profileId())) {
            queue.add(toDonationJsonNode(entity));
        }
        return queue;
    }

    @Transactional
    public JsonNode createDonation(AuthenticatedUser user, JsonNode payload) {
        DonationEntity entity = fromDonationNode(payload, user);
        donationRepository.save(entity);
        return toDonationJsonNode(entity);
    }

    @Transactional(readOnly = true)
    public JsonNode listTripPlans(AuthenticatedUser user) {
        ArrayNode plans = objectMapper.createArrayNode();
        for (TripPlanEntity entity : tripPlanRepository.findByUserIdAndProfileIdOrderByCreatedAtAsc(user.userId(), user.profileId())) {
            plans.add(toTripPlanJsonNode(entity));
        }
        return plans;
    }

    @Transactional
    public JsonNode planTrip(AuthenticatedUser user, JsonNode payload) {
        TripPlanEntity entity = fromTripPlanNode(payload, user);
        tripPlanRepository.save(entity);
        return toTripPlanJsonNode(entity);
    }

    private JsonNode buildSnapshotNode(AuthenticatedUser user) {
        ObjectNode root = objectMapper.createObjectNode();
        root.put("activeCollectionId", user.profileId().toString());
        root.set("collections", listCollections(user));
        root.set("items", listItems(user));
        root.set("looks", listLooks(user));
        root.set("loftBoxes", listLoftBoxes(user));
        root.set("gifts", listDonationQueue(user));
        return root;
    }

    private ArrayNode listCollections(AuthenticatedUser user) {
        ArrayNode collections = objectMapper.createArrayNode();
        for (WardrobeCollectionEntity entity : wardrobeCollectionRepository.findByUserIdAndProfileIdOrderByCreatedAtAsc(user.userId(), user.profileId())) {
            collections.add(toCollectionJsonNode(entity));
        }
        return collections;
    }

    private void replaceCollectionsFromSnapshot(AuthenticatedUser user, JsonNode collections) {
        List<WardrobeCollectionEntity> persisted = wardrobeCollectionRepository.findByUserIdAndProfileIdOrderByCreatedAtAsc(user.userId(), user.profileId());
        wardrobeCollectionRepository.deleteAll(persisted);
        if (collections == null || !collections.isArray()) {
            return;
        }
        List<WardrobeCollectionEntity> toSave = new ArrayList<>();
        for (JsonNode collection : collections) {
            toSave.add(fromCollectionNode(collection, user));
        }
        wardrobeCollectionRepository.saveAll(toSave);
    }

    private void replaceItemsFromSnapshot(AuthenticatedUser user, JsonNode items) {
        List<WardrobeItemEntity> persisted = wardrobeItemRepository.findByUserIdAndProfileIdOrderByCreatedAtAsc(user.userId(), user.profileId());
        wardrobeItemRepository.deleteAll(persisted);
        if (items == null || !items.isArray()) {
            return;
        }
        List<WardrobeItemEntity> toSave = new ArrayList<>();
        for (JsonNode item : items) {
            toSave.add(fromItemNode(item, user));
        }
        wardrobeItemRepository.saveAll(toSave);
    }

    private void replaceLooksFromSnapshot(AuthenticatedUser user, JsonNode looks) {
        List<LookEntity> persisted = lookRepository.findByUserIdAndProfileIdOrderByCreatedAtAsc(user.userId(), user.profileId());
        lookRepository.deleteAll(persisted);
        if (looks == null || !looks.isArray()) {
            return;
        }
        List<LookEntity> toSave = new ArrayList<>();
        for (JsonNode look : looks) {
            toSave.add(fromLookNode(look, user));
        }
        lookRepository.saveAll(toSave);
    }

    private void replaceLoftBoxesFromSnapshot(AuthenticatedUser user, JsonNode loftBoxes) {
        List<LoftBoxEntity> persisted = loftBoxRepository.findByUserIdAndProfileIdOrderByCreatedAtAsc(user.userId(), user.profileId());
        loftBoxRepository.deleteAll(persisted);
        if (loftBoxes == null || !loftBoxes.isArray()) {
            return;
        }
        List<LoftBoxEntity> toSave = new ArrayList<>();
        for (JsonNode loftBox : loftBoxes) {
            toSave.add(fromLoftBoxNode(loftBox, user));
        }
        loftBoxRepository.saveAll(toSave);
    }

    private void replaceDonationQueueFromSnapshot(AuthenticatedUser user, JsonNode gifts) {
        List<DonationEntity> persisted = donationRepository.findByUserIdAndProfileIdOrderByCreatedAtAsc(user.userId(), user.profileId());
        donationRepository.deleteAll(persisted);
        if (gifts == null || !gifts.isArray()) {
            return;
        }
        List<DonationEntity> toSave = new ArrayList<>();
        for (JsonNode gift : gifts) {
            toSave.add(fromDonationNode(gift, user));
        }
        donationRepository.saveAll(toSave);
    }

    private WardrobeCollectionEntity fromCollectionNode(JsonNode node, AuthenticatedUser user) {
        UUID id = safeUuid(node.path("id"), UUID.randomUUID());
        WardrobeCollectionEntity entity = wardrobeCollectionRepository.findById(id).orElse(new WardrobeCollectionEntity());
        entity.setId(id);
        entity.setUserId(user.userId());
        entity.setProfileId(user.profileId());
        entity.setName(node.path("name").asText("Untitled collection"));
        entity.setIcon(node.path("icon").asText("wardrobe"));
        try {
            entity.setCategoriesJson(objectMapper.writeValueAsString(node.path("categories")));
        } catch (Exception e) {
            entity.setCategoriesJson("[]");
        }
        entity.setDisplayMode(node.path("displayMode").asText("category"));
        entity.setShelfCount(node.path("shelfCount").isNumber() ? node.path("shelfCount").asInt() : null);
        entity.setEnableSeasonFilter(node.path("enableSeasonFilter").asBoolean(false));
        return entity;
    }

    private JsonNode toCollectionJsonNode(WardrobeCollectionEntity entity) {
        ObjectNode node = objectMapper.createObjectNode();
        node.put("id", entity.getId().toString());
        node.put("name", entity.getName());
        node.put("icon", entity.getIcon());
        try {
            node.set("categories", objectMapper.readTree(entity.getCategoriesJson()));
        } catch (Exception e) {
            node.set("categories", objectMapper.createArrayNode());
        }
        node.put("displayMode", entity.getDisplayMode() == null ? "category" : entity.getDisplayMode());
        if (entity.getShelfCount() != null) {
            node.put("shelfCount", entity.getShelfCount());
        }
        node.put("enableSeasonFilter", Boolean.TRUE.equals(entity.getEnableSeasonFilter()));
        return node;
    }

    private WardrobeItemEntity fromItemNode(JsonNode node, AuthenticatedUser user) {
        UUID id = safeUuid(node.path("id"), UUID.randomUUID());
        WardrobeItemEntity entity = wardrobeItemRepository.findById(id).orElse(new WardrobeItemEntity());
        entity.setId(id);
        entity.setUserId(user.userId());
        entity.setProfileId(user.profileId());
        entity.setCollectionId(node.path("collectionId").asText(""));
        entity.setName(node.path("name").asText("Untitled item"));
        entity.setCategoryId(node.path("categoryId").asText(null));
        entity.setColor(node.path("color").asText(null));
        entity.setColorHex(node.path("colorHex").asText(null));
        entity.setBrand(node.path("brand").asText(null));
        entity.setSize(node.path("size").asText(null));
        entity.setSeason(node.path("season").asText(null));
        entity.setNotes(node.path("notes").asText(null));
        entity.setImageUrl(node.path("imageUrl").asText(null));
        entity.setOriginalImageUrl(node.path("originalImageUrl").asText(null));
        entity.setImageJobId(node.path("imageJobId").asText(null));
        entity.setProductType(node.path("productType").asText(null));
        entity.setSubtype(node.path("subtype").asText(null));
        entity.setPattern(node.path("pattern").asText(null));
        entity.setOccasion(node.path("occasion").asText(null));
        entity.setWeather(node.path("weather").asText(null));
        entity.setShelfIndex(node.path("shelfIndex").isNumber() ? node.path("shelfIndex").asInt() : null);
        entity.setFavorite(node.path("favorite").asBoolean(false));
        entity.setInLaundry(node.path("inLaundry").asBoolean(false));
        entity.setMarkedForDonation(node.path("markedForDonation").asBoolean(false));
        entity.setDonationMarkedAt(node.path("donationMarkedAt").isNumber() ? node.path("donationMarkedAt").asLong() : null);
        entity.setLoftBoxId(node.path("loftBoxId").isNull() ? null : node.path("loftBoxId").asText(null));
        entity.setLentStatus(node.path("lentStatus").isNull() ? null : node.path("lentStatus").asText(null));
        entity.setLentParty(node.path("lentParty").asText(null));
        entity.setLentDate(node.path("lentDate").isNumber() ? node.path("lentDate").asLong() : null);
        entity.setLentNotes(node.path("lentNotes").asText(null));
        entity.setIsGift(node.path("isGift").asBoolean(false));
        entity.setGiftFrom(node.path("giftFrom").asText(null));
        entity.setGiftOccasion(node.path("giftOccasion").asText(null));
        entity.setPurchasePrice(node.path("purchasePrice").isNumber() ? node.path("purchasePrice").asDouble() : null);
        entity.setPurchaseDate(node.path("purchaseDate").isNumber() ? node.path("purchaseDate").asLong() : null);
        entity.setLastWornAt(node.path("lastWornAt").isNumber() ? node.path("lastWornAt").asLong() : null);
        entity.setWearCount(node.path("wearCount").isNumber() ? node.path("wearCount").asInt() : null);
        if (node.path("createdAt").isNumber()) {
            entity.setCreatedAt(Instant.ofEpochMilli(node.path("createdAt").asLong()));
        }
        return entity;
    }

    private JsonNode toItemJsonNode(WardrobeItemEntity entity) {
        ObjectNode node = objectMapper.createObjectNode();
        node.put("id", entity.getId().toString());
        node.put("collectionId", entity.getCollectionId());
        node.put("name", entity.getName());
        if (entity.getCategoryId() != null) node.put("categoryId", entity.getCategoryId());
        if (entity.getColor() != null) node.put("color", entity.getColor());
        if (entity.getColorHex() != null) node.put("colorHex", entity.getColorHex());
        if (entity.getBrand() != null) node.put("brand", entity.getBrand());
        if (entity.getSize() != null) node.put("size", entity.getSize());
        if (entity.getSeason() != null) node.put("season", entity.getSeason());
        if (entity.getNotes() != null) node.put("notes", entity.getNotes());
        if (entity.getImageUrl() != null) node.put("imageUrl", entity.getImageUrl());
        if (entity.getOriginalImageUrl() != null) node.put("originalImageUrl", entity.getOriginalImageUrl());
        if (entity.getImageJobId() != null) node.put("imageJobId", entity.getImageJobId());
        if (entity.getProductType() != null) node.put("productType", entity.getProductType());
        if (entity.getSubtype() != null) node.put("subtype", entity.getSubtype());
        if (entity.getPattern() != null) node.put("pattern", entity.getPattern());
        if (entity.getOccasion() != null) node.put("occasion", entity.getOccasion());
        if (entity.getWeather() != null) node.put("weather", entity.getWeather());
        if (entity.getShelfIndex() != null) node.put("shelfIndex", entity.getShelfIndex());
        node.put("favorite", Boolean.TRUE.equals(entity.getFavorite()));
        node.put("inLaundry", Boolean.TRUE.equals(entity.getInLaundry()));
        node.put("markedForDonation", Boolean.TRUE.equals(entity.getMarkedForDonation()));
        if (entity.getDonationMarkedAt() != null) node.put("donationMarkedAt", entity.getDonationMarkedAt());
        if (entity.getLoftBoxId() != null) node.put("loftBoxId", entity.getLoftBoxId());
        if (entity.getLentStatus() != null) node.put("lentStatus", entity.getLentStatus());
        if (entity.getLentParty() != null) node.put("lentParty", entity.getLentParty());
        if (entity.getLentDate() != null) node.put("lentDate", entity.getLentDate());
        if (entity.getLentNotes() != null) node.put("lentNotes", entity.getLentNotes());
        node.put("isGift", Boolean.TRUE.equals(entity.getIsGift()));
        if (entity.getGiftFrom() != null) node.put("giftFrom", entity.getGiftFrom());
        if (entity.getGiftOccasion() != null) node.put("giftOccasion", entity.getGiftOccasion());
        if (entity.getPurchasePrice() != null) node.put("purchasePrice", entity.getPurchasePrice());
        if (entity.getPurchaseDate() != null) node.put("purchaseDate", entity.getPurchaseDate());
        if (entity.getLastWornAt() != null) node.put("lastWornAt", entity.getLastWornAt());
        if (entity.getWearCount() != null) node.put("wearCount", entity.getWearCount());
        if (entity.getCreatedAt() != null) node.put("createdAt", entity.getCreatedAt().toEpochMilli());
        return node;
    }

    private LookEntity fromLookNode(JsonNode node, AuthenticatedUser user) {
        UUID id = safeUuid(node.path("id"), UUID.randomUUID());
        LookEntity entity = lookRepository.findById(id).orElse(new LookEntity());
        entity.setId(id);
        entity.setUserId(user.userId());
        entity.setProfileId(user.profileId());
        entity.setName(node.path("name").asText("Untitled look"));
        entity.setPrimaryItemId(node.path("primaryItemId").asText(""));
        try {
            entity.setItemIdsJson(objectMapper.writeValueAsString(node.path("itemIds")));
        } catch (Exception e) {
            entity.setItemIdsJson("[]");
        }
        entity.setNotes(node.path("notes").asText(null));
        try {
            entity.setLayoutJson(node.path("layout").isMissingNode() ? null : objectMapper.writeValueAsString(node.path("layout")));
        } catch (Exception e) {
            entity.setLayoutJson(null);
        }
        if (node.path("createdAt").isNumber()) {
            entity.setCreatedAt(Instant.ofEpochMilli(node.path("createdAt").asLong()));
        }
        return entity;
    }

    private JsonNode toLookJsonNode(LookEntity entity) {
        ObjectNode node = objectMapper.createObjectNode();
        node.put("id", entity.getId().toString());
        node.put("name", entity.getName());
        node.put("primaryItemId", entity.getPrimaryItemId());
        try {
            node.set("itemIds", objectMapper.readTree(entity.getItemIdsJson()));
        } catch (Exception e) {
            node.set("itemIds", objectMapper.createArrayNode());
        }
        if (entity.getNotes() != null) node.put("notes", entity.getNotes());
        if (entity.getLayoutJson() != null) {
            try {
                node.set("layout", objectMapper.readTree(entity.getLayoutJson()));
            } catch (Exception e) {
                node.set("layout", objectMapper.createArrayNode());
            }
        }
        if (entity.getCreatedAt() != null) node.put("createdAt", entity.getCreatedAt().toEpochMilli());
        return node;
    }

    private LoftBoxEntity fromLoftBoxNode(JsonNode node, AuthenticatedUser user) {
        UUID id = safeUuid(node.path("id"), UUID.randomUUID());
        LoftBoxEntity entity = loftBoxRepository.findById(id).orElse(new LoftBoxEntity());
        entity.setId(id);
        entity.setUserId(user.userId());
        entity.setProfileId(user.profileId());
        entity.setName(node.path("name").asText("Loft box"));
        entity.setImageUrl(node.path("imageUrl").asText(null));
        entity.setNotes(node.path("notes").asText(null));
        if (node.path("createdAt").isNumber()) {
            entity.setCreatedAt(Instant.ofEpochMilli(node.path("createdAt").asLong()));
        }
        return entity;
    }

    private JsonNode toLoftBoxJsonNode(LoftBoxEntity entity) {
        ObjectNode node = objectMapper.createObjectNode();
        node.put("id", entity.getId().toString());
        node.put("name", entity.getName());
        if (entity.getImageUrl() != null) node.put("imageUrl", entity.getImageUrl());
        if (entity.getNotes() != null) node.put("notes", entity.getNotes());
        if (entity.getCreatedAt() != null) node.put("createdAt", entity.getCreatedAt().toEpochMilli());
        return node;
    }

    private DonationEntity fromDonationNode(JsonNode node, AuthenticatedUser user) {
        UUID id = safeUuid(node.path("id"), UUID.randomUUID());
        DonationEntity entity = donationRepository.findById(id).orElse(new DonationEntity());
        entity.setId(id);
        entity.setUserId(user.userId());
        entity.setProfileId(user.profileId());
        entity.setItemId(node.path("itemId").asText(node.path("id").asText("")));
        entity.setName(node.path("name").asText("Donation"));
        entity.setDirection(node.path("direction").asText(null));
        entity.setPersonName(node.path("personName").asText(null));
        entity.setOccasion(node.path("occasion").asText(null));
        entity.setNotes(node.path("notes").asText(null));
        entity.setImageUrl(node.path("imageUrl").asText(null));
        entity.setDonationDate(node.path("date").isNumber() ? node.path("date").asLong() : node.path("donationDate").isNumber() ? node.path("donationDate").asLong() : null);
        if (node.path("createdAt").isNumber()) {
            entity.setCreatedAt(Instant.ofEpochMilli(node.path("createdAt").asLong()));
        }
        return entity;
    }

    private JsonNode toDonationJsonNode(DonationEntity entity) {
        ObjectNode node = objectMapper.createObjectNode();
        node.put("id", entity.getId().toString());
        node.put("itemId", entity.getItemId());
        node.put("name", entity.getName());
        if (entity.getDirection() != null) node.put("direction", entity.getDirection());
        if (entity.getPersonName() != null) node.put("personName", entity.getPersonName());
        if (entity.getOccasion() != null) node.put("occasion", entity.getOccasion());
        if (entity.getNotes() != null) node.put("notes", entity.getNotes());
        if (entity.getImageUrl() != null) node.put("imageUrl", entity.getImageUrl());
        if (entity.getDonationDate() != null) node.put("date", entity.getDonationDate());
        if (entity.getCreatedAt() != null) node.put("createdAt", entity.getCreatedAt().toEpochMilli());
        return node;
    }

    private TripPlanEntity fromTripPlanNode(JsonNode node, AuthenticatedUser user) {
        UUID id = safeUuid(node.path("id"), UUID.randomUUID());
        TripPlanEntity entity = tripPlanRepository.findById(id).orElse(new TripPlanEntity());
        entity.setId(id);
        entity.setUserId(user.userId());
        entity.setProfileId(user.profileId());
        entity.setTripName(node.path("tripName").asText(node.path("name").asText("Trip plan")));
        entity.setDestination(node.path("destination").asText(null));
        entity.setStartDate(node.path("startDate").isNumber() ? node.path("startDate").asLong() : null);
        entity.setEndDate(node.path("endDate").isNumber() ? node.path("endDate").asLong() : null);
        try {
            entity.setItineraryJson(objectMapper.writeValueAsString(node.path("itinerary")));
        } catch (Exception e) {
            entity.setItineraryJson("[]");
        }
        entity.setNotes(node.path("notes").asText(null));
        if (node.path("createdAt").isNumber()) {
            entity.setCreatedAt(Instant.ofEpochMilli(node.path("createdAt").asLong()));
        }
        return entity;
    }

    private JsonNode toTripPlanJsonNode(TripPlanEntity entity) {
        ObjectNode node = objectMapper.createObjectNode();
        node.put("id", entity.getId().toString());
        node.put("tripName", entity.getTripName());
        if (entity.getDestination() != null) node.put("destination", entity.getDestination());
        if (entity.getStartDate() != null) node.put("startDate", entity.getStartDate());
        if (entity.getEndDate() != null) node.put("endDate", entity.getEndDate());
        try {
            node.set("itinerary", objectMapper.readTree(entity.getItineraryJson()));
        } catch (Exception e) {
            node.set("itinerary", objectMapper.createArrayNode());
        }
        if (entity.getNotes() != null) node.put("notes", entity.getNotes());
        if (entity.getCreatedAt() != null) node.put("createdAt", entity.getCreatedAt().toEpochMilli());
        return node;
    }

    private UUID safeUuid(JsonNode node, UUID fallback) {
        if (node == null || node.isNull() || node.asText(null) == null || node.asText().isBlank()) {
            return fallback;
        }
        try {
            return UUID.fromString(node.asText());
        } catch (IllegalArgumentException e) {
            return fallback;
        }
    }

    private WardrobeSnapshotDto toDto(JsonNode root) {
        return new WardrobeSnapshotDto(
                root.path("activeCollectionId").asText(),
                root.path("collections"),
                root.path("items"),
                root.path("looks"),
                root.path("loftBoxes"),
                root.path("gifts")
        );
    }
}

