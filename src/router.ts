// simple spa router
type RouteHandler = (params: Record<string, string>) => void | Promise<void>

interface Route {
  pattern: RegExp
  keys: string[]
  handler: RouteHandler
}

const routes: Route[] = []
let currentCleanup: (() => void) | null = null

export function route(path: string, handler: RouteHandler) {
  const keys: string[] = []
  const pattern = new RegExp(
    '^' + path.replace(/:([^/]+)/g, (_m, key) => {
      keys.push(key)
      return '([^/]+)'
    }) + '$'
  )
  routes.push({ pattern, keys, handler })
}

export function navigate(path: string) {
  history.pushState(null, '', path)
  resolve()
}

export function resolve() {
  const path = location.pathname || '/'
  for (const r of routes) {
    const match = path.match(r.pattern)
    if (match) {
      const params: Record<string, string> = {}
      r.keys.forEach((k, i) => { params[k] = match[i + 1] })
      if (currentCleanup) { currentCleanup(); currentCleanup = null }
      r.handler(params)
      return
    }
  }
  // 404 fallback
  if (currentCleanup) { currentCleanup(); currentCleanup = null }
  navigate('/')
}

export function setCleanup(fn: () => void) {
  currentCleanup = fn
}

// intercept link clicks
document.addEventListener('click', (e) => {
  const a = (e.target as HTMLElement).closest('a[data-link]')
  if (!a) return
  e.preventDefault()
  const href = a.getAttribute('href')
  if (href) navigate(href)
})

window.addEventListener('popstate', () => resolve())
