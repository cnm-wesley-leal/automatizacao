import { fakerPT_BR as faker } from '@faker-js/faker'
import { fakePhone } from '../helpers.ts'

export type User = {
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  phone: string;
  password: string;
};

export function createUserFake(): User {
    const firstName = faker.person.firstName();
    const lastName = faker.person.lastName();
  
    const user: User = {
      firstName,
      lastName,
      fullName: `${firstName} ${lastName}`,
      email: faker.internet.email({ firstName, lastName }).toLowerCase(),
      phone: fakePhone(),
      password: faker.internet.password({
        length: 8,
        prefix: 'Aa1!',
      }),
    };
  
    return user;
  }

  
