import type { RegisterClientOptions } from '@peertube/peertube-types/client'
import { RegisterClientVideoFieldOptions } from '@peertube/peertube-types'
import { Api } from './api'

async function register({
    registerVideoField,
    peertubeHelpers
}: RegisterClientOptions): Promise<void> {
    const api = new Api(peertubeHelpers.getAuthHeader)
    const allUserGroups = await api.getUserGroups()
    console.log(allUserGroups)

    const types: Array<RegisterClientVideoFieldOptions['type']> =
        ['update', 'upload', 'import-url', 'import-torrent', 'go-live']

    for (const type of types) {
        for (const group of allUserGroups) {
            registerVideoField({
                name: group,
                label: group,
                type: 'input-checkbox',
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