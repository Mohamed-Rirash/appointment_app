export const client = {
  // login
  async Login(email: string, password: string) {
    console.log("Email client", email);
    console.log("Password", password);
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/users/login`,
      {
        method: "POST",
        headers: {
          accept: "application/json",
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: `grant_type=password&username=${email}&password=${password}&scope=&client_id=string&client_secret=********`,
      }
    );
    return response;
  },

  // get user
  async GetUser(token: string) {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/users/me`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return response;
  },

  // refresh token
  async refreshAccessToken() {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/users/refresh`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          // If your API already reads refresh_token from cookie, body may not be required
          // body: JSON.stringify({ refresh_token: token.refresh_token }),
          credentials: "include", // send cookies!
        }
      );

      if (!res.ok) throw new Error("Failed to refresh token");

      const refreshed = await res.json();

      return {
        access_token: refreshed.access_token,
        expires_at: Math.floor(Date.now() / 1000 + refreshed.expires_in),
      };
    } catch (err) {
      console.error("Error refreshing token:", err);
      return { error: "RefreshAccessTokenError" };
    }
  },
};
