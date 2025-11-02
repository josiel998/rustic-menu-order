// ARQUIVO: src/lib/echo.ts (VERSÃO FINAL E CORRIGIDA)

import Echo from 'laravel-echo';
import Pusher from 'pusher-js';

(window as any).Pusher = Pusher;

// Lendo as variáveis de ambiente do Reverb
const VITE_REVERB_APP_KEY = import.meta.env.VITE_REVERB_APP_KEY;
const VITE_REVERB_HOST = import.meta.env.VITE_REVERB_HOST;
const VITE_REVERB_PORT = import.meta.env.VITE_REVERB_PORT;
const VITE_REVERB_SCHEME = import.meta.env.VITE_REVERB_SCHEME;

// 1. OBRIGA O USO DA VARIÁVEL DE AMBIENTE
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

// 2. CRUCIAL: PEGA A URL BASE DE FORMA ROBUSTA.
// Usa regex para remover o '/api' SÓ SE ESTIVER NO FINAL (Isso corrige a URL malformada).
const BASE_URL = API_URL.replace(/\/api$/, ""); 

export const echo = new Echo({
    broadcaster: 'reverb',
    key: VITE_REVERB_APP_KEY,
    wsHost: VITE_REVERB_HOST,
    wsPort: VITE_REVERB_PORT,
    wssPort: VITE_REVERB_PORT,
    forceTLS: VITE_REVERB_SCHEME === 'https',
    enabledTransports: ['ws', 'wss'],

    // RESULTADO CORRETO ESPERADO: https://api.bomsaborr.shop/broadcasting/auth
    authEndpoint: `${BASE_URL}/broadcasting/auth`,

    authorizer: (channel: any) => {
        return {
            authorize: (socketId: string, callback: (error: Error | null, authInfo: any) => void) => {
                
                const token = localStorage.getItem('auth_token'); 
                
                fetch(`${BASE_URL}/broadcasting/auth`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json',
                        'Authorization': `Bearer ${token}` 
                    },
                    body: JSON.stringify({
                        socket_id: socketId,
                        channel_name: channel.name
                    })
                })
                .then(async response => { 
                    if (!response.ok) {
                        const text = await response.text(); 
                        console.error('Falha na autorização do Echo:', response.status, text);
                        throw new Error(`Falha na autorização: ${response.status}`); 
                    }
                    return response.json();
                })
                .then(data => {
                    callback(null, data); 
                })
                .catch(error => {
                    console.error('Erro no fetch de autorização do Echo:', error);
                    callback(error, null); 
                });
            }
        };
    },
});