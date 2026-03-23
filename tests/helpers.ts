import { faker as faker } from '@faker-js/faker';

export function fakePhone(): string {
    const ddd = faker.number.int({ min: 11, max: 99 });
    const prefix = faker.number.int({ min: 1000, max: 9999 });
    const suffix = faker.number.int({ min: 1000, max: 9999 });
  
    return `(${ddd}) 9${prefix}-${suffix}`;
  }
