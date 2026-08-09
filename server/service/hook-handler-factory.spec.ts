import { HookHandlerFactory } from './hook-handler-factory'

/**
 * Guards the core of the missing-videos fix: filtering by group permissions BEFORE re-paginating,
 * so a filtered page never looks "short" to the frontend's infinite scroll. See
 * docs/bugfix-missing-videos.md.
 */
describe('HookHandlerFactory list pagination', () => {
  const ALLOWED_USER_ID = 7
  const TOTAL_VIDEOS = 60
  const PAGE_SIZE = 25

  // Build a factory whose permission service allows only even video ids for ALLOWED_USER_ID.
  function buildFactory () {
    const registerServerOptions: any = {
      peertubeHelpers: { logger: { warn () {}, error () {}, info () {}, debug () {} } }
    }
    const groupPermissionServices: any = {
      async getAllowedVideoIds (userId: number, candidateIds: number[]) {
        if (userId !== ALLOWED_USER_ID) return new Set<number>()
        return new Set(candidateIds.filter(id => id % 2 === 0))
      }
    }
    return new HookHandlerFactory(registerServerOptions, groupPermissionServices)
  }

  // Simulates one PeerTube request: the params hook widens the window, then listForApi returns the
  // (widened) page, then the result hook filters + re-paginates.
  async function requestPage (factory: HookHandlerFactory, start: number, count: number, userId?: number) {
    const params: any = { start, count, user: userId ? { id: userId } : undefined }

    await factory.buildListParamsHandler()(params)
    expect(params.start).toBe(0)
    expect(params.count).toBeGreaterThan(count)

    const fetched = Array.from({ length: params.count <= TOTAL_VIDEOS ? params.count : TOTAL_VIDEOS }, (_, i) => ({ id: i + 1 }))
    const result: any = { data: fetched, total: fetched.length }

    return factory.buildListResultHandler(item => item.id)(result, params)
  }

  it('returns a full first page of allowed videos (does not stop infinite scroll early)', async () => {
    const result = await requestPage(buildFactory(), 0, PAGE_SIZE, ALLOWED_USER_ID)

    // 30 of 60 videos are allowed -> first page must be full (25), not truncated to "allowed on page 1".
    expect(result.data).toHaveLength(PAGE_SIZE)
    expect(result.total).toBe(TOTAL_VIDEOS / 2)
    expect(result.data.every((v: any) => v.id % 2 === 0)).toBe(true)
  })

  it('returns the remaining allowed videos on the next page', async () => {
    const result = await requestPage(buildFactory(), PAGE_SIZE, PAGE_SIZE, ALLOWED_USER_ID)

    // 30 allowed total, 25 on page 1 -> 5 left on page 2.
    expect(result.data).toHaveLength(5)
    expect(result.total).toBe(TOTAL_VIDEOS / 2)
  })

  it('hides everything from anonymous users', async () => {
    const result = await requestPage(buildFactory(), 0, PAGE_SIZE)

    expect(result.data).toHaveLength(0)
    expect(result.total).toBe(0)
  })

  it('extracts the video id from playlist elements', async () => {
    const factory = buildFactory()
    const params: any = { start: 0, count: PAGE_SIZE, user: { id: ALLOWED_USER_ID } }
    await factory.buildListParamsHandler()(params)

    const result: any = { data: [{ videoId: 2 }, { videoId: 3 }, { videoId: 4 }], total: 3 }
    const filtered = await factory.buildListResultHandler(item => item.videoId)(result, params)

    expect(filtered.data.map((e: any) => e.videoId)).toEqual([2, 4])
    expect(filtered.total).toBe(2)
  })
})
