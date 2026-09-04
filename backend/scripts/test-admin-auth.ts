import "dotenv/config";
import { hashPassword, verifyPassword } from "@better-auth/utils/password";
import { createScriptPrisma } from "./lib/script-db";
import { dashboardPathForRole } from "./lib/roles";

const BASE = process.env.BETTER_AUTH_URL || "http://localhost:3000";
const ADMIN_EMAIL =
  process.env.ADMIN_EMAIL?.trim() ||
  process.env.DEV_ADMIN_EMAIL?.trim() ||
  "admin@rollnexa.com";
const ADMIN_PASSWORD =
  process.env.ADMIN_PASSWORD?.trim() || process.env.DEV_ADMIN_PASSWORD?.trim();

type Check = { name: string; pass: boolean; detail?: string };

const checks: Check[] = [];

function record(name: string, pass: boolean, detail = "") {
  checks.push({ name, pass, detail });
  console.log(`[${pass ? "PASS" : "FAIL"}] ${name}${detail ? ` — ${detail}` : ""}`);
}

function cookieHeader(setCookie: string[] = []) {
  return setCookie.map((cookie) => cookie.split(";")[0]).join("; ");
}

async function api(
  path: string,
  options: {
    method?: string;
    body?: unknown;
    cookie?: string;
    redirect?: RequestRedirect;
  } = {}
) {
  const res = await fetch(`${BASE}${path}`, {
    method: options.method ?? "GET",
    headers: {
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      Origin: BASE,
      ...(options.cookie ? { Cookie: options.cookie } : {}),
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
    redirect: options.redirect ?? "manual",
  });

  const setCookie = res.headers.getSetCookie?.() ?? [];
  const text = await res.text();
  let json: unknown = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = { raw: text.slice(0, 200) };
  }

  return { status: res.status, json, setCookie, location: res.headers.get("location") };
}

