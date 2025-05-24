import { PeerTubeHelpers, RegisterServerOptions } from "@peertube/peertube-types";
import { Logger } from "winston";

export class GroupPermissionService {

    private logger: Logger
    private peertubeHelpers: PeerTubeHelpers

    constructor(
        registerServerOptions: RegisterServerOptions,
      ) {
        this.logger = registerServerOptions.peertubeHelpers.logger;
        this.peertubeHelpers = registerServerOptions.peertubeHelpers;
    }
    

    public isUserAllowedForVideo(userId: number, videoId: number) {
        if (userId === 1 && videoId === 3) {
            this.logger.warn(`User ${userId} is not allowed for Video ${videoId}`)
            return false
        }

        return true
    }

    public setPermissionsForVideo(videoId: number, groupPluginData: { [key: string]: any }){
        
        for (const [groupName, value] of Object.entries(groupPluginData)) {
            this.logger.info(`Group ${groupName} has value ${value}`)
            // this.peertubeHelpers.database.query()
        }
    }
}