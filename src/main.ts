import { createPinia } from 'pinia'
import { createApp } from 'vue'
import { registerSW } from 'virtual:pwa-register'
import App from './App.vue'
import { router } from './router'
import './styles.css'
import './styles-v11.css'
import './styles-v13.css'
import './styles-v14.css'
import './styles-v15.css'

registerSW({ immediate: true })

createApp(App).use(createPinia()).use(router).mount('#app')
