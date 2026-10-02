# Dazhi Zhao's personal website

Personal academic website at [dazhizhao.github.io](https://dazhizhao.github.io), built with [al-folio](https://github.com/alshedivat/al-folio).

## Framework

The October 2026 migration uses the official al-folio v1 starter at commit `40c06007dab344970b681ba63b2241b1a8209ec1`, with `al_folio_core` 1.0.15 and the upstream plugin versions locked in `Gemfile.lock`. Layouts, styles, and browser runtime come from the al-folio gems.

Local runtime overrides are `_layouts/about.liquid`, `_includes/figure.liquid`, `_includes/news.liquid`, `_includes/selected_papers.liquid`, `assets/css/main.scss`, and `assets/js/bibsearch.js`. They retain capitalized section titles and old homepage anchors, share the compact project list, optimize image delivery, show month-only dates where appropriate, and support private local publication previews. The bibliography search override passes a callback to its debounce timer so filtering does not trigger a Content Security Policy error. `.al-folio-overrides.yml` records the reviewed upstream versions. `_layouts/bib_text.liquid` renders the full Publications page without thumbnails.

## Content

| Content                                                         | Source                     |
| --------------------------------------------------------------- | -------------------------- |
| Biography and research interests                                | `_pages/about.md`          |
| Public publications                                             | `_bibliography/papers.bib` |
| Existing publication details and the unlisted conference record | `_pages/publication/`      |
| Projects                                                        | `_projects/`               |
| News                                                            | `_news/`                   |
| CV data                                                         | `assets/json/resume.json`  |
| Contact and social links                                        | `_data/socials.yml`        |
| Profile, publication figures, and icons                         | `assets/img/`              |

The CV remains accessible at `/cv/` for compatibility and is omitted from navigation. There is no CV PDF or Blog. The conference record retains its original address and stays outside publication lists. Original image URLs under `/images/` remain available as static copies.

The October 2026 update uses the latest CV and publisher/Crossref metadata for six public papers. `publication_order` in the BibTeX source sets their CV order without changing dates. Only the first three are selected for the homepage. Dagger markers identify equal contribution. The six-paper public list was also compared with the Google Scholar profile.

News has been restored at the owner's request: the six historical entries plus IJDM publication (August 28), npj publication (September 17), and completion of the HKUST internship (September 2026). The homepage shows the five newest entries; All News preserves the complete archive and original detail URLs. `docs/migration-manifest.json` retains the original content inventory and resource hashes.

The two original projects remain intact. JumpGrad is listed first; its description and the diagram on its detail page come from the [public repository README](https://github.com/dazhizhao/stochastic-stick-slip-tesseract). The diagram is copied unchanged from commit `f04d3c37156d871dc18d5d149c7584c25f162de8` and is covered by that repository's [Apache 2.0 license](https://github.com/dazhizhao/stochastic-stick-slip-tesseract/blob/main/LICENSE).

## Local development

Use Ruby 3.4.9 and Node.js 24. On this Mac, add `/opt/homebrew/opt/ruby@3.4/bin` to `PATH` before running Bundler.

```sh
bundle install
npm ci
JEKYLL_ENV=production bundle exec jekyll build
bundle exec ruby bin/check_site.rb
JEKYLL_ENV=production bundle exec jekyll serve --host 127.0.0.1 --port 4000
```

Open `http://127.0.0.1:4000`. The site uses an empty `baseurl`. Automatic image conversion is disabled. Two checked-in WebP copies (quality 85) serve the portrait at 600px and the static publication preview at 800px. `_data/image_metadata.yml` maps these copies and the original dimensions; the originals remain available as fallbacks and at their existing URLs. GIF files are unchanged. The portrait loads eagerly with high priority, homepage publication previews load lazily, and the text-only Publications page requests no preview images. Regenerating the two static copies requires an image converter with WebP support; the site build does not.

With the local server running, check desktop/mobile rendering, navigation, resources, and redirects:

```sh
npx playwright install chromium
npm run test:browser
npm run lint:prettier
bundle exec al-folio upgrade audit
bundle exec al-folio upgrade overrides audit
```

Screenshots and the browser report are written to ignored `output/playwright/` files. To check the deployed site, run `npm run test:browser -- https://dazhizhao.github.io`.

## Private local publication preview

`_bibliography/local-preview.bib` is ignored by Git and excluded from site output. Keep private publication records only in this file. The public bibliography uses the explicit `papers.bib` file, not a wildcard. The Selected Publications include reads the private file only when it exists and `JEKYLL_ENV=development`; it appends those entries after the three public selections. Production never renders the file, even when it exists locally. Do not publish a private CV PDF.

```sh
JEKYLL_ENV=development bundle exec jekyll serve --destination output/local-preview --host 127.0.0.1 --port 4001
# In another terminal:
npm run test:browser -- http://127.0.0.1:4001 --preview
```

The checked-in square `blank.svg` is a neutral preview placeholder. Replace its `preview` field with a real GIF filename when ready. Before pushing, build in production mode and run `bin/check_site.rb`; it scans every generated artifact for private publication markers, including HTML, search JavaScript, feeds, sitemap, and bibliography output. Browser checks verify three public selections and four local selections. Ignored screenshots and reports must stay outside Git.

## Deployment and rollback

GitHub Pages uses the **GitHub Actions** publishing source. `.github/workflows/deploy.yml` builds pushes to `master` and `codex/**`, pull requests to `master`, and manual runs. Only `master` deploys, using the GitHub Pages artifact actions. Dependencies and the Ruby version match local development.

The original Google Analytics and Cloudflare Web Analytics identifiers are configured in `_config.yml`. No credentials or personal access tokens are required in the repository.

The academic content update has a rollback tag `pre-profile-update-2026-10-02` at `17095f0bf9af87bc151a70bf77e3b606243198f5`. Revert the content update commit and push the revert to restore that version through the existing Actions workflow.

The pre-migration source is tagged `pre-al-folio-2026-10-02` at `8bd545050f458996fab76dd255670b30aa50fece`. To roll back the framework, revert the migration commit and any migration-fix commits, push the revert to `master`, then restore Pages to **Deploy from a branch**, `master`, `/ (root)`. Verify the legacy Pages build and the live site. This preserves subsequent Git history.

al-folio is MIT-licensed; see `LICENSE`. The previous framework's license is retained in `docs/academic-pages-LICENSE`.
