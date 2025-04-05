import type { RegisterClientOptions } from '@peertube/peertube-types/client'
/*
NB: if you need some types like `video`, `playlist`, ..., you can import them like that:
import type { Video } from '@peertube/peertube-types'
*/

async function register ({ peertubeHelpers, registerClientRoute, registerHook }: RegisterClientOptions): Promise<void> {
  
  registerClientRoute({
    route: '/my-account/user-groups',
    onMount: async ({ rootEl }) => {
      const html = await peertubeHelpers.translate('Benutzergruppen')
      rootEl.innerHTML = `
        <div class="margin-content">
          <h1>Benutzergruppen</h1>
          <div class="user-groups-container">
            ${html}
          </div>
        </div>
      `
    }
  })


}

export {
  register
}
