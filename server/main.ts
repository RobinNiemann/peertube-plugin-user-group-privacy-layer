import type { RegisterServerOptions } from '@peertube/peertube-types'
import { GroupManager } from './group-manager'

async function register({ peertubeHelpers, getRouter, registerSetting, settingsManager }: RegisterServerOptions): Promise<void> {

  const router = getRouter()
  const groupManager = new GroupManager(settingsManager)

  registerSetting({
    name: "user-group-definition",
    label: 'User Group Definition',
    type: 'markdown-text',
    private: true
  })

  // GET /user-groups - Liste aller Gruppen 
  router.get('/user-groups', async (req, res, next) => {
    const authUser = await peertubeHelpers.user.getAuthUser(res)
    if (!authUser) {
      res.status(401).json({ error: 'Unauthorized' })
      return
    }

    try {
      const userGroups = await groupManager.getAllGroups()
      const userGroupNames = userGroups.map(group => group.name)
      res.json(userGroupNames)
    } catch (error: unknown) {
      peertubeHelpers.logger.error('Error fetching user groups:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  })

  // GET /user-groups - Liste aller Gruppen des aktuellen Benutzers
  router.get('/user-groups/current-user', async (req, res, next) => {
    const authUser = await peertubeHelpers.user.getAuthUser(res)
    if (!authUser) {
      res.status(401).json({ error: 'Unauthorized' })
      return
    }

    try {
      const userGroups = await groupManager.getGroupsForUser(authUser.username)
      res.json(userGroups)
    } catch (error: unknown) {
      peertubeHelpers.logger.error('Error fetching user groups:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  })
}

async function unregister(): Promise<void> { }

module.exports = {
  register,
  unregister
}