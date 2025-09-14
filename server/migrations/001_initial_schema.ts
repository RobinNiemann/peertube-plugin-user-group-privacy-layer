import { Migration } from "./migration-runner";

export const migration_001_initial_schema: Migration = {
    version: "001",
    description: "Create initial user group schema with tables for groups, users, and videos",
    
    async up(db) {
        // Create user_group table
        await db.query(`
            CREATE TABLE IF NOT EXISTS user_group (
                id SERIAL PRIMARY KEY,
                group_name VARCHAR(255) NOT NULL UNIQUE,
                created_at TIMESTAMP DEFAULT NOW(),
                updated_at TIMESTAMP DEFAULT NOW()
            );
        `);

        // Create user_group_2_video mapping table
        await db.query(`
            CREATE TABLE IF NOT EXISTS user_group_2_video (
                user_group_id INTEGER NOT NULL,
                video_id INTEGER NOT NULL,
                created_at TIMESTAMP DEFAULT NOW(),
                FOREIGN KEY (user_group_id) REFERENCES user_group(id) ON DELETE CASCADE,
                FOREIGN KEY (video_id) REFERENCES video(id) ON DELETE CASCADE,
                PRIMARY KEY (user_group_id, video_id)
            );
        `);

        // Create user_group_2_user mapping table
        await db.query(`
            CREATE TABLE IF NOT EXISTS user_group_2_user (
                user_group_id INTEGER NOT NULL,
                user_id INTEGER NOT NULL,
                created_at TIMESTAMP DEFAULT NOW(),
                FOREIGN KEY (user_group_id) REFERENCES user_group(id) ON DELETE CASCADE,
                FOREIGN KEY (user_id) REFERENCES "user"(id) ON DELETE CASCADE,
                PRIMARY KEY (user_group_id, user_id)
            );
        `);

        // Create indexes for better performance
        await db.query(`
            CREATE INDEX IF NOT EXISTS idx_user_group_2_video_video_id 
            ON user_group_2_video(video_id);
        `);

        await db.query(`
            CREATE INDEX IF NOT EXISTS idx_user_group_2_user_user_id 
            ON user_group_2_user(user_id);
        `);

        await db.query(`
            CREATE INDEX IF NOT EXISTS idx_user_group_name 
            ON user_group(group_name);
        `);
    },

    async down(db) {
        // Drop tables in reverse order (respecting foreign key constraints)
        await db.query(`DROP TABLE IF EXISTS user_group_2_video CASCADE;`);
        await db.query(`DROP TABLE IF EXISTS user_group_2_user CASCADE;`);
        await db.query(`DROP TABLE IF EXISTS user_group CASCADE;`);
    }
};