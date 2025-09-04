import type { RegisterClientOptions } from '@peertube/peertube-types/client'
import { Api } from './api'

async function register ({ peertubeHelpers, registerHook }: RegisterClientOptions): Promise<void> {
  const api = new Api(peertubeHelpers.getAuthHeader)

  registerHook({
    target: 'action:video-edit.init',
    handler: () => {
      setTimeout(() => initializeUserGroupSelector(api), 1000)
    }
  })
}


function initializeUserGroupSelector(api: Api): void {
  const container = document.querySelector('.group-checkboxes') as HTMLElement
  
  if (container && !container.dataset.initialized) {
    container.dataset.initialized = 'true'
    loadUserGroups(api)
  }
}

async function loadUserGroups(api: Api): Promise<void> {
  try {
    const groups = await api.getUserGroups()
    const container = document.querySelector('.group-checkboxes') as HTMLElement
    if (!container) return
    
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
      checkbox.addEventListener('change', updateSelectedGroups)
      
      label.appendChild(checkbox)
      label.appendChild(document.createTextNode(' ' + group.name))
      container.appendChild(label)
      container.appendChild(document.createElement('br'))
    })
    
    await loadExistingSelections(api)
    
  } catch (error) {
    const container = document.querySelector('.group-checkboxes') as HTMLElement
    if (container) {
      container.innerHTML = 'Error loading groups'
    }
  }
}

function updateSelectedGroups(): void {
  console.log('[UserGroupPlugin] updateSelectedGroups called')
  
  const checkboxes = document.querySelectorAll('.group-checkboxes input[type="checkbox"]:checked') as NodeListOf<HTMLInputElement>
  console.log('[UserGroupPlugin] Found checked checkboxes:', checkboxes.length)
  
  const selectedIds = Array.from(checkboxes).map(cb => cb.value)
  console.log('[UserGroupPlugin] Selected IDs:', selectedIds)
  
  const hiddenTextarea = document.querySelector('textarea#user-group-selection') as HTMLTextAreaElement
  console.log('[UserGroupPlugin] Found textarea:', !!hiddenTextarea)
  
  if (hiddenTextarea) {
    const oldValue = hiddenTextarea.value
    hiddenTextarea.value = JSON.stringify(selectedIds)
    console.log('[UserGroupPlugin] Updated textarea from:', oldValue, 'to:', hiddenTextarea.value)
    
    // Trigger input event to notify PeerTube/Angular of the change
    hiddenTextarea.dispatchEvent(new Event('input', { bubbles: true }))
  } else {
    console.error('[UserGroupPlugin] Textarea not found! Available textareas:', 
      document.querySelectorAll('textarea').length)
    
    // Try alternative selectors
    const alternativeTextarea = document.querySelector('textarea#user-group-selection') || 
                               document.querySelector('textarea[id*="user-group"]') ||
                               document.querySelector('textarea[id*="group"]')
    console.log('[UserGroupPlugin] Alternative textarea found:', !!alternativeTextarea)
    if (alternativeTextarea) {
      console.log('[UserGroupPlugin] Alternative textarea element:', alternativeTextarea)
    }
  }
}

async function loadExistingSelections(api: Api): Promise<void> {
  const videoShortUUID = getVideoShortUUID()
  if (!videoShortUUID) {
    // For new videos, try to load from hidden textarea if it has data
    loadFromHiddenField()
    return
  }
  
  try {
    const groupIds = await api.getVideoGroupsByShortUUID(videoShortUUID)
    
    groupIds.forEach((groupId: number) => {
      const checkbox = document.querySelector(`.group-checkboxes input[value="${groupId}"]`) as HTMLInputElement
      if (checkbox) {
        checkbox.checked = true
        console.log('[UserGroupPlugin] Checked group:', groupId)
      }
    })
    updateSelectedGroups()
    
  } catch (error) {
    console.error('Failed to load existing group selections:', error)
    // Fallback: try to load from hidden field
    loadFromHiddenField()
  }
}

function loadFromHiddenField(): void {
  const hiddenTextarea = document.querySelector('textarea#user-group-selection') as HTMLTextAreaElement
  if (!hiddenTextarea || !hiddenTextarea.value) return
  
  try {
    const savedIds = JSON.parse(hiddenTextarea.value)
    console.log('[UserGroupPlugin] Loading from hidden field:', savedIds)
    
    savedIds.forEach((groupId: string) => {
      const checkbox = document.querySelector(`.group-checkboxes input[value="${groupId}"]`) as HTMLInputElement
      if (checkbox) {
        checkbox.checked = true
        console.log('[UserGroupPlugin] Restored group:', groupId)
      }
    })
  } catch (error) {
    console.error('[UserGroupPlugin] Failed to parse saved group data:', error)
  }
}

function getVideoShortUUID(): string | null {
  // Extract video short UUID from current URL
  const match = window.location.pathname.match(/\/videos\/manage\/([a-zA-Z0-9_-]+)/)
  return match ? match[1] : null
}

export {
  register
}
