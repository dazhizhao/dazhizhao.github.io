# Dazhi Zhao's personal website

Personal academic website at [dazhizhao.github.io](https://dazhizhao.github.io), built with [al-folio](https://github.com/alshedivat/al-folio).

## Framework

The October 2026 migration uses the official al-folio v1 starter at commit `40c06007dab344970b681ba63b2241b1a8209ec1`, with `al_folio_core` 1.0.15 and the upstream plugin versions locked in `Gemfile.lock`. Layouts, styles, and browser runtime come from the al-folio gems.

Local runtime overrides are `_layouts/about.liquid` and `assets/css/main.scss`. They retain capitalized section titles and old homepage anchors, display the shared compact project list, and load `_sass/_site.scss` for the smaller portrait and contact icons. The project list is shared with the Projects page through `_includes/project-list.liquid`. `.al-folio-overrides.yml` records the reviewed upstream versions.

## Content

| Content                                                         | Source                     |
| --------------------------------------------------------------- | -------------------------- |
| Biography and research interests                                | `_pages/about.md`          |
| News                                                            | `_news/`                   |
| Displayed publications                                          | `_bibliography/papers.bib` |
| Existing publication details and the unlisted conference record | `_pages/publication/`      |
| Projects                                                        | `_projects/`               |
| CV data                                                         | `assets/json/resume.json`  |
| Contact and social links                                        | `_data/socials.yml`        |
| Profile, publication figures, and icons                         | `assets/img/`              |

The CV remains accessible at `/cv/` for compatibility and is omitted from navigation. There is no CV PDF or Blog. The conference record retains its original address and stays outside publication lists. Original image URLs under `/images/` remain available as static copies.

The migration preserves the previous site's personal content, dates, and external links. `docs/migration-manifest.json` records migrated entries and original resource checksums. The previous Academic Pages examples and all al-folio demo content are excluded.

## Local development

Use Ruby 3.4.9 and Node.js 24. On this Mac, add `/opt/homebrew/opt/ruby@3.4/bin` to `PATH` before running Bundler.

```sh
bundle install
npm ci
JEKYLL_ENV=production bundle exec jekyll build
bundle exec ruby bin/check_site.rb
bundle exec jekyll serve --host 127.0.0.1 --port 4000
```

Open `http://127.0.0.1:4000`. The site uses an empty `baseurl`. Image conversion is disabled to retain the original images and animated GIFs.

With the local server running, check desktop/mobile rendering, navigation, resources, and redirects:

```sh
npx playwright install chromium
npm run test:browser
npm run lint:prettier
bundle exec al-folio upgrade audit
bundle exec al-folio upgrade overrides audit
```

Screenshots and the browser report are written to ignored `output/playwright/` files. To check the deployed site, run `npm run test:browser -- https://dazhizhao.github.io`.

## Deployment and rollback

GitHub Pages uses the **GitHub Actions** publishing source. `.github/workflows/deploy.yml` builds pushes to `master` and `codex/**`, pull requests to `master`, and manual runs. Only `master` deploys, using the GitHub Pages artifact actions. Dependencies and the Ruby version match local development.

The original Google Analytics and Cloudflare Web Analytics identifiers are configured in `_config.yml`. No credentials or personal access tokens are required in the repository.

The pre-migration source is tagged `pre-al-folio-2026-10-02` at `8bd545050f458996fab76dd255670b30aa50fece`. To roll back the framework, revert the migration commit and any migration-fix commits, push the revert to `master`, then restore Pages to **Deploy from a branch**, `master`, `/ (root)`. Verify the legacy Pages build and the live site. This preserves subsequent Git history.

al-folio is MIT-licensed; see `LICENSE`. The previous framework's license is retained in `docs/academic-pages-LICENSE`.
