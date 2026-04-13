// public map viewer
import maplibregl from 'maplibre-gl'
import { fetchMapBySlug, fetchMapLocations } from '../api'
import { getSession } from '../auth'
import { setCleanup } from '../router'
import type { MapRow, MapLocation, ColorScheme } from '../types/database'
import { colorsFromMap } from '../types/database'

export async function renderMapView(slug: string) {
  const app = document.getElementById('app')!
  app.innerHTML = `<div class="map-page"><div class="map-loading">loading map...</div></div>`

  const mapData = await fetchMapBySlug(slug)
  if (!mapData) {
    app.innerHTML = `<div class="map-page"><div class="map-404"><h2>map not found</h2><p>this url doesn't exist yet</p><a href="/dashboard" data-link>go to dashboard</a></div></div>`
    return
  }

  const locations = await fetchMapLocations(mapData.id)
  const colors = colorsFromMap(mapData)
  const session = await getSession()
  const isOwner = session?.user?.id === mapData.user_id

  buildMapUI(app, mapData, locations, colors, isOwner)
}

function buildMapUI(app: HTMLElement, mapData: MapRow, locations: MapLocation[], colors: ColorScheme, isOwner: boolean) {
  applyColors(colors)

  app.innerHTML = `
    <div class="map-page">
      <div id="map"></div>
      <div class="stamp" style="left:${mapData.stamp_x}px;top:${mapData.stamp_y}px">${escHtml(mapData.title)}${mapData.show_heart ? ' <span class="heart">&hearts;</span>' : ''}</div>
      ${isOwner ? `<a href="/${mapData.slug}/edit" data-link class="edit-fab" aria-label="Edit map"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg></a>` : ''}
      <button class="reset-btn" id="reset" aria-label="Reset view">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 1 1-3-6.7L21 8"/><path d="M21 3v5h-5"/></svg>
      </button>
      <aside class="panel" id="panel" aria-hidden="true">
        <button class="panel-close" id="close" aria-label="Close">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>
        </button>
        <div class="panel-photo-wrap">
          <img class="panel-photo" data-slot="0" alt="" />
          <img class="panel-photo" data-slot="1" alt="" />
          <button class="audio-btn" id="audiotoggle" aria-label="Toggle music">
            <span class="ring"></span>
            <svg class="play-icon" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
            <svg class="pause-icon" viewBox="0 0 24 24" fill="currentColor"><path d="M6 4h4v16H6zM14 4h4v16h-4z"/></svg>
          </button>
          <button class="gallery-btn prev" id="gprev" aria-label="Previous photo"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 18l-6-6 6-6"/></svg></button>
          <button class="gallery-btn next" id="gnext" aria-label="Next photo"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 6l6 6-6 6"/></svg></button>
          <div class="gallery-dots" id="gdots"></div>
        </div>
        <div class="panel-body">
          <h1 class="panel-name" id="name"></h1>
          <p class="panel-text" id="text"></p>
          <div class="panel-foot" id="cite"></div>
        </div>
      </aside>
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

  setCleanup(() => { map.remove(); cleanupAudio() })

  // state
  let current: MapLocation | null = null
  let prevView: { center: [number, number]; zoom: number } | null = null
  const markers = new Map<string, { el: HTMLElement; marker: maplibregl.Marker; loc: MapLocation }>()
  let audio: HTMLAudioElement | null = null
  let currentAudioSrc: string | null = null
  let audioPrimed = false
  let gallery: { photos: string[]; fits: string[]; idx: number } | null = null
  let activeSlot = 0

  const panel = document.getElementById('panel')!
  const photoEls = document.querySelectorAll<HTMLImageElement>('.panel-photo')
  const nameEl = document.getElementById('name')!
  const textEl = document.getElementById('text')!

  function cleanupAudio() {
    if (audio) { audio.pause(); audio.src = '' }
  }

  // prime audio
  function primeAudio() {
    if (audioPrimed) return
    audioPrimed = true
    if (!audio) { audio = new Audio(); audio.preload = 'auto' }
    audio.muted = true
    const p = audio.play()
    if (p) p.then(() => { audio!.pause(); audio!.muted = false; audio!.currentTime = 0 }).catch(() => { audio!.muted = false })
  }
  ;(['click', 'touchstart', 'keydown'] as const).forEach(ev =>
    document.addEventListener(ev, primeAudio, { once: true, capture: true })
  )

  function addMarker(loc: MapLocation) {
    const el = document.createElement('div')
    el.className = 'marker'
    el.setAttribute('role', 'button')
    el.setAttribute('aria-label', loc.name)
    el.tabIndex = 0
    const dot = document.createElement('div')
    dot.className = 'marker-dot'
    el.appendChild(dot)
    el.addEventListener('click', (e) => { e.stopPropagation(); select(loc) })
    el.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); select(loc) }
    })
    const marker = new maplibregl.Marker({ element: el, anchor: 'center' })
      .setLngLat([loc.lng, loc.lat]).addTo(map)
    markers.set(loc.id, { el, marker, loc })
  }

  function select(loc: MapLocation) {
    if (!current) {
      prevView = { center: map.getCenter().toArray() as [number, number], zoom: map.getZoom() }
    }
    current = loc
    markers.forEach(({ el }, id) => {
      el.classList.toggle('faded', id !== loc.id)
      el.classList.toggle('selected', id === loc.id)
      el.classList.remove('click-anim')
    })
    const cur = markers.get(loc.id)
    if (cur) { void cur.el.offsetWidth; cur.el.classList.add('click-anim') }

    nameEl.textContent = loc.name
    textEl.textContent = loc.body
    document.getElementById('cite')!.textContent = loc.citation || ''

    const photos = loc.photos || []
    photoEls.forEach(e => { e.classList.remove('loaded'); e.removeAttribute('src'); e.onload = null })
    activeSlot = 0
    gallery = { photos, fits: loc.fits || [], idx: 0 }
    document.querySelector('.panel-body')!.scrollTop = 0

    const audioBtn = document.getElementById('audiotoggle')!
    if (loc.audio) {
      if (!audio) {
        audio = new Audio()
        audio.preload = 'auto'
        audio.addEventListener('play', () => audioBtn.classList.add('playing'))
        audio.addEventListener('pause', () => audioBtn.classList.remove('playing'))
        audio.addEventListener('ended', () => audioBtn.classList.remove('playing'))
      }
      if (currentAudioSrc !== loc.audio) { audio.src = loc.audio; currentAudioSrc = loc.audio }
      audio.currentTime = 0
      audio.volume = 0.6
      audioBtn.classList.add('show')
      audioBtn.classList.add('playing')
      const p = audio.play()
      if (p) p.catch(() => { audioBtn.classList.remove('playing') })
    } else {
      audioBtn.classList.remove('show', 'playing')
      if (audio) audio.pause()
    }
    showPhoto(0)
    panel.classList.add('open')
    panel.setAttribute('aria-hidden', 'false')

    const offset: [number, number] = isMobile() ? [0, -window.innerHeight * 0.22] : [-220, 0]
    map.stop()
    map.flyTo({ center: [loc.lng, loc.lat], zoom: Math.max(map.getZoom(), 13.5), offset, duration: 900, essential: true, curve: 1.4 })
  }

  function closePanel() {
    current = null
    if (audio) { audio.pause(); audio.currentTime = 0 }
    panel.classList.remove('open')
    panel.setAttribute('aria-hidden', 'true')
    markers.forEach(({ el }) => { el.classList.remove('faded', 'selected') })
    if (prevView) {
      map.stop()
      map.flyTo({ center: prevView.center, zoom: prevView.zoom, duration: 900, essential: true, curve: 1.4 })
      prevView = null
    }
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
    const has = incoming.getAttribute('src')?.endsWith(url)
    if (has && incoming.complete && incoming.naturalWidth) { swap() }
    else {
      incoming.classList.remove('loaded')
      incoming.onload = () => requestAnimationFrame(swap)
      incoming.onerror = () => console.error('load fail', url)
      incoming.src = url
    }
    const dots = document.getElementById('gdots')!
    dots.innerHTML = g.photos.map((_, j) => `<span class="${j === g.idx ? 'on' : ''}"></span>`).join('')
    const single = g.photos.length < 2
    ;(document.getElementById('gprev') as HTMLButtonElement).disabled = single
    ;(document.getElementById('gnext') as HTMLButtonElement).disabled = single
    dots.style.display = single ? 'none' : 'flex'
  }

  // events
  document.getElementById('close')!.addEventListener('click', closePanel)
  document.getElementById('gprev')!.addEventListener('click', (e) => { e.stopPropagation(); if (gallery) showPhoto(gallery.idx - 1) })
  document.getElementById('gnext')!.addEventListener('click', (e) => { e.stopPropagation(); if (gallery) showPhoto(gallery.idx + 1) })
  document.getElementById('audiotoggle')!.addEventListener('click', (e) => {
    e.stopPropagation()
    if (!audio) return
    const btn = e.currentTarget as HTMLElement
    if (audio.paused) { btn.classList.add('playing'); const p = audio.play(); if (p) p.catch(() => btn.classList.remove('playing')) }
    else { audio.pause(); btn.classList.remove('playing') }
  })
  document.addEventListener('click', handleOutsideClick)
  function handleOutsideClick(e: MouseEvent) {
    if (!current) return
    if (panel.contains(e.target as Node)) return
    if ((e.target as HTMLElement).closest('.marker')) return
    if ((e.target as HTMLElement).closest('.reset-btn')) return
    if ((e.target as HTMLElement).closest('.maplibregl-ctrl')) return
    if ((e.target as HTMLElement).closest('.edit-fab')) return
    closePanel()
  }
  document.getElementById('reset')!.addEventListener('click', () => {
    prevView = null; closePanel()
    map.stop()
    map.flyTo({ center: [mapData.center_lng, mapData.center_lat], zoom: mapData.zoom, duration: 900, essential: true, curve: 1.4 })
  })
  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape') { closePanel(); return }
    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
      if (!locations.length) return
      const idx = current ? locations.findIndex(l => l.id === current!.id) : -1
      const next = e.key === 'ArrowRight'
        ? locations[(idx + 1) % locations.length]
        : locations[(idx - 1 + locations.length) % locations.length]
      select(next)
    }
  }
  document.addEventListener('keydown', handleKeydown)

  // add cleanup for events
  const origCleanup = () => {
    document.removeEventListener('click', handleOutsideClick)
    document.removeEventListener('keydown', handleKeydown)
    map.remove()
    cleanupAudio()
  }
  setCleanup(origCleanup)

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

export function applyColors(c: ColorScheme) {
  const r = document.documentElement.style
  r.setProperty('--accent', c.accent)
  r.setProperty('--accent-deep', c.accentDeep)
  r.setProperty('--accent-soft', c.accentSoft)
  r.setProperty('--bg', c.bg)
  r.setProperty('--ink', c.ink)
  // derive muted
  r.setProperty('--ink-muted', c.ink + '99')
}

function escHtml(s: string) {
  const d = document.createElement('div')
  d.textContent = s
  return d.innerHTML
}
