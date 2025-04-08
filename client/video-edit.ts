import type { RegisterClientOptions } from '@peertube/peertube-types/client'
import { RegisterClientVideoFieldOptions } from '@peertube/peertube-types'
import { Api } from './api'

async function register({
    registerVideoField,
    peertubeHelpers
}: RegisterClientOptions): Promise<void> {

    const { translate } = peertubeHelpers

    const api = new Api()
    console.log(await api.getUserGroups())

    const types: Array<RegisterClientVideoFieldOptions['type']> =
        ['update', 'upload', 'import-url', 'import-torrent', 'go-live']

    for (const type of types) {
        registerVideoField({
            name: "user-groups",
            label: await translate('User groups'),
            type: 'select',
            options: [
                {
                    value: 'Dummy Group 1',
                    label: await translate('Dummy Group 1')
                },
                {
                    value: 'Dummy Group 2',
                    label: await translate('Dummy Group 2')
                }
            ],
            default: 'Dummy Group 2'
        }, {
            type,
            tab: 'main'
        })
    }
}

export {
    register
}