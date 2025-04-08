import type { PeerTubeHelpers, RegisterServerOptions } from '@peertube/peertube-types'
import { Router } from 'express'

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

export function setupApi(router: Router, peertubeHelpers: PeerTubeHelpers): void {
  const db = peertubeHelpers.database

  router.get('user-groups', (req, res, next) => {

  })
  // GET /user-groups - Liste aller Gruppen des aktuellen Benutzers
  router.get('/user-groups', async (req, res, next) => {
    try {
      const authUser = await peertubeHelpers.user.getAuthUser(res)
      if (!authUser) {
        res.status(401).json({ error: 'Unauthorized' })
        return
      }

      const groups = await db.query(
        'SELECT * FROM user_groups WHERE owner_id = $1 ORDER BY created_at DESC',
        [authUser.id]
      )
      res.json(groups.rows)
    } catch (error: unknown) {
      peertubeHelpers.logger.error('Error fetching user groups:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  })

}

