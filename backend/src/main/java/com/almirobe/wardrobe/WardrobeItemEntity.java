package com.almirobe.wardrobe;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(
        name = "wardrobe_items",
        indexes = {@Index(name = "idx_wardrobe_items_profile", columnList = "user_id, profile_id")}
)
public class WardrobeItemEntity {

    @Id
    private UUID id;

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Column(name = "profile_id", nullable = false)
    private UUID profileId;

    @Column(name = "collection_id", nullable = false, length = 128)
    private String collectionId;

    @Column(nullable = false, length = 256)
    private String name;

    @Column(name = "category_id", length = 128)
    private String categoryId;

    @Column(length = 128)
    private String color;

    @Column(name = "color_hex", length = 32)
    private String colorHex;

    @Column(length = 128)
    private String brand;

    @Column(length = 64)
    private String size;

    @Column(length = 32)
    private String season;

    @Column(length = 4096)
    private String notes;

    @Column(name = "image_url", length = 2048)
    private String imageUrl;

    @Column(name = "original_image_url", length = 2048)
    private String originalImageUrl;

    @Column(name = "image_job_id", length = 128)
    private String imageJobId;

    @Column(name = "product_type", length = 128)
    private String productType;

    @Column(length = 128)
    private String subtype;

    @Column(length = 128)
    private String pattern;

    @Column(length = 128)
    private String occasion;

    @Column(length = 128)
    private String weather;

    @Column(name = "shelf_index")
    private Integer shelfIndex;

    @Column(nullable = false)
    private Boolean favorite = Boolean.FALSE;

    @Column(name = "in_laundry", nullable = false)
    private Boolean inLaundry = Boolean.FALSE;

    @Column(name = "marked_for_donation")
    private Boolean markedForDonation = Boolean.FALSE;

    @Column(name = "donation_marked_at")
    private Long donationMarkedAt;

    @Column(name = "loft_box_id", length = 128)
    private String loftBoxId;

    @Column(name = "lent_status", length = 32)
    private String lentStatus;

    @Column(name = "lent_party", length = 128)
    private String lentParty;

    @Column(name = "lent_date")
    private Long lentDate;

    @Column(name = "lent_notes", length = 2048)
    private String lentNotes;

    @Column(name = "is_gift", nullable = false)
    private Boolean isGift = Boolean.FALSE;

    @Column(name = "gift_from", length = 128)
    private String giftFrom;

    @Column(name = "gift_occasion", length = 128)
    private String giftOccasion;

    @Column(name = "purchase_price")
    private Double purchasePrice;

    @Column(name = "purchase_date")
    private Long purchaseDate;

    @Column(name = "last_worn_at")
    private Long lastWornAt;

    @Column(name = "wear_count")
    private Integer wearCount;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @PrePersist
    @PreUpdate
    void touch() {
        Instant now = Instant.now();
        updatedAt = now;
        if (createdAt == null) {
            createdAt = now;
        }
        if (id == null) {
            id = UUID.randomUUID();
        }
    }

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public UUID getUserId() { return userId; }
    public void setUserId(UUID userId) { this.userId = userId; }

    public UUID getProfileId() { return profileId; }
    public void setProfileId(UUID profileId) { this.profileId = profileId; }

    public String getCollectionId() { return collectionId; }
    public void setCollectionId(String collectionId) { this.collectionId = collectionId; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getCategoryId() { return categoryId; }
    public void setCategoryId(String categoryId) { this.categoryId = categoryId; }

    public String getColor() { return color; }
    public void setColor(String color) { this.color = color; }

    public String getColorHex() { return colorHex; }
    public void setColorHex(String colorHex) { this.colorHex = colorHex; }

    public String getBrand() { return brand; }
    public void setBrand(String brand) { this.brand = brand; }

    public String getSize() { return size; }
    public void setSize(String size) { this.size = size; }

    public String getSeason() { return season; }
    public void setSeason(String season) { this.season = season; }

    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }

    public String getImageUrl() { return imageUrl; }
    public void setImageUrl(String imageUrl) { this.imageUrl = imageUrl; }

    public String getOriginalImageUrl() { return originalImageUrl; }
    public void setOriginalImageUrl(String originalImageUrl) { this.originalImageUrl = originalImageUrl; }

    public String getImageJobId() { return imageJobId; }
    public void setImageJobId(String imageJobId) { this.imageJobId = imageJobId; }

    public String getProductType() { return productType; }
    public void setProductType(String productType) { this.productType = productType; }

    public String getSubtype() { return subtype; }
    public void setSubtype(String subtype) { this.subtype = subtype; }

    public String getPattern() { return pattern; }
    public void setPattern(String pattern) { this.pattern = pattern; }

    public String getOccasion() { return occasion; }
    public void setOccasion(String occasion) { this.occasion = occasion; }

    public String getWeather() { return weather; }
    public void setWeather(String weather) { this.weather = weather; }

    public Integer getShelfIndex() { return shelfIndex; }
    public void setShelfIndex(Integer shelfIndex) { this.shelfIndex = shelfIndex; }

    public Boolean getFavorite() { return favorite; }
    public void setFavorite(Boolean favorite) { this.favorite = favorite; }

    public Boolean getInLaundry() { return inLaundry; }
    public void setInLaundry(Boolean inLaundry) { this.inLaundry = inLaundry; }

    public Boolean getMarkedForDonation() { return markedForDonation; }
    public void setMarkedForDonation(Boolean markedForDonation) { this.markedForDonation = markedForDonation; }

    public Long getDonationMarkedAt() { return donationMarkedAt; }
    public void setDonationMarkedAt(Long donationMarkedAt) { this.donationMarkedAt = donationMarkedAt; }

    public String getLoftBoxId() { return loftBoxId; }
    public void setLoftBoxId(String loftBoxId) { this.loftBoxId = loftBoxId; }

    public String getLentStatus() { return lentStatus; }
    public void setLentStatus(String lentStatus) { this.lentStatus = lentStatus; }

    public String getLentParty() { return lentParty; }
    public void setLentParty(String lentParty) { this.lentParty = lentParty; }

    public Long getLentDate() { return lentDate; }
    public void setLentDate(Long lentDate) { this.lentDate = lentDate; }

    public String getLentNotes() { return lentNotes; }
    public void setLentNotes(String lentNotes) { this.lentNotes = lentNotes; }

    public Boolean getIsGift() { return isGift; }
    public void setIsGift(Boolean isGift) { this.isGift = isGift; }

    public String getGiftFrom() { return giftFrom; }
    public void setGiftFrom(String giftFrom) { this.giftFrom = giftFrom; }

    public String getGiftOccasion() { return giftOccasion; }
    public void setGiftOccasion(String giftOccasion) { this.giftOccasion = giftOccasion; }

    public Double getPurchasePrice() { return purchasePrice; }
    public void setPurchasePrice(Double purchasePrice) { this.purchasePrice = purchasePrice; }

    public Long getPurchaseDate() { return purchaseDate; }
    public void setPurchaseDate(Long purchaseDate) { this.purchaseDate = purchaseDate; }

    public Long getLastWornAt() { return lastWornAt; }
    public void setLastWornAt(Long lastWornAt) { this.lastWornAt = lastWornAt; }

    public Integer getWearCount() { return wearCount; }
    public void setWearCount(Integer wearCount) { this.wearCount = wearCount; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }

    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }
}

