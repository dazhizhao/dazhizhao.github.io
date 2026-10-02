import { chromium } from "@playwright/test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";

const base = process.argv[2] || "http://127.0.0.1:4000";
const preview = process.argv.includes("--preview");
const label = preview ? "preview" : base.includes("127.0.0.1") ? "local" : "live";
const output = `output/playwright/${label}`;
await fs.mkdir(output, { recursive: true });
const browser = await chromium.launch();
const errors = [];
const externalFailures = new Set();
const results = [];
// Offscreen lazy images are checked after a visitor scrolls to them.
async function loadLazyImages(page) {
  for (const image of await page.locator('img[loading="lazy"]').all()) {
    await image.scrollIntoViewIfNeeded();
    await image.evaluate((img) => img.decode());
  }
  await page.evaluate(() => window.scrollTo(0, 0));
}
for (const [device, viewport] of Object.entries({ desktop: { width: 1440, height: 1000 }, mobile: { width: 390, height: 844 } })) {
  const context = await browser.newContext({ viewport, deviceScaleFactor: 1, colorScheme: "dark" });
  // Production analytics are retained in the build; localhost is not their registered origin.
  if (label !== "live") {
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
  for (const route of ["/", "/publications/", "/projects/", "/projects/jumpgrad/", "/news/", "/sitemap/", "/cv/"]) {
    const response = await page.goto(base + route, { waitUntil: "networkidle" });
    assert.equal(response.status(), 200, route);
    await page.evaluate(() => document.fonts.ready);
    await loadLazyImages(page);
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
      assert.equal(await page.locator(".news tr").count(), 5);
      assert.equal(await page.locator(".publications li").count(), preview ? 4 : 3);
      assert.deepEqual(await page.locator(".selected-publications .row > div[id]").evaluateAll((els) => els.map((el) => el.id)), [
        "zhao2026autoregressive",
        "zhao2026impact",
        "xie2026diffusion",
        ...(preview ? ["local_preview"] : []),
      ]);
      assert.equal(await page.locator(".projects .project-item").count(), 3);
      const portrait = await page.locator(".profile img").boundingBox();
      assert.equal(Math.round(portrait.width), device === "mobile" ? 180 : 200);
      for (const image of await page.locator(".publications img.preview").all()) {
        const box = await image.boundingBox();
        assert(Math.abs(box.width - box.height) < 1, "Square publication preview");
      }
      assert.match(
        await page.locator("#about .clearfix").innerText(),
        /final year[\s\S]*June 2027[\s\S]*Rui Fan[\s\S]*January to September 2026, I was a Research Intern/
      );
      for (const title of ["News", "Selected Publications", "Projects"]) assert(state.headings.includes(title));
      await page.waitForFunction(() => Array.isArray(document.querySelector("ninja-keys")?.data));
      const searchItems = await page
        .locator("ninja-keys")
        .evaluate((search) => search.data.map(({ title, section, id }) => ({ title, section, id })));
      assert(searchItems.some((item) => item.id === "nav-news"));
      assert.equal(searchItems.filter((item) => item.section === "News").length, 9);
      assert(!searchItems.some((item) => /Differentiable Phase.Field|Shuheng|local_preview/.test(item.title + item.id)));
      if (device === "mobile") {
        await page.locator("button.navbar-toggler").click();
        await page.getByRole("link", { name: "Publications", exact: true }).first().click();
        assert.equal(new URL(page.url()).pathname, "/publications/");
        await page.waitForLoadState("networkidle");
        await page.goto(base + "/", { waitUntil: "networkidle" });
        await loadLazyImages(page);
      }
    }
    if (route === "/publications/") {
      assert.equal(await page.locator(".publication-text-entry").count(), 6);
      assert.equal(await page.locator("article img, article picture").count(), 0);
      assert.equal(await page.locator(".publication-authors strong").count(), 6);
      await page.locator("#bibsearch").fill("material-aware");
      await page.waitForFunction(() => document.querySelectorAll("ol.bibliography > li:not(.unloaded)").length === 1);
      assert(await page.locator("#zhao2026impact").isVisible());
      await page.locator("#bibsearch").fill("");
      await page.waitForFunction(() => document.querySelectorAll("ol.bibliography > li:not(.unloaded)").length === 6);
    }
    if (!preview || route !== "/") assert(!/Differentiable Phase.Field|Shuheng|local_preview/.test(await page.content()));
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
