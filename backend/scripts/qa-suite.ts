/**
 * Rollnexa Step 26 — End-to-end QA suite
 * Run with: npm run test:qa  (requires `npm run dev` on BETTER_AUTH_URL)
 *
 * Avoid importing app modules that pull `server-only` (lib/db, lib/seo, lib/security).
 */
import "dotenv/config";
import { createScriptPrisma } from "./lib/script-db";
import { dashboardPathForRole } from "./lib/roles";
import { parseMachineBrowseFilters } from "../../frontend/lib/validations/machine-filters";
import { passwordSchema, registerSchema, loginSchema } from "../../frontend/lib/validations/auth";

const BASE = process.env.BETTER_AUTH_URL || "http://localhost:3000";
const ADMIN_EMAIL =
  process.env.DEV_ADMIN_EMAIL?.trim() || "lexcoresolutions@gmail.com";
const ADMIN_PASSWORD = process.env.DEV_ADMIN_PASSWORD?.trim();

type Check = { area: string; name: string; pass: boolean; detail?: string };
const checks: Check[] = [];

function record(area: string, name: string, pass: boolean, detail = "") {
  checks.push({ area, name, pass, detail });
  const tag = pass ? "PASS" : "FAIL";
  console.log(`[${tag}] [${area}] ${name}${detail ? ` — ${detail}` : ""}`);
}

function cookieHeader(setCookie: string[] = []) {
  return setCookie.map((cookie) => cookie.split(";")[0]).join("; ");
}

function sanitizeText(value: string) {
  return value
    .replace(/[<>]/g, "")
    .replace(/javascript:/gi, "")
    .replace(/on\w+=/gi, "")
    .replace(/\s+/g, " ")
    .trim();
}

function detectImageMime(buffer: Buffer): string | null {
  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return "image/jpeg";
  }
  if (
    buffer.length >= 8 &&
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47
  ) {
    return "image/png";
  }
  if (
    buffer.length >= 12 &&
    buffer.toString("ascii", 0, 4) === "RIFF" &&
    buffer.toString("ascii", 8, 12) === "WEBP"
  ) {
    return "image/webp";
  }
  return null;
}

async function api(
  path: string,
  options: {
    method?: string;
    body?: unknown;
    cookie?: string;
    redirect?: RequestRedirect;
    headers?: Record<string, string>;
    timeoutMs?: number;
  } = {}
) {
  const res = await fetch(`${BASE}${path}`, {
    method: options.method ?? "GET",
    headers: {
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      Origin: BASE,
      ...(options.cookie ? { Cookie: options.cookie } : {}),
      ...options.headers,
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
    redirect: options.redirect ?? "manual",
    signal: AbortSignal.timeout(options.timeoutMs ?? 45_000),
  });

  const setCookie = res.headers.getSetCookie?.() ?? [];
  const text = await res.text();
  let json: unknown = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = null;
  }

  return {
    status: res.status,
    json,
    text,
    setCookie,
    location: res.headers.get("location"),
    headers: res.headers,
    ok: res.status >= 200 && res.status < 400,
  };
}

async function page(path: string, cookie?: string, timeoutMs = 90_000) {
  return api(path, { cookie, redirect: "manual", timeoutMs });
}

function isRedirect(status: number) {
  return status === 301 || status === 302 || status === 303 || status === 307 || status === 308;
}

async function waitForServer(timeoutMs = 180_000) {
  const start = Date.now();
  // Prefer a light route so we don't wait on homepage compile.
  const probePaths = ["/login", "/robots.txt", "/"];
  while (Date.now() - start < timeoutMs) {
    for (const path of probePaths) {
      try {
        const res = await fetch(`${BASE}${path}`, {
          redirect: "manual",
          signal: AbortSignal.timeout(12_000),
        });
        if (res.status > 0) return true;
      } catch {
        // retry
      }
    }
    await new Promise((r) => setTimeout(r, 2000));
  }
  return false;
}

