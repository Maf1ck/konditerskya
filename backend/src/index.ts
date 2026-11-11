import { config, hasWeakSecrets, isProduction, onVercel } from './config.ts'
import { createApp } from './createApp.ts'
import { seedIfEmpty } from './seed.ts'

if (isProduction && hasWeakSecrets) {
  console.error(
    'Refusing to start: set ADMIN_PASSWORD (12+ chars) and SESSION_SECRET (24+ random chars) in the environment.',
  )
  process.exit(1)
}

if (isProduction && !config.adminTotpSecret && !config.allowNoTwoFactor) {
  console.error('Refusing to start: enable two-factor auth for the admin panel. Run `pnpm --filter konditerska-backend totp:setup`.')
  console.error('(To run without 2FA anyway, set ADMIN_ALLOW_NO_2FA=true — not recommended.)')
  process.exit(1)
}

if (seedIfEmpty()) console.log('Database was empty — demo data created.')

const app = createApp()

// On Vercel the default export is the entrypoint (src/index.ts); elsewhere start a regular server.
if (!onVercel) {
  app.listen(config.port, () => {
    console.log(`API listening on http://localhost:${config.port}`)
  })
}

export default app
