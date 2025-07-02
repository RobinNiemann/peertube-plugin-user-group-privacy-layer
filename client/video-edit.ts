import type { RegisterClientOptions } from '@peertube/peertube-types/client'
import { RegisterClientVideoFieldOptions } from '@peertube/peertube-types'
import { Api } from './api'
import shortUUID from 'short-uuid'

const REGISTER_VIDEO_FIELD_TYPES: Array<RegisterClientVideoFieldOptions['type']> =
    ['update', 'upload', 'import-url', 'import-torrent', 'go-live']

async function register({
    registerVideoField,
    peertubeHelpers
}: RegisterClientOptions): Promise<void> {

    const api = new Api(peertubeHelpers.getAuthHeader)
    const allUserGroups = await api.getUserGroups()
    
    const urlParts = window.location.pathname.split('/')
    const videoShortUUID = urlParts[urlParts.indexOf('manage') + 1]
    
    let selectedGroupIds: number[] = []
    if (videoShortUUID && videoShortUUID !== 'upload') {
        try {
            // Convert shortUUID to regular UUID
            const translator = shortUUID()
            const videoUUID = translator.toUUID(videoShortUUID)
            selectedGroupIds = await api.getVideoGroupsByUUID(videoUUID)
        } catch (error) {
            console.warn('Could not load video groups:', error)
        }
    }

    for (const type of REGISTER_VIDEO_FIELD_TYPES) {
        for (const group of allUserGroups) {
            registerVideoField({
                name: group.name,
                label: group.name,
                type: 'input-checkbox',
                default: selectedGroupIds.includes(group.id)
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