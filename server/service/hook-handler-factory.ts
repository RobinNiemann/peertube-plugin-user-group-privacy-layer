import { Logger } from 'winston';
import { MVideo, MVideoFormattableDetails, MVideoFullLight, PeerTubeHelpers, RegisterServerOptions, MVideoPlaylistElement, MUser, MChannel } from "@peertube/peertube-types";
import { GetVideoParams, VideoListResultParams, VideoSearchParams, VideoUpdateParams } from "../model/params";
import * as express from "express"
import { GroupPermissionService } from './group-permission-service';


export class HookHandlerFactory {
  private logger: Logger
  private peertubeHelpers: PeerTubeHelpers

  constructor(
    registerServerOptions: RegisterServerOptions,
    private groupPermissionServices: GroupPermissionService
  ) {
    this.logger = registerServerOptions.peertubeHelpers.logger;
    this.peertubeHelpers = registerServerOptions.peertubeHelpers;
  }

  /**
   * When a video is uploaded or its settings are changed
   * @returns 
   */
  getVideoUpdatedHandler(): any {
    return async (params: VideoUpdateParams) => {
      this.logger.warn("Jetzt läuft action:api.video.updated")

      if (params.body.pluginData) {
        await this.groupPermissionServices.setPermissionsForVideo(params.video.id, params.body.pluginData)
      }

    }
  }

  /**
   * When the original video file is downloaded
   * @returns 
   */
  getVideoDownloadAllowedHandler(): any {
    return async (
      result: any,
      params: { video: MVideoFullLight, req: express.Request }
    ): Promise<any> => {
      this.logger.warn("Jetzt läuft filter:api.download.video.allowed.result")

      if (!(await this.groupPermissionServices.isUserAllowedForVideo(await this.getUserId(params), params.video.id))) {
        this.rejectRequest(params);
      }

      return result
    }
  }

  /**
   * When generated video files are downloaded
   * @returns 
   */
  getGeneratedVideoDownloadAllowedHandler(): any {
    return async (
      result: any,
      params: { video: MVideoFullLight, req: express.Request }
    ): Promise<any> => {
      this.logger.warn("Jetzt läuft filter:api.download.generated-video.allowed.result")

      if (!(await this.groupPermissionServices.isUserAllowedForVideo(await this.getUserId(params), params.video.id))) {
        this.rejectRequest(params);
      }

      return result
    }
  }


  /**
   * When a video is watched
   * @returns 
   */
  getGetVideoHandler(): any {
    return async (
      result: MVideoFormattableDetails,
      params: GetVideoParams
    ): Promise<MVideo> => {
      this.logger.warn("Jetzt läuft filter:api.video.get.result")

      const videoId = params.id;
      const userId = await this.getUserId(params);

      if (!(await this.groupPermissionServices.isUserAllowedForVideo(userId, videoId))) {
        this.rejectRequest(params)
      }

      return result
    }
  }


  /**
   * For the Tab "Browse videos"
   * @returns 
   */
  getVideoListResultHandler(): any {
    return async (
      result: { data: any, total: number },
      params: VideoListResultParams): Promise<any> => {

      this.logger.warn("VideoListResultHandler")

      const userId = params.user.id
      const videoPermissions = await Promise.all(
        result.data.map(async (video: MVideoFormattableDetails) => ({
          video,
          allowed: await this.groupPermissionServices.isUserAllowedForVideo(userId, video.id)
        }))
      )
      result.data = videoPermissions.filter(({allowed}) => allowed).map(({video}) => video)

      result.total = result.data.length

      return result
    }
  }


  /**
   * When using the search bar
   * @returns videos
   */
  getVideoSearchHandler(): any {
    return async (
      result: { data: Array<MVideoFormattableDetails>, total?: number },
      params: VideoSearchParams): Promise<any> => {

      this.logger.warn("VideoSearchHandler")

      const userId = params.user.id
      const videoPermissions = await Promise.all(
        result.data.map(async (video: MVideoFormattableDetails) => ({
          video,
          allowed: await this.groupPermissionServices.isUserAllowedForVideo(userId, video.id)
        }))
      )
      result.data = videoPermissions.filter(({allowed}) => allowed).map(({video}) => video)
      result.total = result.data.length

      return result
    }
  }

