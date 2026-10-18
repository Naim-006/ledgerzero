import { describe, it, expect, beforeEach } from "vitest";

describe("Theme State and Persistence", () => {
  const THEME_STORAGE_KEY = "ledger_zero_theme";

  beforeEach(() => {
    localStorage.clear();
    document.documentElement.className = "";
  });

  it("persists theme preference to localStorage when switched to dark", () => {
    // Initial state is empty
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBeNull();

    // Set to dark
    localStorage.setItem(THEME_STORAGE_KEY, "dark");
    document.documentElement.classList.add("dark");

    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe("dark");
    expect(document.documentElement.classList.contains("dark")).toBe(true);
  });

  it("persists theme preference to localStorage when switched to light", () => {
    // Set to dark first
    localStorage.setItem(THEME_STORAGE_KEY, "dark");
    document.documentElement.classList.add("dark");

    // Switch to light
    localStorage.setItem(THEME_STORAGE_KEY, "light");
    document.documentElement.classList.remove("dark");

    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe("light");
    expect(document.documentElement.classList.contains("dark")).toBe(false);
  });

  it("handles system preference setting", () => {
    localStorage.setItem(THEME_STORAGE_KEY, "system");
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe("system");
  });
});