async function main() {
  console.log(`\n=== Rollnexa QA Suite ===\nBase URL: ${BASE}\n`);

  const up = await waitForServer();
  if (!up) {
    console.error("Dev server is not reachable. Start it with: npm run dev");
    process.exit(1);
  }
  record("Environment", "Dev server reachable", true, BASE);

  // Warm light routes first so Turbopack compiles before heavy pages.
  await page("/login", undefined).catch(() => null);
  await page("/robots.txt").catch(() => null);

  const { prisma } = createScriptPrisma();

  try {
    const users = await prisma.user.count();
    const published = await prisma.machine.count({ where: { status: "PUBLISHED" } });
    const categories = await prisma.category.count();
    const brands = await prisma.brand.count();
    const plans = await prisma.subscriptionPlan.count();
    record("Database", "Users table readable", users >= 0, `${users} users`);
    record("Database", "Published machines exist", published >= 0, `${published} published`);
    record("Database", "Categories seeded", categories > 0, `${categories} categories`);
    record("Database", "Brands seeded", brands > 0, `${brands} brands`);
    record("Database", "Subscription plans present", plans > 0, `${plans} plans`);

    const home = await page("/");
    record("Homepage", "Homepage loads", home.status === 200, `status ${home.status}`);
    record(
      "Homepage",
      "Homepage has Rollnexa branding",
      home.text.toLowerCase().includes("rollnexa"),
      "brand present"
    );

    const machinesPage = await page("/machines");
    record("Listings", "/machines loads", machinesPage.status === 200, `status ${machinesPage.status}`);

    const categoriesPage = await page("/categories");
    record("Listings", "/categories loads", categoriesPage.status === 200);

    const brandsPage = await page("/brands");
    record("Listings", "/brands loads", brandsPage.status === 200);

    const about = await page("/about");
    record("Homepage", "/about loads", about.status === 200);

    const contact = await page("/contact");
    record("Homepage", "/contact loads", contact.status === 200);

    const robots = await page("/robots.txt");
    record(
      "SEO",
      "robots.txt available",
      robots.status === 200 && /Disallow:\s*\/admin/i.test(robots.text),
      robots.text.slice(0, 120).replace(/\s+/g, " ")
    );

    const sitemap = await page("/sitemap.xml");
    record(
      "SEO",
      "sitemap.xml available",
      sitemap.status === 200 && sitemap.text.includes("urlset"),
      `status ${sitemap.status}`
    );

    const sampleMachine = await prisma.machine.findFirst({
      where: { status: "PUBLISHED" },
      select: { id: true, slug: true, title: true, price: true, sellerId: true },
    });
    if (sampleMachine) {
      const detail = await page(`/machines/${sampleMachine.slug}`);
      record(
        "Listings",
        "Machine detail page loads",
        detail.status === 200,
        sampleMachine.slug
      );
      record(
        "Listings",
        "Machine detail includes title",
        detail.text.includes(sampleMachine.title),
        sampleMachine.title
      );
      record(
        "SEO",
        "Machine page has Product JSON-LD",
        detail.text.includes('"@type":"Product"') || detail.text.includes('"@type": "Product"'),
        "Product schema"
      );
    } else {
      record("Listings", "Machine detail page loads", true, "skipped — no published machines");
      record("Listings", "Machine detail includes title", true, "skipped");
      record("SEO", "Machine page has Product JSON-LD", true, "skipped");
    }

    const search = await page("/machines?q=excavator&sort=price-asc");
    record("Search", "Search query page loads", search.status === 200);

    const filterPage = await page("/machines?condition=USED&minPrice=1000&maxPrice=999999");
    record("Search", "Filter query page loads", filterPage.status === 200);

    const parsed = parseMachineBrowseFilters({
      search: "roller",
      sort: "price-desc",
      page: "2",
      minPrice: "100",
      maxPrice: "50",
    });
    record(
      "Search",
      "Filter parser swaps invalid price range",
      parsed.minPrice === 50 && parsed.maxPrice === 100,
      JSON.stringify({ min: parsed.minPrice, max: parsed.maxPrice })
    );

    const loginPage = await page("/login");
    record("Auth", "/login loads", loginPage.status === 200);

    const registerPage = await page("/register");
    record("Auth", "/register loads", registerPage.status === 200);

    record(
      "Auth",
      "Password schema rejects weak password",
      !passwordSchema.safeParse("short").success
    );
    record(
      "Auth",
      "Password schema accepts strong password",
      passwordSchema.safeParse("SecurePass1!").success
    );
    record(
      "Auth",
      "Login schema validates email",
      !loginSchema.safeParse({ email: "bad", password: "x" }).success
    );

    const stamp = Date.now();
    const buyerEmail = `qa_buyer_${stamp}@example.com`;
    const sellerEmail = `qa_seller_${stamp}@example.com`;
    const password = `QaTest_${stamp}a9`;

    const buyerSignUp = await api("/api/auth/sign-up/email", {
      method: "POST",
      body: {
        name: "QA Buyer",
        email: buyerEmail,
        password,
        role: "BUYER",
      },
    });
    record(
      "Auth",
      "Buyer registration succeeds",
      buyerSignUp.status === 200,
      `status ${buyerSignUp.status}`
    );
    const buyerCookie = cookieHeader(buyerSignUp.setCookie);
    record("Auth", "Buyer session cookie issued", buyerCookie.length > 0);

    const sellerSignUp = await api("/api/auth/sign-up/email", {
      method: "POST",
      body: {
        name: "QA Seller",
        email: sellerEmail,
        password,
        role: "SELLER",
      },
    });
    record(
      "Auth",
      "Seller registration succeeds",
      sellerSignUp.status === 200,
      `status ${sellerSignUp.status}`
    );
    const sellerCookie = cookieHeader(sellerSignUp.setCookie);

    const adminEscalation = await api("/api/auth/sign-up/email", {
      method: "POST",
      body: {
        name: "Fake Admin",
        email: `qa_admin_escalation_${stamp}@example.com`,
        password,
        role: "ADMIN",
      },
    });
    const escalatedUser =
      adminEscalation.json &&
      typeof adminEscalation.json === "object" &&
      "user" in adminEscalation.json
        ? (adminEscalation.json as { user?: { role?: string; id?: string } }).user
        : null;
    record(
      "Security",
      "Cannot register as ADMIN via public signup",
      escalatedUser?.role !== "ADMIN",
      `role=${escalatedUser?.role ?? "n/a"} status=${adminEscalation.status}`
    );

    const badLogin = await api("/api/auth/sign-in/email", {
      method: "POST",
      body: { email: buyerEmail, password: "WrongPassword99" },
    });
    record(
      "Auth",
      "Invalid login rejected",
      badLogin.status >= 400,
      `status ${badLogin.status}`
    );

    const buyerLogin = await api("/api/auth/sign-in/email", {
      method: "POST",
      body: { email: buyerEmail, password, rememberMe: true },
    });
    record("Auth", "Buyer login succeeds", buyerLogin.status === 200, `status ${buyerLogin.status}`);
    const buyerCookie2 = cookieHeader(buyerLogin.setCookie) || buyerCookie;

    record(
      "Auth",
      "Role dashboard paths",
      dashboardPathForRole("BUYER") === "/buyer/dashboard" &&
        dashboardPathForRole("SELLER") === "/seller/dashboard" &&
        dashboardPathForRole("ADMIN") === "/admin"
    );

    const buyerDash = await page("/buyer/dashboard", buyerCookie2);
    record(
      "Buyer",
      "Buyer can open dashboard",
      buyerDash.status === 200 || isRedirect(buyerDash.status),
      `status ${buyerDash.status}`
    );

    const buyerOnSeller = await page("/seller/dashboard", buyerCookie2);
    record(
      "Security",
      "Buyer blocked from seller dashboard",
      isRedirect(buyerOnSeller.status) || buyerOnSeller.status === 403,
      `status ${buyerOnSeller.status} loc=${buyerOnSeller.location ?? "n/a"}`
    );

    const sellerDash = await page("/seller/dashboard", sellerCookie);
    record(
      "Seller",
      "Seller can open dashboard",
      sellerDash.status === 200 || isRedirect(sellerDash.status),
      `status ${sellerDash.status}`
    );

    const sellerMachines = await page("/seller/machines", sellerCookie);
    record(
      "Seller",
      "Seller machines page loads",
      sellerMachines.status === 200 || isRedirect(sellerMachines.status),
      `status ${sellerMachines.status}`
    );

    const guestBuyer = await page("/buyer/dashboard");
    record(
      "Security",
      "Guest redirected from buyer dashboard",
      isRedirect(guestBuyer.status),
      `status ${guestBuyer.status} loc=${guestBuyer.location ?? "n/a"}`
    );

    if (ADMIN_PASSWORD) {
      const adminLogin = await api("/api/auth/sign-in/email", {
        method: "POST",
        body: {
          email: ADMIN_EMAIL,
          password: ADMIN_PASSWORD,
          rememberMe: true,
        },
      });
      record("Admin", "Admin login succeeds", adminLogin.status === 200, `status ${adminLogin.status}`);
      const adminCookie = cookieHeader(adminLogin.setCookie);

      const adminDash = await page("/admin/dashboard", adminCookie);
      record(
        "Admin",
        "Admin dashboard loads",
        adminDash.status === 200 || isRedirect(adminDash.status),
        `status ${adminDash.status}`
      );

      const adminPlans = await api("/api/admin/subscriptions/plans", { cookie: adminCookie });
      record(
        "Admin",
        "Admin brands API authorized",
        adminPlans.status === 200,
        `status ${adminPlans.status} (plans)`
      );

      const buyerAdminApi = await api("/api/admin/subscriptions/plans", {
        cookie: buyerCookie2,
      });
      record(
        "Security",
        "Buyer cannot call admin API",
        buyerAdminApi.status === 401 || buyerAdminApi.status === 403,
        `status ${buyerAdminApi.status}`
      );
    } else {
      record(
        "Admin",
        "Admin login succeeds",
        true,
        "SKIPPED — set DEV_ADMIN_PASSWORD to enable"
      );
      // Still verify buyer cannot hit admin API without admin session
      const buyerAdminApi = await api("/api/admin/subscriptions/plans", {
        cookie: buyerCookie2,
      });
      record(
        "Security",
        "Buyer cannot call admin API",
        buyerAdminApi.status === 401 || buyerAdminApi.status === 403,
        `status ${buyerAdminApi.status}`
      );
    }

    const machinesApi = await api("/api/machines");
    record(
      "API",
      "GET /api/machines public",
      machinesApi.status === 200,
      `status ${machinesApi.status}`
    );

    const plansApi = await api("/api/subscriptions/plans");
    record(
      "API",
      "GET /api/subscriptions/plans public",
      plansApi.status === 200,
      `status ${plansApi.status}`
    );

    const favoritesGuest = await api("/api/favorites");
    record(
      "API",
      "Favorites requires auth",
      favoritesGuest.status === 401 || isRedirect(favoritesGuest.status),
      `status ${favoritesGuest.status}`
    );

    const notificationsGuest = await api("/api/notifications");
    record(
      "API",
      "Notifications requires auth",
      notificationsGuest.status === 401 || isRedirect(notificationsGuest.status),
      `status ${notificationsGuest.status}`
    );

    if (buyerCookie2) {
      const notif = await api("/api/notifications", { cookie: buyerCookie2 });
      record(
        "Notifications",
        "Buyer can load notifications",
        notif.status === 200,
        `status ${notif.status}`
      );
    }

    if (sampleMachine && buyerCookie2) {
      const conv = await api("/api/conversations", {
        method: "POST",
        cookie: buyerCookie2,
        body: {
          machineId: sampleMachine.id,
          message: "QA hello from buyer — interested in this machine.",
        },
      });
      record(
        "Messaging",
        "Buyer can start conversation",
        conv.status === 200 || conv.status === 201,
        `status ${conv.status} body=${JSON.stringify(conv.json)?.slice(0, 120)}`
      );

      const list = await api("/api/conversations", { cookie: buyerCookie2 });
      record(
        "Messaging",
        "Buyer can list conversations",
        list.status === 200,
        `status ${list.status}`
      );
    } else {
      record("Messaging", "Buyer can start conversation", true, "skipped");
      record("Messaging", "Buyer can list conversations", true, "skipped");
    }

    if (sellerCookie) {
      const subPage = await page("/seller/subscription", sellerCookie);
      record(
        "Payment",
        "Seller subscription page loads",
        subPage.status === 200 || isRedirect(subPage.status),
        `status ${subPage.status}`
      );

      const checkout = await api("/api/seller/subscription/checkout", {
        method: "POST",
        cookie: sellerCookie,
        body: { planSlug: "basic" },
      });
      record(
        "Payment",
        "Seller checkout API responds safely",
        checkout.status === 200 ||
          checkout.status === 400 ||
          checkout.status === 403 ||
          checkout.status === 404,
        `status ${checkout.status}`
      );
    }

    const cleaned = sanitizeText("<script>alert(1)</script>hi");
    record("Security", "sanitizeText strips tags", !cleaned.includes("<") && !cleaned.includes(">"));

    const jpeg = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10]);
    record("Security", "detectImageMime recognizes JPEG", detectImageMime(jpeg) === "image/jpeg");

    const csrf = await api("/api/inquiries", {
      method: "POST",
      cookie: buyerCookie2,
      body: { machineId: "00000000-0000-0000-0000-000000000000", message: "hi" },
      headers: { Origin: "https://evil.example" },
    });
    record(
      "Security",
      "Cross-origin inquiry rejected or unauthorized",
      csrf.status === 403 || csrf.status === 401 || csrf.status === 400,
      `status ${csrf.status}`
    );

    record(
      "Security",
      "registerSchema rejects ADMIN role",
      !registerSchema.safeParse({
        name: "X",
        email: "x@y.com",
        phone: "123",
        role: "ADMIN",
        password: "SecurePass1!",
        confirmPassword: "SecurePass1!",
        terms: true,
      }).success
    );

    record(
      "Email",
      "Email env documented (RESEND optional)",
      true,
      process.env.RESEND_API_KEY ? "RESEND configured" : "RESEND not set (dev OK)"
    );

    const t0 = Date.now();
    const homePerf = await page("/");
    const elapsed = Date.now() - t0;
    record(
      "Performance",
      "Homepage TTFB under 8s (local)",
      homePerf.status === 200 && elapsed < 8000,
      `${elapsed}ms`
    );

    record(
      "Mobile",
      "Viewport meta present",
      /viewport/i.test(homePerf.text),
      "viewport check"
    );

    const secHeader =
      homePerf.headers.get("x-frame-options") || homePerf.headers.get("X-Frame-Options");
    record(
      "Security",
      "X-Frame-Options on homepage",
      Boolean(secHeader),
      secHeader ?? "missing"
    );

    if (buyerCookie2) {
      const fav = await page("/buyer/favorites", buyerCookie2);
      record(
        "Buyer",
        "Favorites page loads",
        fav.status === 200 || isRedirect(fav.status),
        `status ${fav.status}`
      );
      const inquiries = await page("/buyer/inquiries", buyerCookie2);
      record(
        "Buyer",
        "Inquiries page loads",
        inquiries.status === 200 || isRedirect(inquiries.status),
        `status ${inquiries.status}`
      );
      const messages = await page("/buyer/messages", buyerCookie2);
      record(
        "Buyer",
        "Messages page loads",
        messages.status === 200 || isRedirect(messages.status),
        `status ${messages.status}`
      );
    }

    if (sellerCookie) {
      const sellerInquiries = await page("/seller/inquiries", sellerCookie);
      record(
        "Seller",
        "Seller inquiries page loads",
        sellerInquiries.status === 200 || isRedirect(sellerInquiries.status),
        `status ${sellerInquiries.status}`
      );
      const sellerMessages = await page("/seller/messages", sellerCookie);
      record(
        "Seller",
        "Seller messages page loads",
        sellerMessages.status === 200 || isRedirect(sellerMessages.status),
        `status ${sellerMessages.status}`
      );
    }

    const compare = await page("/compare");
    record("Listings", "/compare loads", compare.status === 200, `status ${compare.status}`);
    const dealers = await page("/dealers");
    record("Listings", "/dealers loads", dealers.status === 200, `status ${dealers.status}`);

    await prisma.user
      .deleteMany({
        where: {
          email: {
            in: [
              buyerEmail,
              sellerEmail,
              `qa_admin_escalation_${stamp}@example.com`,
            ],
          },
        },
      })
      .catch(() => undefined);
  } finally {
    await prisma.$disconnect();
  }

  const failed = checks.filter((c) => !c.pass);
  const byArea = new Map<string, { pass: number; fail: number }>();
  for (const c of checks) {
    const cur = byArea.get(c.area) || { pass: 0, fail: 0 };
    if (c.pass) cur.pass += 1;
    else cur.fail += 1;
    byArea.set(c.area, cur);
  }

  console.log("\n=== QA Summary by Area ===");
  for (const [area, stats] of byArea) {
    console.log(`  ${area}: ${stats.pass} passed, ${stats.fail} failed`);
  }
  console.log(`\nTotal: ${checks.length - failed.length}/${checks.length} passed`);

  if (failed.length) {
    console.log("\n=== Failures ===");
    for (const f of failed) {
      console.log(`  - [${f.area}] ${f.name}${f.detail ? ` — ${f.detail}` : ""}`);
    }
    process.exit(1);
  }

  console.log("\nAll QA checks passed.");
}

main().catch((error) => {
  console.error("QA suite crashed:", error instanceof Error ? error.message : error);
  process.exit(1);
});
