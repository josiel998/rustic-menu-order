// ARQUIVO: echo.ts (PARA USAR REVERB)

import Echo from 'laravel-echo';
import Pusher from 'pusher-js';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

(window as any).Pusher = Pusher;

const BASE_URL = API_URL.replace(/\/api$/, "");

// Lendo as variáveis de ambiente do Reverb
const VITE_REVERB_APP_KEY = import.meta.env.VITE_REVERB_APP_KEY;
const VITE_REVERB_HOST = import.meta.env.VITE_REVERB_HOST;
const VITE_REVERB_PORT = import.meta.env.VITE_REVERB_PORT;
const VITE_REVERB_SCHEME = import.meta.env.VITE_REVERB_SCHEME;

export const echo = new Echo({
    broadcaster: 'reverb',
    key: VITE_REVERB_APP_KEY,
    wsHost: VITE_REVERB_HOST,
    wsPort: VITE_REVERB_PORT,
    wssPort: VITE_REVERB_PORT,
    forceTLS: VITE_REVERB_SCHEME === 'https',
    enabledTransports: ['ws', 'wss'],
    authEndpoint: `${BASE_URL}/broadcasting/auth`,
});