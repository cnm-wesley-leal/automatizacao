import { faker as faker } from '@faker-js/faker';
import { Page } from '@playwright/test';


export function fakePhone(): string {
  const ddd = faker.number.int({ min: 11, max: 99 });
  const prefix = faker.number.int({ min: 1000, max: 9999 });
  const suffix = faker.number.int({ min: 1000, max: 9999 });

  return `(${ddd}) 9${prefix}-${suffix}`;
}

export async function landingHome(page: Page) {
  await page.goto(process.env.BASE_URL!);
  await page.getByText('Entendi').click({ timeout: 20000 });
}

