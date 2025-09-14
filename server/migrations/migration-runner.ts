import { PeerTubeHelpers } from "@peertube/peertube-types";
import { Logger } from "winston";
import { migration_001_initial_schema } from "./001_initial_schema";

export interface Migration {
    version: string;
    description: string;
    up: (db: PeerTubeHelpers['database']) => Promise<void>;
    down: (db: PeerTubeHelpers['database']) => Promise<void>;
}

export class MigrationRunner {
    private db: PeerTubeHelpers['database'];
    private logger: Logger;
    
    private migrations: Migration[] = [
        migration_001_initial_schema,
        // Add new migrations here as they are created
    ];

    constructor(db: PeerTubeHelpers['database'], logger: Logger) {
        this.db = db;
        this.logger = logger;
    }

    public async initializeMigrationTable(): Promise<void> {
        // Check if table already exists
        const result = await this.db.query(`
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_name = 'plugin_migrations'
            );
        `);
        const [rows] = result;
        const tableExists = rows[0].exists;

        if (!tableExists) {
            await this.db.query(`
                CREATE TABLE plugin_migrations (
                    id SERIAL PRIMARY KEY,
                    version VARCHAR(50) NOT NULL UNIQUE,
                    executed_at TIMESTAMP DEFAULT NOW(),
                    description TEXT NOT NULL
                );
            `);
            this.logger.info("Migration table created");
        }
    }

    public async getExecutedMigrations(): Promise<string[]> {
        const result = await this.db.query(`
            SELECT version FROM plugin_migrations ORDER BY version
        `);
        const [rows] = result;
        return rows.map((row: any) => row.version);
    }

    public async runMigrations(): Promise<void> {
        await this.initializeMigrationTable();
        
        const executedMigrations = await this.getExecutedMigrations();
        const pendingMigrations = this.migrations
            .sort((a, b) => a.version.localeCompare(b.version))
            .filter(migration => !executedMigrations.includes(migration.version));
        
        let migrationsRun = 0;
        
        for (const migration of pendingMigrations) {
            this.logger.info(`Running migration ${migration.version}: ${migration.description}`);
            
            try {
                await migration.up(this.db);
                
                // Mark migration as executed
                await this.db.query(`
                    INSERT INTO plugin_migrations (version, description) 
                    VALUES ('${migration.version}', '${migration.description}')
                `);
                
                this.logger.info(`✅ Migration ${migration.version} completed successfully`);
                migrationsRun++;
            } catch (error) {
                this.logger.error(`❌ Migration ${migration.version} failed:`, error);
                throw new Error(`Migration ${migration.version} failed: ${error}`);
            }
        }
        
        if (migrationsRun > 0) {
            this.logger.info(`Completed ${migrationsRun} migrations`);
        } else {
            this.logger.info("All migrations are up to date");
        }
    }

    public async rollbackMigration(version: string): Promise<void> {
        const migration = this.migrations.find(m => m.version === version);
        if (!migration) {
            throw new Error(`Migration ${version} not found`);
        }

        const executedMigrations = await this.getExecutedMigrations();
        if (!executedMigrations.includes(version)) {
            throw new Error(`Migration ${version} was not executed`);
        }

        this.logger.info(`Rolling back migration ${version}: ${migration.description}`);
        
        try {
            await migration.down(this.db);
            
            // Remove migration from executed list
            await this.db.query(`
                DELETE FROM plugin_migrations WHERE version = '${version}'
            `);
            
            this.logger.info(`✅ Migration ${version} rolled back successfully`);
        } catch (error) {
            this.logger.error(`❌ Rollback of migration ${version} failed:`, error);
            throw new Error(`Rollback of migration ${version} failed: ${error}`);
        }
    }

    public async getMigrationStatus(): Promise<Array<{version: string, description: string, executed: boolean}>> {
        const executedMigrations = await this.getExecutedMigrations();
        
        return this.migrations
            .sort((a, b) => a.version.localeCompare(b.version))
            .map(migration => ({
                version: migration.version,
                description: migration.description,
                executed: executedMigrations.includes(migration.version)
            }));
    }

    public async initializeDatabase(reinitializeDb: boolean = false): Promise<void> {
        this.logger.info("Initializing database...");
        
        if (reinitializeDb) {
            await this.reinitializeDatabase();
        }
        
        this.logger.info("Running database migrations...");
        await this.runMigrations();
        
        // Log migration status
        const status = await this.getMigrationStatus();
        this.logger.info(`Migration status: ${status.length} migrations existing, ${status.filter(s => s.executed).length} executed`);
        
        this.logger.info("Database initialization completed");
    }

    public async reinitializeDatabase(): Promise<void> {
        this.logger.warn("⚠️  REINITIALIZE_DB is enabled - reverting all migrations!");
        
        // Initialize migration table first (in case it doesn't exist)
        await this.initializeMigrationTable();
        
        // Get all executed migrations and revert them in reverse order
        const executedMigrations = await this.getExecutedMigrations();
        const sortedMigrations = this.migrations.sort((a, b) => b.version.localeCompare(a.version)); // Reverse order
        
        for (const migration of sortedMigrations) {
            if (executedMigrations.includes(migration.version)) {
                await this.rollbackMigration(migration.version);
            }
        }
        
        this.logger.info("All migrations reverted");
    }
}