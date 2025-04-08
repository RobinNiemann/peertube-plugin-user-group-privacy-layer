import type { RegisterServerOptions } from '@peertube/peertube-types'
import { setupApi, setupDb } from './setup'

async function register ({ peertubeHelpers, getRouter, registerHook }: RegisterServerOptions): Promise<void> {
  await setupDb(peertubeHelpers)

  const router = getRouter()

  // Erreichbar via http://peertube.localhost:9000/plugins/user-group-sharing/router/ping
  router.get('/ping', (req, res, next) => {
    try {
      res.status(200).json({ message: 'pong' });
    } catch (error) {
      next(error); // Fehler an die Middleware weiterleiten
    }
  });
  setupApi(router, peertubeHelpers)
}

async function unregister (): Promise<void> {
  // Cleanup wird in setup.ts gehandhabt
}

module.exports = {
  register,
  unregister
}