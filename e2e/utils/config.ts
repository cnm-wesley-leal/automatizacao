export const isCI = Boolean(process.env.CI)

export const TIMEOUTS = {
  cookieConsent: 5000,
  authLink: isCI ? 30000 : 15000,
  authCookies: isCI ? 30000 : 15000,
  authCookiesLogin: isCI ? 20000 : 10000,
  registrationOutcome: isCI ? 30000 : 15000,
} as const
