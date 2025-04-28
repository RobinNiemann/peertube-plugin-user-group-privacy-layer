import { PluginSettingsManager } from "@peertube/peertube-types";
import { UserGroup } from "../model/user-group";

/**
 * Reads and parses the markdown settings with the group definition
 */
export class GroupSettingsService {

  constructor(private settingsManager: PluginSettingsManager) { }

  async getAllGroups(): Promise<UserGroup[]> {
    const markdown = await this.settingsManager.getSetting('user-group-definition') as string;
    if (!markdown) {
      return [];
    }

    const groups: UserGroup[] = [];
    const lines = markdown.split('\n');
    let currentGroup: UserGroup | null = null;

    for (const line of lines) {
      const trimmedLine = line.trim();

      if (trimmedLine.startsWith('# ')) {
        if (currentGroup) {
          groups.push(currentGroup);
        }
        currentGroup = { name: trimmedLine.substring(2).trim(), members: [] };
      } else if (trimmedLine && currentGroup) {
        currentGroup.members.push(trimmedLine);
      }
    }

    if (currentGroup) {
      groups.push(currentGroup);
    }

    return groups;
  }

  async getGroupsForUser(userName: string): Promise<UserGroup[]> {
    const groups = await this.getAllGroups();
    return groups.filter(group => group.members.includes(userName));
  }
}