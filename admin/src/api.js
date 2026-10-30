import axios from 'axios'
import { url } from './assets/assets'

const TOKEN_KEY = 'adminToken'

export const getToken = () => {
  try { return localStorage.getItem(TOKEN_KEY) || '' } catch { return '' }
}

export const setToken = (token) => {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token)
    else localStorage.removeItem(TOKEN_KEY)
  } catch { /* stockage indisponible */ }
}

// Client HTTP du panneau admin : ajoute le jeton à chaque requête.
// validateStatus laisse passer les réponses d'erreur pour que les pages lisent data.success.
export const api = axios.create({
  baseURL: url,
  validateStatus: () => true
})

api.interceptors.request.use((config) => {
  const token = getToken()
  if (token) config.headers.token = token
  return config
})

// Jeton expiré ou refusé : retour à l'écran de connexion
api.interceptors.response.use((response) => {
  if ((response.status === 401 || response.status === 403) && !response.config.url?.includes('/admin/login')) {
    setToken('')
    window.location.reload()
  }
  return response
})
