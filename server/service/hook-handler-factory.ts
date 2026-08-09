import { Logger } from 'winston';
import { MVideoFormattableDetails, MVideoFullLight, PeerTubeHelpers, RegisterServerOptions } from "@peertube/peertube-types";
import { GetVideoParams, VideoUpdateParams, NotificationCreatedParams } from "../model/params";
import * as express from "express"
import { GroupPermissionService } from './group-permission-service';

/** Key under which the originally requested page (start/count) is stashed on the query options. */
const PAGE_STASH_KEY = '__userGroupPrivacyPage'

export class HookHandlerFactory {
  private logger: Logger
  private peertubeHelpers: PeerTubeHelpers
  /** Upper bound of videos fetched per list request before group filtering + re-pagination. */
  private readonly MAX_FETCH = 5000

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
    ): Promise<MVideoFormattableDetails> => {
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
   * Inflates the query window (start=0, count=MAX_FETCH) so the matching result handler can filter
   * by group permissions BEFORE re-paginating. The originally requested page is stashed on the
   * options object, which PeerTube passes through to the result hook.
   */
  buildListParamsHandler(): any {
    return async (params: any): Promise<any> => {
      params[PAGE_STASH_KEY] = {
        start: Number(params.start) || 0,
        count: Number(params.count) || 0
      }
      params.start = 0
      params.count = this.MAX_FETCH
      return params
    }
  }

  /**
   * Filters a video list result by group permissions, then slices it back to the originally
   * requested page so `total` and the page contents stay consistent with PeerTube's pagination.
   * `getVideoId` extracts the video id from a data item (plain videos vs. playlist elements).
   */
  buildListResultHandler(getVideoId: (item: any) => number): any {
    return async (
      result: { data: any[], total?: number },
      params: any
    ): Promise<any> => {
      const userId = params.user?.id ?? -1

      if (result.data.length >= this.MAX_FETCH) {
        this.logger.warn(`User group privacy filter hit MAX_FETCH (${this.MAX_FETCH}); allowed videos may be truncated for user ${userId}.`)
      }

      const candidateIds = result.data.map(getVideoId)
      const allowedIds = await this.groupPermissionServices.getAllowedVideoIds(userId, candidateIds)
      const filtered = result.data.filter(item => allowedIds.has(getVideoId(item)))

      const page = params[PAGE_STASH_KEY] ?? { start: Number(params.start) || 0, count: filtered.length }

      result.total = filtered.length
      result.data = filtered.slice(page.start, page.start + page.count)

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