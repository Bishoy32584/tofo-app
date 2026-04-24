export async function refreshAccessToken() {
  try {

    const res = await fetch("https://tofo-app-production.up.railway.app/api/auth/refresh-token", {
      method: "POST",
      credentials: "include"
    });

    if (!res.ok) {
      throw new Error("Refresh token failed");
    }

    const data = await res.json();

    if (data.accessToken) {
      localStorage.setItem("accessToken", data.accessToken);
      window.token = data.accessToken;
    }

    return data.accessToken;

  } catch (err) {

    console.error("Refresh token error:", err);

    // لو فشل refresh يرجع المستخدم للـlogin
    window.location.href = "/login";

  }
}