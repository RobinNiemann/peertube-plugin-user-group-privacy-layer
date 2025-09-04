
export class Api {
  getAuthHeader: () => { Authorization: string } | undefined
  pluginBasePath = `/plugins/user-group-sharing/router`

  constructor (getAuthHeader?: () => { Authorization: string } | undefined) {
    this.getAuthHeader = getAuthHeader ? getAuthHeader : () => undefined
  }

  private async get<P>(path: string): Promise<P> {
    return fetch(path, {
      method: 'GET',
      headers: this.getAuthHeader()
    }).then(async res => res.json())
  }


  async getUserGroups (): Promise<{id: number, name: string}[]> {
    return this.get(this.pluginBasePath + '/user-groups')
  }
  
  async getVideoGroupsByShortUUID (videoShortUUID: string): Promise<number[]> {
    return this.get(this.pluginBasePath + '/video-groups/' + videoShortUUID)
  }

}