export const isCI = Boolean(process.env.CI)

export const TIMEOUTS = {
  cookieConsent: 5000,
  authLink: isCI ? 30000 : 15000,
  authCookies: isCI ? 30000 : 15000,
  authCookiesLogin: isCI ? 20000 : 10000,
  registrationOutcome: isCI ? 30000 : 15000,
  hamburgerMenu: isCI ? 10000 : 3000,
  navLink: isCI ? 10000 : 3000,
  authPanel: isCI ? 10000 : 3000,
} as const
