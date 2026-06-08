/**
 * UNIFED-PROBATUM — config.js
 * Configuração global do sistema (GitHub Pages / file://)
 * R24-AUTH: carregado antes de qualquer outro módulo
 */
(function() {
    'use strict';

    window.UNIFED_CONFIG = {
        version:     '13.5.5-I18N-HARDENED',
        environment: 'github-pages',
        debug:       false,
        crypto: {
            requireSubtle:  false,   // Usa CryptoJS local se crypto.subtle indisponível
            fallbackAllowed: true
        },
        export: {
            pdfEnabled: true,
            zipEnabled: true,
            qrEnabled:  true
        },
        network: {
            isolationMode: 'selective'  // bloqueia apenas BLOCKED_DOMAINS
        }
    };

    console.info('[UNIFED-CONFIG] ✅ Configuração global carregada (v' + window.UNIFED_CONFIG.version + ')');
})();
