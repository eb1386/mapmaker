// map editor
import maplibregl from 'maplibre-gl'
import { fetchMapBySlug, fetchMapLocations, updateMap, createLocation, updateLocation, deleteLocation, uploadPhoto, uploadAudio } from '../api'
import { getSession, getProfile } from '../auth'
import { navigate, setCleanup } from '../router'
import { applyColors } from './map-view'
import type { MapRow, MapLocation, ColorScheme } from '../types/database'
import { colorsFromMap, colorsToMap, COLOR_PRESETS } from '../types/database'

export async function renderMapEditor(slug: string) {
  const app = document.getElementById('app')!
  app.innerHTML = `<div class="map-page"><div class="map-loading">loading editor...</div></div>`

  const session = await getSession()
  if (!session) { navigate('/login'); return }

  const mapData = await fetchMapBySlug(slug)
  if (!mapData || mapData.user_id !== session.user.id) {
    navigate('/dashboard')
    return
  }

  const locations = await fetchMapLocations(mapData.id)
  const profile = await getProfile()
  buildEditor(app, mapData, locations, session.user.id, profile?.username || '')
}

function buildEditor(app: HTMLElement, mapData: MapRow, locations: MapLocation[], userId: string, _username: string) {
  let colors = colorsFromMap(mapData)
  applyColors(colors)

  app.innerHTML = `
    <div class="map-page editor-mode">
      <div id="map"></div>
      <div class="stamp stamp-draggable" id="stampEl" style="left:${mapData.stamp_x}px;top:${mapData.stamp_y}px">
        <span class="stamp-text" id="stampText">${escHtml(mapData.title)}</span>${mapData.show_heart ? '<span class="heart">&hearts;</span>' : ''}
      </div>
      <div class="editor-topbar">
        <a href="/dashboard" data-link class="editor-back">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
        </a>
        <input class="editor-title-input" id="titleInput" value="${escAttr(mapData.title)}" placeholder="Map title" />
        <label class="editor-heart-toggle" title="Show heart">
          <input type="checkbox" id="heartToggle" ${mapData.show_heart ? 'checked' : ''} />
          <span>&hearts;</span>
        </label>
        <a href="/${mapData.slug}" data-link class="editor-preview-btn">preview</a>
      </div>

      <!-- toolbar -->
      <div class="editor-toolbar" id="toolbar">
        <button class="toolbar-btn" id="addDotBtn" title="Add a pin">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="10" r="3"/><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/></svg>
          <span>add pin</span>
        </button>
        <button class="toolbar-btn" id="colorBtn" title="Color scheme">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 2a10 10 0 010 20 5 5 0 010-10 5 5 0 000-10z" fill="currentColor"/></svg>
          <span>colors</span>
        </button>
        <button class="toolbar-btn" id="searchBtn" title="Search city">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
          <span>search</span>
        </button>
        <button class="toolbar-btn" id="savePosBtn" title="Save map position">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z"/></svg>
          <span>save view</span>
        </button>
      </div>

      <!-- color picker panel -->
      <div class="color-panel" id="colorPanel" style="display:none">
        <h3>color scheme</h3>
        <div class="color-presets" id="colorPresets"></div>
        <div class="color-custom">
          <label>accent <input type="color" id="customAccent" value="${colors.accent}" /></label>
          <label>dark <input type="color" id="customDeep" value="${colors.accentDeep}" /></label>
          <label>soft <input type="color" id="customSoft" value="${colors.accentSoft}" /></label>
          <label>background <input type="color" id="customBg" value="${colors.bg}" /></label>
          <label>text <input type="color" id="customInk" value="${colors.ink}" /></label>
        </div>
        <button class="color-apply" id="applyColors">apply colors</button>
      </div>

      <!-- search panel -->
      <div class="search-panel" id="searchPanel" style="display:none">
        <input class="search-input" id="searchInput" placeholder="search for a city..." />
        <div class="search-results" id="searchResults"></div>
      </div>

      <!-- location editor panel -->
      <aside class="panel editor-panel" id="panel" aria-hidden="true">
        <button class="panel-close" id="close" aria-label="Close">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>
        </button>
        <div class="panel-photo-wrap" id="photoWrap">
          <img class="panel-photo" data-slot="0" alt="" />
          <img class="panel-photo" data-slot="1" alt="" />
          <button class="gallery-btn prev" id="gprev" aria-label="Previous"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 18l-6-6 6-6"/></svg></button>
          <button class="gallery-btn next" id="gnext" aria-label="Next"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 6l6 6-6 6"/></svg></button>
          <div class="gallery-dots" id="gdots"></div>
          <div class="photo-upload-area" id="photoUploadArea">
            <label class="photo-upload-btn">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12"/></svg>
              <span>add photos</span>
              <input type="file" id="photoInput" accept="image/*" multiple hidden />
            </label>
            <button class="photo-remove-btn" id="removePhotoBtn" style="display:none">remove current</button>
          </div>
        </div>
        <div class="panel-body">
          <input class="editor-name-input" id="locName" placeholder="Place name" />
          <textarea class="editor-body-input" id="locBody" placeholder="Describe this place..." rows="6"></textarea>
          <input class="editor-citation-input" id="locCitation" placeholder="Citation or source (optional)" />
          <div class="editor-audio-section">
            <label class="editor-audio-label">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>
              <span id="audioFileName">no audio</span>
              <input type="file" id="audioInput" accept="audio/*" hidden />
            </label>
            <button class="editor-audio-remove" id="removeAudioBtn" style="display:none">remove</button>
          </div>
          <div class="editor-actions">
            <button class="editor-save-btn" id="saveLocBtn">save changes</button>
            <button class="editor-delete-btn" id="deleteLocBtn">delete pin</button>
          </div>
        </div>
      </aside>

      <div class="editor-toast" id="toast"></div>
      <div class="add-dot-cursor" id="addDotCursor" style="display:none">click map to place pin</div>
    </div>
  `

  const isMobile = () => window.matchMedia('(max-width: 720px)').matches
  const map = new maplibregl.Map({
    container: 'map',
    style: makeStyle(colors),
    center: [mapData.center_lng, mapData.center_lat],
    zoom: mapData.zoom,
    attributionControl: { compact: true },
    fadeDuration: 200
  })
  map.addControl(new maplibregl.NavigationControl({ showCompass: false, showZoom: true }), 'bottom-left')

  // state
  const markers = new Map<string, { el: HTMLElement; marker: maplibregl.Marker; loc: MapLocation }>()
  let selected: MapLocation | null = null
  let addingDot = false
  let gallery: { photos: string[]; fits: string[]; idx: number } | null = null
  let activeSlot = 0
  const panel = document.getElementById('panel')!
  const photoEls = document.querySelectorAll<HTMLImageElement>('.panel-photo')
  let saveDebounce: ReturnType<typeof setTimeout>

  setCleanup(() => {
    document.removeEventListener('keydown', handleKeydown)
    map.remove()
  })

  // toast helper
  function toast(msg: string, type = 'info') {
    const el = document.getElementById('toast')!
    el.textContent = msg
    el.className = `editor-toast show ${type}`
    setTimeout(() => { el.className = 'editor-toast' }, 2500)
  }

  // create marker
  function addMarker(loc: MapLocation) {
    const el = document.createElement('div')
    el.className = 'marker'
    el.setAttribute('role', 'button')
    el.setAttribute('aria-label', loc.name)
    el.tabIndex = 0
    const dot = document.createElement('div')
    dot.className = 'marker-dot'
    el.appendChild(dot)
    el.addEventListener('click', (e) => { e.stopPropagation(); selectLoc(loc) })
    const marker = new maplibregl.Marker({ element: el, anchor: 'center', draggable: true })
      .setLngLat([loc.lng, loc.lat]).addTo(map)
    marker.on('dragend', async () => {
      const pos = marker.getLngLat()
      loc.lng = pos.lng
      loc.lat = pos.lat
      try {
        await updateLocation(loc.id, { lng: pos.lng, lat: pos.lat })
        toast('pin moved')
      } catch (e) {
        console.error('move error:', e)
        toast('failed to move pin', 'error')
      }
    })
    markers.set(loc.id, { el, marker, loc })
  }

  function selectLoc(loc: MapLocation) {
    selected = loc
    markers.forEach(({ el }, id) => {
      el.classList.toggle('faded', id !== loc.id)
      el.classList.toggle('selected', id === loc.id)
    })

    const locName = document.getElementById('locName') as HTMLInputElement
    const locBody = document.getElementById('locBody') as HTMLTextAreaElement
    const locCitation = document.getElementById('locCitation') as HTMLInputElement
    locName.value = loc.name
    locBody.value = loc.body
    locCitation.value = loc.citation || ''

    // audio display
    const audioName = document.getElementById('audioFileName')!
    const removeAudioBtn = document.getElementById('removeAudioBtn')!
    if (loc.audio) {
      audioName.textContent = loc.audio.split('/').pop() || 'audio file'
      removeAudioBtn.style.display = 'inline-block'
    } else {
      audioName.textContent = 'no audio'
      removeAudioBtn.style.display = 'none'
    }

    // photos
    const photos = loc.photos || []
    photoEls.forEach(e => { e.classList.remove('loaded'); e.removeAttribute('src'); e.onload = null })
    activeSlot = 0
    gallery = { photos, fits: loc.fits || [], idx: 0 }
    document.querySelector('.panel-body')!.scrollTop = 0
    const removePhotoBtn = document.getElementById('removePhotoBtn') as HTMLButtonElement
    removePhotoBtn.style.display = photos.length ? 'inline-block' : 'none'
    showPhoto(0)

    panel.classList.add('open')
    panel.setAttribute('aria-hidden', 'false')

    const offset: [number, number] = isMobile() ? [0, -window.innerHeight * 0.22] : [-220, 0]
    map.flyTo({ center: [loc.lng, loc.lat], zoom: Math.max(map.getZoom(), 13.5), offset, duration: 600, essential: true })
  }

  function closePanel() {
    selected = null
    panel.classList.remove('open')
    panel.setAttribute('aria-hidden', 'true')
    markers.forEach(({ el }) => el.classList.remove('faded', 'selected'))
  }

  function showPhoto(i: number) {
    const g = gallery
    if (!g || !g.photos.length) {
      photoEls.forEach(e => e.classList.remove('loaded'))
      ;(document.getElementById('gprev') as HTMLButtonElement).disabled = true
      ;(document.getElementById('gnext') as HTMLButtonElement).disabled = true
      document.getElementById('gdots')!.style.display = 'none'
      return
    }
    g.idx = (i + g.photos.length) % g.photos.length
    const nextSlot = 1 - activeSlot
    const incoming = photoEls[nextSlot]
    const outgoing = photoEls[activeSlot]
    const url = g.photos[g.idx]
    const fit = (g.fits && g.fits[g.idx]) || 'cover'
    incoming.style.objectFit = fit
    const swap = () => {
      if (!incoming.naturalWidth) return
      incoming.classList.add('loaded')
      outgoing.classList.remove('loaded')
      activeSlot = nextSlot
    }
    incoming.classList.remove('loaded')
    incoming.onload = () => requestAnimationFrame(swap)
    incoming.src = url
    const dots = document.getElementById('gdots')!
    dots.innerHTML = g.photos.map((_, j) => `<span class="${j === g.idx ? 'on' : ''}"></span>`).join('')
    const single = g.photos.length < 2
    ;(document.getElementById('gprev') as HTMLButtonElement).disabled = single
    ;(document.getElementById('gnext') as HTMLButtonElement).disabled = single
    dots.style.display = single ? 'none' : 'flex'
  }

  // === add dot mode ===
  const addDotBtn = document.getElementById('addDotBtn')!
  const addDotCursor = document.getElementById('addDotCursor')!
  addDotBtn.addEventListener('click', () => {
    addingDot = !addingDot
    addDotBtn.classList.toggle('active', addingDot)
    addDotCursor.style.display = addingDot ? 'block' : 'none'
    map.getCanvas().style.cursor = addingDot ? 'crosshair' : ''
  })

  map.on('click', async (e) => {
    if (!addingDot) return
    addingDot = false
    addDotBtn.classList.remove('active')
    addDotCursor.style.display = 'none'
    map.getCanvas().style.cursor = ''

    try {
      const loc = await createLocation({
        map_id: mapData.id,
        lng: e.lngLat.lng,
        lat: e.lngLat.lat,
        name: 'New Place',
        body: '',
        sort_order: locations.length
      })
      locations.push(loc)
      addMarker(loc)
      selectLoc(loc)
      toast('pin added - edit its details')
    } catch (err) {
      console.error('create error:', err)
      toast('failed to add pin', 'error')
    }
  })

  // === save location ===
  document.getElementById('saveLocBtn')!.addEventListener('click', async () => {
    if (!selected) return
    const locName = (document.getElementById('locName') as HTMLInputElement).value.trim()
    const locBody = (document.getElementById('locBody') as HTMLTextAreaElement).value
    const locCitation = (document.getElementById('locCitation') as HTMLInputElement).value.trim()

    try {
      const updated = await updateLocation(selected.id, {
        name: locName || 'Untitled',
        body: locBody,
        citation: locCitation || null
      })
      // update local
      Object.assign(selected, updated)
      const m = markers.get(selected.id)
      if (m) { m.loc = selected; m.el.setAttribute('aria-label', selected.name) }
      toast('saved!')
    } catch (err) {
      console.error('save error:', err)
      toast('save failed', 'error')
    }
  })

  // === delete location ===
  document.getElementById('deleteLocBtn')!.addEventListener('click', async () => {
    if (!selected) return
    if (!confirm('Delete this pin?')) return
    try {
      await deleteLocation(selected.id)
      const m = markers.get(selected.id)
      if (m) m.marker.remove()
      markers.delete(selected.id)
      const idx = locations.findIndex(l => l.id === selected!.id)
      if (idx >= 0) locations.splice(idx, 1)
      closePanel()
      toast('pin deleted')
    } catch (err) {
      console.error('delete error:', err)
      toast('delete failed', 'error')
    }
  })

  // === photo upload ===
  document.getElementById('photoInput')!.addEventListener('change', async (e) => {
    const files = (e.target as HTMLInputElement).files
    if (!files || !selected) return
    const btn = document.querySelector('.photo-upload-btn span') as HTMLElement
    btn.textContent = 'uploading...'

    try {
      const urls: string[] = []
      for (const file of Array.from(files)) {
        const url = await uploadPhoto(userId, file)
        urls.push(url)
      }
      selected.photos = [...selected.photos, ...urls]
      selected.fits = [...selected.fits, ...urls.map(() => 'cover')]
      await updateLocation(selected.id, { photos: selected.photos, fits: selected.fits })
      gallery = { photos: selected.photos, fits: selected.fits, idx: selected.photos.length - urls.length }
      showPhoto(gallery.idx)
      document.getElementById('removePhotoBtn')!.style.display = 'inline-block'
      toast(`${urls.length} photo(s) added`)
    } catch (err) {
      console.error('upload error:', err)
      toast('upload failed', 'error')
    } finally {
      btn.textContent = 'add photos'
      ;(e.target as HTMLInputElement).value = ''
    }
  })

  // remove current photo
  document.getElementById('removePhotoBtn')!.addEventListener('click', async () => {
    if (!selected || !gallery || !gallery.photos.length) return
    const idx = gallery.idx
    selected.photos.splice(idx, 1)
    selected.fits.splice(idx, 1)
    try {
      await updateLocation(selected.id, { photos: selected.photos, fits: selected.fits })
      gallery = { photos: selected.photos, fits: selected.fits, idx: Math.min(idx, selected.photos.length - 1) }
      showPhoto(Math.max(0, gallery.idx))
      if (!selected.photos.length) document.getElementById('removePhotoBtn')!.style.display = 'none'
      toast('photo removed')
    } catch (err) {
      console.error('remove photo error:', err)
      toast('remove failed', 'error')
    }
  })

  // === audio upload ===
  document.getElementById('audioInput')!.addEventListener('change', async (e) => {
    const file = (e.target as HTMLInputElement).files?.[0]
    if (!file || !selected) return
    const audioName = document.getElementById('audioFileName')!
    audioName.textContent = 'uploading...'

    try {
      const url = await uploadAudio(userId, file)
      selected.audio = url
      await updateLocation(selected.id, { audio: url })
      audioName.textContent = file.name
      document.getElementById('removeAudioBtn')!.style.display = 'inline-block'
      toast('audio added')
    } catch (err) {
      console.error('audio upload error:', err)
      toast('audio upload failed', 'error')
      audioName.textContent = selected.audio ? selected.audio.split('/').pop()! : 'no audio'
    }
  })

  document.getElementById('removeAudioBtn')!.addEventListener('click', async () => {
    if (!selected) return
    try {
      selected.audio = null
      await updateLocation(selected.id, { audio: null })
      document.getElementById('audioFileName')!.textContent = 'no audio'
      document.getElementById('removeAudioBtn')!.style.display = 'none'
      toast('audio removed')
    } catch (err) {
      console.error('remove audio error:', err)
      toast('remove failed', 'error')
    }
  })

  // === title save ===
  const titleInput = document.getElementById('titleInput') as HTMLInputElement
  const stampText = document.getElementById('stampText')!
  titleInput.addEventListener('input', () => {
    stampText.textContent = titleInput.value.trim() || 'Untitled'
    clearTimeout(saveDebounce)
    saveDebounce = setTimeout(async () => {
      try {
        await updateMap(mapData.id, { title: titleInput.value.trim() || 'Untitled' })
      } catch (err) { console.error('title save:', err) }
    }, 800)
  })

  // === heart toggle ===
  const heartToggle = document.getElementById('heartToggle') as HTMLInputElement
  heartToggle.addEventListener('change', async () => {
    const show = heartToggle.checked
    mapData.show_heart = show
    const stampEl = document.getElementById('stampEl')!
    const existing = stampEl.querySelector('.heart')
    if (show && !existing) {
      const span = document.createElement('span')
      span.className = 'heart'
      span.innerHTML = '&hearts;'
      stampEl.appendChild(span)
    } else if (!show && existing) {
      existing.remove()
    }
    try {
      await updateMap(mapData.id, { show_heart: show })
    } catch (err) { console.error('heart toggle:', err) }
  })

  // === draggable stamp ===
  const stampEl = document.getElementById('stampEl')!
  let stampDragging = false
  let stampOffX = 0
  let stampOffY = 0

  stampEl.addEventListener('pointerdown', (e: PointerEvent) => {
    if ((e.target as HTMLElement).closest('.editor-topbar')) return
    stampDragging = true
    stampOffX = e.clientX - stampEl.offsetLeft
    stampOffY = e.clientY - stampEl.offsetTop
    stampEl.setPointerCapture(e.pointerId)
    stampEl.style.cursor = 'grabbing'
    e.preventDefault()
  })

  stampEl.addEventListener('pointermove', (e: PointerEvent) => {
    if (!stampDragging) return
    const x = Math.max(0, Math.min(window.innerWidth - stampEl.offsetWidth, e.clientX - stampOffX))
    const y = Math.max(0, Math.min(window.innerHeight - stampEl.offsetHeight, e.clientY - stampOffY))
    stampEl.style.left = x + 'px'
    stampEl.style.top = y + 'px'
  })

  stampEl.addEventListener('pointerup', async (e: PointerEvent) => {
    if (!stampDragging) return
    stampDragging = false
    stampEl.style.cursor = ''
    stampEl.releasePointerCapture(e.pointerId)
    const x = parseFloat(stampEl.style.left)
    const y = parseFloat(stampEl.style.top)
    mapData.stamp_x = x
    mapData.stamp_y = y
    try {
      await updateMap(mapData.id, { stamp_x: x, stamp_y: y })
      toast('title moved')
    } catch (err) { console.error('stamp save:', err) }
  })

  // === save map position ===
  document.getElementById('savePosBtn')!.addEventListener('click', async () => {
    const center = map.getCenter()
    const zoom = map.getZoom()
    try {
      await updateMap(mapData.id, { center_lng: center.lng, center_lat: center.lat, zoom })
      mapData.center_lng = center.lng
      mapData.center_lat = center.lat
      mapData.zoom = zoom
      toast('map view saved')
    } catch (err) {
      console.error('save pos error:', err)
      toast('save failed', 'error')
    }
  })

  // === color scheme ===
  const colorPanel = document.getElementById('colorPanel')!
  document.getElementById('colorBtn')!.addEventListener('click', () => {
    colorPanel.style.display = colorPanel.style.display === 'none' ? 'block' : 'none'
    document.getElementById('searchPanel')!.style.display = 'none'
  })

  const presetsEl = document.getElementById('colorPresets')!
  presetsEl.innerHTML = COLOR_PRESETS.map(p => `
    <button class="color-preset" data-name="${p.name}" title="${p.name}">
      <span style="background:${p.colors.accent}"></span>
      <span style="background:${p.colors.accentDeep}"></span>
      <span style="background:${p.colors.bg}"></span>
    </button>
  `).join('')

  presetsEl.addEventListener('click', (e) => {
    const btn = (e.target as HTMLElement).closest('.color-preset') as HTMLElement
    if (!btn) return
    const name = btn.dataset.name!
    const preset = COLOR_PRESETS.find(p => p.name === name)
    if (!preset) return
    colors = { ...preset.colors }
    applyColors(colors)
    updateColorInputs()
    // update map bg
    if (map.getLayer('bg')) {
      map.setPaintProperty('bg', 'background-color', colors.bg)
    }
  })

  function updateColorInputs() {
    ;(document.getElementById('customAccent') as HTMLInputElement).value = colors.accent
    ;(document.getElementById('customDeep') as HTMLInputElement).value = colors.accentDeep
    ;(document.getElementById('customSoft') as HTMLInputElement).value = colors.accentSoft
    ;(document.getElementById('customBg') as HTMLInputElement).value = colors.bg
    ;(document.getElementById('customInk') as HTMLInputElement).value = colors.ink
  }

  // live preview custom colors
  for (const [id, key] of [['customAccent', 'accent'], ['customDeep', 'accentDeep'], ['customSoft', 'accentSoft'], ['customBg', 'bg'], ['customInk', 'ink']] as const) {
    document.getElementById(id)!.addEventListener('input', (e) => {
      (colors as unknown as Record<string, string>)[key] = (e.target as HTMLInputElement).value
      applyColors(colors)
      if (key === 'bg' && map.getLayer('bg')) {
        map.setPaintProperty('bg', 'background-color', colors.bg)
      }
    })
  }

  document.getElementById('applyColors')!.addEventListener('click', async () => {
    try {
      await updateMap(mapData.id, colorsToMap(colors))
      colorPanel.style.display = 'none'
      toast('colors saved')
    } catch (err) {
      console.error('color save error:', err)
      toast('save failed', 'error')
    }
  })

  // === city search ===
  const searchPanel = document.getElementById('searchPanel')!
  const searchInput = document.getElementById('searchInput') as HTMLInputElement
  const searchResults = document.getElementById('searchResults')!
  let searchTimer: ReturnType<typeof setTimeout>

  document.getElementById('searchBtn')!.addEventListener('click', () => {
    searchPanel.style.display = searchPanel.style.display === 'none' ? 'block' : 'none'
    colorPanel.style.display = 'none'
    if (searchPanel.style.display === 'block') searchInput.focus()
  })

  searchInput.addEventListener('input', () => {
    clearTimeout(searchTimer)
    const q = searchInput.value.trim()
    if (!q) { searchResults.innerHTML = ''; return }
    searchTimer = setTimeout(async () => {
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=5`, {
          headers: { 'Accept-Language': 'en' }
        })
        const data = await res.json()
        searchResults.innerHTML = data.map((r: { display_name: string; lat: string; lon: string }) => `
          <button class="search-result" data-lng="${r.lon}" data-lat="${r.lat}">
            ${escHtml(r.display_name)}
          </button>
        `).join('')
      } catch (err) {
        searchResults.innerHTML = '<div class="search-error">search failed</div>'
      }
    }, 400)
  })

  searchResults.addEventListener('click', (e) => {
    const btn = (e.target as HTMLElement).closest('.search-result') as HTMLElement
    if (!btn) return
    const lng = parseFloat(btn.dataset.lng!)
    const lat = parseFloat(btn.dataset.lat!)
    map.flyTo({ center: [lng, lat], zoom: 12, duration: 1500, essential: true })
    searchPanel.style.display = 'none'
    searchInput.value = ''
    searchResults.innerHTML = ''
  })

  // === close panel ===
  document.getElementById('close')!.addEventListener('click', closePanel)
  document.getElementById('gprev')!.addEventListener('click', (e) => { e.stopPropagation(); if (gallery) showPhoto(gallery.idx - 1) })
  document.getElementById('gnext')!.addEventListener('click', (e) => { e.stopPropagation(); if (gallery) showPhoto(gallery.idx + 1) })

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape') {
      if (addingDot) {
        addingDot = false
        addDotBtn.classList.remove('active')
        addDotCursor.style.display = 'none'
        map.getCanvas().style.cursor = ''
      } else if (colorPanel.style.display !== 'none') {
        colorPanel.style.display = 'none'
      } else if (searchPanel.style.display !== 'none') {
        searchPanel.style.display = 'none'
      } else {
        closePanel()
      }
    }
  }
  document.addEventListener('keydown', handleKeydown)

  // render markers
  map.on('load', () => { locations.forEach(addMarker) })
}

function makeStyle(colors: ColorScheme): maplibregl.StyleSpecification {
  return {
    version: 8,
    sources: {
      base: {
        type: 'raster',
        tiles: [
          'https://a.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}@2x.png',
          'https://b.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}@2x.png',
          'https://c.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}@2x.png',
          'https://d.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}@2x.png'
        ],
        tileSize: 256,
        attribution: '&copy; OpenStreetMap &copy; CARTO',
        maxzoom: 19
      }
    },
    layers: [
      { id: 'bg', type: 'background', paint: { 'background-color': colors.bg } },
      { id: 'base', type: 'raster', source: 'base', paint: { 'raster-opacity': 1 } }
    ]
  }
}

function escHtml(s: string) {
  const d = document.createElement('div')
  d.textContent = s
  return d.innerHTML
}

function escAttr(s: string) {
  return s.replace(/"/g, '&quot;').replace(/</g, '&lt;')
}
