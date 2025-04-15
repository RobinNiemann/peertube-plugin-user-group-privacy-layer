import type { RegisterServerOptions } from '@peertube/peertube-types'
import { RouteHandlerFactory } from './service/route-handler-factory'
import { HookHandlerFactory } from './service/hook-handler-factory'

async function register(registerServerOptions: RegisterServerOptions): Promise<void> {
  const { getRouter, registerSetting, registerHook } = registerServerOptions
  const routeHandlerFactory = new RouteHandlerFactory(registerServerOptions)
  const hookHandlerFactory = new HookHandlerFactory(registerServerOptions)

  registerSetting({
    name: "user-group-definition",
    label: 'User Group Definition',
    type: 'markdown-text',
    private: true
  })

  getRouter().get('/user-groups', routeHandlerFactory.createUserGroupsRouteHandler())
  getRouter().get('/user-groups/current-user', routeHandlerFactory.createUserGroupsForCurrentUserRouteHandler())

  registerHook({
    target: 'action:api.video.updated',
    handler: hookHandlerFactory.createVideoUpdatedHandler()
  })

  registerHook({
    target: 'filter:api.download.video.allowed.result',
    handler: hookHandlerFactory.createVideoDownloadAllowedHandler()
  })
  registerHook({
    target: 'filter:api.download.generated-video.allowed.result',
    handler: hookHandlerFactory.createGeneratedVideoDownloadAllowedHandler()
  })

  registerHook({
    target: 'filter:api.video.get.result',
    handler: hookHandlerFactory.createGetVideoHandler()
  })

  registerHook({
    target: 'filter:api.videos.list.result',
    handler: hookHandlerFactory.createVideoListResultHandler()
  })
  registerHook({
    target: 'filter:api.search.videos.local.list.result',
    handler: hookHandlerFactory.createVideoSearchHandler()
  })

  //  TODO
  // 'filter:api.video-playlist.videos.list.result'
  // 'filter:api.accounts.videos.list.result'
  // 'filter:api.video-channels.videos.list.result'
  // 'filter:api.overviews.videos.list.result'
  // 'filter:api.user.me.subscription-videos.list.result'
  // 'filter:api.search.video-channels.local.list.result'
  // 'filter:api.search.video-playlists.local.list.result'
  // 'filter:html.embed.video.allowed.result'
  // 'filter:html.embed.video-playlist.allowed.result'

  }

async function unregister(): Promise<void> { }

module.exports = {
  register,
  unregister
}