/**
 * Upload CSS skin files & i18n JSON files to Cloudflare R2 CDN
 *
 * CSS (src/assets/*.css):
 *   library/style/<filename>.css              ← always latest
 *   library/style/<filename>.min.css          ← always latest (minified)
 *   library/style/v<version>/<filename>.css          ← version-pinned
 *   library/style/v<version>/<filename>.min.css      ← version-pinned (minified)
 *
 * i18n (src/assets/*.json):
 *   library/language/<lng>.json                ← always latest
 *   library/language/v<version>/<lng>.json     ← version-pinned
 *
 * The version comes from package.json so it stays in sync with npm releases.
 *
 * Usage:  node scripts/r2.mjs
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import CleanCSS from "clean-css";
import dotenv from "dotenv";

// ── resolve paths ──────────────────────────────────────────────────────
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..");

dotenv.config({ path: path.join(ROOT, ".env") });

// ── read package version ───────────────────────────────────────────────
const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, "package.json"), "utf-8"));
const VERSION = pkg.version;

// ── R2 / S3 client ────────────────────────────────────────────────────
const {
  R2_ACCESS_KEY_ID,
  R2_SECRET_ACCESS_KEY,
  ACCOUNT_ID,
  R2_BUCKET_NAME,
  R2_ENDPOINT,
  ZONE_ID,
  CF_API_TOKEN,
} = process.env;

if (!R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY || !ACCOUNT_ID || !R2_BUCKET_NAME) {
  console.error("❌ Missing R2 credentials in .env");
  process.exit(1);
}

if (!ZONE_ID || !CF_API_TOKEN) {
  console.warn("⚠️  Missing ZONE_ID or CF_API_TOKEN in .env — cache purge will be skipped");
}

const CDN_ORIGIN = `https://${R2_ENDPOINT || "cdn.ebig.co"}`;

const s3 = new S3Client({
  region: "auto",
  endpoint: `https://${ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID,
    secretAccessKey: R2_SECRET_ACCESS_KEY,
  },
});

// ── helpers ────────────────────────────────────────────────────────────
const minifier = new CleanCSS({ level: 2 });

async function upload(key, body, contentType = "text/css") {
  const cmd = new PutObjectCommand({
    Bucket: R2_BUCKET_NAME,
    Key: key,
    Body: body,
    ContentType: contentType,
    CacheControl: "public, max-age=31536000, immutable",
    Metadata: { version: VERSION },
  });
  await s3.send(cmd);
}

/**
 * Purge Cloudflare CDN cache for the given file URLs.
 * Cloudflare allows up to 30 URLs per purge request.
 */
async function purgeCache(urls) {
  if (!ZONE_ID || !CF_API_TOKEN || urls.length === 0) return;

  // Cloudflare purge API accepts max 30 files per request
  const BATCH_SIZE = 30;
  for (let i = 0; i < urls.length; i += BATCH_SIZE) {
    const batch = urls.slice(i, i + BATCH_SIZE);
    const res = await fetch(
      `https://api.cloudflare.com/client/v4/zones/${ZONE_ID}/purge_cache`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${CF_API_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ files: batch }),
      }
    );
    const data = await res.json();
    if (!data.success) {
      console.error("  ⚠️  Cache purge failed:", JSON.stringify(data.errors));
    }
  }
}

// ── main ───────────────────────────────────────────────────────────────
const ASSETS_DIR = path.join(ROOT, "src", "assets");
const cssFiles = fs.readdirSync(ASSETS_DIR).filter((f) => f.endsWith(".css"));

if (cssFiles.length === 0) {
  console.log("⚠️  No CSS files found in src/assets/");
}

console.log(`\n📦  ebig-library v${VERSION}`);
console.log(`📂  Found ${cssFiles.length} CSS file(s) in src/assets/\n`);

// Collect latest URLs for cache purge (versioned paths are new, no purge needed)
const urlsToPurge = [];

for (const file of cssFiles) {
  const raw = fs.readFileSync(path.join(ASSETS_DIR, file), "utf-8");
  const minified = minifier.minify(raw).styles;
  const baseName = path.basename(file, ".css");

  // Keys for latest (always overwritten)
  const latestOriginal = `library/style/${file}`;
  const latestMinified = `library/style/${baseName}.min.css`;

  // Keys for versioned (immutable per release)
  const versionedOriginal = `library/style/v${VERSION}/${file}`;
  const versionedMinified = `library/style/v${VERSION}/${baseName}.min.css`;

  // Upload all 4 variants
  await upload(latestOriginal, raw);
  await upload(latestMinified, minified);
  await upload(versionedOriginal, raw);
  await upload(versionedMinified, minified);

  // Track latest URLs for cache purge
  urlsToPurge.push(`${CDN_ORIGIN}/${latestOriginal}`);
  urlsToPurge.push(`${CDN_ORIGIN}/${latestMinified}`);

  console.log(`  ✅  ${file}`);
  console.log(`      latest:    ${latestOriginal}  |  ${latestMinified}`);
  console.log(`      v${VERSION}:  ${versionedOriginal}  |  ${versionedMinified}`);
}

// ── upload i18n JSON files ─────────────────────────────────────────────
const jsonFiles = fs.readdirSync(ASSETS_DIR).filter((f) => f.endsWith(".json"));

if (jsonFiles.length > 0) {
  console.log(`\n🌐  Found ${jsonFiles.length} language file(s) in src/assets/\n`);

  for (const file of jsonFiles) {
    const raw = fs.readFileSync(path.join(ASSETS_DIR, file), "utf-8");

    // Latest
    const latestKey = `library/language/${file}`;
    // Versioned
    const versionedKey = `library/language/v${VERSION}/${file}`;

    await upload(latestKey, raw, "application/json");
    await upload(versionedKey, raw, "application/json");

    urlsToPurge.push(`${CDN_ORIGIN}/${latestKey}`);

    console.log(`  ✅  ${file}`);
    console.log(`      latest:    ${latestKey}`);
    console.log(`      v${VERSION}:  ${versionedKey}`);
  }
}

// ── purge Cloudflare cache for latest paths ────────────────────────────
if (ZONE_ID && CF_API_TOKEN) {
  console.log(`\n🧹  Purging Cloudflare cache for ${urlsToPurge.length} latest URLs...`);
  await purgeCache(urlsToPurge);
  console.log(`  ✅  Cache purged`);
} else {
  console.log(`\n⚠️  Skipping cache purge (no ZONE_ID / CF_API_TOKEN)`);
}

console.log(`\n🚀  Done! All files uploaded to R2 bucket "${R2_BUCKET_NAME}"`);
console.log(`\n    CSS (latest):`);
console.log(`      https://cdn.ebig.co/library/style/<file>.css`);
console.log(`      https://cdn.ebig.co/library/style/<file>.min.css`);
console.log(`    CSS (pinned to v${VERSION}):`);
console.log(`      https://cdn.ebig.co/library/style/v${VERSION}/<file>.css`);
console.log(`      https://cdn.ebig.co/library/style/v${VERSION}/<file>.min.css`);
console.log(`\n    i18n (latest):`);
console.log(`      https://cdn.ebig.co/library/language/<lng>.json`);
console.log(`    i18n (pinned to v${VERSION}):`);
console.log(`      https://cdn.ebig.co/library/language/v${VERSION}/<lng>.json\n`);
