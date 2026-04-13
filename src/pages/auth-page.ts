// login and signup page
import { signIn, signUp } from '../auth'
import { navigate } from '../router'

export function renderAuthPage(mode: 'login' | 'signup') {
  const app = document.getElementById('app')!
  app.innerHTML = `
    <div class="auth-page">
      <div class="auth-card">
        <h1 class="auth-logo">map<span>maker</span></h1>
        <p class="auth-tagline">create and share beautiful interactive maps</p>
        <div class="auth-tabs">
          <button class="auth-tab ${mode === 'login' ? 'active' : ''}" data-mode="login">log in</button>
          <button class="auth-tab ${mode === 'signup' ? 'active' : ''}" data-mode="signup">sign up</button>
        </div>
        <form class="auth-form" id="authForm">
          ${mode === 'signup' ? `
            <label class="auth-label">
              <span>username</span>
              <input type="text" name="username" required minlength="3" maxlength="30"
                pattern="^[a-z0-9_-]+$" placeholder="yourname" autocomplete="username" />
              <small>lowercase letters, numbers, dashes, underscores</small>
            </label>
          ` : ''}
          <label class="auth-label">
            <span>email</span>
            <input type="email" name="email" required placeholder="you@example.com" autocomplete="email" />
          </label>
          <label class="auth-label">
            <span>password</span>
            <input type="password" name="password" required minlength="6" placeholder="••••••••"
              autocomplete="${mode === 'signup' ? 'new-password' : 'current-password'}" />
          </label>
          <div class="auth-error" id="authError"></div>
          <button type="submit" class="auth-submit" id="authSubmit">
            ${mode === 'signup' ? 'create account' : 'log in'}
          </button>
        </form>
        <p class="auth-switch">
          ${mode === 'login'
            ? `don't have an account? <a href="/signup" data-link>sign up</a>`
            : `already have an account? <a href="/login" data-link>log in</a>`
          }
        </p>
      </div>
    </div>
  `

  // tab switching
  app.querySelectorAll('.auth-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      const m = (tab as HTMLElement).dataset.mode
      navigate(m === 'signup' ? '/signup' : '/login')
    })
  })

  // form submit
  const form = document.getElementById('authForm') as HTMLFormElement
  const errorEl = document.getElementById('authError')!
  const submitBtn = document.getElementById('authSubmit') as HTMLButtonElement

  form.addEventListener('submit', async (e) => {
    e.preventDefault()
    errorEl.textContent = ''
    submitBtn.disabled = true
    submitBtn.textContent = mode === 'signup' ? 'creating...' : 'logging in...'

    const fd = new FormData(form)
    const email = (fd.get('email') as string).trim()
    const password = fd.get('password') as string

    try {
      if (mode === 'signup') {
        const username = (fd.get('username') as string).trim().toLowerCase()
        if (!/^[a-z0-9_-]{3,30}$/.test(username)) {
          throw new Error('Username must be 3-30 chars: lowercase letters, numbers, dashes, underscores')
        }
        await signUp(email, password, username)
      } else {
        await signIn(email, password)
      }
      navigate('/dashboard')
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Something went wrong'
      errorEl.textContent = msg
      submitBtn.disabled = false
      submitBtn.textContent = mode === 'signup' ? 'create account' : 'log in'
    }
  })
}
