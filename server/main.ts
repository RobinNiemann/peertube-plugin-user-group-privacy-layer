import type { RegisterServerOptions } from '@peertube/peertube-types'
import { setupDb } from './setup'

async function register ({ peertubeHelpers, getRouter }: RegisterServerOptions): Promise<void> {
  await setupDb(peertubeHelpers)

  const router = getRouter()
  const db = peertubeHelpers.database

  // GET /user-groups - Liste aller Gruppen des aktuellen Benutzers
  router.get('/user-groups', async (req, res) => {
    try {
      const authUser = await peertubeHelpers.user.getAuthUser(res)
      if (!authUser) {
        return res.status(401).json({ error: 'Unauthorized' })
      }

      const groups = await db.query(
        'SELECT * FROM user_groups WHERE owner_id = $1 ORDER BY created_at DESC',
        [authUser.id]
      )
      return res.json(groups.rows)
    } catch (error: unknown) {
      peertubeHelpers.logger.error('Error fetching user groups:', error)
      return res.status(500).json({ error: 'Internal server error' })
    }
  })

  // POST /user-groups - Neue Gruppe erstellen
  router.post('/user-groups', async (req, res) => {
    try {
      const authUser = await peertubeHelpers.user.getAuthUser(res)
      if (!authUser) {
        return res.status(401).json({ error: 'Unauthorized' })
      }

      const { name, description } = req.body

      if (!name) {
        return res.status(400).json({ error: 'Name is required' })
      }

      const result = await db.query(
        'INSERT INTO user_groups (name, description, owner_id) VALUES ($1, $2, $3) RETURNING *',
        [name, description, authUser.id]
      )
      return res.json(result.rows[0])
    } catch (error: unknown) {
      peertubeHelpers.logger.error('Error creating user group:', error)
      return res.status(500).json({ error: 'Internal server error' })
    }
  })

  // PUT /user-groups/:id - Gruppe aktualisieren
  router.put('/user-groups/:id', async (req, res) => {
    try {
      const authUser = await peertubeHelpers.user.getAuthUser(res)
      if (!authUser) {
        return res.status(401).json({ error: 'Unauthorized' })
      }

      const groupId = parseInt(req.params.id)
      const { name, description } = req.body

      if (!name) {
        return res.status(400).json({ error: 'Name is required' })
      }

      // Überprüfe, ob die Gruppe dem Benutzer gehört
      const group = await db.query(
        'SELECT * FROM user_groups WHERE id = $1 AND owner_id = $2',
        [groupId, authUser.id]
      )

      if (group.rows.length === 0) {
        return res.status(404).json({ error: 'Group not found or access denied' })
      }

      const result = await db.query(
        'UPDATE user_groups SET name = $1, description = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3 AND owner_id = $4 RETURNING *',
        [name, description, groupId, authUser.id]
      )
      return res.json(result.rows[0])
    } catch (error: unknown) {
      peertubeHelpers.logger.error('Error updating user group:', error)
      return res.status(500).json({ error: 'Internal server error' })
    }
  })

  // DELETE /user-groups/:id - Gruppe löschen
  router.delete('/user-groups/:id', async (req, res) => {
    try {
      const authUser = await peertubeHelpers.user.getAuthUser(res)
      if (!authUser) {
        return res.status(401).json({ error: 'Unauthorized' })
      }

      const groupId = parseInt(req.params.id)

      // Überprüfe, ob die Gruppe dem Benutzer gehört
      const group = await db.query(
        'SELECT * FROM user_groups WHERE id = $1 AND owner_id = $2',
        [groupId, authUser.id]
      )

      if (group.rows.length === 0) {
        return res.status(404).json({ error: 'Group not found or access denied' })
      }

      await db.query('DELETE FROM user_groups WHERE id = $1 AND owner_id = $2', [groupId, authUser.id])
      return res.status(204).send()
    } catch (error: unknown) {
      peertubeHelpers.logger.error('Error deleting user group:', error)
      return res.status(500).json({ error: 'Internal server error' })
    }
  })

  // GET /user-groups/:id/members - Mitglieder einer Gruppe
  router.get('/user-groups/:id/members', async (req, res) => {
    try {
      const authUser = await peertubeHelpers.user.getAuthUser(res)
      if (!authUser) {
        return res.status(401).json({ error: 'Unauthorized' })
      }

      const groupId = parseInt(req.params.id)

      // Überprüfe, ob die Gruppe dem Benutzer gehört
      const group = await db.query(
        'SELECT * FROM user_groups WHERE id = $1 AND owner_id = $2',
        [groupId, authUser.id]
      )

      if (group.rows.length === 0) {
        return res.status(404).json({ error: 'Group not found or access denied' })
      }

      const members = await db.query(
        `SELECT u.id, u.username, u.email, ugm.created_at 
         FROM user_group_members ugm 
         JOIN "user" u ON u.id = ugm.user_id 
         WHERE ugm.group_id = $1`,
        [groupId]
      )
      return res.json(members.rows)
    } catch (error: unknown) {
      peertubeHelpers.logger.error('Error fetching group members:', error)
      return res.status(500).json({ error: 'Internal server error' })
    }
  })

  // POST /user-groups/:id/members - Mitglied zu Gruppe hinzufügen
  router.post('/user-groups/:id/members', async (req, res) => {
    try {
      const authUser = await peertubeHelpers.user.getAuthUser(res)
      if (!authUser) {
        return res.status(401).json({ error: 'Unauthorized' })
      }

      const groupId = parseInt(req.params.id)
      const { memberId } = req.body

      if (!memberId) {
        return res.status(400).json({ error: 'Member ID is required' })
      }

      // Überprüfe, ob die Gruppe dem Benutzer gehört
      const group = await db.query(
        'SELECT * FROM user_groups WHERE id = $1 AND owner_id = $2',
        [groupId, authUser.id]
      )

      if (group.rows.length === 0) {
        return res.status(404).json({ error: 'Group not found or access denied' })
      }

      // Überprüfe, ob der Benutzer existiert
      const user = await db.query('SELECT * FROM "user" WHERE id = $1', [memberId])
      if (user.rows.length === 0) {
        return res.status(404).json({ error: 'User not found' })
      }

      const result = await db.query(
        'INSERT INTO user_group_members (group_id, user_id) VALUES ($1, $2) RETURNING *',
        [groupId, memberId]
      )
      return res.json(result.rows[0])
    } catch (error: unknown) {
      if (error instanceof Error && 'code' in error && (error as { code: string }).code === '23505') { // Unique violation
        return res.status(409).json({ error: 'User is already a member of this group' })
      }
      peertubeHelpers.logger.error('Error adding group member:', error)
      return res.status(500).json({ error: 'Internal server error' })
    }
  })

  // DELETE /user-groups/:id/members/:userId - Mitglied aus Gruppe entfernen
  router.delete('/user-groups/:id/members/:userId', async (req, res) => {
    try {
      const authUser = await peertubeHelpers.user.getAuthUser(res)
      if (!authUser) {
        return res.status(401).json({ error: 'Unauthorized' })
      }

      const groupId = parseInt(req.params.id)
      const memberId = parseInt(req.params.userId)

      // Überprüfe, ob die Gruppe dem Benutzer gehört
      const group = await db.query(
        'SELECT * FROM user_groups WHERE id = $1 AND owner_id = $2',
        [groupId, authUser.id]
      )

      if (group.rows.length === 0) {
        return res.status(404).json({ error: 'Group not found or access denied' })
      }

      await db.query(
        'DELETE FROM user_group_members WHERE group_id = $1 AND user_id = $2',
        [groupId, memberId]
      )
      return res.status(204).send()
    } catch (error: unknown) {
      peertubeHelpers.logger.error('Error removing group member:', error)
      return res.status(500).json({ error: 'Internal server error' })
    }
  })
}

async function unregister (): Promise<void> {
  // Cleanup wird in setup.ts gehandhabt
}

module.exports = {
  register,
  unregister
}