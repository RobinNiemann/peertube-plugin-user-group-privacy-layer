import { PeerTubeHelpers, RegisterServerOptions } from "@peertube/peertube-types";
import { Logger } from "winston";
import { UserGroup } from "../model/user-group";

export class DbService {

    private readonly REINITIALIZE_DB = true

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
        // TODO Gruppen löschen, cascade zu Mitglieder

        for (const group of userGroups){
            // TODO Gruppen hinzufügen

            // TODO Gruppenmitglieder speichern
            const memberUserIds = await Promise.all(group.members.map(this.getUserIdByName))
            this.logger.debug(memberUserIds)

            await this.peertubeHelpers.database.query(`
                
            `);
        }
    }

    private async getUserIdByName(userName: string): Promise<number> {
        return await this.peertubeHelpers.database.query(`
            SELECT id FROM user
            WHERE username = '${userName}';
            `)
    }

}