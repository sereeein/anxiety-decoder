// tests/e2e/history-flow.spec.ts
import { test, expect } from '@playwright/test';

test('history: navigate from landing → history → card detail', async ({ page }) => {
  test.setTimeout(90_000);

  await page.addInitScript(() => {
    localStorage.setItem(
      'anxiety_decoder_fp',
      '00000000-0000-0000-0000-000000000000',
    );
  });

  // Run a full decode first to seed a session.
  await page.goto('/');
  await page.click('button[aria-label="跳过"]', { timeout: 5_000 }).catch(() => {});
  await page
    .getByPlaceholder('把你现在脑子里所有担心倒出来')
    .fill('今天应该写论文但又担心导师不满意，拖了一整个下午。');
  await page.getByRole('button', { name: /开始解码/ }).click();
  await page.waitForSelector('div.bg-stone-100', { timeout: 30_000 });
  await page
    .getByPlaceholder('继续说…')
    .fill(
      '具体担心是文献综述写得太浅，导师上次说过要更深入，我不知道怎么深入下去，一打开文件夹就想关掉。',
    );
  await page.getByRole('button', { name: /继续/ }).click();
  await expect(page).toHaveURL(/\/decode\/[0-9a-f-]+\/result$/, { timeout: 45_000 });
  await page.getByRole('button', { name: /现在做 5 分钟/ }).click();
  await page.getByRole('button', { name: /我回来了/ }).click();
  await page.locator('button[aria-label="🙂"]').click();
  await page.getByRole('button', { name: /提交/ }).click();
  await expect(page.getByText(/收到/)).toBeVisible();

  // Navigate to /history via the global AppNav link ("过往").
  await page.getByRole('link', { name: /^过往$/ }).click();
  await expect(page).toHaveURL(/\/history$/);
  await expect(page.getByText(/过往的解码/)).toBeVisible();

  // First HistoryCard should be clickable → /card/:id.
  const firstCard = page.locator('a[href^="/card/"]').first();
  await expect(firstCard).toBeVisible();
  await firstCard.click();
  await expect(page).toHaveURL(/\/card\/[0-9a-f-]+$/);
  await expect(page.getByRole('button', { name: /保存图片/ })).toBeVisible();
});
