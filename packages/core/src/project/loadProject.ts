import { readFile } from "node:fs/promises";
import { StoreShotProjectSchema, type StoreShotProject } from "../schema/project";

export async function loadProject(path: string): Promise<StoreShotProject> {
  const raw = await readFile(path, "utf8");
  return StoreShotProjectSchema.parse(JSON.parse(raw));
}
