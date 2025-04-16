import { Logger } from 'winston';
import { MVideo, MVideoFormattableDetails, MVideoFullLight, PeerTubeHelpers, RegisterServerOptions } from "@peertube/peertube-types";
import { GetVideoParams, VideoListResultParams, VideoSearchParams, VideoUpdateParams } from "../model/params";
import * as express from "express"


export class HookHandlerFactory {
  private logger: Logger
  private peertubeHelpers: PeerTubeHelpers

  constructor(registerServerOptions: RegisterServerOptions) {
    this.logger = registerServerOptions.peertubeHelpers.logger;
    this.peertubeHelpers = registerServerOptions.peertubeHelpers;
  }

  createVideoUpdatedHandler(): Function {
    return async (params: VideoUpdateParams) => {

      this.logger.warn("Jetzt läuft action:api.video.updated")
      this.logger.info(params.video.constructor.name)
      this.logger.info(params.body.pluginData?.['Gruppe 1'])
      this.logger.info(params.body.pluginData?.['Gruppe 2'])
      this.logger.info(params.video.name)
      this.logger.info(params.video.id)

    }
  }

  createVideoDownloadAllowedHandler(): Function {
    return async (
      result: any,
      params: { video: MVideoFullLight , req: express.Request}
    ): Promise<any> => {
      this.logger.warn("Jetzt läuft filter:api.download.video.allowed.result")
      this.logger.info(Object.keys(result))
      this.logger.info(Object.keys(params))

      if (params.video.uuid === "54ebe022-f4dc-41f2-a6af-d021f67e638e") {
        params.req.res!.statusCode = 400
      }

      return result
    }
  }

  createGeneratedVideoDownloadAllowedHandler(): Function {
    return async (
      result: any,
      params: { video: MVideoFullLight , req: express.Request}
    ): Promise<any> => {
      this.logger.warn("Jetzt läuft filter:api.download.generated-video.allowed.result")
      this.logger.info(Object.keys(result))
      this.logger.info(Object.keys(params))

      if (params.video.uuid === "54ebe022-f4dc-41f2-a6af-d021f67e638e") {
        params.req.res!.statusCode = 400
      }

      return result
    }
  }


  createGetVideoHandler(): Function {
    return async (
      result: MVideoFormattableDetails,
      params: GetVideoParams
    ): Promise<MVideo> => {

      this.logger.warn("Jetzt läuft filter:api.video.get.result")
      this.logger.info(Object.keys(result))
      this.logger.info(Object.keys(params))

      const videoId = params.id;
      // const videoUuid = result.uuid
      let userId = params.userId;
      const authUser = await this.peertubeHelpers.user.getAuthUser(params.req.res!)
      userId = authUser?.id || -1
      this.logger.info("UserId: " + userId + " user: " + authUser)
      
      if (videoId === 3 && userId !== 2) {
        result.uuid = ""
        params.req.res!.statusCode = 400
        this.logger.warn(`${videoId} is not allowed for user ${userId}`)
      }

      return result
    }
  }

  createVideoListResultHandler(): Function {
    return async (
      result: {data: any, total: number},
      params: VideoListResultParams): Promise<any> => {

      this.logger.warn("VideoListResultHandler")
      this.logger.info(Object.keys(result.data))
      this.logger.info(result.total)     
      result.data = result.data.filter((video: MVideoFormattableDetails) => {
        return video.uuid !== "54ebe022-f4dc-41f2-a6af-d021f67e638e"
      })
      result.total = result.data.length

      this.logger.info(Object.keys(params.user))

      return result
    }
  }


  createVideoSearchHandler(): Function {
    return async (
      result: {data: Array<MVideoFormattableDetails>, total?: number},
      params: VideoSearchParams): Promise<any> => {

      this.logger.warn("VideoSearchHandler")

      for (let video of result.data) {
        this.logger.info("VideoId: " + video.id + " UUID: " + video.uuid)
      }
      this.logger.info("Total:" + result.total)
      
      result.data = result.data.filter((video: MVideoFormattableDetails) => {
        return video.uuid !== "54ebe022-f4dc-41f2-a6af-d021f67e638e"
      })
      result.total = result.data.length

      this.logger.info(params.user.id + " " + params.user.username)

      return result
    }
  }

}