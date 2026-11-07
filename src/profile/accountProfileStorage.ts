export interface AccountProfile {
  contactEmail?: string;
  phone: string;
  shippingAddress: string;
  membershipLevel: string;
  memberSince: string;
  preferredLanguage: string;
  newsletter: boolean;
  notifications: boolean;
  loginVia: string;
}

const KEY = 'almirobe-account-profile-v1';

function readAll(): Record<string, AccountProfile> {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return {};
    return JSON.parse(raw) as Record<string, AccountProfile>;
  } catch {
    return {};
  }
}

function writeAll(data: Record<string, AccountProfile>) {
  localStorage.setItem(KEY, JSON.stringify(data));
}

export function defaultAccountProfile(displayName?: string, email?: string): AccountProfile {
  const since = new Date();
  const month = since.toLocaleString('en-IN', { month: 'short' });
  const year = since.getFullYear();
  return {
    phone: '+91 98765 43210',
    shippingAddress: '123, Green Park, 5th Floor, HSR Layout, Bangalore - 560102',
    membershipLevel: 'Premium Member',
    memberSince: `${month} ${year}`,
    preferredLanguage: 'English',
    newsletter: true,
    notifications: true,
    loginVia: email?.includes('@') ? 'Email' : 'Google',
  };
}

export function getAccountProfile(userId: string, displayName?: string, email?: string): AccountProfile {
  const all = readAll();
  if (!all[userId]) {
    all[userId] = defaultAccountProfile(displayName, email);
    writeAll(all);
  }
  return all[userId];
}

export function updateAccountProfile(userId: string, patch: Partial<AccountProfile>): AccountProfile {
  const all = readAll();
  const current = all[userId] ?? defaultAccountProfile();
  const next = { ...current, ...patch };
  all[userId] = next;
  writeAll(all);
  return next;
}

export interface ContactSettings {
  email: string;
  phone: string;
  phoneHours: string;
  officeAddress: string;
}

const CONTACT_KEY = 'almirobe-contact-settings-v1';

export function getContactSettings(): ContactSettings {
  try {
    const raw = localStorage.getItem(CONTACT_KEY);
    if (raw) return JSON.parse(raw) as ContactSettings;
  } catch {
    /* use defaults */
  }
  return {
    email: 'hello@yourbrand.com',
    phone: '+91 98765 43210',
    phoneHours: 'Mon - Sat, 10:00 AM - 6:00 PM',
    officeAddress: '123, Green Park, 5th Floor, HSR Layout, Bangalore - 560102',
  };
}

export function saveContactSettings(settings: ContactSettings): void {
  localStorage.setItem(CONTACT_KEY, JSON.stringify(settings));
}
