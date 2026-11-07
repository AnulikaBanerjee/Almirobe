const ONBOARDING_KEY = 'my-wardrobe-onboarding-v2';
const GIFT_RECORDER_KEY = 'my-wardrobe-gift-recorder-v1';

export function hasCompletedOnboarding(userId: string): boolean {
  try {
    const raw = localStorage.getItem(ONBOARDING_KEY);
    if (!raw) return false;
    const completed = JSON.parse(raw) as Record<string, boolean>;
    return Boolean(completed[userId]);
  } catch {
    return false;
  }
}

export function markOnboardingComplete(userId: string): void {
  try {
    const raw = localStorage.getItem(ONBOARDING_KEY);
    const completed: Record<string, boolean> = raw ? JSON.parse(raw) : {};
    completed[userId] = true;
    localStorage.setItem(ONBOARDING_KEY, JSON.stringify(completed));
  } catch {
    // ignore
  }
}

export function isGiftRecorderEnabled(profileId: string): boolean {
  try {
    const raw = localStorage.getItem(GIFT_RECORDER_KEY);
    if (!raw) return true;
    const preferences = JSON.parse(raw) as Record<string, boolean>;
    return preferences[profileId] ?? true;
  } catch {
    return true;
  }
}

export function setGiftRecorderEnabled(profileId: string, enabled: boolean): void {
  const raw = localStorage.getItem(GIFT_RECORDER_KEY);
  let preferences: Record<string, boolean> = {};
  if (raw) {
    try {
      preferences = JSON.parse(raw) as Record<string, boolean>;
    } catch {
      preferences = {};
    }
  }
  preferences[profileId] = enabled;
  localStorage.setItem(GIFT_RECORDER_KEY, JSON.stringify(preferences));
}
