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
async function checkPublicationButtons(entries) {
  for (const entry of await entries.all()) {
    const links = entry.locator(".links a");
    assert.deepEqual(await links.allTextContents(), ["DOI", "BIB", "PDF"]);
    const sizes = await links.evaluateAll((els) =>
      els.map((el) => ({ width: el.getBoundingClientRect().width, height: el.getBoundingClientRect().height }))
    );
    assert(sizes.every((size) => Math.abs(size.width - sizes[0].width) < 1 && Math.abs(size.height - sizes[0].height) < 1));
    await entry.getByRole("button", { name: "BIB", exact: true }).click();
    assert(await entry.locator(".bibtex.hidden").evaluate((panel) => panel.classList.contains("open")));
    assert.match(await entry.locator(".bibtex.hidden").innerText(), /@article/);
    await entry.getByRole("button", { name: "BIB", exact: true }).click();
    assert(!(await entry.locator(".bibtex.hidden").evaluate((panel) => panel.classList.contains("open"))));
  }
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
  for (const route of ["/", "/publications/", "/projects/", "/projects/jumpgrad/", "/sitemap/", "/cv/"]) {
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
    assert(!state.nav.some((s) => /^(CV|Blog|News)$/.test(s)), "CV, Blog, and News must not appear in navigation");
    if (route === "/") {
      assert.equal(await page.locator("#news, .news").count(), 0);
      assert.equal(await page.locator("#publications .equal-contribution-note").count(), 1);
      assert.equal((await page.locator("#about").innerText()).split("† Equal contribution").length - 1, 1);
      assert.equal(await page.locator(".publications li").count(), preview ? 5 : 4);
      assert.deepEqual(await page.locator(".selected-publications .row > div[id]").evaluateAll((els) => els.map((el) => el.id)), [
        "zhao2026autoregressive",
        "zhao2026impact",
        ...(preview ? ["local_preview"] : []),
        "zhang2026failure",
        "xie2026diffusion",
      ]);
      assert.equal(await page.locator(".projects .project-item").count(), 3);
      await checkPublicationButtons(page.locator(".selected-publications .row > div[id]:not(#local_preview)"));
      const portrait = await page.locator(".profile img").boundingBox();
      assert.equal(Math.round(portrait.width), device === "mobile" ? 180 : 200);
      for (const image of await page.locator(".publications img.preview").all()) {
        const dimensions = await image.evaluate((img) => ({
          width: img.getBoundingClientRect().width,
          height: img.getBoundingClientRect().height,
          ratio: img.naturalWidth / img.naturalHeight,
        }));
        assert(Math.abs(dimensions.width / dimensions.ratio - dimensions.height) < 1, "Publication preview must preserve its aspect ratio");
      }
      assert.match(
        await page.locator("#about .clearfix").innerText(),
        /final-year undergraduate[\s\S]*Rui Fan[\s\S]*I previously worked as a research intern[\s\S]*HKUST/
      );
      for (const title of ["Selected Publications", "Projects"]) assert(state.headings.some((heading) => heading.startsWith(title)));
      if (device === "desktop") {
        const spacing = await page.evaluate(() => {
          const profile = document.querySelector("#about .profile");
          const box = profile.getBoundingClientRect();
          const copy = document.querySelector("#about .about-copy");
          const copyBox = copy.getBoundingClientRect();
          const walker = document.createTreeWalker(copy, NodeFilter.SHOW_TEXT);
          const rightEdges = [];
          while (walker.nextNode()) {
            if (!walker.currentNode.textContent.trim()) continue;
            const range = document.createRange();
            range.selectNodeContents(walker.currentNode);
            for (const rect of range.getClientRects()) {
              if (rect.width) rightEdges.push(rect.right);
            }
          }
          return { columnGap: box.left - copyBox.right, textGap: box.left - Math.max(...rightEdges) };
        });
        assert.equal(spacing.columnGap, 60);
        assert(spacing.textGap >= 59, `All About text must stay in its column: ${spacing.textGap}`);
      }
      await page.waitForFunction(() => Array.isArray(document.querySelector("ninja-keys")?.data));
      const searchItems = await page
        .locator("ninja-keys")
        .evaluate((search) => search.data.map(({ title, section, id }) => ({ title, section, id })));
      assert(!searchItems.some((item) => item.id === "nav-news" || item.section === "News"));
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
    if (route === "/" || route === "/projects/") {
      assert.deepEqual(
        await page
          .locator(".project-list-title")
          .allTextContents()
          .then((titles) => titles.map((title) => title.trim())),
        [
          "JumpGrad: Differentiable Optimization through Stochastic Mechanics",
          "GUI for Phase-Field Fracture Simulation",
          "Reinforcement Learning for Torque Control",
        ]
      );
      assert(!/Details|Hackathon|Track 03/.test(await page.locator(".project-list").innerText()));
      for (const project of await page.locator(".project-item").all()) {
        assert.equal(
          await project.locator(".project-list-title a").getAttribute("href"),
          await project.locator(".project-list-repository").getAttribute("href")
        );
      }
    }
    if (route === "/publications/") {
      assert.equal(await page.locator(".publication-text-entry").count(), 6);
      assert.equal(await page.locator("article img, article picture").count(), 0);
      assert.equal(await page.locator(".publication-authors strong").count(), 6);
      await checkPublicationButtons(page.locator(".publication-text-entry"));
      await page.locator("#bibsearch").fill("material-aware");
      await page.waitForFunction(() => document.querySelectorAll("ol.bibliography > li:not(.unloaded)").length === 1);
      assert(await page.locator("#zhao2026impact").isVisible());
      await page.locator("#bibsearch").fill("");
      await page.waitForFunction(() => document.querySelectorAll("ol.bibliography > li:not(.unloaded)").length === 6);
    }
    if (!preview || route !== "/") assert(!/Differentiable Phase.Field|Shuheng|local_preview/.test(await page.content()));
    results.push({ device, route, ...state });
    await page.evaluate(() => window.scrollTo({ top: 0, left: 0, behavior: "instant" }));
    await page.mouse.move(0, 0);
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
  ["/news/", "/"],
  ["/news/2025-07-18/", "/"],
  ["/news/2026-01-28/", "/"],
  ["/news/2026-03-08/", "/"],
  ["/news/2026-03-17/", "/"],
  ["/news/2026-04-18/", "/"],
  ["/news/2026-06-13/", "/"],
  ["/news/2026-08-28/", "/"],
  ["/news/2026-09-17/", "/"],
  ["/news/2026-09/", "/"],
]) {
  await page.goto(base + from, { waitUntil: "networkidle" });
  await page.waitForURL((url) => url.pathname === to);
  results.push({ redirect: from, destination: new URL(page.url()).pathname });
}
await browser.close();
await fs.writeFile(`${output}/report.json`, JSON.stringify({ base, results, errors, externalFailures: [...externalFailures] }, null, 2));
assert.deepEqual(errors, []);
console.log(JSON.stringify({ base, checked: results.length, errors, externalFailures: [...externalFailures] }, null, 2));
