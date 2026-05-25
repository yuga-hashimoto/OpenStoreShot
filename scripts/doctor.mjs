#!/usr/bin/env node
import { existsSync } from "node:fs";
import { execSync } from "node:child_process";

const checks = [];

function check(name, ok, detail = "") {
  checks.push({ name, ok, detail });
}

function command(commandLine) {
  try {
    return execSync(commandLine, { stdio: ["ignore", "pipe", "pipe"], encoding: "utf8" }).trim();
  } catch {
    return "";
  }
}

const nodeMajor = Number(process.versions.node.split(".")[0]);
check("Node.js >= 20", nodeMajor >= 20, process.versions.node);

const pnpmVersion = command("pnpm --version");
check("pnpm is available", Boolean(pnpmVersion), pnpmVersion || "Run: corepack enable");

check("dependencies installed", existsSync("node_modules"), existsSync("node_modules") ? "node_modules found" : "Run: pnpm install");
check("demo project exists", existsSync("examples/demo-project/storeshot.project.json"), "examples/demo-project/storeshot.project.json");
check("web app exists", existsSync("apps/web/app/page.tsx"), "apps/web/app/page.tsx");
check("Codex skill exists", existsSync(".agents/skills/storeshot-designer/SKILL.md"), ".agents/skills/storeshot-designer/SKILL.md");

const failed = checks.filter((item) => !item.ok);

for (const item of checks) {
  const mark = item.ok ? "OK" : "MISS";
  console.log(`${mark.padEnd(4)} ${item.name}${item.detail ? ` - ${item.detail}` : ""}`);
}

console.log("");
if (failed.length > 0) {
  console.log("OpenStoreShot is not ready yet.");
  console.log("Recommended fix:");
  console.log("  corepack enable");
  console.log("  pnpm install");
  console.log("  pnpm run doctor");
  process.exitCode = 1;
} else {
  console.log("OpenStoreShot is ready.");
  console.log("Start the studio:");
  console.log("  pnpm demo");
  console.log("");
  console.log("Validate and render the demo:");
  console.log("  pnpm validate:demo");
  console.log("  pnpm render:demo");
}
