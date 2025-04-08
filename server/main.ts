import type { RegisterServerOptions } from '@peertube/peertube-types'

async function register ({ peertubeHelpers, getRouter, registerSetting, settingsManager }: RegisterServerOptions): Promise<void> {

  const router = getRouter()

  // Erreichbar via http://peertube.localhost:9000/plugins/user-group-sharing/router/ping
  router.get('/ping', (req, res, next) => {
    try {
      res.status(200).json({ message: 'pong' });
    } catch (error) {
      next(error); // Fehler an die Middleware weiterleiten
    }
  });

  registerSetting({
    name: "user-group-definition",
    label: 'User Group Definition',
    type: 'markdown-text',
    private: true
  })

  // GET /user-groups - Liste aller Gruppen des aktuellen Benutzers
  router.get('/user-groups', async (req, res, next) => {
    try {
      const userGroups = await settingsManager.getSetting('user-group-definition')
      res.json(userGroups)
    } catch (error: unknown) {
      peertubeHelpers.logger.error('Error fetching user groups:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  })
}

async function unregister (): Promise<void> {
  // Cleanup wird in setup.ts gehandhabt
}

module.exports = {
  register,
  unregister
}