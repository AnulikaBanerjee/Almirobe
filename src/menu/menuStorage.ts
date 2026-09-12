import type { AuthUser } from '@/auth';

export type ServiceRequestType = 'professional-help' | 'donation-pickup';

export interface ServiceRequest {
  id: string;
  profileId: string;
  type: ServiceRequestType;
  createdAt: number;
  status: 'submitted' | 'confirmed';
  fields: Record<string, string>;
}

export interface ActivityEntry {
  id: string;
  profileId: string;
  createdAt: number;
  title: string;
  detail?: string;
}

export interface StoredProfile extends AuthUser {
  label: string;
}

const REQUESTS_KEY = 'my-wardrobe-service-requests-v1';
const ACTIVITY_KEY = 'my-wardrobe-activity-v1';
const PROFILES_KEY = 'my-wardrobe-profiles-v1';

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeJson<T>(key: string, value: T): void {
  localStorage.setItem(key, JSON.stringify(value));
}

const DEMO_PROFILES: StoredProfile[] = [
  { id: 'demo-me@demo.local', displayName: 'Me', email: 'me@demo.local', label: 'Me' },
  { id: 'demo-partner', displayName: 'Partner', email: 'partner@demo.local', label: 'Partner' },
  { id: 'demo-family', displayName: 'Family Member', email: 'family@demo.local', label: 'Family Member' },
];

/** Old Google/phone logins used `demo-<timestamp>` — drop stale copies. */
function isEphemeralDemoProfileId(id: string): boolean {
  return /^demo-\d+$/.test(id);
}

function pruneStaleDemoProfiles(profiles: StoredProfile[], activeUserId: string): StoredProfile[] {
  return profiles.filter((profile) => {
    if (!isEphemeralDemoProfileId(profile.id)) return true;
    return profile.id === activeUserId;
  });
}

export function ensureProfilesForUser(user: AuthUser): StoredProfile[] {
  const existing = pruneStaleDemoProfiles(readJson<StoredProfile[]>(PROFILES_KEY, []), user.id);
  const byId = new Map(existing.map((p) => [p.id, p]));

  byId.set(user.id, {
    id: user.id,
    displayName: user.displayName,
    email: user.email,
    label: user.displayName ?? 'Me',
  });

  for (const demo of DEMO_PROFILES) {
    if (!byId.has(demo.id)) byId.set(demo.id, demo);
  }

  const base = [...byId.values()];
  writeJson(PROFILES_KEY, base);
  return base;
}

export function getProfiles(): StoredProfile[] {
  return readJson<StoredProfile[]>(PROFILES_KEY, []);
}

export function updateProfileName(profileId: string, displayName: string): StoredProfile[] {
  const profiles = getProfiles().map((p) =>
    p.id === profileId ? { ...p, displayName, label: displayName } : p
  );
  writeJson(PROFILES_KEY, profiles);
  return profiles;
}

export function addServiceRequest(
  profileId: string,
  type: ServiceRequestType,
  fields: Record<string, string>
): ServiceRequest {
  const request: ServiceRequest = {
    id: `req-${Date.now()}`,
    profileId,
    type,
    createdAt: Date.now(),
    status: 'submitted',
    fields,
  };
  const all = readJson<ServiceRequest[]>(REQUESTS_KEY, []);
  writeJson(REQUESTS_KEY, [request, ...all]);
  addActivity(profileId, requestTitle(type), 'Request submitted — we will follow up shortly (demo).');
  return request;
}

function requestTitle(type: ServiceRequestType): string {
  return type === 'professional-help' ? 'Professional help requested' : 'Donation pickup requested';
}

export function getServiceRequests(profileId?: string): ServiceRequest[] {
  const all = readJson<ServiceRequest[]>(REQUESTS_KEY, []);
  return profileId ? all.filter((r) => r.profileId === profileId) : all;
}

export function addActivity(profileId: string, title: string, detail?: string): void {
  const entry: ActivityEntry = {
    id: `act-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    profileId,
    createdAt: Date.now(),
    title,
    detail,
  };
  const all = readJson<ActivityEntry[]>(ACTIVITY_KEY, []);
  writeJson(ACTIVITY_KEY, [entry, ...all].slice(0, 100));
}

export function getActivity(profileId?: string): ActivityEntry[] {
  const all = readJson<ActivityEntry[]>(ACTIVITY_KEY, []);
  const filtered = profileId ? all.filter((a) => a.profileId === profileId) : all;
  return filtered.sort((a, b) => b.createdAt - a.createdAt);
}
