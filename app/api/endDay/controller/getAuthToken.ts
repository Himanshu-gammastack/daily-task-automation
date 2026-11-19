
let cachedAccessToken: string | null = null;
let tokenExpiresAt = 0;

export async function getZohoAccessToken(): Promise<string | null> {
  if (cachedAccessToken && Date.now() < tokenExpiresAt - 5 * 60 * 1000) {
    return cachedAccessToken;
  }

  const clientId = process.env.ZOHO_CLIENT_ID;
  const clientSecret = process.env.ZOHO_CLIENT_SECRET;
  const refreshToken = process.env.ZOHO_REFRESH_TOKEN;
  const accountsUrl = "https://accounts.zoho.in";

  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error("Missing Zoho OAuth environment variables");
  }

  const params = new URLSearchParams({
    refresh_token: refreshToken,
    client_id: clientId,
    client_secret: clientSecret,
    grant_type: "refresh_token",
  });

  const response = await fetch(
    `${accountsUrl}/oauth/v2/token`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params.toString(),
      cache: "no-store",
    }
  );

  const data = await response.json();

  if (!response.ok || !data.access_token) {
    console.error("Zoho token refresh failed:", data.error);
    throw new Error("Unable to refresh Zoho access token");
  }

  cachedAccessToken = data.access_token;
  tokenExpiresAt = Date.now() + data.expires_in * 1000;

  return cachedAccessToken;
}
