import { AuthTab } from './authTabs';

/** Fragment key that carries a one-time password link's token. */
const TOKEN_KEY = 'token';

/**
 * Builds the link a member opens to set their password. The token goes after `#`,
 * so browsers never send it to a server and it stays out of server logs.
 */
export function buildPasswordLink(origin: string, token: string): string {
	return `${origin}/auth?tab=${AuthTab.SET_PASSWORD}#${TOKEN_KEY}=${encodeURIComponent(token)}`;
}

/** Reads the token from a link's fragment (`location.hash`); null when there is none. */
export function readPasswordLinkToken(hash: string): string | null {
	const token = new URLSearchParams(hash.replace(/^#/, '')).get(TOKEN_KEY)?.trim();
	return token ? token : null;
}

/** Formats a link's expiry with the time of day, in the viewer's locale and time zone. */
export function formatLinkExpiry(iso: string, locale: string): string {
	return new Date(iso).toLocaleString(locale, { dateStyle: 'medium', timeStyle: 'short' });
}

export type NewPasswordError = 'tooShort' | 'tooLong' | 'mismatch';

const MIN_PASSWORD_LENGTH = 8;
/** bcrypt, which stores the password, reads at most 72 bytes. */
const MAX_PASSWORD_BYTES = 72;

/** Checks a new password and its confirmation; null when it can be sent. */
export function newPasswordError(password: string, confirmation: string): NewPasswordError | null {
	if ([...password].length < MIN_PASSWORD_LENGTH) return 'tooShort';
	if (new TextEncoder().encode(password).length > MAX_PASSWORD_BYTES) return 'tooLong';
	if (password !== confirmation) return 'mismatch';
	return null;
}
