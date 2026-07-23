import { mount } from 'svelte'
import { getOptions } from '../core/storage'
import { applyLocale } from '../i18n/i18n.svelte'
import '../ui/theme.css'
import Popup from './Popup.svelte'

// Browser language for the first paint, then the stored preference once it loads.
applyLocale('auto')
getOptions()
  .then(o => applyLocale(o.locale))
  .catch(() => {})

mount(Popup, { target: document.getElementById('root')! })
