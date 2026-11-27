#!/usr/bin/env node
// Reads client-config.json and updates site.ts with the client's contact info and price.
// Usage: node scripts/apply-client-config.mjs

import { readFileSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");
const configPath = resolve(root, "client-config.json");
const sitePath = resolve(root, "Code/site/src/content/site.ts");

const config = JSON.parse(readFileSync(configPath, "utf-8"));
let site = readFileSync(sitePath, "utf-8");

// Apply contact info
if (config.contact.whatsapp) {
  site = site.replace(
    /whatsapp: null as string \| null/,
    `whatsapp: "${config.contact.whatsapp}" as string | null`
  );
}
if (config.contact.email) {
  site = site.replace(
    /email: null as string \| null/,
    `email: "${config.contact.email}" as string | null`
  );
}
if (config.contact.instagram) {
  site = site.replace(
    /instagram: null as string \| null/,
    `instagram: "${config.contact.instagram}" as string | null`
  );
}

// Apply price
if (config.price && config.price.amount > 0) {
  site = site.replace(
    /price: null as null \| \{ amount: number; regular\?: number; currency: string \}/,
    `price: { amount: ${config.price.amount}, currency: "${config.price.currency}" } as null | { amount: number; regular?: number; currency: string }`
  );
}

writeFileSync(sitePath, site, "utf-8");

console.log("site.ts updated successfully:");
console.log(`  WhatsApp: ${config.contact.whatsapp || "(not set)"}`);
console.log(`  Email:    ${config.contact.email || "(not set)"}`);
console.log(`  Instagram: ${config.contact.instagram || "(not set)"}`);
console.log(`  Price:    ${config.price?.amount > 0 ? `$${config.price.amount} ${config.price.currency}` : "(not set)"}`);
console.log("\nRun 'npm run build' in Code/site/ to verify the changes.");
