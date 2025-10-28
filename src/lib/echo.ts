import Echo from 'laravel-echo';
import Pusher from 'pusher-js';

// Necessário para o Echo funcionar no navegador
(window as any).Pusher = Pusher;

// Lendo as variáveis de ambiente que você acabou de adicionar
const VITE_REVERB_APP_KEY = import.meta.env.VITE_REVERB_APP_KEY;
const VITE_REVERB_HOST = import.meta.env.VITE_REVERB_HOST;
const VITE_REVERB_PORT = import.meta.env.VITE_REVERB_PORT;
const VITE_REVERB_SCHEME = import.meta.env.VITE_REVERB_SCHEME;

export const echo = new Echo({
    // 1. ESTA É A LINHA MAIS IMPORTANTE
    // Deve ser 'reverb' para conectar no seu localhost
    broadcaster: 'reverb', 
    
    // 2. A chave do seu app (do .env.local)
    key: VITE_REVERB_APP_KEY,

    // 3. Onde o Reverb está rodando (localhost:8080)
    wsHost: VITE_REVERB_HOST,
    wsPort: VITE_REVERB_PORT,
    wssPort: VITE_REVERB_PORT, // porta para https
    
    // 4. Configurações adicionais
    forceTLS: VITE_REVERB_SCHEME === 'https',
    enabledTransports: ['ws', 'wss'], // Permite conexões ws (http) e wss (https)
});