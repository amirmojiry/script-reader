import { createRouter, createWebHashHistory } from 'vue-router'
import LibraryView from './views/LibraryView.vue'
import ReaderView from './views/ReaderView.vue'

export const router = createRouter({
  history: createWebHashHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', name: 'library', component: LibraryView },
    { path: '/play/:id', name: 'reader', component: ReaderView, props: true },
    { path: '/:pathMatch(.*)*', redirect: '/' }
  ]
})
