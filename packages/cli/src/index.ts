#!/usr/bin/env node
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { Command } from "commander";
import { validateProject } from "@openstoreshot/core";
import { loadProject } from "@openstoreshot/core/node";
import { renderProject } from "@openstoreshot/renderer";
import { AppStoreAdapter, GooglePlayAdapter } from "@openstoreshot/store-fetch";
import { buildBackgroundPrompt, MockImageGenerationProvider } from "@openstoreshot/imagegen";

const program = new Command();
program.name("storeshot").description("OpenStoreShot CLI").version("0.1.0");

function resolveInputPath(path: string): string {
  if (path.startsWith("/")) return path;
  return resolve(process.env.INIT_CWD ?? process.cwd(), path);
}

program.command("init").description("Create a starter storeshot.project.json").action(async () => {
  const target = resolve("storeshot.project.json");
  await writeFile(target, JSON.stringify({ schemaVersion: "0.1.0", projectId: "new-project", name: "New StoreShot Project" }, null, 2));
  console.log(`Created ${target}`);
});

program.command("dev").description("Start the web studio").action(() => {
  console.log("Run: pnpm --filter @openstoreshot/web dev");
});

program.command("validate <project>").description("Validate a StoreShot project").action(async (projectPath) => {
  const project = await loadProject(resolveInputPath(projectPath));
  const issues = validateProject(project);
  console.log(JSON.stringify({ ok: !issues.some((issue) => issue.severity === "error"), issues }, null, 2));
  if (issues.some((issue) => issue.severity === "error")) process.exitCode = 1;
});

program.command("render <project>").description("Render all artboards").option("-o, --output <dir>", "Output directory").action(async (projectPath, options) => {
  const resolvedProjectPath = resolveInputPath(projectPath);
  const project = await loadProject(resolvedProjectPath);
  const outputDir = options.output ? resolveInputPath(options.output) : resolve(dirname(resolvedProjectPath), "exports");
  const outputs = await renderProject(project, { outputDir });
  console.log(JSON.stringify({ outputs }, null, 2));
});

program.command("export <project>").description("Export filtered artboards").option("--platform <platform>").option("--locale <locale>").option("--format <format>", "png or jpeg").option("-o, --output <dir>").action(async (projectPath, options) => {
  const resolvedProjectPath = resolveInputPath(projectPath);
  const project = await loadProject(resolvedProjectPath);
  const outputDir = options.output ? resolveInputPath(options.output) : resolve(dirname(resolvedProjectPath), "exports");
  await mkdir(outputDir, { recursive: true });
  const outputs = await renderProject(project, { outputDir, platform: options.platform, locale: options.locale, format: options.format });
  console.log(JSON.stringify({ outputs }, null, 2));
});

const ref = program.command("ref").description("Fetch reference gallery data");
ref.command("appstore").option("--country <country>", "Storefront country", "jp").option("--feed <feed>", "Chart/feed", "top-free").option("--keyword <keyword>", "Keyword", "productivity").option("--limit <limit>", "Limit", "20").action(async (options) => {
  const data = await new AppStoreAdapter().search({ ...options, limit: Number(options.limit) });
  console.log(JSON.stringify(data, null, 2));
});
ref.command("play").option("--country <country>", "Country", "jp").option("--category <category>", "Category", "productivity").option("--limit <limit>", "Limit", "20").action(async (options) => {
  const data = await new GooglePlayAdapter().search({ ...options, limit: Number(options.limit) });
  console.log(JSON.stringify(data, null, 2));
});

program.command("imagegen").argument("<kind>", "background").requiredOption("--project <project>").option("--slide <slide>").option("--style <style>", "premium-gradient").action(async (_kind, options) => {
  const resolvedProjectPath = resolveInputPath(options.project);
  const project = await loadProject(resolvedProjectPath);
  const prompt = buildBackgroundPrompt({ appName: project.app.name, category: project.app.category, style: options.style, tone: project.brand.tone });
  const provider = new MockImageGenerationProvider();
  const image = await provider.generateImage(prompt, { size: "1024x500", outputDir: resolve(dirname(resolvedProjectPath), "assets/generated"), metadata: { slideId: options.slide } });
  console.log(JSON.stringify(image, null, 2));
});

if (import.meta.url === `file://${process.argv[1]}`) {
  program.parseAsync(process.argv).catch((error) => {
    console.error(error);
    process.exit(1);
  });
}

export { program };
