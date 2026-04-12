import './style.css'
import maplibregl from 'maplibre-gl'
import { fetchLocations } from './locations'
import type { Location } from './types/database'

const isMobileInit = window.matchMedia('(max-width: 720px)').matches
const INITIAL_VIEW = isMobileInit
  ? { center: [-123.155, 49.255] as [number, number], zoom: 10.7 }
  : { center: [-123.115, 49.255] as [number, number], zoom: 11.4 }

const style: maplibregl.StyleSpecification = {
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
    { id: 'bg', type: 'background', paint: { 'background-color': '#FBF6F1' } },
    { id: 'base', type: 'raster', source: 'base', paint: { 'raster-opacity': 1 } }
  ]
}

const map = new maplibregl.Map({
  container: 'map',
  style,
  center: INITIAL_VIEW.center,
  zoom: INITIAL_VIEW.zoom,
  attributionControl: { compact: true },
  fadeDuration: 200
})
map.addControl(new maplibregl.NavigationControl({ showCompass: false, showZoom: true }), 'bottom-left')

interface AppState {
  locations: Location[]
  current: Location | null
  markers: Map<string, { el: HTMLElement; marker: maplibregl.Marker; loc: Location }>
  prevView: { center: [number, number]; zoom: number } | null
  audio: HTMLAudioElement | null
  currentAudio: string | null
  audioPrimed: boolean
  gallery: { photos: string[]; fits: string[]; idx: number } | null
}

const state: AppState = {
  locations: [],
  current: null,
  markers: new Map(),
  prevView: null,
  audio: null,
  currentAudio: null,
  audioPrimed: false,
  gallery: null
}

const panel = document.getElementById('panel')!
const photoEls = document.querySelectorAll<HTMLImageElement>('.panel-photo')
let activeSlot = 0
const nameEl = document.getElementById('name')!
const textEl = document.getElementById('text')!

function isMobile() { return window.matchMedia('(max-width: 720px)').matches }

// prime audio
function primeAudio() {
  if (state.audioPrimed) return
  state.audioPrimed = true
  if (!state.audio) {
    state.audio = new Audio()
    state.audio.preload = 'auto'
  }
  state.audio.muted = true
  const p = state.audio.play()
  if (p) p.then(() => { state.audio!.pause(); state.audio!.muted = false; state.audio!.currentTime = 0 }).catch(() => { state.audio!.muted = false })
}
;(['click', 'touchstart', 'keydown'] as const).forEach(ev =>
  document.addEventListener(ev, primeAudio, { once: true, capture: true })
)

function addMarker(loc: Location) {
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
    .setLngLat(loc.coords as [number, number]).addTo(map)
  state.markers.set(loc.id, { el, marker, loc })
}

function preloadAdjacent(loc: Location) {
  const others = state.locations.filter(l => l.id !== loc.id)
  others.sort((a, b) => {
    const da = (a.coords[0] - loc.coords[0]) ** 2 + (a.coords[1] - loc.coords[1]) ** 2
    const db = (b.coords[0] - loc.coords[0]) ** 2 + (b.coords[1] - loc.coords[1]) ** 2
    return da - db
  })
  others.slice(0, 2).forEach(l => { const i = new Image(); i.src = l.photos[0] })
}

function select(loc: Location) {
  if (!state.current) {
    state.prevView = { center: map.getCenter().toArray() as [number, number], zoom: map.getZoom() }
  }
  state.current = loc
  state.markers.forEach(({ el }, id) => {
    el.classList.toggle('faded', id !== loc.id)
    el.classList.toggle('selected', id === loc.id)
    el.classList.remove('click-anim')
  })
  const cur = state.markers.get(loc.id)
  if (cur) { void cur.el.offsetWidth; cur.el.classList.add('click-anim') }

  nameEl.textContent = loc.name
  textEl.textContent = loc.body
  document.getElementById('cite')!.textContent = loc.citation || ''

  const photos = loc.photos || []
  photoEls.forEach(e => { e.classList.remove('loaded'); e.removeAttribute('src'); e.onload = null })
  activeSlot = 0
  state.gallery = { photos, fits: loc.fits || [], idx: 0 }
  document.querySelector('.panel-body')!.scrollTop = 0

  // audio
  const audioBtn = document.getElementById('audiotoggle')!
  if (loc.audio) {
    if (!state.audio) {
      state.audio = new Audio()
      state.audio.preload = 'auto'
      state.audio.addEventListener('play', () => audioBtn.classList.add('playing'))
      state.audio.addEventListener('pause', () => audioBtn.classList.remove('playing'))
      state.audio.addEventListener('ended', () => audioBtn.classList.remove('playing'))
    }
    if (state.currentAudio !== loc.audio) {
      state.audio.src = loc.audio
      state.currentAudio = loc.audio
    }
    state.audio.currentTime = 0
    state.audio.volume = 0.6
    audioBtn.classList.add('show')
    audioBtn.classList.add('playing')
    const p = state.audio.play()
    if (p) p.catch(() => { audioBtn.classList.remove('playing') })
  } else {
    audioBtn.classList.remove('show', 'playing')
    if (state.audio) state.audio.pause()
  }
  showPhoto(0)

  panel.classList.add('open')
  panel.setAttribute('aria-hidden', 'false')

  const offset: [number, number] = isMobile() ? [0, -window.innerHeight * 0.22] : [-220, 0]
  map.stop()
  map.flyTo({ center: loc.coords as [number, number], zoom: Math.max(map.getZoom(), 13.5), offset, duration: 900, essential: true, curve: 1.4 })

  preloadAdjacent(loc)
}

