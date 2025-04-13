import { GroupManager } from './group-manager';
import { PeerTubeHelpers, RegisterServerOptions } from '@peertube/peertube-types';
import { RequestHandler, Response } from 'express';

export class RouteHandlerFactory {
  private peertubeHelpers: PeerTubeHelpers;
  private groupManager: GroupManager;

  constructor(registerServerOptions: RegisterServerOptions) {
    this.peertubeHelpers = registerServerOptions.peertubeHelpers;
    this.groupManager = new GroupManager(registerServerOptions.settingsManager);
  }

  createUserGroupsRouteHandler(): RequestHandler {
    return async (req, res, next) => {
      try {
        await this.getAuthUser(res)
        const userGroups = await this.groupManager.getAllGroups()
        const userGroupNames = userGroups.map(group => group.name)
        res.json(userGroupNames)

      } catch (error: unknown) {
        this.handleError(error, res);
      }
    }
  }

  createUserGroupsForCurrentUserRouteHandler(): RequestHandler {
    return async (req, res, next) => {
        try {
          const authUser = await this.getAuthUser(res)
          const userGroups = await this.groupManager.getGroupsForUser(authUser.username)
          res.json(userGroups)

        } catch (error: unknown) {
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