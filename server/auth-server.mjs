import { createHash, randomInt, timingSafeEqual } from "node:crypto";
import { createServer } from "node:http";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();
loadEnvFile(resolve(root, ".env.local"));
loadEnvFile(resolve(root, ".env"));

const port = Number(process.env.AUTH_SERVER_PORT || 8787);
const resendApiKey = process.env.RESEND_API_KEY || "";
const fromEmail = process.env.RESEND_FROM_EMAIL || "OperionOS <onboarding@resend.dev>";
const otpSecret = process.env.OTP_SECRET || resendApiKey || "operionos-local-otp";
const ttlMs = 10 * 60 * 1000;
const maxAttempts = 5;
const otpStore = new Map();

const allowedOrigins = new Set([
  "http://127.0.0.1:5173",
  "http://localhost:5173",
  "http://127.0.0.1:5174",
  "http://localhost:5174",
  "http://127.0.0.1:5175",
  "http://localhost:5175",
  "http://127.0.0.1:4173",
  "http://localhost:4173",
]);

function loadEnvFile(path) {
  try {
    const source = readFileSync(path, "utf8");
    for (const line of source.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const equalIndex = trimmed.indexOf("=");
      if (equalIndex < 1) continue;
      const key = trimmed.slice(0, equalIndex).trim();
      let value = trimmed.slice(equalIndex + 1).trim();
      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      if (!process.env[key]) process.env[key] = value;
    }
  } catch {
    // The file is optional. Vite may still provide its own env variables.
  }
}

function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

function hashOtp(email, code) {
  return createHash("sha256").update(`${normalizeEmail(email)}:${code}:${otpSecret}`).digest("hex");
}

function safeCompare(a, b) {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}

function json(res, statusCode, body, origin) {
  res.writeHead(statusCode, {
    "content-type": "application/json; charset=utf-8",
    "access-control-allow-origin": allowedOrigins.has(origin) ? origin : "http://127.0.0.1:5173",
    "access-control-allow-methods": "GET,POST,OPTIONS",
    "access-control-allow-headers": "content-type",
  });
  res.end(JSON.stringify(body));
}

function readBody(req) {
  return new Promise((resolveBody, reject) => {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
      if (body.length > 1024 * 1024) {
        reject(new Error("Request body is too large."));
        req.destroy();
      }
    });
    req.on("end", () => {
      try {
        resolveBody(body ? JSON.parse(body) : {});
      } catch {
        reject(new Error("Request body must be valid JSON."));
      }
    });
    req.on("error", reject);
  });
}

async function sendOtpEmail(email, code, name) {
  if (!resendApiKey) {
    throw new Error("RESEND_API_KEY is not configured in .env.local.");
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      authorization: `Bearer ${resendApiKey}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      from: fromEmail,
      to: [email],
      subject: "Your OperionOS verification code",
      html: `
        <div style="font-family:Arial,sans-serif;line-height:1.5;color:#111827">
          <h1 style="margin:0 0 12px">Verify your OperionOS account</h1>
          <p>Hello ${escapeHtml(name || "there")},</p>
          <p>Use this one-time code to verify your email:</p>
          <p style="font-size:32px;font-weight:700;letter-spacing:8px;margin:24px 0">${code}</p>
          <p>This code expires in 10 minutes. If you did not request it, you can ignore this email.</p>
        </div>
      `,
      text: `Your OperionOS verification code is ${code}. It expires in 10 minutes.`,
    }),
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Resend could not send the OTP email. HTTP ${response.status}: ${detail}`);
  }
}

async function sendInviteEmail({ email, name, role, agencyName, acceptUrl, declineUrl }) {
  if (!resendApiKey) {
    throw new Error("RESEND_API_KEY is not configured in .env.local.");
  }

  const safeName = escapeHtml(name || "there");
  const safeAgency = escapeHtml(agencyName || "your agency");
  const safeRole = escapeHtml(role || "Employee");
  const safeAcceptUrl = escapeHtml(acceptUrl);
  const safeDeclineUrl = escapeHtml(declineUrl);

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      authorization: `Bearer ${resendApiKey}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      from: fromEmail,
      to: [email],
      subject: `${agencyName || "OperionOS"} invited you to OperionOS`,
      html: `
        <div style="font-family:Arial,sans-serif;line-height:1.55;color:#111827;max-width:560px">
          <h1 style="margin:0 0 12px">Join ${safeAgency} on OperionOS</h1>
          <p>Hello ${safeName},</p>
          <p>You have been invited as <strong>${safeRole}</strong>. Accept the invite to create your team-member account for this agency workspace.</p>
          <p style="margin:28px 0">
            <a href="${safeAcceptUrl}" style="background:#111827;color:#fff;text-decoration:none;padding:14px 22px;border-radius:999px;font-weight:700">Accept invite</a>
          </p>
          <p>If this invite was not meant for you, you can decline it here:</p>
          <p><a href="${safeDeclineUrl}">${safeDeclineUrl}</a></p>
        </div>
      `,
      text: `You were invited to ${agencyName || "OperionOS"} as ${role || "Employee"}.\nAccept: ${acceptUrl}\nDecline: ${declineUrl}`,
    }),
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Resend could not send the team invite email. HTTP ${response.status}: ${detail}`);
  }
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

