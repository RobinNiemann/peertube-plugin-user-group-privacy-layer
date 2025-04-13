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