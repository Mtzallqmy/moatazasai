/**
 * يتحقق أن package.json و package-lock.json متوافقان (يمنع drift في CI).
 */
import { readFileSync } from "node:fs";
const pkg = JSON.parse(readFileSync("package.json", "utf8"));
const lock = JSON.parse(readFileSync("package-lock.json", "utf8"));
const lockDeps = lock?.packages?.[""]?.dependencies ?? {};
const mismatches = [];
for (const [name, version] of Object.entries(pkg.dependencies ?? {})) {
  if (lockDeps[name] && lockDeps[name] !== version) {
    mismatches.push(`${name}: package.json=${version}, lock=${lockDeps[name]}`);
  }
}
if (mismatches.length > 0) {
  console.error("Lock drift:\n" + mismatches.join("\n"));
  process.exit(1);
}
console.log("package.json / package-lock.json consistent");
