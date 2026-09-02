const otpApiBase = import.meta.env.VITE_AUTH_API_URL || (import.meta.env.DEV ? "http://127.0.0.1:8787" : "");

type OtpResponse = {
  ok?: boolean;
  message?: string;
  error?: string;
};

async function postOtp(path: string, body: Record<string, unknown>) {
  if (!otpApiBase) {
    throw new Error("OTP API URL is not configured. Set VITE_AUTH_API_URL or run the local auth server.");
  }
  let response: Response;
  try {
    response = await fetch(`${otpApiBase}${path}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch {
    throw new Error(`Could not reach the OperionOS auth server at ${otpApiBase}. Run npm run dev:auth and try again.`);
  }
  const data = (await response.json().catch(() => ({}))) as OtpResponse;
  if (!response.ok || data.ok === false) {
    throw new Error(data.message || data.error || `OTP request failed with HTTP ${response.status}.`);
  }
  return data;
}

export async function requestEmailOtp(email: string, name: string, mode: "signup" | "signin" | "resend") {
  return postOtp("/api/auth/request-otp", { email, name, mode });
}

export async function verifyEmailOtp(email: string, code: string) {
  return postOtp("/api/auth/verify-otp", { email, code });
}
