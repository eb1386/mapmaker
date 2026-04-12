// app entry point
import './style.css'
import 'maplibre-gl/dist/maplibre-gl.css'
import { route, resolve } from './router'
import { getSession } from './auth'
import { renderAuthPage } from './pages/auth-page'
import { renderDashboard } from './pages/dashboard'
import { renderMapView } from './pages/map-view'
import { renderMapEditor } from './pages/map-editor'

// routes
route('/', async () => {
  const session = await getSession()
  if (session) {
    window.history.replaceState(null, '', '/dashboard')
    renderDashboard()
  } else {
    window.history.replaceState(null, '', '/login')
    renderAuthPage('login')
  }
})

route('/login', () => renderAuthPage('login'))
route('/signup', () => renderAuthPage('signup'))
route('/dashboard', async () => {
  const session = await getSession()
  if (!session) { window.history.replaceState(null, '', '/login'); renderAuthPage('login'); return }
  renderDashboard()
})

route('/:slug/edit', async (params) => {
  const session = await getSession()
  if (!session) { window.history.replaceState(null, '', '/login'); renderAuthPage('login'); return }
  renderMapEditor(params.slug)
})

route('/:slug', (params) => renderMapView(params.slug))

// start
resolve()
