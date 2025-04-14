import { Logger } from 'winston';
import { MVideo, MVideoFormattableDetails, MVideoFullLight, RegisterServerOptions } from "@peertube/peertube-types";
import { GetVideoParams, VideoListResultParams, VideoSearchParams, VideoUpdateParams } from "../model/params";


export class HookHandlerFactory {
  private logger: Logger

  constructor(registerServerOptions: RegisterServerOptions) {
    this.logger = registerServerOptions.peertubeHelpers.logger;
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
      params: { video: MVideoFullLight }
    ): Promise<any> => {
      this.logger.warn("Jetzt läuft filter:api.download.video.allowed.result")
      this.logger.info(Object.keys(result))
      this.logger.info(Object.keys(params))

      return result
    }
  }


  createGetVideoHandler(): Function {
    return async (
      result: MVideoFormattableDetails,
      params: GetVideoParams
    ): Promise<MVideo> => {

      this.logger.warn("Jetzt läuft filter:api.video.get.result")

      const videoId = params.id;
      const userId = params.userId;
      
      if (videoId === 3) {
        result.uuid = ""
        params.req.res?.statusCode == 400
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
      result: {data: Array<MVideoFormattableDetails>, total: number},
      params: VideoSearchParams): Promise<any> => {

      this.logger.warn("VideoSearchHandler")

      this.logger.info("VideoId: " + result.data[0].id + " UUID: " + result.data[0].uuid)
      this.logger.info("VideoId: " + result.data[1].id + " UUID: " + result.data[1].uuid)
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