const server = createServer(async (req, res) => {
  const origin = req.headers.origin || "";

  if (req.method === "OPTIONS") {
    json(res, 204, {}, origin);
    return;
  }

  try {
    const url = new URL(req.url || "/", `http://${req.headers.host || "127.0.0.1"}`);

    if (req.method === "GET" && url.pathname === "/api/health") {
      json(res, 200, { ok: true, resendConfigured: Boolean(resendApiKey), fromEmail }, origin);
      return;
    }

    if (req.method === "POST" && url.pathname === "/api/auth/request-otp") {
      const body = await readBody(req);
      const email = normalizeEmail(body.email);
      const name = String(body.name || "").trim();
      if (!email || !email.includes("@")) {
        json(res, 400, { ok: false, message: "A valid email is required." }, origin);
        return;
      }
      const code = String(randomInt(100000, 1000000));
      otpStore.set(email, {
        hash: hashOtp(email, code),
        expiresAt: Date.now() + ttlMs,
        attempts: 0,
      });
      await sendOtpEmail(email, code, name);
      json(res, 200, { ok: true, expiresInMinutes: 10 }, origin);
      return;
    }

    if (req.method === "POST" && url.pathname === "/api/auth/verify-otp") {
      const body = await readBody(req);
      const email = normalizeEmail(body.email);
      const code = String(body.code || "").replace(/\D/g, "");
      const record = otpStore.get(email);
      if (!record) {
        json(res, 400, { ok: false, message: "No active OTP was found for this email. Please resend the code." }, origin);
        return;
      }
      if (Date.now() > record.expiresAt) {
        otpStore.delete(email);
        json(res, 400, { ok: false, message: "This OTP has expired. Please resend the code." }, origin);
        return;
      }
      if (record.attempts >= maxAttempts) {
        otpStore.delete(email);
        json(res, 429, { ok: false, message: "Too many incorrect OTP attempts. Please resend the code." }, origin);
        return;
      }
      record.attempts += 1;
      if (!/^\d{6}$/.test(code) || !safeCompare(record.hash, hashOtp(email, code))) {
        json(res, 400, { ok: false, message: "The OTP code is incorrect." }, origin);
        return;
      }
      otpStore.delete(email);
      json(res, 200, { ok: true }, origin);
      return;
    }

    if (req.method === "POST" && url.pathname === "/api/invites/send") {
      const body = await readBody(req);
      const email = normalizeEmail(body.email);
      const acceptUrl = String(body.acceptUrl || "").trim();
      const declineUrl = String(body.declineUrl || "").trim();
      if (!email || !email.includes("@")) {
        json(res, 400, { ok: false, message: "A valid invite email is required." }, origin);
        return;
      }
      if (!acceptUrl || !declineUrl) {
        json(res, 400, { ok: false, message: "Accept and decline URLs are required." }, origin);
        return;
      }
      await sendInviteEmail({
        email,
        name: String(body.name || "").trim(),
        role: String(body.role || "Employee").trim(),
        agencyName: String(body.agencyName || "OperionOS Agency").trim(),
        acceptUrl,
        declineUrl,
      });
      json(res, 200, { ok: true }, origin);
      return;
    }

    if (req.method === "POST" && (url.pathname === "/api/invites/accept" || url.pathname === "/api/invites/decline")) {
      json(res, 200, { ok: true, message: "Invite status is recorded by the OperionOS app." }, origin);
      return;
    }

    json(res, 404, { ok: false, message: "Route not found." }, origin);
  } catch (error) {
    json(res, 500, { ok: false, message: error instanceof Error ? error.message : "Server error." }, origin);
  }
});

server.listen(port, "127.0.0.1", () => {
  console.log(`OperionOS auth server running at http://127.0.0.1:${port}`);
});
