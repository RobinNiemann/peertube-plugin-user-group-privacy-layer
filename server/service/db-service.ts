import { PeerTubeHelpers, RegisterServerOptions } from "@peertube/peertube-types";
import { Logger } from "winston";
import { UserGroup } from "../model/user-group";

export class DbService {

    private readonly REINITIALIZE_DB = false

    private logger: Logger
    private peertubeHelpers: PeerTubeHelpers

    constructor(
        registerServerOptions: RegisterServerOptions,
    ) {
        this.logger = registerServerOptions.peertubeHelpers.logger;
        this.peertubeHelpers = registerServerOptions.peertubeHelpers;
    }

    public async initDb() {
        if (this.REINITIALIZE_DB) {
            await this.delete_old_tables();
        }

        await this.createUserGroupsTable();
        await this.createUserGroupVideoMappingTable();
        await this.createUserGroupUserMappingTable();
    }

    
    private async delete_old_tables() {
        await this.peertubeHelpers.database.query(`
            DROP TABLE IF EXISTS user_group_2_video;
            DROP TABLE IF EXISTS user_group_2_user;
            DROP TABLE IF EXISTS user_group;
        `)
        this.logger.info("Tables deleted")
    }

    private async createUserGroupsTable() {
        await this.peertubeHelpers.database.query(`
            CREATE TABLE IF NOT EXISTS user_group (
                id SERIAL PRIMARY KEY,
                group_name VARCHAR(255) NOT NULL
            );
        `);
        this.logger.info("Table user_group created")
    }

    private async createUserGroupVideoMappingTable() {
        await this.peertubeHelpers.database.query(`
            CREATE TABLE IF NOT EXISTS user_group_2_video (
                user_group_id INTEGER NOT NULL,
                video_id INTEGER NOT NULL,
                FOREIGN KEY (user_group_id) REFERENCES user_group(id),
                FOREIGN KEY (video_id) REFERENCES video(id),
                PRIMARY KEY (user_group_id, video_id)
            );
        `);
        this.logger.info("Table user_group_2_video created")
    }

    private async createUserGroupUserMappingTable() {
        await this.peertubeHelpers.database.query(`
            CREATE TABLE IF NOT EXISTS user_group_2_user (
                user_group_id INTEGER NOT NULL,
                user_id INTEGER NOT NULL,
                FOREIGN KEY (user_group_id) REFERENCES user_group(id),
                FOREIGN KEY (user_id) REFERENCES "user"(id),
                PRIMARY KEY (user_group_id, user_id)
            );
        `);
        this.logger.info("Table user_group_2_user created")
    }

    public async updateUserGroups(userGroups: UserGroup[]) {
        await this.peertubeHelpers.database.query('DELETE FROM user_group_2_user');
        await this.peertubeHelpers.database.query('DELETE FROM user_group');
        
        for (const group of userGroups) {
            const [insertResult] = await this.peertubeHelpers.database.query(
                `INSERT INTO user_group (group_name) VALUES ('${group.name}') RETURNING id`
            );
            const groupId = insertResult[0].id;
            
            const memberUserIds = await Promise.all(
                group.members.map(userName => this.getUserIdByName(userName))
            );
            
            for (const userId of memberUserIds) {
                if (userId) {
                    await this.peertubeHelpers.database.query(
                        `INSERT INTO user_group_2_user (user_group_id, user_id) VALUES (${groupId}, ${userId})`
                    );
                }
            }
        }
        
        this.logger.info(`Updated ${userGroups.length} user groups`);
    }

    private async getUserIdByName(userName: string): Promise<number | null> {
        const result = await this.peertubeHelpers.database.query(
            `SELECT id FROM "user" WHERE username = '${userName}'`
        );
        const [rows] = result;
        return rows.length > 0 ? rows[0].id : null;
    }
    
    public async setVideoGroupPermissionsByIds(videoId: number, groupIds: number[]) {
        await this.peertubeHelpers.database.query(
            `DELETE FROM user_group_2_video WHERE video_id = ${videoId}`
        );
        
        for (const groupId of groupIds) {
            await this.peertubeHelpers.database.query(
                `INSERT INTO user_group_2_video (user_group_id, video_id) VALUES (${groupId}, ${videoId})`
            );
        }
    }
    
    public async getUserGroupsForUser(userId: number): Promise<string[]> {
        const result = await this.peertubeHelpers.database.query(`
            SELECT ug.group_name 
            FROM user_group ug
            JOIN user_group_2_user ugu ON ug.id = ugu.user_group_id
            WHERE ugu.user_id = ${userId}
        `);
        const [rows] = result;
        return rows.map((row: any) => row.group_name);
    }
    
    public async getVideoGroupPermissions(videoId: number): Promise<string[]> {
        const result = await this.peertubeHelpers.database.query(`
            SELECT ug.group_name 
            FROM user_group ug
            JOIN user_group_2_video ugv ON ug.id = ugv.user_group_id
            WHERE ugv.video_id = ${videoId}
        `);
        const [rows] = result;
        return rows.map((row: any) => row.group_name);
    }
    
    public async getAllUserGroupsWithIds(): Promise<{id: number, name: string}[]> {
        const result = await this.peertubeHelpers.database.query(
            `SELECT id, group_name as name FROM user_group ORDER BY group_name`
        );
        const [rows] = result;
        return rows;
    }
    
    public async getVideoGroupIds(videoId: number): Promise<number[]> {
        const result = await this.peertubeHelpers.database.query(`
            SELECT user_group_id 
            FROM user_group_2_video 
            WHERE video_id = ${videoId}
        `);
        const [rows] = result;
        return rows.map((row: any) => row.user_group_id);
    }
    
    public async getVideoGroupsByUUID(videoUUID: string): Promise<number[]> {
        const result = await this.peertubeHelpers.database.query(`
            SELECT ugv.user_group_id
            FROM user_group_2_video ugv
            JOIN video v ON ugv.video_id = v.id
            WHERE v.uuid::text = '${videoUUID}'
        `);
        const [rows] = result;
        return rows.map((row: any) => row.user_group_id);
    }
    
    public async isVideoOwner(userId: number, videoId: number): Promise<boolean> {
        const result = await this.peertubeHelpers.database.query(`
            SELECT COUNT(*) as count 
            FROM video v
            JOIN "videoChannel" vc ON v."channelId" = vc.id
            JOIN account a ON vc."accountId" = a.id
            WHERE v.id = ${videoId} AND a."userId" = ${userId}
        `);
        const [rows] = result;
        return parseInt(rows[0].count) > 0;
    }

}