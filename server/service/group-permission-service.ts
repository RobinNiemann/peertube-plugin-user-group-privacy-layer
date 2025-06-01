import { RegisterServerOptions, SettingEntries } from "@peertube/peertube-types";
import { Logger } from "winston";
import { DbService } from "./db-service";

export class GroupPermissionService {

    private logger: Logger
    private dbService: DbService

    constructor(
        registerServerOptions: RegisterServerOptions,
        dbSerbice: DbService,
      ) {
        this.logger = registerServerOptions.peertubeHelpers.logger;
        this.dbService = dbSerbice;
    }
    
    public isUserAllowedForVideo(userId: number, videoId: number) {
        // TODO Search user - user_group - video connection
        if (userId === 1 && videoId === 3) {
            this.logger.warn(`User ${userId} is not allowed for Video ${videoId}`)
            return false
        }

        return true
    }

    public setPermissionsForVideo(videoId: number, groupPluginData: { [key: string]: any }){
        // TODO Save to user_group_2_video
        for (const [groupName, value] of Object.entries(groupPluginData)) {
            this.logger.info(`Group ${groupName} has value ${value}`)
        }
    }
    
    public async updateUserGroups(settings: SettingEntries): Promise<any> {
        const userGroupDefinition = settings['user-group-definition'] as string
        // TODO Save to user_groups_2_user
        this.dbService.updateUserGroups([])

        
        this.logger.info(userGroupDefinition)
        return Promise.resolve()

    }
}