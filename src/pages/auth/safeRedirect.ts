/**
 * Accepts a `redirect` query parameter only when it points back into this app.
 *
 * The login page sends the browser wherever this returns. Without the check,
 * `/auth?redirect=https://evil.example` would be a link that looks like the
 * real login and lands the user on someone else's site the moment they sign in.
 *
 * Returns the value unchanged when it is a path on this origin, `null` otherwise.
 */
export function sanitizeRedirect(raw: string | null | undefined): string | null {
	if (!raw) return null;
	// Must be a path. Rules out `https://evil.example` and `javascript:...`.
	if (!raw.startsWith('/')) return null;
	// `//evil.example` is protocol-relative, and browsers read `\` as `/`.
	if (raw.startsWith('//') || raw.startsWith('/\\')) return null;
	// No path this app issues carries a scheme, so one further in is refused too.
	if (raw.includes('://')) return null;
	if (raw.includes('\n') || raw.includes('\r')) return null;
	return raw;
}