  /**
   * When a playlist is watched
   * @returns 
   */
  getVideoPlaylistHandler(): any {
    return async (
      result: {
        total: any,
        data: MVideoPlaylistElement[]
      },
      params: any
    ): Promise<any> => {
      this.logger.warn("createVideoPlaylistHandler")

      const userId = params.user.id
      const elementPermissions = await Promise.all(
        result.data.map(async (playlistElement: MVideoPlaylistElement) => ({
          playlistElement,
          allowed: await this.groupPermissionServices.isUserAllowedForVideo(userId, playlistElement.videoId)
        }))
      )
      result.data = elementPermissions.filter(({allowed}) => allowed).map(({playlistElement}) => playlistElement)
      result.total = result.data.length

      return result
    }
  }

  /**
   * When using the Search bar
   * @returns playlists
   */
  getVideoPlaylistSearchHandler(): any {
    return async (
      result: any,
      params: any
    ): Promise<any> => {
      this.logger.warn("createVideoPlaylistSearchHandler")
      this.logger.info(Object.keys(result))
      this.logger.info(Object.keys(result.data[0]))
      this.logger.info(Object.keys(params))
      return result
    }
  }

  getAccountVideosListHandler(): any {
    return async (
      result: {
        data: MVideo[],
      },
      params: any | {
        user: MUser
      }
    ): Promise<any> => {
      this.logger.warn("accountsVideosListHandler")
      const userId = params.user.id
      const videoPermissions = await Promise.all(
        result.data.map(async (video: MVideo) => ({
          video,
          allowed: await this.groupPermissionServices.isUserAllowedForVideo(userId, video.id)
        }))
      )
      result.data = videoPermissions.filter(({allowed}) => allowed).map(({video}) => video)

      return result
    }
  }

  getChannelVideosListHandler(): any {
    return async (
      result: {
        data: MVideo[],
        total: number,
      },
      params: any | {

      }
    ): Promise<any> => {
      this.logger.warn("channelVideosListHandler")

      const userId = params.user.id
      const videoPermissions = await Promise.all(
        result.data.map(async (video: MVideo) => ({
          video,
          allowed: await this.groupPermissionServices.isUserAllowedForVideo(userId, video.id)
        }))
      )
      result.data = videoPermissions.filter(({allowed}) => allowed).map(({video}) => video)
      result.total = result.data.length

      return result
    }
  }

  getOverviewVideoListHandler(): any {
    return async (
      result: any,
      params: any
    ): Promise<any> => {
      this.logger.warn("overviewVideoListHandler")
      this.logger.error("Hallo!!! Hier bin ich!!!")
      this.logger.info(Object.keys(result))
      this.logger.info(Object.keys(result.data[0]))
      this.logger.info(Object.keys(params))

      const userId = params.user.id
      const videoPermissions = await Promise.all(
        result.data.map(async (video: MVideo) => ({
          video,
          allowed: await this.groupPermissionServices.isUserAllowedForVideo(userId, video.id)
        }))
      )
      result.data = videoPermissions.filter(({allowed}) => allowed).map(({video}) => video)
      result.total = result.data.length

      return result
    }
  }

  getUserMeSubscriptionVideosListHandler(): any {
    return async (
      result: any |{

      },
      params: any | {

      }
    ): Promise<any> => {
      this.logger.warn("userMeSubscriptionVideosListHandler")
      this.logger.error("Hallo!!! Hier bin ich!!!")
      this.logger.info(Object.keys(result))
      this.logger.info(Object.keys(result.data[0]))
      this.logger.info(Object.keys(params))

      const userId = params.user.id
      const videoPermissions = await Promise.all(
        result.data.map(async (video: MVideo) => ({
          video,
          allowed: await this.groupPermissionServices.isUserAllowedForVideo(userId, video.id)
        }))
      )
      result.data = videoPermissions.filter(({allowed}) => allowed).map(({video}) => video)
      result.total = result.data.length

      return result
    }
  }

  getSearchChannelsListHandler(): any {
    return async (
      result: {
        data: MChannel[]
      },
      params:  {
        searchTarget: any, // local
        search: any,
        start: any,
        count: any,
        sort: any,
        actorId: any,
      }
    ): Promise<any> => {
      this.logger.warn("searchChannelsListHandler")
      this.logger.info(Object.keys(result))
      this.logger.info(Object.keys(result.data[0]))
      this.logger.info(Object.keys(result.data[1]))
      this.logger.info(Object.keys(params))

      this.logger.info(result.data[0].name)
      this.logger.info(params.searchTarget)
      this.logger.info(params.search)

      return result
    }
  }

  private async getUserId(params: { req: express.Request }) {
    const authUser = await this.peertubeHelpers.user.getAuthUser(params.req.res!);
    const userId = authUser?.id || -1;
    return userId;
  }
  
  private rejectRequest(params: { req: express.Request; }) {
    params.req.res!.statusCode = 400;
  }

}