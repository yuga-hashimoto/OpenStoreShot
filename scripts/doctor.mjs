#!/usr/bin/env node
import { existsSync } from "node:fs";
import { execSync } from "node:child_process";

const checks = [];
const agentDefs = [
  { id: "codex", label: "Codex CLI", command: "codex --version", recommended: true },
  { id: "claude", label: "Claude Code", command: "claude --version" },
  { id: "gemini", label: "Gemini CLI", command: "gemini --version" },
  { id: "opencode", label: "OpenCode", command: "opencode --version" },
  { id: "cursor-agent", label: "Cursor Agent", command: "cursor-agent --version" },
  { id: "qwen", label: "Qwen Code", command: "qwen --version" },
  { id: "qodercli", label: "Qoder CLI", command: "qodercli --version" },
  { id: "copilot", label: "GitHub Copilot CLI", command: "copilot --version" }
];

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

const detectedAgents = agentDefs
  .map((agent) => ({ ...agent, version: command(agent.command) }))
  .filter((agent) => Boolean(agent.version));
const selectedAgent = detectedAgents.find((agent) => agent.recommended) ?? detectedAgents[0];
check(
  "local AI agent CLI",
  Boolean(selectedAgent),
  selectedAgent
    ? `${selectedAgent.label} detected${selectedAgent.recommended ? " (recommended)" : ""}`
    : "optional; install any supported local agent CLI"
);

const failed = checks.filter((item) => !item.ok);

for (const item of checks) {
  const mark = item.ok ? "OK" : "MISS";
  console.log(`${mark.padEnd(4)} ${item.name}${item.detail ? ` - ${item.detail}` : ""}`);
}

console.log("");
console.log("Agent setup:");
if (detectedAgents.length > 0) {
  for (const agent of detectedAgents) {
    const badge = agent.id === selectedAgent?.id ? (agent.recommended ? "recommended" : "detected") : "available";
    console.log(`  ${badge.padEnd(11)} ${agent.label} (${agent.id})`);
  }
} else {
  console.log("  No supported agent CLI found on PATH.");
  console.log("  You can still use Manual Studio and CLI render/validate.");
  console.log("  Install any supported local coding agent when you want agent-assisted edits.");
}

console.log("");
if (failed.length > 0) {
  console.log("OpenStoreShot is not ready yet.");
  console.log("Recommended fix:");
  console.log("  corepack enable");
  console.log("  pnpm install");
  console.log("  pnpm run doctor");
  console.log("  See docs/AGENT_SETUP.md");
  process.exitCode = 1;
} else {
  console.log("OpenStoreShot is ready.");
  console.log("Start the studio:");
  console.log("  pnpm demo");
  console.log("");
  console.log("Agent guide:");
  console.log("  docs/AGENT_SETUP.md");
  console.log("");
  console.log("Validate and render the demo:");
  console.log("  pnpm validate:demo");
  console.log("  pnpm render:demo");
}
