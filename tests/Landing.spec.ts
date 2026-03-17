import { test, expect} from '@playwright/test';

test('test', async ({ page }) => {
await page.goto(process.env.BASE_URL!);
await page.getByRole('link', { name: 'Chaves na Mão' }).click();
})


