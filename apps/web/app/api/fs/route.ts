import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { platform } from "node:os";
import { access } from "node:fs/promises";
import { constants } from "node:fs";
import { join } from "node:path";
import { NextResponse } from "next/server";

const run = promisify(execFile);

interface PickOutcome {
  path: string | null;
  unsupported?: boolean;
}

async function nativePickDirectory(): Promise<PickOutcome> {
  const os = platform();
  try {
    if (os === "darwin") {
      const script = 'POSIX path of (choose folder with prompt "OpenStoreShot: select a project folder")';
      const { stdout } = await run("osascript", ["-e", script], { timeout: 180000 });
      return { path: normalize(stdout) };
    }
    if (os === "linux") {
      const { stdout } = await run("zenity", ["--file-selection", "--directory", "--title=OpenStoreShot"], { timeout: 180000 });
      return { path: normalize(stdout) };
    }
    if (os === "win32") {
      const ps =
        "Add-Type -AssemblyName System.Windows.Forms; $d = New-Object System.Windows.Forms.FolderBrowserDialog; if ($d.ShowDialog() -eq 'OK') { Write-Output $d.SelectedPath }";
      const { stdout } = await run("powershell", ["-NoProfile", "-Command", ps], { timeout: 180000 });
      return { path: normalize(stdout) };
    }
    return { path: null, unsupported: true };
  } catch {
    // Non-zero exit means the user canceled the dialog (or the picker tool is missing).
    return { path: null };
  }
}

function normalize(stdout: string): string | null {
  const trimmed = stdout.trim();
  if (!trimmed) return null;
  return trimmed.length > 1 && trimmed.endsWith("/") ? trimmed.slice(0, -1) : trimmed;
}

async function check(path: string, mode: number): Promise<boolean> {
  try {
    await access(path, mode);
    return true;
  } catch {
    return false;
  }
}

export async function POST(): Promise<Response> {
  const outcome = await nativePickDirectory();
  if (outcome.unsupported) {
    return NextResponse.json({ error: "unsupported_platform" }, { status: 501 });
  }
  if (!outcome.path) {
    return NextResponse.json({ canceled: true });
  }
  const [writable, hasProject] = await Promise.all([
    check(outcome.path, constants.W_OK),
    check(join(outcome.path, "storeshot.project.json"), constants.F_OK)
  ]);
  return NextResponse.json({ path: outcome.path, writable, hasProject });
}
