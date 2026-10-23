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

function storageKey(userId: string): string {
  return `almirobe.tripPlans.${userId}`;
}

export function loadTripPlans(userId: string): TripPlan[] {
  try {
    const raw = localStorage.getItem(storageKey(userId));
    if (!raw) return [];
    const parsed = JSON.parse(raw) as TripPlan[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveTripPlans(userId: string, trips: TripPlan[]): void {
  localStorage.setItem(storageKey(userId), JSON.stringify(trips));
}
