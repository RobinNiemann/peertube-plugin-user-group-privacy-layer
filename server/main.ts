import type { RegisterServerOptions } from '@peertube/peertube-types'
import { setupApi, setupDb } from './setup'

async function register ({ peertubeHelpers, getRouter, registerHook }: RegisterServerOptions): Promise<void> {
  await setupDb(peertubeHelpers)

  const router = getRouter()

  router.get('/ping', (req, res) => res.json({ message: 'pong' }))

  setupApi(router, peertubeHelpers)
}

async function unregister (): Promise<void> {
  // Cleanup wird in setup.ts gehandhabt
}

module.exports = {
  register,
  unregister
}