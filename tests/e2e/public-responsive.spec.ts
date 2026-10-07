import { expect, test } from "@playwright/test";
import { collectBrowserErrors } from "./helpers";

for (const width of [1440, 1280, 768, 390, 360]) {
  test(`public pages are real, keyboard reachable and fit ${width}px`, async ({ page }, info) => {
    const errors: string[] = [];
    collectBrowserErrors(page, `${width}px`, errors);
    await page.setViewportSize({ width, height: 900 });
    for (const route of ["/", "/tasks", "/how-it-works", "/login", "/register"]) {
      const response = await page.goto(route);
      expect(response?.status(), route).toBe(200);
      await expect(page.getByRole("main")).toBeVisible();
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
      await page.keyboard.press("Tab");
      const skip = page.getByRole("link", { name: "Skip to content" });
      await expect(skip).toBeFocused();
      await expect(skip).toBeVisible();
      await page.keyboard.press("Enter");
      await expect(page).toHaveURL(/#main-content$/);
      const dimensions = await page.evaluate(() => ({
        viewport: document.documentElement.clientWidth,
        document: document.documentElement.scrollWidth,
        body: document.body.scrollWidth,
      }));
      expect(dimensions.document, `${route} horizontal document overflow at ${width}px`).toBeLessThanOrEqual(dimensions.viewport + 1);
      expect(dimensions.body, `${route} horizontal body overflow at ${width}px`).toBeLessThanOrEqual(dimensions.viewport + 1);
      await info.attach(`${width}-${route.replaceAll("/", "_") || "home"}`, {
        body: await page.screenshot({ fullPage: true }), contentType: "image/png",
      });
    }
    expect(errors, "No browser runtime or console errors on public routes").toEqual([]);
  });
}