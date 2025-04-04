import type { RegisterServerOptions } from '@peertube/peertube-types'
import { setupDb } from './setup';

async function register ({ peertubeHelpers, getRouter }: RegisterServerOptions): Promise<void> {

  await setupDb(peertubeHelpers);

}

async function unregister (): Promise<void> {

}

module.exports = {
  register,
  unregister
}
