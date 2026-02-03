import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { Page, Browser, chromium } from 'playwright';

/**
 * End-to-End Smoke Tests
 * 
 * These tests verify the complete application works end-to-end
 * Note: Requires a running development server on localhost:5173
 */
describe('Visualizer Smoke Tests', () => {
  let browser: Browser;
  let page: Page;
  const BASE_URL = process.env.TEST_URL || 'http://localhost:5173';

  beforeAll(async () => {
    // Launch browser for testing
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
    // Navigate to app before each test
    await page.goto(BASE_URL);
    // Wait for app to load
    await page.waitForSelector('[data-testid="winamp-visualizer"]', { timeout: 10000 });
  });

  describe('application startup', () => {
    it('should load the application successfully', async () => {
      // Check page title
      const title = await page.title();
      expect(title).toContain('Winamp');
      
      // Check that main container is present
      const container = await page.$('[data-testid="winamp-visualizer"]');
      expect(container).not.toBeNull();
    });

    it('should render the visualizer canvas', async () => {
      // Canvas should be present
      const canvas = await page.$('canvas');
      expect(canvas).not.toBeNull();
      
      // Canvas should have dimensions
      const box = await canvas?.boundingBox();
      expect(box?.width).toBeGreaterThan(0);
      expect(box?.height).toBeGreaterThan(0);
    });

    it('should have WebGL support', async () => {
      const hasWebGL = await page.evaluate(() => {
        const canvas = document.createElement('canvas');
        const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
        return gl !== null;
      });
      
      expect(hasWebGL).toBe(true);
    });
  });

  describe('UI components', () => {
    it('should display the title bar', async () => {
      const titleBar = await page.$('[data-testid="title-bar"]');
      expect(titleBar).not.toBeNull();
      
      // Should show app name
      const text = await titleBar?.textContent();
      expect(text).toContain('Winamp');
    });

    it('should display playback controls', async () => {
      const controls = await page.$('[data-testid="controls"]');
      expect(controls).not.toBeNull();
      
      // Should have play button
      const playBtn = await page.$('[data-testid="play-btn"]');
      expect(playBtn).not.toBeNull();
      
      // Should have pause button
      const pauseBtn = await page.$('[data-testid="pause-btn"]');
      expect(pauseBtn).not.toBeNull();
      
      // Should have stop button
      const stopBtn = await page.$('[data-testid="stop-btn"]');
      expect(stopBtn).not.toBeNull();
    });

    it('should display visualizer selector', async () => {
      const selector = await page.$('[data-testid="visualizer-selector"]');
      expect(selector).not.toBeNull();
      
      // Should have multiple visualizer options
      const options = await page.$$('[data-testid="visualizer-option"]');
      expect(options.length).toBeGreaterThanOrEqual(2);
    });

    it('should display volume control', async () => {
      const volume = await page.$('[data-testid="volume-control"]');
      expect(volume).not.toBeNull();
    });
  });

  describe('playback functionality', () => {
    it('should play demo audio', async () => {
      // Click play button
      await page.click('[data-testid="play-btn"]');
      
      // Wait for audio to start
      await page.waitForTimeout(100);
      
      // Check that visualizer is active (canvas should be updating)
      const isAnimating = await page.evaluate(() => {
        const canvas = document.querySelector('canvas');
        if (!canvas) return false;
        
        // Check if getContext was called
        return !!(canvas as any).__webglContext;
      });
      
      expect(isAnimating).toBe(true);
    });

    it('should pause audio', async () => {
      // First start playback
      await page.click('[data-testid="play-btn"]');
      await page.waitForTimeout(100);
      
      // Then pause
      await page.click('[data-testid="pause-btn"]');
      await page.waitForTimeout(100);
      
      // Check paused state
      const isPaused = await page.evaluate(() => {
        return document.body.classList.contains('paused');
      });
      
      expect(isPaused).toBe(true);
    });

    it('should stop audio', async () => {
      // First start playback
      await page.click('[data-testid="play-btn"]');
      await page.waitForTimeout(100);
      
      // Then stop
      await page.click('[data-testid="stop-btn"]');
      await page.waitForTimeout(100);
      
      // Check stopped state
      const isStopped = await page.evaluate(() => {
        return document.body.classList.contains('stopped');
      });
      
      expect(isStopped).toBe(true);
    });

    it('should adjust volume', async () => {
      // Get volume control
      const volumeSlider = await page.$('[data-testid="volume-slider"]');
      expect(volumeSlider).not.toBeNull();
      
      // Set volume to 50%
      const box = await volumeSlider?.boundingBox();
      if (box) {
        await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
      }
      
      // Check volume value
      const volume = await page.evaluate(() => {
        return (window as any).__TEST_VOLUME;
      });
      
      expect(volume).toBeGreaterThan(0);
      expect(volume).toBeLessThanOrEqual(1);
    });
  });

  describe('visualizer switching', () => {
    it('should switch between visualizers', async () => {
      // Get available visualizers
      const options = await page.$$('[data-testid="visualizer-option"]');
      expect(options.length).toBeGreaterThan(1);
      
      // Click first visualizer
      await options[0].click();
      await page.waitForTimeout(100);
      
      let activeId = await page.evaluate(() => {
        return document.querySelector('[data-testid="visualizer-option"].active')?.getAttribute('data-id');
      });
      expect(activeId).toBeTruthy();
      
      // Click second visualizer
      await options[1].click();
      await page.waitForTimeout(100);
      
      const newActiveId = await page.evaluate(() => {
        return document.querySelector('[data-testid="visualizer-option"].active')?.getAttribute('data-id');
      });
      expect(newActiveId).toBeTruthy();
      expect(newActiveId).not.toBe(activeId);
    });

    it('should cycle through visualizers with keyboard', async () => {
      // Start with a visualizer
      await page.keyboard.press('ArrowRight');
      await page.waitForTimeout(100);
      
      const activeId1 = await page.evaluate(() => {
        return document.querySelector('[data-testid="visualizer-option"].active')?.getAttribute('data-id');
      });
      
      // Cycle to next
      await page.keyboard.press('ArrowRight');
      await page.waitForTimeout(100);
      
      const activeId2 = await page.evaluate(() => {
        return document.querySelector('[data-testid="visualizer-option"].active')?.getAttribute('data-id');
      });
      
      expect(activeId2).not.toBe(activeId1);
    });
  });

  describe('theme switching', () => {
    it('should switch themes', async () => {
      // Get theme selector
      const themeBtn = await page.$('[data-testid="theme-btn"]');
      expect(themeBtn).not.toBeNull();
      
      // Get initial theme
      const initialTheme = await page.evaluate(() => {
        return document.body.getAttribute('data-theme');
      });
      
      // Click theme button
      await themeBtn?.click();
      await page.waitForTimeout(100);
      
      // Check theme changed
      const newTheme = await page.evaluate(() => {
        return document.body.getAttribute('data-theme');
      });
      
      expect(newTheme).not.toBe(initialTheme);
    });
  });

  describe('performance', () => {
    it('should maintain 60fps during playback', async () => {
      // Start playback
      await page.click('[data-testid="play-btn"]');
      
      // Wait a bit for rendering to stabilize
      await page.waitForTimeout(500);
      
      // Measure frame times
      const frameTimes = await page.evaluate(async () => {
        const times: number[] = [];
        let lastTime = performance.now();
        
        for (let i = 0; i < 60; i++) {
          await new Promise(resolve => requestAnimationFrame(resolve));
          const currentTime = performance.now();
          times.push(currentTime - lastTime);
          lastTime = currentTime;
        }
        
        return times;
      });
      
      // Calculate average frame time
      const avgFrameTime = frameTimes.reduce((a, b) => a + b, 0) / frameTimes.length;
      
      // Should be around 16.67ms (60fps)
      expect(avgFrameTime).toBeLessThan(25); // Allow some variance
    });

    it('should not have memory leaks', async () => {
      // Get initial memory
      const initialMemory = await page.evaluate(() => {
        return (performance as any).memory?.usedJSHeapSize || 0;
      });
      
      // Switch visualizers multiple times
      for (let i = 0; i < 20; i++) {
        await page.keyboard.press('ArrowRight');
        await page.waitForTimeout(50);
      }
      
      // Force garbage collection if available
      await page.evaluate(() => {
        if ((window as any).gc) {
          (window as any).gc();
        }
      });
      
      // Get final memory
      const finalMemory = await page.evaluate(() => {
        return (performance as any).memory?.usedJSHeapSize || 0;
      });
      
      // Memory shouldn't grow excessively
      const growth = finalMemory - initialMemory;
      const growthMB = growth / (1024 * 1024);
      
      expect(growthMB).toBeLessThan(50); // Less than 50MB growth
    });
  });

  describe('error handling', () => {
    it('should handle WebGL context loss gracefully', async () => {
      // Simulate context loss
      await page.evaluate(() => {
        const canvas = document.querySelector('canvas');
        const gl = canvas?.getContext('webgl2');
        const ext = gl?.getExtension('WEBGL_lose_context');
        ext?.loseContext();
      });
      
      await page.waitForTimeout(100);
      
      // App should still be responsive
      const container = await page.$('[data-testid="winamp-visualizer"]');
      expect(container).not.toBeNull();
    });

    it('should show error state for unsupported browsers', async () => {
      // This test would require mocking WebGL unavailability
      // Skipping as it requires specific browser configuration
    });
  });

  describe('accessibility', () => {
    it('should be keyboard navigable', async () => {
      // Tab through controls
      await page.keyboard.press('Tab');
      
      const focusedElement = await page.evaluate(() => {
        return document.activeElement?.getAttribute('data-testid');
      });
      
      expect(focusedElement).toBeTruthy();
    });

    it('should have proper ARIA labels', async () => {
      // Check play button
      const playBtn = await page.$('[data-testid="play-btn"]');
      const ariaLabel = await playBtn?.getAttribute('aria-label');
      expect(ariaLabel).toContain('Play');
    });
  });
});

// Additional e2e utilities
async function measureFPS(page: Page, duration = 1000): Promise<number> {
  const frames = await page.evaluate(async (measureDuration) => {
    let count = 0;
    const start = performance.now();
    
    while (performance.now() - start < measureDuration) {
      await new Promise(resolve => requestAnimationFrame(resolve));
      count++;
    }
    
    return count;
  }, duration);
  
  return frames / (duration / 1000);
}

async function waitForVisualizer(page: Page, timeout = 5000): Promise<void> {
  await page.waitForFunction(() => {
    const canvas = document.querySelector('canvas');
    return canvas && canvas.width > 0 && canvas.height > 0;
  }, { timeout });
}
