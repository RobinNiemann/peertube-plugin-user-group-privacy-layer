import { DbService } from './db-service';
import { PeerTubeHelpers, RegisterServerOptions } from '@peertube/peertube-types';
import { RequestHandler, Response } from 'express';

export class RouteHandlerFactory {
  private peertubeHelpers: PeerTubeHelpers;
  private dbService: DbService;

  constructor(registerServerOptions: RegisterServerOptions, dbService: DbService) {
    this.peertubeHelpers = registerServerOptions.peertubeHelpers;
    this.dbService = dbService;
  }

  /**
   * 
   * @returns List of all available user group names
   */
  createUserGroupsRouteHandler(): RequestHandler {
    return async (req, res, next) => {
      try {
        await this.getAuthUser(res)
        const userGroups = await this.dbService.getAllUserGroupsWithIds()
        res.json(userGroups)

      } catch (error: unknown) {
        this.handleError(error, res);
      }
    }
  }

  /**
   * 
   * @returns List of groups the current user is in
   */
  createUserGroupsForCurrentUserRouteHandler(): RequestHandler {
    return async (req, res, next) => {
        try {
          const authUser = await this.getAuthUser(res)
          const userGroups = await this.dbService.getUserGroupsForUser(authUser.id)
          res.json(userGroups)

        } catch (error: unknown) {
          this.handleError(error, res);
        }
      }
    }
    
    createVideoGroupsRouteHandler(): RequestHandler {
      return async (req, res, next) => {
        try {
          await this.getAuthUser(res)
          const videoUUID = req.params.videoUUID
          const groupIds = await this.dbService.getVideoGroupsByUUID(videoUUID)
          
          // Prevent caching to ensure fresh data
          res.set('Cache-Control', 'no-cache, no-store, must-revalidate')
          res.set('Pragma', 'no-cache')
          res.set('Expires', '0')
          
          res.json(groupIds)

        } catch (error: unknown) {
          this.peertubeHelpers.logger.error(`Error in getVideoGroups for ${req.params.videoId}:`, error)
          this.handleError(error, res);
        }
      }
    }

  private handleError(error: unknown, res: Response): void {
    if (error instanceof Error && error.message === 'Unauthorized') {
      res.status(401).json({ error: 'Unauthorized' });
    } else {
      this.peertubeHelpers.logger.error('Error fetching user groups:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  private async getAuthUser(res: Response): Promise<any> {
    const authUser = await this.peertubeHelpers.user.getAuthUser(res);
    if (!authUser) {
      throw new Error('Unauthorized');
    }
    return authUser;
  }

}