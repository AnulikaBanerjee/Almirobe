/** Client-side email checks before hitting the API. */

const EMAIL_RE =
  /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

/** Common disposable / throwaway domains — not exhaustive. */
const DISPOSABLE_DOMAINS = new Set([
  'mailinator.com',
  'guerrillamail.com',
  'guerrillamail.net',
  '10minutemail.com',
  'tempmail.com',
  'temp-mail.org',
  'yopmail.com',
  'trashmail.com',
  'sharklasers.com',
  'getnada.com',
  'discard.email',
  'mailnesia.com',
]);

export type EmailValidationResult = { ok: true } | { ok: false; message: string };

export function validateEmailAddress(raw: string): EmailValidationResult {
  const email = raw.trim().toLowerCase();
  if (!email) return { ok: false, message: 'Please enter your email' };
  if (email.length > 254) return { ok: false, message: 'Email address is too long' };
  if (!EMAIL_RE.test(email)) return { ok: false, message: 'Enter a valid email address' };
  const domain = email.split('@')[1] ?? '';
  if (!domain.includes('.') || domain.startsWith('.') || domain.endsWith('.')) {
    return { ok: false, message: 'Enter a valid email domain' };
  }
  if (DISPOSABLE_DOMAINS.has(domain)) {
    return { ok: false, message: 'Please use a permanent email address (not a temporary inbox)' };
  }
  return { ok: true };
}
