import axios from 'axios'
import { API_BASE_URL } from './api.js'

// Глобальні дефолти для "голого" axios, яким користується більшість сторінок
// (axios.get('/api/...') і axios.get('api/...') без слеша). baseURL обов'язковий:
// без нього 'api/x' резолвиться відносно поточного шляху сторінки
// (/admin/users → /admin/api/x).
axios.defaults.baseURL = API_BASE_URL || '/'
axios.defaults.withCredentials = true
axios.defaults.withXSRFToken = true
axios.defaults.headers.common.Accept = 'application/json'
axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest'
