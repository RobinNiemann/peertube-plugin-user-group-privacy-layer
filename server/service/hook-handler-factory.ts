import { MVideo, MVideoFullLight, PeerTubeHelpers, RegisterServerOptions } from "@peertube/peertube-types";
import { Params } from "../model/params";


export class HookHandlerFactory {
  private peertubeHelpers: PeerTubeHelpers

  constructor(registerServerOptions: RegisterServerOptions) {
    this.peertubeHelpers = registerServerOptions.peertubeHelpers;
  }

  createVideoUpdatedHandler(): Function {
    return async (params: Params) => {

      this.peertubeHelpers.logger.warn("Jetzt läuft action:api.video.updated")
      this.peertubeHelpers.logger.info(params.video.constructor.name)
      this.peertubeHelpers.logger.info(Object.keys(params.body.pluginData))
      this.peertubeHelpers.logger.info(params.body.pluginData?.['Gruppe 1'])
      this.peertubeHelpers.logger.info(params.body.pluginData?.['Gruppe 2'])
      this.peertubeHelpers.logger.info(params.video.name)

    }
  }

  createVideoUpdatedAllowsHandler(): Function {
    return async (
      result: any,
      params: { video: MVideoFullLight }
    ): Promise<any> => {
      this.peertubeHelpers.logger.warn("Jetzt läuft filter:api.download.video.allowed.result")
      this.peertubeHelpers.logger.info(Object.keys(result))
      this.peertubeHelpers.logger.info(Object.keys(params))

      return result
    }
  }

  
  createGetVideoHandler(): Function {
    return async (
      result: any,
      params: any
    ): Promise<MVideo> => {

      this.peertubeHelpers.logger.warn("Jetzt läuft filter:api.video.get.result")
      this.peertubeHelpers.logger.info(Object.keys(result))
      this.peertubeHelpers.logger.info(Object.keys(params))

      return result
    }
  }
}