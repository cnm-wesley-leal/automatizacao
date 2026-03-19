import { Page } from '@playwright/test';

export async function landingHome(page: Page) {
await page.goto(process.env.BASE_URL!);
}