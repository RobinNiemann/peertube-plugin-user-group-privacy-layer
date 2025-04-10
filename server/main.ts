import type { MVideo, MVideoFullLight, RegisterServerOptions } from '@peertube/peertube-types'
import { GroupManager } from './group-manager'
import { Params } from './model/params'

async function register({
  peertubeHelpers,
  getRouter,
  registerSetting,
  registerHook,
  settingsManager }: RegisterServerOptions): Promise<void> {

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


  registerHook({
    target: 'action:api.video.updated',
    handler: async (params: Params) => {

      peertubeHelpers.logger.warn("Jetzt läuft action:api.video.updated")
      peertubeHelpers.logger.info(params.video.constructor.name)
      peertubeHelpers.logger.info(Object.keys(params.body.pluginData))
      peertubeHelpers.logger.info(params.body.pluginData?.['Gruppe 1'])
      peertubeHelpers.logger.info(params.body.pluginData?.['Gruppe 2'])
      peertubeHelpers.logger.info(params.video.name)

    }
  })

  registerHook({
    target: 'filter:api.download.video.allowed.result',
    handler: async (
      result: any,
      params: { video: MVideoFullLight }
    ): Promise<any> => {
      peertubeHelpers.logger.warn("Jetzt läuft filter:api.download.video.allowed.result")
      peertubeHelpers.logger.info(Object.keys(result))
      peertubeHelpers.logger.info(Object.keys(params))
      
      return result
    }
  })

  registerHook({
    target: 'filter:api.video.get.result',
    handler: async (
      result: any,
      params: any
    ): Promise<MVideo> => {

      peertubeHelpers.logger.warn("Jetzt läuft filter:api.video.get.result")
      peertubeHelpers.logger.info(Object.keys(result))
      peertubeHelpers.logger.info(Object.keys(params))

      return result
    }
  })
}

async function unregister(): Promise<void> { }

module.exports = {
  register,
  unregister
}