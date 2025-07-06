import type { RegisterClientOptions } from '@peertube/peertube-types/client'
import { RegisterClientVideoFieldOptions } from '@peertube/peertube-types'
import { Api } from './api'
import { VIDEO_FIELD_GROUP_PREFIX } from '../shared/constants'

const REGISTER_VIDEO_FIELD_TYPES: Array<RegisterClientVideoFieldOptions['type']> =
    ['update', 'upload', 'import-url', 'import-torrent', 'go-live']

async function register({
    registerVideoField,
    peertubeHelpers
}: RegisterClientOptions): Promise<void> {

    const api = new Api(peertubeHelpers.getAuthHeader)
    const allUserGroups = await api.getUserGroups()

    for (const type of REGISTER_VIDEO_FIELD_TYPES) {
        for (const group of allUserGroups) {
            registerVideoField({
                name: VIDEO_FIELD_GROUP_PREFIX + group.id,
                label: group.name,
                type: 'input-checkbox',
                default: false
            }, {
                type: type,
                tab: 'plugin-settings'
            })
        }
    }
}

export {
    register
}