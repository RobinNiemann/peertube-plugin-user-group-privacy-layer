import type { RegisterClientOptions } from '@peertube/peertube-types/client'
import { RegisterClientVideoFieldOptions } from '@peertube/peertube-types'
import { USER_GROUP_SELECTION_FIELD } from '../shared/constants'

const REGISTER_VIDEO_FIELD_TYPES: Array<RegisterClientVideoFieldOptions['type']> =
    ['update', 'upload', 'import-url', 'import-torrent', 'go-live']

async function register({
    registerVideoField
}: RegisterClientOptions): Promise<void> {

    for (const type of REGISTER_VIDEO_FIELD_TYPES) {
        // Register hidden textarea field for data storage
        registerVideoField({
            name: USER_GROUP_SELECTION_FIELD,
            label: 'Selected User Groups (Internal)',
            type: 'input-textarea',
            default: '[]',
            hidden: () => false,
            descriptionHTML: 'This field stores the selected group IDs as JSON. Please use the checkboxes below to select groups.'
        }, {
            type: type,
            tab: 'plugin-settings'
        })
        
        // Register separate HTML field for UI display
        registerVideoField({
            name: 'user-group-ui',
            label: 'User Groups',
            type: 'html',
            html: createUserGroupSelectorHTML()
        }, {
            type: type,
            tab: 'plugin-settings'
        })
    }
}

function createUserGroupSelectorHTML(): string {
    return `
        <div class="user-group-selector" data-plugin="user-group-sharing">
            <div class="group-checkboxes">
                Loading user groups...
            </div>
        </div>
    `;
}

export {
    register
}