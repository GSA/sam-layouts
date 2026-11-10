import { expect, test } from '@playwright/test';

test('domain toggle includes its visible label in its name and supports native keyboard activation', async ({
  page,
}) => {
  await page.goto('/iframe.html?id=responsive-layout--responsive-layout&viewMode=story');
  const toggle = page.locator('button[aria-controls="panelBody"]');
  await expect(toggle).toBeVisible();
  await expect(toggle).toHaveAttribute('type', 'button');
  const visibleLabel = (await toggle.innerText()).replace(/\s+/g, ' ').trim();
  expect(visibleLabel).toContain('Select Domain');
  expect(visibleLabel.length).toBeGreaterThan('Select Domain'.length);
  await expect(toggle).toHaveAccessibleName(visibleLabel);
  await expect(toggle).toHaveAttribute('aria-expanded', 'false');

  await toggle.focus();
  await page.keyboard.press('Enter');
  await expect(toggle).toHaveAttribute('aria-expanded', 'true');
  await expect(page.locator('#panelBody')).toBeVisible();

  await page.keyboard.press('Space');
  await expect(toggle).toHaveAttribute('aria-expanded', 'false');
  await expect(toggle).toBeFocused();

  await toggle.click();
  await expect(toggle).toHaveAttribute('aria-expanded', 'true');
});
