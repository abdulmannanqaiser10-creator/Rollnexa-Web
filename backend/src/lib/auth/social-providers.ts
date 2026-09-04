export type OAuthProviderId = "google" | "facebook" | "apple";

function hasCredentials(clientId?: string, clientSecret?: string): boolean {
  return Boolean(clientId?.trim() && clientSecret?.trim());
}

export function buildSocialProviders() {
  const providers: Record<string, Record<string, string>> = {};

  const googleId = process.env.GOOGLE_CLIENT_ID?.trim();
  const googleSecret = process.env.GOOGLE_CLIENT_SECRET?.trim();
  if (hasCredentials(googleId, googleSecret)) {
    providers.google = {
      clientId: googleId!,
      clientSecret: googleSecret!,
    };
  }

  const facebookId = process.env.FACEBOOK_CLIENT_ID?.trim();
  const facebookSecret = process.env.FACEBOOK_CLIENT_SECRET?.trim();
  if (hasCredentials(facebookId, facebookSecret)) {
    providers.facebook = {
      clientId: facebookId!,
      clientSecret: facebookSecret!,
    };
  }

  const appleId = process.env.APPLE_CLIENT_ID?.trim();
  const appleSecret = process.env.APPLE_CLIENT_SECRET?.trim();
  if (hasCredentials(appleId, appleSecret)) {
    providers.apple = {
      clientId: appleId!,
      clientSecret: appleSecret!,
      ...(process.env.APPLE_APP_BUNDLE_IDENTIFIER?.trim()
        ? { appBundleIdentifier: process.env.APPLE_APP_BUNDLE_IDENTIFIER.trim() }
        : {}),
    };
  }

  return providers;
}

export function getEnabledOAuthProviders(): OAuthProviderId[] {
  return Object.keys(buildSocialProviders()) as OAuthProviderId[];
}

export function buildAccountLinkingConfig() {
  const enabled = getEnabledOAuthProviders();
  if (enabled.length === 0) return undefined;

  return {
    enabled: true,
    trustedProviders: enabled,
  };
}
