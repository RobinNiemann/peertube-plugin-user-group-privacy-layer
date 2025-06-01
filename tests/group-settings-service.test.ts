import { GroupSettingsService } from '../server/service/group-settings-service';
import { PluginSettingsManager } from '@peertube/peertube-types';

describe('GroupManager', () => {
    let mockSettingsManager: jest.Mocked<PluginSettingsManager>;
    let groupSettingsService: GroupSettingsService;

    beforeEach(() => {
        // Mock PluginSettingsManager
        mockSettingsManager = {
            getSetting: jest.fn(),
            setSetting: jest.fn(),
            deleteSetting: jest.fn(),
        } as unknown as jest.Mocked<PluginSettingsManager>;

        groupSettingsService = new GroupSettingsService(mockSettingsManager);
    });

    it('should parse groups from markdown', async () => {
        const markdown = `
        # Group 1
        root

        # Group 2
        root
        test_user
        `;
        mockSettingsManager.getSetting.mockResolvedValue(markdown);

        const groups = await groupSettingsService.getAllGroups();

        expect(groups).toHaveLength(2);
        expect(groups[0].name).toBe('Group 1');
        expect(groups[0].members).toEqual(['root']);
        expect(groups[1].name).toBe('Group 2');
        expect(groups[1].members).toEqual(['root', 'test_user']);
    });
});