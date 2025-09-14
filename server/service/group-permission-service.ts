import { RegisterServerOptions, SettingEntries } from "@peertube/peertube-types";
import { Logger } from "winston";
import { DbService } from "./db-service";
import { parse as yamlParse } from "yaml";
import { USER_GROUP_SELECTION_FIELD } from '../../shared/constants';

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
    
    public async isUserAllowedForVideo(userId: number, videoId: number): Promise<boolean> {
        // Check if user owns the video
        const isOwner = await this.dbService.isVideoOwner(userId, videoId);
        if (isOwner) {
            return true;
        }
        
        const videoGroups = await this.dbService.getVideoGroupPermissions(videoId);
        
        // If video has no group restrictions, deny access (video is restricted but user not in groups)
        if (videoGroups.length === 0) {
            return false;
        }
        
        const userGroups = await this.dbService.getUserGroupsForUser(userId);
        const hasAccess = videoGroups.some(group => userGroups.includes(group));
        
        if (!hasAccess) {
            this.logger.debug(`User ${userId} not allowed for video ${videoId} - user groups: [${userGroups.join(', ')}], video groups: [${videoGroups.join(', ')}]`);
        }
        
        return hasAccess;
    }

    public async setPermissionsForVideo(videoId: number, groupPluginData: { [key: string]: any }) {
        let selectedGroupIds: number[] = []
        
        // Parse group IDs from JSON format
        if (groupPluginData[USER_GROUP_SELECTION_FIELD]) {
            const groupSelectionValue = groupPluginData[USER_GROUP_SELECTION_FIELD];
            if (groupSelectionValue && groupSelectionValue.trim() !== '') {
                try {
                    const parsedArray = JSON.parse(groupSelectionValue);
                    if (Array.isArray(parsedArray)) {
                        selectedGroupIds = parsedArray.map((id: any) => parseInt(id)).filter((id: number) => !isNaN(id));
                    }
                } catch (error) {
                    this.logger.error('Failed to parse group selection JSON:', error, 'Value:', groupSelectionValue);
                }
            }
        }
        
        this.logger.info(`Setting video ${videoId} permissions for group IDs: [${selectedGroupIds.join(', ')}]`);
        await this.dbService.setVideoGroupPermissionsByIds(videoId, selectedGroupIds);
    }
    
    public async loadPluginDataForVideo(video: any, videoId: number) {
        const groupIds = await this.dbService.getVideoGroupIds(videoId);
        
        video.pluginData = video.pluginData || {};
        
        // Set the user-group-selection field with the correct JSON format
        video.pluginData[USER_GROUP_SELECTION_FIELD] = JSON.stringify(groupIds.map(String));
        
        this.logger.info(`Loaded plugin data for video ${videoId}: ${USER_GROUP_SELECTION_FIELD} = ${video.pluginData[USER_GROUP_SELECTION_FIELD]}`);
    }
    
    public async updateUserGroups(settings: SettingEntries): Promise<any> {
        const userGroupDefinition = settings['user-group-definition'] as string
        
        if (!userGroupDefinition || userGroupDefinition.trim() === '') {
            this.logger.info("Empty user group definition, clearing all groups")
            await this.dbService.updateUserGroups([])
            return Promise.resolve()
        }

        try {
            const groups = yamlParse(userGroupDefinition)
            this.logger.info(`Parsed ${groups?.length || 0} user groups from settings`)
            
            const userGroups = groups?.map((group: any) => ({
                name: group.group_name || group.name,
                members: group.members || []
            })) || []
            
            await this.dbService.updateUserGroups(userGroups)
            this.logger.info("User groups updated successfully")
        } catch (error) {
            this.logger.error("Failed to parse user group definition:", error)
        }
        
        return Promise.resolve()
    }
}