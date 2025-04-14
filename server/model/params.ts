import { MVideoFullLight } from "@peertube/peertube-types"
import * as express from "express"

export type VideoUpdateParams = {
    video: MVideoFullLight
    body: {
        pluginData?: {
            [key: string]: any
        }
    }
    req: express.Request
    res: express.Response
}

export type GetVideoParams = {
    id: number
    userId: number
    req: express.Request
}

export type VideoListResultParams = {
    start: any
    count: any
    sort: any
    nsfw: any
    isLive: any
    skipCount: any
    displayOnlyForFollower: any
    user: any
    countVideos: any
}

export type VideoSearchParams = {
    start: any
    count: any
    sort: any
    search: any
    searchTarget: any
    displayOnlyForFollower: any
    countVideos: any
    nsfw: any
    user: any
}