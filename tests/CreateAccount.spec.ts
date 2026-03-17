import { test } from '@playwright/test';
import { fakerPT_BR as faker } from '@faker-js/faker';
import { LandingPage } from './pages/LandingPage';
import { AuthPage } from './pages/AuthPage';

test('criar conta com dados válidos', async ({ page }) => {
  const firstName = faker.person.firstName();
  const lastName = faker.person.lastName();
  const fullName = `${firstName} ${lastName}`;
  const email = faker.internet.email({ firstName, lastName }).toLowerCase();
  
  const ddd = faker.number.int({ min: 11, max: 99 });
  const prefix = faker.number.int({ min: 1000, max: 9999 });
  const suffix = faker.number.int({ min: 1000, max: 9999 });
  const phone = `(${ddd}) 9${prefix}-${suffix}`;

  const password = faker.internet.password({
    length: 8,
    prefix: 'Aa1!'
  });

  const landing = new LandingPage(page);
  const auth = new AuthPage(page);

  await landing.goto();
  await auth.createAccount({ fullName, email, phone, password });
  await auth.expectLoggedIn();

});