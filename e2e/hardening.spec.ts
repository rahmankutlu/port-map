import { expect, test } from "@playwright/test";

test("uses truthful state wording and validates network addresses", async ({
  page,
}) => {
  await page.goto("/port-map");
  await expect(page.getByText("Documented", { exact: true })).toBeVisible();
  await expect(page.getByText("Online", { exact: true })).toHaveCount(0);

  await page.getByRole("button", { name: /Port 1,/ }).click();
  const portDialog = page.getByRole("dialog");
  await portDialog.getByLabel("MAC address").fill("not-a-mac");
  await portDialog.getByRole("button", { name: "Save port" }).click();
  await expect(portDialog.getByRole("alert")).toContainText("MAC address");
  await portDialog.getByLabel("MAC address").fill("00-1a-2b-3c-4d-5e");
  await portDialog.getByRole("button", { name: "Save port" }).click();

  await page.getByRole("button", { name: /Port 1,/ }).click();
  await expect(page.getByRole("dialog").getByLabel("MAC address")).toHaveValue(
    "00:1A:2B:3C:4D:5E",
  );
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Close port details" })
    .click();

  await page
    .getByRole("checkbox", { name: "Select port 1", exact: true })
    .check();
  await page
    .getByRole("checkbox", { name: "Select port 2", exact: true })
    .check();
  await page.getByRole("button", { name: /Bulk edit/ }).click();
  const bulkDialog = page.getByRole("dialog");
  await bulkDialog.getByLabel("Action").selectOption("location");
  await bulkDialog
    .getByRole("textbox", { name: "Location", exact: true })
    .fill("E2E rack");
  await bulkDialog.getByRole("button", { name: "Apply changes" }).click();

  await page.goto("/switches");
  await page.getByLabel("Switch actions").first().click();
  await page.getByRole("button", { name: "Edit details" }).click();
  const switchDialog = page.getByRole("dialog");
  await switchDialog.getByLabel("Management IP").fill("192.168.1.999");
  await switchDialog.getByRole("button", { name: "Save changes" }).click();
  await expect(switchDialog.getByRole("alert")).toContainText("IPv4 or IPv6");
  await switchDialog.getByLabel("Management IP").fill("2001:db8::10");
  await switchDialog.getByRole("button", { name: "Save changes" }).click();

  await page.goto("/vlans");
  await page.getByLabel("Actions for VLAN 10").click();
  await page.getByRole("button", { name: "Edit VLAN" }).click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Save VLAN" })
    .click();
  await expect(page.getByText("VLAN updated", { exact: true })).toBeVisible();
});

test("previews imports, rejects malformed JSON, and creates a restorable backup", async ({
  page,
}) => {
  await page.goto("/import-export");
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export workspace" }).click();
  const download = await downloadPromise;
  const exportPath = await download.path();
  expect(exportPath).not.toBeNull();

  const fileInput = page.locator('input[type="file"]');
  await fileInput.setInputFiles({
    name: "invalid.json",
    mimeType: "application/json",
    buffer: Buffer.from("{not-json"),
  });
  await expect(page.locator(".error-callout")).toContainText("not valid JSON");

  await fileInput.setInputFiles(exportPath!);
  const importDialog = page.getByRole("dialog");
  await expect(
    importDialog.getByText("Valid Port Map workspace"),
  ).toBeVisible();
  await importDialog.getByRole("button", { name: "Import workspace" }).click();
  await expect(
    page.getByText("Before JSON import", { exact: true }),
  ).toBeVisible();

  await page.getByRole("button", { name: "Restore" }).first().click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Restore backup" })
    .click();
  await expect(
    page.getByText("Backup restored", { exact: true }),
  ).toBeVisible();
});

test("keeps the workspace ledger within a mobile viewport", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Workspace index" }),
  ).toBeVisible();
  const dimensions = await page.evaluate(() => ({
    viewport: document.documentElement.clientWidth,
    content: document.documentElement.scrollWidth,
  }));
  expect(dimensions.content).toBe(dimensions.viewport);
});
