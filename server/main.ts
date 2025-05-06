import type { RegisterServerOptions } from '@peertube/peertube-types'
import { RouteHandlerFactory } from './service/route-handler-factory'
import { HookHandlerFactory } from './service/hook-handler-factory'
import { GroupPermissionService } from './service/group-permission-service'

async function register(registerServerOptions: RegisterServerOptions): Promise<void> {
  const { getRouter, registerSetting, registerHook } = registerServerOptions
  const routeHandlerFactory = new RouteHandlerFactory(registerServerOptions)
  const groupPermissionServices = new GroupPermissionService(registerServerOptions)
  const hookHandlerFactory = new HookHandlerFactory(registerServerOptions, groupPermissionServices)

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
    handler: hookHandlerFactory.getVideoUpdatedHandler()
  })
  registerHook({
    target: 'filter:api.download.video.allowed.result',
    handler: hookHandlerFactory.getVideoDownloadAllowedHandler()
  })
  registerHook({
    target: 'filter:api.download.generated-video.allowed.result',
    handler: hookHandlerFactory.getGeneratedVideoDownloadAllowedHandler()
  })
  registerHook({
    target: 'filter:api.video.get.result',
    handler: hookHandlerFactory.getGetVideoHandler()
  })
  registerHook({
    target: 'filter:api.videos.list.result',
    handler: hookHandlerFactory.getVideoListResultHandler()
  })
  registerHook({
    target: 'filter:api.search.videos.local.list.result',
    handler: hookHandlerFactory.getVideoSearchHandler()
  })
  registerHook({
    target: 'filter:api.video-playlist.videos.list.result',
    handler: hookHandlerFactory.getVideoPlaylistHandler()
  })
  registerHook({
    target: 'filter:api.search.video-playlists.local.list.result',
    handler: hookHandlerFactory.getVideoPlaylistSearchHandler()
  })
  registerHook({
    target: 'filter:api.accounts.videos.list.result',
    handler: hookHandlerFactory.getAccountVideosListHandler()
  })
  registerHook({
    target: 'filter:api.video-channels.videos.list.result',
    handler: hookHandlerFactory.getChannelVideosListHandler()
  })
  registerHook({
    target: 'filter:api.overviews.videos.list.result',
    handler: hookHandlerFactory.getOverviewVideoListHandler()
  })


  //  TODO
  // 'filter:api.user.me.subscription-videos.list.result'
  // 'filter:api.search.video-channels.local.list.result'
  // ''
  // 'filter:html.embed.video.allowed.result'
  // 'filter:html.embed.video-playlist.allowed.result'

  }

async function unregister(): Promise<void> { }

module.exports = {
  register,
  unregister
}