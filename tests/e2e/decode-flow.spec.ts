// tests/e2e/decode-flow.spec.ts
import { test, expect } from '@playwright/test';

test('full decode loop happy path', async ({ page }) => {
  test.setTimeout(60_000);

  await page.addInitScript(() => {
    localStorage.setItem(
      'anxiety_decoder_fp',
      '00000000-0000-0000-0000-000000000000',
    );
  });

  // Skip the opening ritual by clicking through.
  await page.goto('/');
  await page.click('button[aria-label="跳过"]', { timeout: 5_000 }).catch(() => {
    // Already past ritual — fine.
  });

  // Landing input.
  const dump = '我应该改简历但是已经拖了一周，每次打开 Word 就关掉，担心投了被拒。';
  await page.getByPlaceholder('把你现在脑子里所有担心倒出来').fill(dump);
  await page.getByRole('button', { name: /开始解码/ }).click();

  // Conversation page — wait for the assistant question bubble.
  await expect(page).toHaveURL(/\/decode\/[0-9a-f-]+$/);
  await page.waitForSelector('div.bg-stone-100', { timeout: 30_000 });

  // Reply with enough info to (probably) skip a second follow-up.
  const reply =
    '具体担心简历里的项目经历不够亮，之前实习的项目只是数据分析，没有产品决策的故事。我想改但写不出来。';
  await page.getByPlaceholder('继续说…').fill(reply);
  await page.getByRole('button', { name: /继续/ }).click();

  // Should land on result (may first route through a second follow-up; allow for either).
  await expect(page).toHaveURL(/\/decode\/[0-9a-f-]+\/result$/, { timeout: 45_000 });
  await expect(page.getByText(/真正要做的/)).toBeVisible({ timeout: 30_000 });

  // Click main action button.
  await page.getByRole('button', { name: /现在做 5 分钟/ }).click();
  await expect(page).toHaveURL(/\/decode\/[0-9a-f-]+\/wait$/);

  // Click "I'm back".
  await page.getByRole('button', { name: /我回来了/ }).click();
  await expect(page).toHaveURL(/\/decode\/[0-9a-f-]+\/return$/);

  // Pick emoji and submit.
  await page.locator('button[aria-label="🙂"]').click();
  await page.getByRole('button', { name: /提交/ }).click();
  await expect(page.getByText(/收到/)).toBeVisible();
});
