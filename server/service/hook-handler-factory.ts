import { Logger } from 'winston';
import { MVideo, MVideoFormattableDetails, MVideoFullLight, PeerTubeHelpers, RegisterServerOptions, MVideoPlaylistElement } from "@peertube/peertube-types";
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
  createVideoUpdatedHandler(): Function {
    return async (params: VideoUpdateParams) => {
      this.logger.warn("Jetzt läuft action:api.video.updated")

      if (params.body.pluginData) {
        this.groupPermissionServices.setPermissionsForVideo(params.video.id, params.body.pluginData)
      }

    }
  }

  /**
   * When the original video file is downloaded
   * @returns 
   */
  createVideoDownloadAllowedHandler(): Function {
    return async (
      result: any,
      params: { video: MVideoFullLight, req: express.Request }
    ): Promise<any> => {
      this.logger.warn("Jetzt läuft filter:api.download.video.allowed.result")

      if (!this.groupPermissionServices.isUserAllowedForVideo(await this.getUserId(params), params.video.id)) {
        this.rejectRequest(params);
      }

      return result
    }
  }

  /**
   * When generated video files are downloaded
   * @returns 
   */
  createGeneratedVideoDownloadAllowedHandler(): Function {
    return async (
      result: any,
      params: { video: MVideoFullLight, req: express.Request }
    ): Promise<any> => {
      this.logger.warn("Jetzt läuft filter:api.download.generated-video.allowed.result")

      if (!this.groupPermissionServices.isUserAllowedForVideo(await this.getUserId(params), params.video.id)) {
        this.rejectRequest(params);
      }

      return result
    }
  }


  /**
   * When a video is watched
   * @returns 
   */
  createGetVideoHandler(): Function {
    return async (
      result: MVideoFormattableDetails,
      params: GetVideoParams
    ): Promise<MVideo> => {

      this.logger.warn("Jetzt läuft filter:api.video.get.result")

      const videoId = params.id;
      const userId = await this.getUserId(params);

      if (!this.groupPermissionServices.isUserAllowedForVideo(userId, videoId)) {
        this.rejectRequest(params)
      }

      return result
    }
  }


  /**
   * For the Tab "Browse videos"
   * @returns 
   */
  createVideoListResultHandler(): Function {
    return async (
      result: { data: any, total: number },
      params: VideoListResultParams): Promise<any> => {

      this.logger.warn("VideoListResultHandler")

      const userId = params.user.id
      result.data = result.data
        .filter((video: MVideoFormattableDetails) => this.groupPermissionServices.isUserAllowedForVideo(userId, video.id))

      result.total = result.data.length

      return result
    }
  }


  /**
   * When using the search bar
   * @returns videos
   */
  createVideoSearchHandler(): Function {
    return async (
      result: { data: Array<MVideoFormattableDetails>, total?: number },
      params: VideoSearchParams): Promise<any> => {

      this.logger.warn("VideoSearchHandler")

      const userId = params.user.id
      result.data = result.data.filter((video: MVideoFormattableDetails) => this.groupPermissionServices.isUserAllowedForVideo(userId, video.id))
      result.total = result.data.length

      return result
    }
  }

  /**
   * When a playlist is watched
   * @returns 
   */
  createVideoPlaylistHandler(): Function {
    return async (
      result: {
        total: any,
        data: MVideoPlaylistElement[]
      },
      params: any
    ): Promise<any> => {

      this.logger.warn("createVideoPlaylistHandler")

      const userId = params.user.id
      result.data = result.data.filter((playlistElement: MVideoPlaylistElement) => this.groupPermissionServices.isUserAllowedForVideo(userId, playlistElement.videoId))
      result.total = result.data.length

      return result
    }
  }

  /**
   * When using the Search bar
   * @returns playlists
   */
  createVideoPlaylistSearchHandler(): Function {
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

  private async getUserId(params: { req: express.Request }) {
    const authUser = await this.peertubeHelpers.user.getAuthUser(params.req.res!);
    const userId = authUser?.id || -1;
    return userId;
  }
  
  private rejectRequest(params: { req: express.Request; }) {
    params.req.res!.statusCode = 400;
  }

}