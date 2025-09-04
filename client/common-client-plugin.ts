import type { RegisterClientOptions } from '@peertube/peertube-types/client'
import { Api } from './api'
import { USER_GROUP_SELECTION_FIELD } from '../shared/constants'

class UserGroupSelectionUpdater {
  private api: Api

  constructor(api: Api) {
    this.api = api
  }

  async initialize(): Promise<void> {
    const container = document.querySelector('.group-checkboxes') as HTMLElement
    
    if (container && !container.dataset.initialized) {
      container.dataset.initialized = 'true'
      await this.loadUserGroups(container)
    }
  }

  private async loadUserGroups(container: HTMLElement): Promise<void> {
    try {
      const groups = await this.api.getUserGroups()
      container.innerHTML = ''
      
      if (groups.length === 0) {
        container.innerHTML = 'No user groups configured'
        return
      }
      
      groups.forEach(group => {
        const label = document.createElement('label')
        const checkbox = document.createElement('input')
        checkbox.type = 'checkbox'
        checkbox.value = group.id.toString()
        checkbox.addEventListener('change', () => this.updateSelectedGroupsInTextArea())
        
        label.appendChild(checkbox)
        label.appendChild(document.createTextNode(' ' + group.name))
        container.appendChild(label)
        container.appendChild(document.createElement('br'))
      })
      
      await this.loadExistingSelections()
      
    } catch (error) {
      container.innerHTML = 'Error loading groups'
    }
  }

  private async loadExistingSelections(): Promise<void> {
    const videoShortUUID = this.getVideoShortUUID()
    if (!videoShortUUID) {
      // New videos have no saved selections
      return
    }
    
    try {
      const selectedGroupIds = await this.api.getVideoGroupsByShortUUID(videoShortUUID)
      
      selectedGroupIds.forEach((groupId: number) => {
        const checkboxForGroupId = document.querySelector(`.group-checkboxes input[value="${groupId}"]`) as HTMLInputElement
        if (checkboxForGroupId) {
          checkboxForGroupId.checked = true
        }
      })
      // Update textarea silently (don't trigger form change events during initial load)
      this.updateSelectedGroupsInTextArea(false)
      
    } catch (error) {
      console.error('Failed to load existing group selections:', error)
    }
  }

  private updateSelectedGroupsInTextArea(triggerEvents: boolean = true): void {
    const checkedCheckboxes = document.querySelectorAll('.group-checkboxes input[type="checkbox"]:checked') as NodeListOf<HTMLInputElement>
    const selectedIds = Array.from(checkedCheckboxes).map(checkbox => checkbox.value)
    const textArea = document.querySelector(`textarea#${USER_GROUP_SELECTION_FIELD}`) as HTMLTextAreaElement

    textArea.value = JSON.stringify(selectedIds)
    
    // Only trigger input event for user interactions, not during initial load
    if (triggerEvents) {
      textArea.dispatchEvent(new Event('input', { bubbles: true }))
    }
  }

  private getVideoShortUUID(): string | null {
    // Extract video short UUID from current URL
    const match = window.location.pathname.match(/\/videos\/manage\/([a-zA-Z0-9_-]+)/)
    return match ? match[1] : null
  }
}

async function register({ peertubeHelpers, registerHook }: RegisterClientOptions): Promise<void> {
  const api = new Api(peertubeHelpers.getAuthHeader)
  const userGroupSelectionUpdater = new UserGroupSelectionUpdater(api)

  registerHook({
    target: 'action:video-edit.init',
    handler: () => {
      setTimeout(() => userGroupSelectionUpdater.initialize(), 1000)
    }
  })
}

export {
  register
}