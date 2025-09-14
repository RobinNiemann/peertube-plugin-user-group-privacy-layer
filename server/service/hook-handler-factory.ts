import { Logger } from 'winston';
import { MVideo, MVideoFormattableDetails, MVideoFullLight, PeerTubeHelpers, RegisterServerOptions, MVideoPlaylistElement, MUser } from "@peertube/peertube-types";
import { GetVideoParams, VideoListResultParams, VideoSearchParams, VideoUpdateParams, NotificationCreatedParams } from "../model/params";
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
      result: MVideoFormattableDetails & { pluginData?: any },
      params: GetVideoParams
    ): Promise<MVideo> => {
      const videoId = params.id;
      const userId = await this.getUserId(params);

      if (!(await this.groupPermissionServices.isUserAllowedForVideo(userId, videoId))) {
        this.rejectRequest(params)
      }
      
      await this.groupPermissionServices.loadPluginDataForVideo(result, videoId);

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

  getAccountVideosListHandler(): any {
    return async (
      result: {
        data: MVideo[],
      },
      params: any | {
        user: MUser
      }
    ): Promise<any> => {
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
      this.logger.error("THE HOOK overviewVideoListHandler WICH I NEVER MANAGED TO TRIGGER HAS BEEN FINALLY FIRED")

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

  /**
   * When a notification is created
   * @returns 
   */
  getNotificationCreatedHandler(): any {
    return async (params: NotificationCreatedParams) => {
      const { notification, user } = params;
      
      if (!notification.videoId) {
        return params
      }

      const allowed = await this.groupPermissionServices.isUserAllowedForVideo(user.id, notification.videoId);
      
      if (!allowed) {
        await notification.destroy();
        this.logger.info(`Notification ${notification.id} blocked and deleted for user ${user.id} (video ${notification.videoId})`)
      }

      return params
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