const ONBOARDING_KEY = 'my-wardrobe-onboarding-v2';

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
