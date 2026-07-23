import { mount } from 'svelte'
import { applyLocale } from '../i18n/i18n.svelte'
import '../ui/theme.css'
import App from './App.svelte'
import '../feature-background/boot' // optional feature — see src/feature-background/README.md

// Match the browser language on first paint; App refines this to the stored
// preference once options load.
applyLocale('auto')

mount(App, { target: document.getElementById('root')! })
