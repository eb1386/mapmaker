// dashboard page
import { getProfile, signOut } from '../auth'
import { fetchUserMaps, createMap, deleteMap, checkSlugAvailable } from '../api'
import { navigate } from '../router'
import type { MapRow } from '../types/database'

export async function renderDashboard() {
  const app = document.getElementById('app')!
  const profile = await getProfile()
  if (!profile) { navigate('/login'); return }

  app.innerHTML = `
    <div class="dash-page">
      <header class="dash-header">
        <h1 class="dash-logo">map<span>makr</span></h1>
        <div class="dash-user">
          <span class="dash-username">@${profile.username}</span>
          <button class="dash-logout" id="logoutBtn">log out</button>
        </div>
      </header>
      <main class="dash-main">
        <div class="dash-title-row">
          <h2>your maps</h2>
          <button class="dash-new-btn" id="newMapBtn">+ new map</button>
        </div>
        <div class="dash-maps" id="mapsList">
          <div class="dash-loading">loading...</div>
        </div>
      </main>
      <div class="modal-overlay" id="newMapModal" style="display:none">
        <div class="modal-card">
          <h3>create new map</h3>
          <form id="newMapForm">
            <label class="auth-label">
              <span>map title</span>
              <input type="text" name="title" required placeholder="My Favourite Places" />
            </label>
            <label class="auth-label">
              <span>custom url</span>
              <div class="slug-input-wrap">
                <span class="slug-prefix">your-url/</span>
                <input type="text" name="slug" required placeholder="my-map"
                  pattern="^[a-z0-9_-]+$" minlength="1" maxlength="60" />
              </div>
              <small>letters, numbers, dashes only</small>
              <div class="slug-status" id="slugStatus"></div>
            </label>
            <div class="auth-error" id="newMapError"></div>
            <div class="modal-actions">
              <button type="button" class="modal-cancel" id="cancelNewMap">cancel</button>
              <button type="submit" class="auth-submit" id="createMapBtn">create map</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `

  document.getElementById('logoutBtn')!.addEventListener('click', async () => {
    await signOut()
    navigate('/login')
  })

  // load maps
  let maps: MapRow[] = []
  try {
    maps = await fetchUserMaps(profile.id)
  } catch (err) {
    console.error('fetch maps error:', err)
  }
  renderMapsList(maps, profile.id)

  // new map modal
  const modal = document.getElementById('newMapModal')!
  document.getElementById('newMapBtn')!.addEventListener('click', () => {
    modal.style.display = 'flex'
  })
  document.getElementById('cancelNewMap')!.addEventListener('click', () => {
    modal.style.display = 'none'
  })
  modal.addEventListener('click', (e) => {
    if (e.target === modal) modal.style.display = 'none'
  })

  // slug check
  const slugInput = document.querySelector('[name="slug"]') as HTMLInputElement
  const slugStatus = document.getElementById('slugStatus')!
  let slugTimer: ReturnType<typeof setTimeout>
  slugInput.addEventListener('input', () => {
    clearTimeout(slugTimer)
    const val = slugInput.value.toLowerCase().replace(/[^a-z0-9_-]/g, '')
    slugInput.value = val
    if (!val) { slugStatus.textContent = ''; return }
    slugStatus.textContent = 'checking...'
    slugStatus.className = 'slug-status'
    slugTimer = setTimeout(async () => {
      // reserved slugs
      const reserved = ['login', 'signup', 'dashboard', 'api', 'admin', 'settings']
      if (reserved.includes(val)) {
        slugStatus.textContent = 'this url is reserved'
        slugStatus.className = 'slug-status slug-taken'
        return
      }
      const available = await checkSlugAvailable(val)
      slugStatus.textContent = available ? 'available!' : 'already taken'
      slugStatus.className = available ? 'slug-status slug-ok' : 'slug-status slug-taken'
    }, 400)
  })

  // create map
  const newMapForm = document.getElementById('newMapForm') as HTMLFormElement
  const newMapError = document.getElementById('newMapError')!
  newMapForm.addEventListener('submit', async (e) => {
    e.preventDefault()
    const fd = new FormData(newMapForm)
    const title = (fd.get('title') as string).trim()
    const slug = (fd.get('slug') as string).trim().toLowerCase()
    newMapError.textContent = ''

    const reserved = ['login', 'signup', 'dashboard', 'api', 'admin', 'settings']
    if (reserved.includes(slug)) {
      newMapError.textContent = 'This URL is reserved'
      return
    }

    const btn = document.getElementById('createMapBtn') as HTMLButtonElement
    btn.disabled = true
    btn.textContent = 'creating...'

    try {
      const available = await checkSlugAvailable(slug)
      if (!available) throw new Error('This URL is already taken')
      await createMap({ user_id: profile.id, slug, title })
      navigate(`/${slug}/edit`)
    } catch (err: unknown) {
      newMapError.textContent = err instanceof Error ? err.message : 'Failed to create map'
      btn.disabled = false
      btn.textContent = 'create map'
    }
  })
}

function renderMapsList(maps: MapRow[], userId: string) {
  const el = document.getElementById('mapsList')!
  if (!maps.length) {
    el.innerHTML = `
      <div class="dash-empty">
        <p>you haven't created any maps yet</p>
        <p class="dash-empty-sub">click <strong>+ new map</strong> to get started</p>
      </div>
    `
    return
  }

  el.innerHTML = maps.map(m => `
    <div class="dash-map-card" data-id="${m.id}" data-slug="${m.slug}">
      <div class="dash-map-color" style="background:${m.color_accent}"></div>
      <div class="dash-map-info">
        <h3>${escHtml(m.title)}</h3>
        <span class="dash-map-url">${location.origin}/${m.slug}</span>
        <span class="dash-map-date">${new Date(m.updated_at).toLocaleDateString()}</span>
      </div>
      <div class="dash-map-actions">
        <a href="/${m.slug}" class="dash-map-view" data-link>view</a>
        <a href="/${m.slug}/edit" class="dash-map-edit" data-link>edit</a>
        <button class="dash-map-delete" data-id="${m.id}">delete</button>
      </div>
    </div>
  `).join('')

  // delete handlers
  el.querySelectorAll('.dash-map-delete').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.stopPropagation()
      const id = (btn as HTMLElement).dataset.id!
      if (!confirm('Delete this map? This cannot be undone.')) return
      try {
        await deleteMap(id)
        const card = el.querySelector(`[data-id="${id}"]`)
        if (card) card.remove()
        maps = maps.filter(m => m.id !== id)
        if (!maps.length) renderMapsList([], userId)
      } catch (err) {
        console.error('delete error:', err)
      }
    })
  })
}

function escHtml(s: string) {
  const d = document.createElement('div')
  d.textContent = s
  return d.innerHTML
}
