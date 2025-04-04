import type { RegisterServerOptions } from '@peertube/peertube-types'

export async function setupDb (peertubeHelpers: RegisterServerOptions['peertubeHelpers']): Promise<void> {
  const db = peertubeHelpers.database

  await db.query(`
    DROP TABLE IF EXISTS user_group_members;
    DROP TABLE IF EXISTS user_groups;
  `)
  peertubeHelpers.logger.info('User group tables removed successfully.')

  // Create user_groups table
  await db.query(`
    CREATE TABLE IF NOT EXISTS user_groups (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      description TEXT,
      owner_id INTEGER NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(name, owner_id)
    )
  `)

  // Create user_group_members table
  await db.query(`
    CREATE TABLE IF NOT EXISTS user_group_members (
      id SERIAL PRIMARY KEY,
      group_id INTEGER NOT NULL REFERENCES user_groups(id) ON DELETE CASCADE,
      user_id INTEGER NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(group_id, user_id)
    )
  `)

  // Create indexes for better performance
  await db.query(`
    CREATE INDEX IF NOT EXISTS idx_user_groups_owner_id ON user_groups(owner_id);
    CREATE INDEX IF NOT EXISTS idx_user_group_members_group_id ON user_group_members(group_id);
    CREATE INDEX IF NOT EXISTS idx_user_group_members_user_id ON user_group_members(user_id);
  `)

  peertubeHelpers.logger.info('User group tables created successfully.')
}
