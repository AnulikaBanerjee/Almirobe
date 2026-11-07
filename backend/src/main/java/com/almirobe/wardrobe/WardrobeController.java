package com.almirobe.wardrobe;

import com.almirobe.auth.AuthenticatedUser;
import com.fasterxml.jackson.databind.JsonNode;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1")
public class WardrobeController {

    private final WardrobeService wardrobeService;

    public WardrobeController(WardrobeService wardrobeService) {
        this.wardrobeService = wardrobeService;
    }

    @GetMapping("/wardrobe")
    public WardrobeSnapshotDto getWardrobe(@AuthenticationPrincipal AuthenticatedUser user) {
        requireUser(user);
        return wardrobeService.getSnapshot(user);
    }

    @PostMapping("/wardrobe")
    @ResponseStatus(HttpStatus.OK)
    public WardrobeSnapshotDto saveWardrobe(
            @AuthenticationPrincipal AuthenticatedUser user,
            @Valid @RequestBody WardrobeSnapshotDto snapshot
    ) {
        requireUser(user);
        return wardrobeService.upsertSnapshot(user, snapshot);
    }

    @GetMapping("/items")
    public JsonNode listItems(@AuthenticationPrincipal AuthenticatedUser user) {
        requireUser(user);
        return wardrobeService.listItems(user);
    }

    @GetMapping("/items/{id}")
    public JsonNode getItem(@AuthenticationPrincipal AuthenticatedUser user, @PathVariable String id) {
        requireUser(user);
        return wardrobeService.getItem(user, id);
    }

    @PostMapping("/items")
    public JsonNode createOrUpdateItem(@AuthenticationPrincipal AuthenticatedUser user, @RequestBody JsonNode item) {
        requireUser(user);
        return wardrobeService.upsertItem(user, item);
    }

    @GetMapping("/looks")
    public JsonNode listLooks(@AuthenticationPrincipal AuthenticatedUser user) {
        requireUser(user);
        return wardrobeService.listLooks(user);
    }

    @PostMapping("/looks")
    public JsonNode saveLook(@AuthenticationPrincipal AuthenticatedUser user, @RequestBody JsonNode look) {
        requireUser(user);
        return wardrobeService.saveLook(user, look);
    }

    @GetMapping("/lofts")
    public JsonNode listLoftBoxes(@AuthenticationPrincipal AuthenticatedUser user) {
        requireUser(user);
        return wardrobeService.listLoftBoxes(user);
    }

    @PostMapping("/lofts")
    public JsonNode saveLoftBox(@AuthenticationPrincipal AuthenticatedUser user, @RequestBody JsonNode loftBox) {
        requireUser(user);
        return wardrobeService.saveLoftBox(user, loftBox);
    }

    @GetMapping("/donations")
    public JsonNode listDonations(@AuthenticationPrincipal AuthenticatedUser user) {
        requireUser(user);
        return wardrobeService.listDonationQueue(user);
    }

    @PostMapping("/donations")
    public JsonNode createDonation(@AuthenticationPrincipal AuthenticatedUser user, @RequestBody JsonNode payload) {
        requireUser(user);
        return wardrobeService.createDonation(user, payload);
    }

    @GetMapping("/trip-plans")
    public JsonNode listTripPlans(@AuthenticationPrincipal AuthenticatedUser user) {
        requireUser(user);
        return wardrobeService.listTripPlans(user);
    }

    @PostMapping("/trip-plans")
    public JsonNode planTrip(@AuthenticationPrincipal AuthenticatedUser user, @RequestBody JsonNode payload) {
        requireUser(user);
        return wardrobeService.planTrip(user, payload);
    }

    private void requireUser(AuthenticatedUser user) {
        if (user == null) {
            throw new IllegalStateException("Authentication required");
        }
    }
}
