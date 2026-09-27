import { expect, test } from "@playwright/test";
test("loads, edits a port, persists refresh, and changes theme", async ({
  page,
}) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Network inventory" }),
  ).toBeVisible();
  await page.getByRole("link", { name: "Port Map" }).first().click();
  await expect(page.getByRole("heading", { name: "Port map" })).toBeVisible();
  await page.getByRole("button", { name: /Port 1,/ }).click();
  await expect(
    page.getByRole("dialog").getByText("Port 1", { exact: true }),
  ).toBeVisible();
  await page.getByLabel("Port name").fill("E2E Port Label");
  await page.getByRole("button", { name: "Save port" }).click();
  await expect(page.getByText("E2E Port Label")).toBeVisible();
  await page.reload();
  await expect(page.getByText("E2E Port Label")).toBeVisible();
  await page.getByRole("link", { name: "Settings" }).click();
  await page.getByLabel("Default theme").selectOption("dark");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
});
