import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { Page, Browser, chromium } from "playwright";

/**
 * End-to-End Smoke Tests
 *
 * These tests verify the shader-based application works end-to-end.
 * Note: Requires a running development server on localhost:5173
 */
describe("Shader Smoke Tests", () => {
  let browser: Browser;
  let page: Page;
  const BASE_URL = process.env.TEST_URL || "http://localhost:5173";

  beforeAll(async () => {
    browser = await chromium.launch({
      headless: true,
    });

    page = await browser.newPage({
      viewport: { width: 1280, height: 720 },
    });
  });

  afterAll(async () => {
    await browser?.close();
  });

  beforeEach(async () => {
    await page.goto(BASE_URL);
    await page.waitForSelector('[data-testid="winamp-visualizer"]', {
      timeout: 10000,
    });
  });

  describe("application startup", () => {
    it("should load the application successfully", async () => {
      const title = await page.title();
      expect(title).toContain("Winamp");

      const container = await page.$('[data-testid="winamp-visualizer"]');
      expect(container).not.toBeNull();
    });

    it("should render the shader canvas", async () => {
      const canvas = await page.$("canvas");
      expect(canvas).not.toBeNull();

      const box = await canvas?.boundingBox();
      expect(box?.width).toBeGreaterThan(0);
      expect(box?.height).toBeGreaterThan(0);
    });

    it("should have WebGL support", async () => {
      const hasWebGL = await page.evaluate(() => {
        const canvas = document.createElement("canvas");
        const gl = canvas.getContext("webgl");
        return gl !== null;
      });

      expect(hasWebGL).toBe(true);
    });
  });

  describe("UI components", () => {
    it("should display shader selector", async () => {
      const selector = await page.$('[data-testid="visualizer-selector"]');
      expect(selector).not.toBeNull();

      const options = await page.$$('[data-testid="visualizer-option"]');
      expect(options.length).toBeGreaterThanOrEqual(4);
    });

    it("should switch between shaders", async () => {
      const options = await page.$$('[data-testid="visualizer-option"]');
      expect(options.length).toBeGreaterThan(1);

      await options[0].click();
      await page.waitForTimeout(100);

      let activeId = await page.evaluate(() =>
        document
          .querySelector('[data-testid="visualizer-option"].active')
          ?.getAttribute("data-id"),
      );
      expect(activeId).toBeTruthy();

      await options[1].click();
      await page.waitForTimeout(100);

      const nextActiveId = await page.evaluate(() =>
        document
          .querySelector('[data-testid="visualizer-option"].active')
          ?.getAttribute("data-id"),
      );
      expect(nextActiveId).not.toEqual(activeId);
    });
  });
});
