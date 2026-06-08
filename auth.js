/**
 * UNIFED-PROBATUM — auth.js
 * Módulo de autenticação local (GitHub Pages / offline)
 * R24-AUTH: stub sem dependências externas
 */
(function() {
    'use strict';

    window.UNIFED_AUTH = {
        isAuthenticated: function() { return true; },
        getSessionId: function() {
            if (!window._unifed_session_id) {
                // Gera session ID determinístico baseado no timestamp de arranque
                window._unifed_session_id = 'UNIFED-' + Date.now().toString(36).toUpperCase();
            }
            return window._unifed_session_id;
        },
        getCurrentUser: function() {
            return { role: 'perito', permissions: ['read', 'write', 'export'] };
        },
        logout: function() {
            console.info('[UNIFED-AUTH] Sessão terminada.');
        }
    };

    console.info('[UNIFED-AUTH] ✅ Módulo de autenticação local carregado.');
})();
