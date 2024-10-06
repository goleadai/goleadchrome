import { defineManifest } from '@crxjs/vite-plugin'
import packageData from '../package.json' assert { type: 'json' }

const isDev = process.env.NODE_ENV == 'development'

export default defineManifest({
  name: `${packageData.displayName || packageData.name}${isDev ? ` ➡️ Dev` : ''}`,
  description: packageData.description,
  version: packageData.version,
  manifest_version: 3,
  icons: {
    16: 'img/logo.png',
    32: 'img/logo.png',
    48: 'img/logo.png',
    128: 'img/logo.png',
  },
  action: {
    default_popup: 'popup.html',
    default_icon: 'img/logo.png',
  },
  background: {
    service_worker: 'src/background/index.js',
    type: 'module',
  },
  web_accessible_resources: [
    {
      resources: ['img/logo.png'],
      matches: [],
    },
  ],
  permissions: ['cookies', 'activeTab', 'scripting'],
  host_permissions: ['https://api.golead.ai/*', 'https://twitter.com/*', 'https://x.com/*'],
})
