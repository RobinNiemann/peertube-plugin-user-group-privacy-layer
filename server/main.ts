import type { RegisterServerOptions } from '@peertube/peertube-types'

async function register ({ peertubeHelpers, getRouter, registerSetting, settingsManager }: RegisterServerOptions): Promise<void> {

  const router = getRouter()

  registerSetting({
    name: "user-group-definition",
    label: 'User Group Definition',
    type: 'markdown-text',
    private: true
  })

  // GET /user-groups - Liste aller Gruppen des aktuellen Benutzers
  router.get('/user-groups', async (req, res, next) => {
    const authUser = await peertubeHelpers.user.getAuthUser(res)
    if (!authUser) {
      res.status(401).json({ error: 'Unauthorized' })
      return
    }
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