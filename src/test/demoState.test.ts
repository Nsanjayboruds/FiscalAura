import { describe, it, expect, beforeEach } from "vitest";
import { clearDemoSessionData } from "../lib/demoState";

describe("demo session state", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("clears stale demo data when a real user session is active", () => {
    localStorage.setItem("fiscalaura_demo_mode", "true");
    localStorage.setItem("fiscalaura_family_profile", "spouse");

    clearDemoSessionData();

    expect(localStorage.getItem("fiscalaura_demo_mode")).toBeNull();
    expect(localStorage.getItem("fiscalaura_family_profile")).toBeNull();
  });
});
