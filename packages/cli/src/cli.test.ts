import { describe, expect, it } from "vitest";
import { program } from "./index";

describe("cli", () => {
  it("registers validate command", () => {
    expect(program.commands.some((command) => command.name() === "validate")).toBe(true);
  });
});
