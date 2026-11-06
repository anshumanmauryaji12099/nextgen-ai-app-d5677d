import { createStore, useStore } from './external-store'

export type ThemePreference = 'dark' | 'light' | 'system'
const KEY = 'ng-theme'

const themeStore = createStore<ThemePreference>('dark')

/** Inline script for <head>: applies the saved theme before first paint. */
export const themeBootScript = `(function(){try{var t=localStorage.getItem('${KEY}')||'dark';var d=t==='dark'||(t==='system'&&matchMedia('(prefers-color-scheme: dark)').matches);document.documentElement.classList.toggle('dark',d);}catch(e){document.documentElement.classList.add('dark')}})()`

function apply(pref: ThemePreference) {
  const dark =
    pref === 'dark' ||
    (pref === 'system' && matchMedia('(prefers-color-scheme: dark)').matches)
  document.documentElement.classList.toggle('dark', dark)
  document
    .querySelector('meta[name="theme-color"]')
    ?.setAttribute('content', dark ? '#0b0d10' : '#fafaf5')
}

export function initTheme() {
  const saved = (localStorage.getItem(KEY) as ThemePreference | null) ?? 'dark'
  themeStore.set(saved)
  apply(saved)
  matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
    if (themeStore.get() === 'system') apply('system')
  })
}

export function setTheme(pref: ThemePreference) {
  localStorage.setItem(KEY, pref)
  themeStore.set(pref)
  apply(pref)
}

export function useTheme() {
  return useStore(themeStore)
}
