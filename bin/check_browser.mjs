import { chromium } from "@playwright/test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";

const base = process.argv[2] || "http://127.0.0.1:4000";
const label = base.includes("127.0.0.1") ? "local" : "live";
const output = `output/playwright/${label}`;
await fs.mkdir(output, { recursive: true });
const browser = await chromium.launch();
const errors = [];
const externalFailures = new Set();
const results = [];
for (const [device, viewport] of Object.entries({ desktop: { width: 1440, height: 1000 }, mobile: { width: 390, height: 844 } })) {
  const context = await browser.newContext({ viewport, deviceScaleFactor: 1, colorScheme: "dark" });
  // Production analytics are retained in the build; localhost is not their registered origin.
  if (label === "local") {
    await context.route("https://www.googletagmanager.com/**", (route) => route.fulfill({ contentType: "application/javascript", body: "" }));
    await context.route("https://static.cloudflareinsights.com/**", (route) => route.fulfill({ contentType: "application/javascript", body: "" }));
  }
  const page = await context.newPage();
  page.on("pageerror", (e) => errors.push(`${device}: ${e.message}`));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(`${device}: console: ${message.text()}`);
  });
  page.on("requestfailed", (request) => {
    if (request.url().startsWith(base)) errors.push(`${device}: failed ${request.url()}`);
    else externalFailures.add(`${new URL(request.url()).origin}${new URL(request.url()).pathname}: ${request.failure()?.errorText}`);
  });
  page.on("response", (response) => {
    if (response.status() >= 400 && response.url().startsWith(base)) errors.push(`${device}: ${response.status()} ${response.url()}`);
  });
  for (const route of ["/", "/publications/", "/projects/", "/news/", "/cv/"]) {
    const response = await page.goto(base + route, { waitUntil: "networkidle" });
    assert.equal(response.status(), 200, route);
    await page.evaluate(() => document.fonts.ready);
    const state = await page.evaluate(() => ({
      overflow: document.documentElement.scrollWidth > innerWidth + 1,
      background: getComputedStyle(document.body).backgroundColor,
      brokenImages: [...document.images].filter((i) => !i.complete || i.naturalWidth === 0).map((i) => i.src),
      headings: [...document.querySelectorAll("h1, h2")].map((h) => h.textContent.trim()),
      nav: [...document.querySelectorAll("header .nav-link")].map((a) => a.textContent.trim()),
    }));
    assert.equal(state.overflow, false, `${device} ${route}: horizontal overflow`);
    assert.equal(state.background, "rgb(255, 255, 255)", `${device} ${route}: background`);
    assert.deepEqual(state.brokenImages, [], `${device} ${route}: images`);
    assert(!state.nav.some((s) => /^(CV|Blog)$/.test(s)), "CV and Blog must not appear in navigation");
    if (route === "/") {
      assert.equal(await page.locator(".news tr").count(), 6);
      assert.equal(await page.locator(".publications li").count(), 3);
      assert.equal(await page.locator(".projects .card").count(), 2);
      for (const title of ["News", "Selected Publications", "Projects"]) assert(state.headings.includes(title));
      if (device === "mobile") {
        await page.locator("button.navbar-toggler").click();
        await page.getByRole("link", { name: "Publications", exact: true }).first().click();
        assert.equal(new URL(page.url()).pathname, "/publications/");
        await page.waitForLoadState("networkidle");
        await page.goto(base + "/", { waitUntil: "networkidle" });
      }
    }
    results.push({ device, route, ...state });
    await page.screenshot({ path: `${output}/${device}-${route.replaceAll("/", "") || "about"}.png`, fullPage: true });
  }
  await context.close();
}
const context = await browser.newContext();
const page = await context.newPage();
for (const [from, to] of [
  ["/about/", "/"],
  ["/about.html", "/"],
  ["/cv-json/", "/cv/"],
  ["/resume", "/cv/"],
  ["/resume-json", "/cv/"],
  ["/portfolio/", "/projects/"],
]) {
  await page.goto(base + from, { waitUntil: "networkidle" });
  await page.waitForURL((url) => url.pathname === to);
  results.push({ redirect: from, destination: new URL(page.url()).pathname });
}
await browser.close();
await fs.writeFile(`${output}/report.json`, JSON.stringify({ base, results, errors, externalFailures: [...externalFailures] }, null, 2));
assert.deepEqual(errors, []);
console.log(JSON.stringify({ base, checked: results.length, errors, externalFailures: [...externalFailures] }, null, 2));
