export type TripExtraNote = {
  id: string;
  text: string;
  createdAt: number;
};

export type TripPlan = {
  id: string;
  name: string;
  itemIds: string[];
  extras: TripExtraNote[];
  updatedAt: number;
};

function storageKey(userId: string, profileId?: string): string {
  return profileId ? `almirobe.tripPlans.${userId}.${profileId}` : `almirobe.tripPlans.${userId}`;
}

function legacyStorageKey(userId: string): string {
  return `almirobe.tripPlans.${userId}`;
}

export function loadTripPlans(userId: string, profileId?: string): TripPlan[] {
  try {
    const preferred = storageKey(userId, profileId);
    const raw = localStorage.getItem(preferred);
    if (raw) {
      const parsed = JSON.parse(raw) as TripPlan[];
      return Array.isArray(parsed) ? parsed : [];
    }

    const legacyRaw = localStorage.getItem(legacyStorageKey(userId));
    if (!legacyRaw) return [];
    const parsed = JSON.parse(legacyRaw) as TripPlan[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveTripPlans(userId: string, trips: TripPlan[], profileId?: string): void {
  localStorage.setItem(storageKey(userId, profileId), JSON.stringify(trips));
  if (profileId) {
    localStorage.setItem(legacyStorageKey(userId), JSON.stringify(trips));
  }
}