async function main() {
  if (!ADMIN_PASSWORD) {
    console.error("ADMIN_PASSWORD (or DEV_ADMIN_PASSWORD) is required for auth tests.");
    process.exit(1);
  }

  const { prisma } = createScriptPrisma();

  try {
    const admin = await prisma.user.findUnique({
      where: { email: ADMIN_EMAIL.toLowerCase() },
      include: {
        accounts: { where: { providerId: "credential" }, take: 1 },
      },
    });

    record("Admin account exists", Boolean(admin), admin?.email);
    record("Admin role is ADMIN", admin?.role === "ADMIN", admin?.role);
    record(
      "Admin password is hashed",
      Boolean(admin?.accounts[0]?.password?.includes(":")),
      admin?.accounts[0]?.password ? "hash present" : "missing credential account"
    );

    if (admin?.accounts[0]?.password) {
      const valid = await verifyPassword(
        admin.accounts[0].password,
        ADMIN_PASSWORD
      );
      record("Admin password verifies", valid);
    }

    const login = await api("/api/auth/sign-in/email", {
      method: "POST",
      body: {
        email: ADMIN_EMAIL,
        password: ADMIN_PASSWORD,
        rememberMe: true,
      },
    });

    record("Admin login succeeds", login.status === 200, `status ${login.status}`);
    const adminCookie = cookieHeader(login.setCookie);
    record("Admin session cookie created", adminCookie.length > 0);

    const loginUser =
      login.json && typeof login.json === "object" && "user" in login.json
        ? (login.json as { user?: { role?: string } }).user
        : null;
    record("Admin role in login response", loginUser?.role === "ADMIN", loginUser?.role);
    record(
      "Admin dashboard path mapping",
      dashboardPathForRole("ADMIN") === "/admin/dashboard",
      dashboardPathForRole("ADMIN")
    );

    const adminPage = await api("/admin/dashboard", { cookie: adminCookie });
    record(
      "Admin can access /admin/dashboard",
      adminPage.status === 200 || adminPage.status === 307 || adminPage.status === 308,
      `status ${adminPage.status}`
    );

    const wrongPassword = await api("/api/auth/sign-in/email", {
      method: "POST",
      body: {
        email: ADMIN_EMAIL,
        password: `${ADMIN_PASSWORD}__wrong`,
        rememberMe: true,
      },
    });
    record(
      "Wrong admin password rejected",
      wrongPassword.status === 401 || wrongPassword.status === 400 || wrongPassword.status === 403,
      `status ${wrongPassword.status}`
    );

    const buyerEmail = `buyer_gate_${Date.now()}@example.com`;
    const buyerPassword = `Buyer_${Date.now()}!9`;
    const buyerSignUp = await api("/api/auth/sign-up/email", {
      method: "POST",
      body: {
        name: "Buyer Gate Test",
        email: buyerEmail,
        password: buyerPassword,
        role: "BUYER",
      },
    });
    const buyerCookie = cookieHeader(buyerSignUp.setCookie);

    const buyerAdmin = await api("/admin/dashboard", { cookie: buyerCookie });
    record(
      "Buyer blocked from /admin/*",
      buyerAdmin.status === 307 || buyerAdmin.status === 308,
      `status ${buyerAdmin.status} location ${buyerAdmin.location ?? "n/a"}`
    );

    const sellerEmail = `seller_gate_${Date.now()}@example.com`;
    const sellerPassword = `Seller_${Date.now()}!9`;
    const sellerSignUp = await api("/api/auth/sign-up/email", {
      method: "POST",
      body: {
        name: "Seller Gate Test",
        email: sellerEmail,
        password: sellerPassword,
        role: "SELLER",
      },
    });
    const sellerCookie = cookieHeader(sellerSignUp.setCookie);

    const sellerAdmin = await api("/admin/dashboard", { cookie: sellerCookie });
    record(
      "Seller blocked from /admin/*",
      sellerAdmin.status === 307 || sellerAdmin.status === 308,
      `status ${sellerAdmin.status} location ${sellerAdmin.location ?? "n/a"}`
    );

    const guestAdmin = await api("/admin/dashboard");
    record(
      "Unauthenticated user redirected from /admin/*",
      guestAdmin.status === 307 || guestAdmin.status === 308,
      `status ${guestAdmin.status} location ${guestAdmin.location ?? "n/a"}`
    );

    const logout = await api("/api/auth/sign-out", {
      method: "POST",
      body: {},
      cookie: adminCookie,
    });
    record(
      "Admin logout succeeds",
      logout.status === 200 || logout.status === 204,
      `status ${logout.status}`
    );
    const afterLogoutCookie = cookieHeader(logout.setCookie);
    const sessionCookieAfterLogout =
      afterLogoutCookie.length > 0 ? afterLogoutCookie : adminCookie;
    const afterLogout = await api("/admin/dashboard", {
      cookie: sessionCookieAfterLogout,
    });
    record(
      "Admin session destroyed after logout",
      afterLogout.status === 307 || afterLogout.status === 308,
      `status ${afterLogout.status} location ${afterLogout.location ?? "n/a"}`
    );

    const sampleHash = await hashPassword("sample-only");
    record("Password hashing produces salted hash", sampleHash.includes(":"));

    const invalidEmailSignUp = await api("/api/auth/sign-up/email", {
      method: "POST",
      body: {
        name: "Invalid Email Test",
        email: "not-an-email",
        password: "ValidPass1!",
        role: "BUYER",
      },
    });
    record(
      "Invalid email registration rejected",
      invalidEmailSignUp.status === 400 || invalidEmailSignUp.status === 422,
      `status ${invalidEmailSignUp.status}`
    );

    const duplicateEmailSignUp = await api("/api/auth/sign-up/email", {
      method: "POST",
      body: {
        name: "Duplicate Email Test",
        email: buyerEmail,
        password: buyerPassword,
        role: "BUYER",
      },
    });
    record(
      "Duplicate email registration rejected",
      duplicateEmailSignUp.status === 400 ||
        duplicateEmailSignUp.status === 409 ||
        duplicateEmailSignUp.status === 422,
      `status ${duplicateEmailSignUp.status}`
    );

    const buyerLogin = await api("/api/auth/sign-in/email", {
      method: "POST",
      body: {
        email: buyerEmail,
        password: buyerPassword,
        rememberMe: true,
      },
    });
    record(
      "Registered buyer can login",
      buyerLogin.status === 200,
      `status ${buyerLogin.status}`
    );

    const buyerWrongPassword = await api("/api/auth/sign-in/email", {
      method: "POST",
      body: {
        email: buyerEmail,
        password: `${buyerPassword}__wrong`,
        rememberMe: true,
      },
    });
    record(
      "Wrong buyer password rejected",
      buyerWrongPassword.status === 401 ||
        buyerWrongPassword.status === 400 ||
        buyerWrongPassword.status === 403,
      `status ${buyerWrongPassword.status}`
    );

    const buyerSeller = await api("/seller/dashboard", { cookie: buyerCookie });
    record(
      "Buyer blocked from /seller/*",
      buyerSeller.status === 307 || buyerSeller.status === 308,
      `status ${buyerSeller.status} location ${buyerSeller.location ?? "n/a"}`
    );

    const guestBuyer = await api("/buyer/dashboard");
    record(
      "Unauthenticated user redirected from /buyer/*",
      guestBuyer.status === 307 || guestBuyer.status === 308,
      `status ${guestBuyer.status} location ${guestBuyer.location ?? "n/a"}`
    );

    const failed = checks.filter((check) => !check.pass);
    if (failed.length > 0) {
      console.error(`\n${failed.length} check(s) failed.`);
      process.exit(1);
    }

    console.log(`\nAll ${checks.length} checks passed.`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error("Admin auth test failed:", error instanceof Error ? error.message : error);
  process.exit(1);
});