function closePanel() {
  state.current = null
  if (state.audio) { state.audio.pause(); state.audio.currentTime = 0 }
  panel.classList.remove('open')
  panel.setAttribute('aria-hidden', 'true')
  state.markers.forEach(({ el }) => { el.classList.remove('faded', 'selected') })
  if (state.prevView) {
    map.stop()
    map.flyTo({ center: state.prevView.center, zoom: state.prevView.zoom, duration: 900, essential: true, curve: 1.4 })
    state.prevView = null
  }
}

function showPhoto(i: number) {
  const g = state.gallery
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
  const incomingHasUrl = incoming.getAttribute('src')?.endsWith(url)
  if (incomingHasUrl && incoming.complete && incoming.naturalWidth) {
    swap()
  } else {
    incoming.classList.remove('loaded')
    incoming.onload = () => requestAnimationFrame(swap)
    incoming.onerror = () => console.error('failed to load', url)
    incoming.src = url
  }
  const preload = (j: number) => { const p = new Image(); p.src = g.photos[(j + g.photos.length) % g.photos.length] }
  preload(g.idx + 1); preload(g.idx - 1)
  const dots = document.getElementById('gdots')!
  dots.innerHTML = g.photos.map((_, j) => `<span class="${j === g.idx ? 'on' : ''}"></span>`).join('')
  const single = g.photos.length < 2
  ;(document.getElementById('gprev') as HTMLButtonElement).disabled = single
  ;(document.getElementById('gnext') as HTMLButtonElement).disabled = single
  dots.style.display = single ? 'none' : 'flex'
}

// event listeners
document.getElementById('close')!.addEventListener('click', closePanel)
document.getElementById('gprev')!.addEventListener('click', (e) => { e.stopPropagation(); showPhoto(state.gallery!.idx - 1) })
document.getElementById('gnext')!.addEventListener('click', (e) => { e.stopPropagation(); showPhoto(state.gallery!.idx + 1) })
document.getElementById('audiotoggle')!.addEventListener('click', (e) => {
  e.stopPropagation()
  if (!state.audio) return
  const btn = e.currentTarget as HTMLElement
  if (state.audio.paused) {
    btn.classList.add('playing')
    const p = state.audio.play()
    if (p) p.catch(() => btn.classList.remove('playing'))
  } else {
    state.audio.pause()
    btn.classList.remove('playing')
  }
})
document.addEventListener('click', (e) => {
  if (!state.current) return
  if (panel.contains(e.target as Node)) return
  if ((e.target as HTMLElement).closest('.marker')) return
  if ((e.target as HTMLElement).closest('.reset-btn')) return
  if ((e.target as HTMLElement).closest('.maplibregl-ctrl')) return
  closePanel()
})
document.getElementById('reset')!.addEventListener('click', () => {
  state.prevView = null
  closePanel()
  map.stop()
  map.flyTo({ ...INITIAL_VIEW, duration: 900, essential: true, curve: 1.4 })
})
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') { closePanel(); return }
  if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
    if (!state.locations.length) return
    const idx = state.current ? state.locations.findIndex(l => l.id === state.current!.id) : -1
    const next = e.key === 'ArrowRight'
      ? state.locations[(idx + 1) % state.locations.length]
      : state.locations[(idx - 1 + state.locations.length) % state.locations.length]
    select(next)
  }
})

// load data
map.on('load', async () => {
  state.locations = await fetchLocations()
  state.locations.forEach(addMarker)
})
