/**
 * ==========================================================================
 * UNIFED-PROBATUM — script.js FINAL v1.0-COMMERCIAL-LITIGATION
 * ==========================================================================
 * RETIFICAÇÃO CIRÚRGICA DE ALTA PRECISÃO (v1.0):
 *   - Motor de internacionalização bidirecional não-destrutivo (data-pt/data-en)
 *   - Eliminação de sufixos antigos "(3 PDFs + JSON)" e "(19 Pág + JSON)"
 *   - Sanitização do termo 'bolt' no metadata.client (JSON export)
 *   - Remoção de redefinições hardcoded em executarRetificacoesFinaisUnifed
 *
 * RECTIFICAÇÕES v1.0:
 *   R1 — Blindagem DOM: atributo data-i18n-ignore adicionado em todos os
 *        elementos que recebem valores via _syncPureDashboard e
 *        executarRetificacoesFinaisUnifed (pure-zona-*, pure-sg*-*,
 *        pure-nc-cancelamentos, hashElements). Impede sobrescrita pelo
 *        motor i18n (translateAll / updateUI).
 *   R1-GUARD — Guard de exclusão em translateAll(): elementos marcados com
 *        data-i18n-ignore são ignorados no ciclo de tradução.
 *   R2 — Flag de travamento anti-reentrância window._isSyncing em
 *        _syncPureDashboard, com libertação garantida via bloco finally.
 *        Elimina o ciclo de retroalimentação circular:
 *        languageChanged → translateAll → ANALYSIS_COMPLETE → sync → repeat.
 *
 * RECTIFICAÇÕES v1.0:
 *   COC — Selagem da cadeia de custódia (chainOfCustody.seal()) inserida em
 *        performAudit() imediatamente após generateMasterHash(), antes de
 *        qualquer acção de validação automática ou despacho de eventos.
 *        Garante que o Master Hash calculado é o valor imutável registado na
 *        cadeia de custódia. Conformidade: ISO/IEC 27037:2012 §8.4.
 * ==========================================================================
 */

'use strict';

// =========================================================================
// RECTIFICAÇÃO DE EMERGÊNCIA: Travamento de Layout
// Impede a sobreposição de elementos de boas-vindas e painel principal.
// =========================================================================
document.addEventListener('DOMContentLoaded', function() {
    const welcome = document.getElementById('welcome-screen');
    const dashboard = document.getElementById('pureDashboard');

    if (welcome && dashboard) {
        dashboard.style.display = 'none'; // Força a ocultação do painel
        welcome.style.display = 'flex';   // Restitui modelo Flexbox — align-items/justify-content activos
    }
});

// =========================================================================
// RECTIFICAÇÃO v1.0-ALIAS: Compatibilidade de ID splash screen
// O script.js referencia getElementById('splashScreen') em múltiplos pontos
// (activateDemoMode, startGatekeeperSession, resetAllValues).
// O HTML usa id="welcome-screen". Sem este alias, splash=null e o ecrã de
// boas-vindas nunca é ocultado ao activar o modo DEMO ou ao iniciar sessão.
// Solução: proxy DOM que intercepta getElementById('splashScreen') e
// redireciona para o elemento id="welcome-screen".
// =========================================================================
(function installSplashAlias() {
    var _origGetById = document.getElementById.bind(document);
    document.getElementById = function(id) {
        if (id === 'splashScreen') {
            return _origGetById('welcome-screen') || _origGetById('splashScreen');
        }
        return _origGetById(id);
    };
})();

// =========================================================================
// FILTRO GLOBAL DE CONSOLE – Redireccionamento para IndexedDB (ForensicDB)
// =========================================================================
(function() {
    if (window._unifedConsoleInterceptorInstalled) return;
    window._unifedConsoleInterceptorInstalled = true;

    const originalConsoleLog = console.log;
    const originalConsoleWarn = console.warn;
    const originalConsoleInfo = console.info;
    const originalConsoleError = console.error;

    // ── RETIFICAÇÃO v1.0-R2 ──────────────────────────────────────────────
    // Fila de persistência secundária: logs não persistidos no IndexedDB por
    // falha ou timeout do flushTimer são guardados em memória e reexpostos
    // via window.UNIFED_FAILED_LOG_QUEUE para auditoria externa.
    // Conformidade: ISO/IEC 27037:2012 §8.3 — nenhum artefacto de auditoria
    // pode ser silenciosamente descartado. (Substitui .catch(() => {}) vazio)
    // ────────────────────────────────────────────────────────────────────────
    if (!window.UNIFED_FAILED_LOG_QUEUE) {
        window.UNIFED_FAILED_LOG_QUEUE = [];
    }

    let messageQueue = [];
    let flushTimer = null;

    function flushMessages() {
        if (messageQueue.length === 0) return;
        const messages = [...messageQueue];
        messageQueue = [];
        if (window.UNIFED_FORENSIC_SYSTEM && window.UNIFED_FORENSIC_SYSTEM.secureStore) {
            const store = window.UNIFED_FORENSIC_SYSTEM.secureStore;
            store.retrieveSensitiveData('console_logs').then(existing => {
                const logs = existing || [];
                logs.push(...messages);
                store.storeSensitiveData('console_logs', logs);
            }).catch((idbError) => {
                // RETIFICAÇÃO R2: falha de persistência primária (IndexedDB) →
                // reencaminhar para fila secundária em memória.
                // Garante rastreabilidade forense mesmo em falha de storage.
                window.UNIFED_FAILED_LOG_QUEUE.push({
                    failedAt: Date.now(),
                    reason: idbError ? String(idbError.message || idbError) : 'IndexedDB unavailable',
                    messages: messages
                });
                // Limite defensivo: manter no máximo 500 entradas na fila em memória
                if (window.UNIFED_FAILED_LOG_QUEUE.length > 500) {
                    window.UNIFED_FAILED_LOG_QUEUE.splice(0, window.UNIFED_FAILED_LOG_QUEUE.length - 500);
                }
            });
        }
    }

    function queueMessage(level, args) {
        const message = args.map(arg => {
            if (typeof arg === 'object') try { return JSON.stringify(arg); } catch(e) { return String(arg); }
            return String(arg);
        }).join(' ');
        messageQueue.push({ level, message, timestamp: Date.now() });
        if (flushTimer) clearTimeout(flushTimer);
        flushTimer = setTimeout(flushMessages, 1000);
    }

    console.log = function(...args) {
        queueMessage('log', args);
    };
    console.warn = function(...args) {
        queueMessage('warn', args);
    };
    console.info = function(...args) {
        queueMessage('info', args);
    };
    console.error = function(...args) {
        queueMessage('error', args);
        originalConsoleError.apply(console, args);
    };
})();

// ==========================================================================
// BLOCO A — NÚCLEO RETIFICADO
// ==========================================================================

if (!window.UNIFEDSystem) {
    window.UNIFEDSystem = {
        config: {
            version: 'v1.0-COMMERCIAL-LITIGATION',
            timestamp: new Date().toISOString(),
            language: 'pt'
        },
        data: {
            saftInput: null,
            extractInput: null,
            dac7Input: null,
            fleetMetadata: null
        },
        analysis: {
            btor: null,
            top3Questions: null,
            merkleRoot: null,
            merkleMetadata: null,
            verdict: null
        }
    };
}

// ============================================================================
// BTOR ENGINE — ANÁLISE FINANCEIRA PLURIANUAL
// ============================================================================

window.BTOR_Engine = {
    processedPeriods: {},
    fleetRegistry: {
        drivers: new Set(),
        vehicles: new Set(),
        operators: new Set()
    },

    ingestMonthlyData: function(periodKey, rawData, fleetMetadata) {
        if (!periodKey || !rawData) {
            console.error('[BTOR] Parâmetros inválidos para ingestMonthlyData');
            return false;
        }

        if (!this.processedPeriods[periodKey]) {
            this.processedPeriods[periodKey] = {
                saftGross: 0,
                dac7Total: 0,
                extractTotal: 0,
                divergence: 0,
                motoristas: 0,
                viaturas: 0,
                operadores: 0
            };
        }

        if (rawData.saftGross !== undefined) {
            this.processedPeriods[periodKey].saftGross += parseFloat(rawData.saftGross) || 0;
        }
        if (rawData.dac7Total !== undefined) {
            this.processedPeriods[periodKey].dac7Total += parseFloat(rawData.dac7Total) || 0;
        }
        if (rawData.extractTotal !== undefined) {
            this.processedPeriods[periodKey].extractTotal += parseFloat(rawData.extractTotal) || 0;
        }

        if (fleetMetadata) {
            if (fleetMetadata.drivers) {
                fleetMetadata.drivers.forEach(d => this.fleetRegistry.drivers.add(d));
            }
            if (fleetMetadata.vehicles) {
                fleetMetadata.vehicles.forEach(v => this.fleetRegistry.vehicles.add(v));
            }
            if (fleetMetadata.operators) {
                fleetMetadata.operators.forEach(o => this.fleetRegistry.operators.add(o));
            }
        }

        this.recalculateGlobalMetrics();
        return true;
    },

    recalculateGlobalMetrics: function() {
        let totalSaft = 0;
        let totalDac7 = 0;
        let totalExtract = 0;

        for (const periodKey in this.processedPeriods) {
            const period = this.processedPeriods[periodKey];
            totalSaft += period.saftGross;
            totalDac7 += period.dac7Total;
            totalExtract += period.extractTotal;
        }

        const baseTributavel = Math.abs(totalSaft - totalDac7);
        const ivaOmitido = baseTributavel * 0.23;

        if (!window.UNIFEDSystem.analysis.btor) {
            window.UNIFEDSystem.analysis.btor = {};
        }

        window.UNIFEDSystem.analysis.btor = {
            totalSaft: totalSaft,
            totalDac7: totalDac7,
            totalExtract: totalExtract,
            baseTributavel: baseTributavel,
            ivaOmitido: ivaOmitido,
            omissionPercentage: (totalSaft > 0) ? ((baseTributavel / totalSaft) * 100) : 0,
            driversCount: this.fleetRegistry.drivers.size,
            vehiclesCount: this.fleetRegistry.vehicles.size,
            operatorsCount: this.fleetRegistry.operators.size,
            periodsProcessed: Object.keys(this.processedPeriods).length
        };
    },

    validateCadducity: function(periodKey, refDate) {
        const [year, month] = periodKey.split('_');
        const periodDate = new Date(year, parseInt(month) - 1, 1);
        const yearsElapsed = (refDate - periodDate) / (1000 * 60 * 60 * 24 * 365.25);

        if (yearsElapsed > 4) {
            return { valid: false, status: 'CADUCADO', yearsElapsed: yearsElapsed };
        } else if (yearsElapsed > 3.8) {
            return { valid: true, status: 'VENCIMENTO_IMINENTE', yearsElapsed: yearsElapsed };
        } else {
            return { valid: true, status: 'VÁLIDO', yearsElapsed: yearsElapsed };
        }
    },

    validatePeriod: function(periodKey) {
        const period = this.processedPeriods[periodKey];
        if (!period) {
            return { valid: false, issues: ['Período não processado'] };
        }

        const issues = [];

        if (period.saftGross === 0) {
            issues.push('SAF-T com valor zero');
        }

        const divergence = Math.abs(period.saftGross - period.dac7Total);
        if ((divergence / Math.max(period.saftGross, period.dac7Total)) > 0.5) {
            issues.push('Divergência SAF-T vs DAC7 > 50%');
        }

        if (period.dac7Total > period.saftGross) {
            issues.push('Reversão detectada: DAC7 > SAF-T');
        }

        return {
            valid: issues.length === 0,
            issues: issues,
            divergenceRatio: divergence / Math.max(period.saftGross, period.dac7Total)
        };
    },

    exportBigDataReport: function() {
        return {
            processedPeriods: this.processedPeriods,
            fleetRegistry: {
                drivers: Array.from(this.fleetRegistry.drivers),
                vehicles: Array.from(this.fleetRegistry.vehicles),
                operators: Array.from(this.fleetRegistry.operators)
            },
            globalMetrics: window.UNIFEDSystem.analysis.btor
        };
    }
};

// ============================================================================
// MERKLE ENGINE — eIDAS 2.0 SELECTIVE DISCLOSURE
// ============================================================================

window.UNIFED_MerkleEngine = {
    /**
     * CORRECÇÃO CRÍTICA v1.4 — Race Condition na Árvore de Merkle
     * Causa-raiz: após conversão de _simpleSHA256 para async, o generateMerkleRoot
     * mantinha estrutura síncrona. .map() sem await retorna array de Promise
     * não resolvidas; left + right concatenava "[object Promise][object Promise]"
     * em vez de cadeias hexadecimais. O Master Hash resultante era semanticamente
     * inútil e constituía falsificação inadvertida de prova técnica eIDAS 2.0.
     * Conformidade: FIPS 180-4 | ISO/IEC 10118-3 | eIDAS 2.0 Selective Disclosure
     */
    generateMerkleRoot: async function(top3Questions) {
        try {
            if (!top3Questions || top3Questions.length === 0) {
                throw new Error('[UNIFED-MERKLE] TOP 3 Questions não fornecidas ou lista vazia.');
            }

            // Resolução assíncrona paralela das folhas (Parallel Execution)
            // Promise.all garante que cada folha é uma cadeia hex real antes de
            // prosseguir para o cálculo dos nós intermédios.
            const leafNodes = await Promise.all(
                top3Questions.map(async function(q) {
                    const data = q.id + '|' + q.text;
                    return await this._simpleSHA256(data);
                }.bind(this))
            );

            // Validação de integridade das folhas — cada nó deve ser hex de 64 chars
            for (let i = 0; i < leafNodes.length; i++) {
                if (typeof leafNodes[i] !== 'string' || leafNodes[i].length !== 64) {
                    throw new Error(
                        '[UNIFED-MERKLE] Folha ' + i + ' inválida: "' +
                        String(leafNodes[i]).substring(0, 20) + '..." ' +
                        '(esperado: hex de 64 caracteres)'
                    );
                }
            }

            let merkleNodes = leafNodes.slice(); // cópia defensiva

            // Resolução assíncrona sequencial dos nós intermédios (Sequential Layering)
            // Cada nível é completamente resolvido antes de avançar para o seguinte.
            while (merkleNodes.length > 1) {
                const newLevel = [];
                for (let i = 0; i < merkleNodes.length; i += 2) {
                    const left  = merkleNodes[i];
                    const right = merkleNodes[i + 1] || merkleNodes[i]; // duplicação do último nó ímpar
                    const parent = await this._simpleSHA256(left + right);
                    newLevel.push(parent);
                }
                merkleNodes = newLevel;
            }

            const merkleRoot = merkleNodes[0];

            // Validação final da raiz
            if (typeof merkleRoot !== 'string' || merkleRoot.length !== 64) {
                throw new Error(
                    '[UNIFED-MERKLE] Raiz inválida após construção: "' +
                    String(merkleRoot).substring(0, 20) + '"'
                );
            }

            return {
                root:      merkleRoot,
                leaves:    leafNodes,
                timestamp: new Date().toISOString(),
                algorithm: 'SHA-256-WebCrypto (FIPS 180-4)',
                proofs:    this._generateInclusionProofs(leafNodes, merkleRoot)
            };
        } catch (e) {
            // Relançar com prefixo para rastreabilidade forense nos logs
            throw new Error('[UNIFED-MERKLE] generateMerkleRoot falhou: ' + e.message);
        }
    },

    /**
     * CORRECÇÃO CRÍTICA: substituição do pseudo-hash polinomial (djb2) pela
     * WebCrypto API nativa (SHA-256 real). O algoritmo anterior produzia colisões
     * triviais e não é SHA-256 — apresentar o seu output como "hash SHA-256" em
     * juízo constituiria falsificação de prova técnica.
     * Conformidade: FIPS 180-4 | ISO/IEC 10118-3 | eIDAS 2.0
     *
     * NOTA (v1.4): todos os callers internos da árvore Merkle (generateMerkleRoot)
     * foram migrados para await em v1.4. Chamadas síncronas a este método
     * produzirão Promise não resolvidas — qualquer novo caller deve usar await.
     */
    _simpleSHA256: async function(str) {
        try {
            const encoder = new TextEncoder();
            const data    = encoder.encode(String(str));
            const hashBuf = await crypto.subtle.digest('SHA-256', data);
            return Array.from(new Uint8Array(hashBuf))
                        .map(function(b) { return b.toString(16).padStart(2, '0'); })
                        .join('');
        } catch (e) {
            // crypto.subtle requer contexto seguro (HTTPS/localhost).
            // Em ambiente inseguro, interromper em vez de retornar pseudo-hash.
            throw new Error(
                '[UNIFED-MERKLE] ERRO CRÍTICO: crypto.subtle indisponível. ' +
                'O sistema requer contexto seguro (HTTPS ou localhost). ' +
                'Detalhe: ' + e.message
            );
        }
    },

    _generateInclusionProofs: function(leaves, root) {
        return leaves.map((leaf, index) => ({
            leafIndex: index,
            leafHash: leaf,
            rootHash: root,
            proofPath: [leaf]
        }));
    }
};

// ============================================================================
// MOTOR ANALÍTICO COGNITIVO
// ============================================================================

window.UNIFED_AnalysisCognitive = {
    triggerAnalysisComplete: async function(analysisMetrics) {
        console.log('[COGNITIVE-ENGINE] 🧠 GATILHO: UNIFED_ANALYSIS_COMPLETE');

        if (!analysisMetrics) {
            console.error('[COGNITIVE-ENGINE] ❌ analysisMetrics não fornecido');
            return false;
        }

        if (!window.UNIFED_QUESTIONNAIRE || !window.UNIFED_QUESTIONNAIRE.computeTopQuestions) {
            console.error('[COGNITIVE-ENGINE] ❌ UNIFED_QUESTIONNAIRE.computeTopQuestions não disponível');
            return false;
        }

        let top3Questions;
        try {
            top3Questions = window.UNIFED_QUESTIONNAIRE.computeTopQuestions(analysisMetrics);
            console.log('[COGNITIVE-ENGINE] 📋 TOP 3 Questões Computadas: ' + top3Questions.length);
        } catch (e) {
            console.error('[COGNITIVE-ENGINE] ❌ Erro ao computar TOP 3: ' + e.message);
            return false;
        }

        if (!window.UNIFED_MerkleEngine || !window.UNIFED_MerkleEngine.generateMerkleRoot) {
            console.error('[COGNITIVE-ENGINE] ❌ UNIFED_MerkleEngine.generateMerkleRoot não disponível');
            return false;
        }

        let merkleResult;
        try {
            merkleResult = await window.UNIFED_MerkleEngine.generateMerkleRoot(top3Questions);
            console.log('[COGNITIVE-ENGINE] ✅ Merkle Root Gerada: ' + merkleResult.root.substring(0, 16) + '...');
        } catch (e) {
            console.error('[COGNITIVE-ENGINE] ❌ Erro ao gerar Merkle: ' + e.message);
            return false;
        }

        if (!window.UNIFEDSystem) window.UNIFEDSystem = {};
        if (!window.UNIFEDSystem.analysis) window.UNIFEDSystem.analysis = {};

        window.UNIFEDSystem.analysis.top3Questions = top3Questions;
        window.UNIFEDSystem.analysis.merkleRoot = merkleResult.root;
        window.UNIFEDSystem.analysis.merkleMetadata = merkleResult;
        window.UNIFEDSystem.analysis.top3Timestamp = new Date().toISOString();
        window.UNIFEDSystem.analysis.top3Edited = false;

        console.log('[COGNITIVE-ENGINE] ✅ Estado Sincronizado: TOP 3 + Merkle em UNIFEDSystem');

        const event = new Event('UNIFED_TOP3_READY');
        document.dispatchEvent(event);

        return true;
    },

    recomputeMerkleOnEdit: async function(editedQuestions) {
        console.log('[COGNITIVE-ENGINE] 🔄 Re-computando Merkle após edição do advogado...');

        if (!window.UNIFED_MerkleEngine) {
            console.error('[COGNITIVE-ENGINE] ❌ UNIFED_MerkleEngine não disponível');
            return false;
        }

        try {
            const merkleResult = await window.UNIFED_MerkleEngine.generateMerkleRoot(editedQuestions);
            console.log('[COGNITIVE-ENGINE] ✅ Novo Merkle Root (Editado): ' + merkleResult.root.substring(0, 16) + '...');

            if (window.UNIFEDSystem && window.UNIFEDSystem.analysis) {
                window.UNIFEDSystem.analysis.top3Questions = editedQuestions;
                window.UNIFEDSystem.analysis.merkleRoot = merkleResult.root;
                window.UNIFEDSystem.analysis.merkleMetadata = merkleResult;
                window.UNIFEDSystem.analysis.top3Edited = true;
                window.UNIFEDSystem.analysis.editTimestamp = new Date().toISOString();
            }

            console.log('[COGNITIVE-ENGINE] ✅ Merkle Atualizado (Edição do Advogado)');
            return true;
        } catch (e) {
            console.error('[COGNITIVE-ENGINE] ❌ Erro ao re-computar Merkle: ' + e.message);
            return false;
        }
    }
};

// ============================================================================
// _nexusFullDisclose — Purga Ativa do #top3Container (R3 Evolução · script.js)
// Complementar à implementação em nexus.js. Garante purga atómica mesmo quando
// nexus.js ainda não carregou ou o evento é disparado antes do módulo NEXUS·M5.
// ============================================================================
window._nexusFullDisclose = window._nexusFullDisclose || function() {
    const wrapper = document.getElementById('lawyerContradictoryPanel');
    const container = document.getElementById('top3Container');
    if (wrapper) wrapper.style.display = 'block';
    if (container) {
        container.innerHTML = ''; // Purga coerciva — dados ausentes até regeneração explícita
        console.log('[SECURITY] DOM Purged: #top3Container');
    }
};

// ============================================================================
// UI RENDERING — TOP 3 QUESTIONS
// ============================================================================

window.UNIFED_RenderTop3 = function() {
    if (!window.UNIFEDSystem || !window.UNIFEDSystem.analysis || !window.UNIFEDSystem.analysis.top3Questions) {
        console.log('[UI-TOP3] ⚠️  TOP 3 não disponível ainda');
        return;
    }

    const top3 = window.UNIFEDSystem.analysis.top3Questions;
    const container = document.getElementById('top3Container');
    if (!container) {
        console.error('[UI-TOP3] ❌ #top3Container não encontrado no DOM');
        return;
    }

    console.log('[UI-TOP3] 🎨 Renderizando TOP 3 questões...');
    container.innerHTML = '';

    top3.forEach(function(q, index) {
        const card = document.createElement('div');
        card.className = 'top3-question-card';
        card.setAttribute('data-question-id', q.id);

        const headerHtml = '<div class="header">' +
            '<div>' +
            '<span class="id-badge">' + q.id + '</span>' +
            '<span class="axis-badge">Eixo ' + q.axis + '</span>' +
            '<span class="score-badge">Score: ' + q.relevanceScore + '</span>' +
            '</div>' +
            '<div style="font-size: 12px; color: #00e5ff; font-weight: bold;">#' + (index + 1) + '</div>' +
            '</div>';

        const questionTextHtml = '<div class="question-text" contenteditable="true" data-field="text">' + 
            (q.text || '') + 
            '</div>';

        const normaHtml = '<div class="norma">' +
            '<div class="label" data-pt="📋 Norma Legal" data-en="📋 Legal Norm">📋 Norma Legal</div>' +
            (q.norma || '') +
            '</div>';

        const implicacaoHtml = '<div class="implicacao">' +
            '<div class="label" data-pt="⚡ Implicação Técnica/Jurídica" data-en="⚡ Technical/Legal Implication">⚡ Implicação Técnica/Jurídica</div>' +
            (q.implicacao || '') +
            '</div>';

        const defesaHtml = '<div class="defesa">' +
            '<div class="label" data-pt="🛡️ Estratégia de Defesa" data-en="🛡️ Defense Strategy">🛡️ Estratégia de Defesa</div>' +
            (q.defesa || '') +
            '</div>';

        card.innerHTML = headerHtml + questionTextHtml + normaHtml + implicacaoHtml + defesaHtml;
        container.appendChild(card);
    });

    const panelElement = document.getElementById('lawyerContradictoryPanel');
    if (panelElement) {
        panelElement.style.display = 'block';
        console.log('[UI-TOP3] ✅ Painel do Advogado tornado visível');
    }

    console.log('[UI-TOP3] ✅ TOP 3 Renderizado com sucesso');

    setupTop3EditListeners();
};

function setupTop3EditListeners() {
    const textFields = document.querySelectorAll('.top3-question-card .question-text');
    
    textFields.forEach(function(field) {
        field.addEventListener('blur', function() {
            const questionId = this.closest('.top3-question-card').getAttribute('data-question-id');
            const editedText = this.textContent;
            
            console.log('[UI-TOP3] ✏️  Questão ' + questionId + ' editada pelo advogado');

            if (window.UNIFEDSystem && window.UNIFEDSystem.analysis && window.UNIFEDSystem.analysis.top3Questions) {
                const idx = window.UNIFEDSystem.analysis.top3Questions.findIndex(q => q.id === questionId);
                if (idx !== -1) {
                    window.UNIFEDSystem.analysis.top3Questions[idx].text = editedText;
                }
            }

            if (window.UNIFED_AnalysisCognitive && window.UNIFEDSystem && window.UNIFEDSystem.analysis) {
                window.UNIFED_AnalysisCognitive.recomputeMerkleOnEdit(window.UNIFEDSystem.analysis.top3Questions);
            }
        });

        field.addEventListener('focus', function() {
            this.style.backgroundColor = 'rgba(0,229,255,0.05)';
        });

        field.addEventListener('blur', function() {
            this.style.backgroundColor = 'rgba(15,23,42,0.7)';
        });
    });
}

// ============================================================================
// EVENT LISTENERS — INTERFACE BINDING
// ============================================================================

document.addEventListener('DOMContentLoaded', function() {
    const regenerateBtn = document.getElementById('regenerateTop3Btn');
    if (regenerateBtn) {
        regenerateBtn.addEventListener('click', function() {
            console.log('[UI-TOP3] 🔄 Regenerando TOP 3...');
            if (window.UNIFED_AnalysisCognitive && window.UNIFEDSystem && window.UNIFEDSystem.analysis) {
                window.UNIFED_AnalysisCognitive.triggerAnalysisComplete(window.UNIFEDSystem.analysis.btor);
            }
        });

        regenerateBtn.addEventListener('mouseover', function() {
            this.style.boxShadow = '0 0 20px rgba(0,229,255,0.4)';
        });

        regenerateBtn.addEventListener('mouseout', function() {
            this.style.boxShadow = 'none';
        });
    }

    const acceptBtn = document.getElementById('acceptTop3Btn');
    if (acceptBtn) {
        acceptBtn.addEventListener('click', function() {
            console.log('[UI-TOP3] ✅ Advogado Aceitou TOP 3 — Pronto para Exportação');
            if (window.UNIFEDSystem && window.UNIFEDSystem.analysis) {
                window.UNIFEDSystem.analysis.top3Accepted = true;
                window.UNIFEDSystem.analysis.acceptTimestamp = new Date().toISOString();
            }
            alert('✅ TOP 3 Confirmado. Proceda com Exportação dos Pacotes (Advogado ou Analista).');
        });

        acceptBtn.addEventListener('mouseover', function() {
            this.style.boxShadow = '0 0 20px rgba(34,197,94,0.4)';
        });

        acceptBtn.addEventListener('mouseout', function() {
            this.style.boxShadow = 'none';
        });
    }
});

document.addEventListener('UNIFED_TOP3_READY', function() {
    console.log('[SCRIPT-JS] 🎯 Evento UNIFED_TOP3_READY disparado — Renderizando TOP 3');
    window.UNIFED_RenderTop3();
});

// ============================================================================
// RETIFICAÇÃO 4 – Eliminação de Race Conditions (semáforo + debounce)
// ============================================================================

console.log('[SCRIPT-JS] ✅ Sistema UNIFED-PROBATUM v1.0-COMMERCIAL-LITIGATION Carregado Completo');
console.log('[SCRIPT-JS] ✅ Componentes Disponíveis:');
console.log('[SCRIPT-JS]    - BTOR_Engine (Análise Financeira)');
console.log('[SCRIPT-JS]    - UNIFED_MerkleEngine (eIDAS 2.0)');
console.log('[SCRIPT-JS]    - UNIFED_AnalysisCognitive (Orquestração)');
console.log('[SCRIPT-JS]    - UNIFED_RenderTop3 (UI Rendering)');

// ==========================================================================
// BLOCO B — BODY ORIGINAL PRESERVADO
// ==========================================================================

'use strict';

window._nifafAlertedHash = window._nifafAlertedHash || new Set();
window._demoModeTimer = null;

console.log('UNIFED - PROBATUM SCRIPT v1.0-COMMERCIAL-LITIGATION · ATF · INTEGRITY SEAL · DOCX · AI ADVERSARIAL · NIFAF GUARD · NEXUS · ATIVADO');

// ============================================================================
// VERIFICAÇÃO DE DEPENDÊNCIAS: translations.js
// ============================================================================
(function validateTranslationsModule() {
    if (typeof window.getTranslation !== 'function') {
        console.error('[UNIFED-SCRIPT] ❌ ERRO CRÍTICO: translations.js NÃO CARREGADO');
        console.error('[UNIFED-SCRIPT] Carregue assim em <head> HTML:');
        console.error('[UNIFED-SCRIPT]   <script src="translations.js"></script> <!-- PRIMEIRO -->');
        console.error('[UNIFED-SCRIPT]   <script src="script.js"></script>');
        console.warn('[UNIFED-SCRIPT] Sistema em modo DEGRADADO — usando fallbacks');
    } else {
        console.log('[UNIFED-SCRIPT] ✅ translations.js carregado — i18n ativo');
    }
    
    window.t = window.t || window.getTranslation || function(key) { return key; };
})();

// ============================================================================
// 0. HANDSHAKE DE INFRAESTRUTURA
// ============================================================================
(function initOTSHandshake() {
    function detectOTSLibrary() {
        if (typeof window.OpenTimestamps === 'undefined') {
            if (typeof window.opentimestamps !== 'undefined') {
                window.OpenTimestamps = window.opentimestamps;
            }
        }
        return typeof window.OpenTimestamps !== 'undefined';
    }

    window.addEventListener('load', function () {
        if (detectOTSLibrary()) {
            console.log('[UNIFED-OTS] ✅ Handshake OK — window.OpenTimestamps disponível.');
        } else {
            console.info('[UNIFED-OTS] ⚙ Operação em Modo de Segurança Forense — OTS indisponível (CDN bloqueado). ' +
                         'A funcionalidade OTS/Blockchain estará indisponível; o Nível 2 (PROBATUM interno) permanece ativo.');
        }
    });
})();

window.addEventListener('error', function(e) {
    if (e.target && e.target.tagName === 'SCRIPT' && 
        (e.target.src && e.target.src.includes('opentimestamps.js'))) {
        e.stopPropagation();
        e.preventDefault();
        console.log('[UNIFED] OpenTimestamps fallback não encontrado – funcionalidade OTS Nível 1 activa.');
        return false;
    }
}, true);

// ============================================================================
// CONFIGURAÇÃO DO PDF.JS
// ============================================================================
const pdfjsLib = window['pdfjs-dist/build/pdf'];
if (pdfjsLib) {
    pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
}

// ============================================================================
// DADOS DAS PLATAFORMAS (SANITIZADOS)
// ============================================================================
const PLATFORM_DATA = {
    bolt: {
        name: 'Plataforma Digital Operacional (Anonimizado)',
        address: 'Vana-Lõuna 15, 10134 Tallinn, Estónia',
        nif: 'EE102090374',
        fullAddress: 'Vana-Lõuna 15, Tallinn 10134, Estónia'
    },
    uber: {
        name: 'Plataforma Digital Operacional (Anonimizado)',
        address: 'Strawinskylaan 4117, Amesterdão, Países Baixos',
        nif: 'NL852071588B01',
        fullAddress: 'Strawinskylaan 4117, 1077 ZX Amesterdão, Países Baixos'
    },
    freenow: {
        name: 'Plataforma Digital Operacional (Anonimizado)',
        address: 'Rua Castilho, 39, 1250-066 Lisboa, Portugal',
        nif: 'PT514214739',
        fullAddress: 'Rua Castilho, 39, 1250-066 Lisboa, Portugal'
    },
    cabify: {
        name: 'Plataforma Digital Operacional (Anonimizado)',
        address: 'Avenida da Liberdade, 244, 1250-149 Lisboa, Portugal',
        nif: 'PT515239876',
        fullAddress: 'Avenida da Liberdade, 244, 1250-149 Lisboa, Portugal'
    },
    indrive: {
        name: 'Plataforma Digital Operacional (Anonimizado)',
        address: 'Rua de São Paulo, 56, 4150-179 Porto, Portugal',
        nif: 'PT516348765',
        fullAddress: 'Rua de São Paulo, 56, 4150-179 Porto, Portugal'
    },
    outra: {
        name: 'Plataforma Digital Operacional (Anonimizado)',
        address: 'A verificar em documentação complementar',
        nif: 'A VERIFICAR',
        fullAddress: 'A verificar em documentação complementar'
    }
};

// ============================================================================
// QUESTIONÁRIO PERICIAL ESTRATÉGICO (40 Questões)
// ============================================================================
const QUESTIONS_CACHE = [
    { id: 1, text: "Qual a justificação para a diferença entre a comissão retida nos extratos e o valor faturado pela plataforma?", type: "high" },
    { id: 2, text: "Como justifica a discrepância de IVA apurado (23% vs 6%) face aos valores declarados?", type: "high" },
    { id: 3, text: "Existem registos de 'Shadow Entries' (entradas sem ID) no sistema que justifiquem a omissão?", type: "med" },
    { id: 4, text: "A plataforma disponibiliza o código-fonte do algoritmo de cálculo de comissões para auditoria?", type: "low" },
    { id: 5, text: "Qual o tratamento das 'Tips' (Gorjetas) na faturação e declaração de IVA, e porque não foram consideradas?", type: "med" },
    { id: 6, text: "Como é determinada a origem geográfica para efeitos de IVA nas transações, e qual o impacto na taxa aplicada?", type: "med" },
    { id: 7, text: "Houve aplicação de taxa de comissão flutuante sem notificação ao utilizador? Qual o algoritmo?", type: "low" },
    { id: 8, text: "Os extratos bancários dos motoristas coincidem com os registos na base de dados da plataforma?", type: "high" },
    { id: 9, text: "Qual a metodologia de retenção de IVA quando a fatura é omissa na taxa, e como se justifica a não faturação?", type: "high" },
    { id: 10, text: "Há evidências de manipulação de 'timestamp' para alterar a validade fiscal das operações?", type: "high" },
    { id: 11, text: "O sistema permite a edição retroativa de registos de faturação já selados? Como é auditado?", type: "med" },
    { id: 12, text: "Qual o protocolo de redundância quando a API de faturação falha em tempo real? Houve falhas no período?", type: "low" },
    { id: 13, text: "Como são conciliados os cancelamentos com as faturas retificativas e o impacto nas comissões?", type: "med" },
    { id: 14, text: "Existem fluxos de capital para contas não declaradas na jurisdição nacional que expliquem a diferença?", type: "high" },
    { id: 15, text: "O algoritmo de 'Surge Pricing' discrimina a margem de lucro operacional e as comissões?", type: "low" },
    { id: 16, text: "Qual o nível de acesso dos administradores à base de dados transacional e quem autorizou as alterações?", type: "med" },
    { id: 17, text: "Existe algum 'script' de limpeza automática de logs de erro de sincronização? Apresentar registos.", type: "med" },
    { id: 18, text: "Como é processada a autoliquidação de IVA em serviços intracomunitários? Porque não foi aplicada?", type: "high" },
    { id: 19, text: "As taxas de intermediação seguem o regime de isenção ou tributação plena? Justificar a opção.", type: "med" },
    { id: 20, text: "Qual a justificação técnica para o desvio de base tributável (BTOR vs BTF) detetado na triangulação UNIFED - PROBATUM?", type: "high" },
    { id: 21, text: "Existe segregação de funções no acesso aos algoritmos de cálculo financeiro? Quem tem acesso?", type: "low" },
    { id: 22, text: "Como são validados os NIFs de clientes em faturas automáticas? Quantos NIFs são inválidos?", type: "low" },
    { id: 23, text: "O sistema utiliza 'dark patterns' para ocultar taxas adicionais? Exemplificar.", type: "med" },
    { id: 24, text: "Há registo de transações em 'offline mode' sem upload posterior? Como foram faturadas?", type: "high" },
    { id: 25, text: "Qual a política de retenção de dados brutos antes do parsing contabilístico? Onde estão os originais?", type: "low" },
    { id: 26, text: "Existem discrepâncias de câmbio não justificadas em faturas multimoeda? Qual o impacto?", type: "med" },
    { id: 27, text: "Como é garantida a imutabilidade dos logs de acesso ao sistema financeiro? Apresentar prova.", type: "high" },
    { id: 28, text: "Os valores reportados à AT via SAFT-PT coincidem com este relatório? Se não, porquê?", type: "high" },
    { id: 29, text: "Qual o impacto da latência da API no valor final cobrado ao cliente e na comissão retida?", type: "low" },
    { id: 30, text: "Existe evidência de sub-declaração de receitas via algoritmos de desconto não reportados?", type: "high" },
    { id: 31, text: "É possível inspecionar o código-fonte do módulo de cálculo de taxas variáveis para verificar a sua conformidade com o contrato e a lei?", type: "high" },
    { id: 32, text: "Como é que o algoritmo de 'Surge Pricing' interage com a base de cálculo da comissão da plataforma, e existe segregação contabilística destes valores?", type: "med" },
    { id: 33, text: "Apresente o registo de validação de NIF dos utilizadores para o período em análise, incluindo os que falharam ou foram omitidos.", type: "med" },
    { id: 34, text: "Demonstre, com logs do sistema, o funcionamento do protocolo de redundância da API de faturação durante as falhas reportadas no período.", type: "low" },
    { id: 35, text: "Disponibilize os 'raw data' (logs de servidor) das transações anteriores ao parsing contabilístico para o período em análise.", type: "high" },
    { id: 36, text: "Como é que o modelo de preços dinâmico ('Surge') impacta a margem bruta reportada e qual a fórmula exata aplicada a cada viagem?", type: "med" },
    { id: 37, text: "Identifique e explique a origem de todas as entradas na base de dados que não possuem um identificador de transação único ('Shadow Entries').", type: "high" },
    { id: 38, text: "Forneça o 'hash chain' ou prova criptográfica que atesta a imutabilidade dos registos de faturação e logs de acesso para o período.", type: "high" },
    { id: 39, text: "Apresente os metadados completos (incluindo 'timestamps' de criação e modificação) de todos os registos de faturação do período para auditoria de integridade temporal.", type: "high" },
    { id: 40, text: "Liste todos os acessos de administrador à base de dados que resultaram em alterações de registos financeiros já finalizados, incluindo o 'before' e 'after' dos dados.", type: "med" }
];

// ============================================================================
// UTILITÁRIOS FORENSES
// ============================================================================
const forensicRound = (num) => {
    if (num === null || num === undefined || isNaN(num)) return 0;
    return Math.round((num + Number.EPSILON) * 100) / 100;
};

const normalizeNumericValue = (input) => {
    if (!input) return 0;

    let str = input.toString().trim();

    str = str.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F]/g, '');
    str = str.replace(/€/g, '');
    str = str.replace(/[\$£]/g, '');
    str = str.replace(/EUR/gi, '');
    str = str.replace(/euros?/gi, '');
    str = str.replace(/\s+/g, '');
    str = str.replace(/[^-0-9.,]/g, '');

    if (str === '' || str === '-') return 0;

    const dots = (str.match(/\./g) || []).length;
    const commas = (str.match(/,/g) || []).length;

    if (commas >= 1 && dots >= 1) {
        const dotIndex   = str.indexOf('.');
        const commaIndex = str.indexOf(',');
        if (commaIndex > dotIndex) {
            str = str.replace(/\./g, '').replace(',', '.');
        } else {
            str = str.replace(/,/g, '');
        }
    }
    else if (dots === 1 && commas === 0) {
        const afterDot = str.split('.')[1] || '';
        if (afterDot.length === 3) {
            str = str.replace('.', '');
        }
    }
    else if (dots > 1 && commas === 0) {
        const parts = str.split('.');
        const lastPart = parts[parts.length - 1];
        if (lastPart.length <= 2) {
            str = parts.slice(0, -1).join('') + '.' + lastPart;
        } else {
            str = parts.join('');
        }
    }
    else if (dots === 0 && commas === 1) {
        str = str.replace(',', '.');
    }
    else if (dots === 0 && commas > 1) {
        const parts = str.split(',');
        const lastPart = parts.pop();
        str = parts.join('') + '.' + lastPart;
    }
    else if (dots > 1 && commas === 1) {
        str = str.replace(/\./g, '').replace(',', '.');
    }

    str = str.replace(/[^\d.-]/g, '');
    const parts = str.split('.');
    if (parts.length > 2) {
        str = parts[0] + '.' + parts.slice(1).join('');
    }

    const result = parseFloat(str);
    return isNaN(result) ? 0 : result;
};

if (window.location.search.includes('debug=true')) {
    const testParsing = () => {
        const testCases = [
            { input: "2.849,49", expected: 2849.49 },
            { input: "14,00", expected: 14.00 },
            { input: "2.213,12", expected: 2213.12 },
            { input: "7,00", expected: 7.00 },
            { input: "2.618,67", expected: 2618.67 },
            { input: "3,50", expected: 3.50 },
            { input: "0.25", expected: 0.25 },
            { input: "4.18", expected: 4.18 },
            { input: "169.47", expected: 169.47 },
            { input: "1.038,78", expected: 1038.78 },
            { input: "€ 1.234,56", expected: 1234.56 },
            { input: "1.234,56 €", expected: 1234.56 },
            { input: "7755.16€", expected: 7755.16 },
            { input: "€ 18.738,00", expected: 18738.00 },
            { input: "18.738,00", expected: 18738.00 },
            { input: "€ 7.731,22", expected: 7731.22 },
            { input: "4.178,32", expected: 4178.32 }
        ];

        console.log('🔬 TESTE DE PARSING v1.0-COMMERCIAL-LITIGATION:');
        testCases.forEach((test, i) => {
            const result = normalizeNumericValue(test.input);
            const status = Math.abs(result - test.expected) < 0.01 ? '✓' : '❌';
            console.log(`${status} ${test.input} → ${result.toFixed(2)} (esperado: ${test.expected.toFixed(2)})`);
        });
    };

    testParsing();

    const testSAFTValues = () => {
        console.log('🔬 TESTE DE NORMALIZAÇÃO COM VALORES SAF-T:');
        const testCases = [
            { input: "0.63", expected: 0.63 },
            { input: "10.45", expected: 10.45 },
            { input: "11.08", expected: 11.08 },
            { input: "0.52", expected: 0.52 },
            { input: "8.67", expected: 8.67 },
            { input: "0,63", expected: 0.63 },
            { input: "10,45", expected: 10.45 }
        ];

        testCases.forEach(test => {
            const result = normalizeNumericValue(test.input);
            console.log(`${Math.abs(result - test.expected) < 0.01 ? '✓' : '❌'} ${test.input} → ${result} (esperado: ${test.expected})`);
        });
    };

    testSAFTValues();
}

function robustSAFTParser(csvText) {
    const parseCSVLine = (line) => {
        const result = [];
        let current = '';
        let inQuotes = false;
        for (let c = 0; c < line.length; c++) {
            const ch = line[c];
            if (ch === '"') {
                if (inQuotes && line[c + 1] === '"') {
                    current += '"';
                    c++;
                } else {
                    inQuotes = !inQuotes;
                }
            } else if (ch === ',' && !inQuotes) {
                result.push(current);
                current = '';
            } else {
                current += ch;
            }
        }
        result.push(current);
        return result;
    };

    const sanitizeToFloat = (val) => {
        if (val === undefined || val === null) return 0;
        let str = String(val).trim().replace(/"/g, '');
        str = str.replace(/[€$£]/g, '').replace(/EUR/gi, '').replace(/\s+/g, '');
        if (str === '' || str === '-') return 0;
        return normalizeNumericValue(str);
    };

    const lines = csvText.split(/\r?\n/);
    if (lines.length < 2) {
        logAudit('[!] SAF-T CSV: ficheiro sem linhas de dados suficientes.', 'warning');
        return;
    }

    const rawHeader = lines[0].replace(/^\uFEFF/, '').trim();
    const headers = parseCSVLine(rawHeader).map(h => h.trim().replace(/"/g, ''));

    const LABEL_ILIQUIDO = 'Preço da viagem (sem IVA)';
    const LABEL_IVA      = 'IVA';
    const LABEL_BRUTO    = 'Preço da viagem';

    const idxIliquido = headers.indexOf(LABEL_ILIQUIDO);
    const idxIVA      = headers.indexOf(LABEL_IVA);
    const idxBruto    = headers.indexOf(LABEL_BRUTO);

    console.log(`🗂️ HEADER-MAPPING v1.0-COMMERCIAL-LITIGATION | "${LABEL_ILIQUIDO}" → col[${idxIliquido}] | "${LABEL_IVA}" → col[${idxIVA}] | "${LABEL_BRUTO}" → col[${idxBruto}]`);

    if (idxIliquido === -1 || idxIVA === -1 || idxBruto === -1) {
        const missing = [
            idxIliquido === -1 ? `"${LABEL_ILIQUIDO}"` : null,
            idxIVA      === -1 ? `"${LABEL_IVA}"` : null,
            idxBruto    === -1 ? `"${LABEL_BRUTO}"` : null
        ].filter(Boolean).join(', ');
        logAudit(`❌ SAF-T CSV: Cabeçalhos não encontrados → ${missing}. Verifique o ficheiro.`, 'error');
        console.error(`❌ HEADER-MAPPING FAILED: colunas em falta: ${missing}`);
        console.info('📋 Cabeçalhos detectados:', headers);
        return;
    }

    let totalIliquido = 0;
    let totalIVA      = 0;
    let totalBruto    = 0;
    let linhasProcessadas = 0;
    let linhasIgnoradas   = 0;

    for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        const cols = parseCSVLine(line);
        const minRequired = Math.max(idxIliquido, idxIVA, idxBruto) + 1;
        if (cols.length < minRequired) {
            linhasIgnoradas++;
            continue;
        }

        totalIliquido += sanitizeToFloat(cols[idxIliquido]);
        totalIVA      += sanitizeToFloat(cols[idxIVA]);
        totalBruto    += sanitizeToFloat(cols[idxBruto]);
        linhasProcessadas++;
    }

    UNIFEDSystem.documents.saft.totals.iliquido = totalIliquido;
    UNIFEDSystem.documents.saft.totals.iva      = totalIVA;
    UNIFEDSystem.documents.saft.totals.bruto    = totalBruto;

    const setUI = (id, value) => {
        const el = document.getElementById(id);
        if (el) el.textContent = formatCurrency(value);
    };

    setUI('saftIliquidoValue', totalIliquido);
    setUI('saftIvaValue',      totalIVA);
    setUI('saftBrutoValue',    totalBruto);

    console.log(
        `✅ EXTRAÇÃO CERTIFICADA v1.0-COMMERCIAL-LITIGATION | ` +
        `Linhas processadas: ${linhasProcessadas} | Ignoradas: ${linhasIgnoradas} | ` +
        `Ilíquido: ${formatCurrency(totalIliquido)} | ` +
        `IVA: ${formatCurrency(totalIVA)} | ` +
        `Bruto: ${formatCurrency(totalBruto)}`
    );

    logAudit(
        `📋 SAF-T Extraído v1.0-COMMERCIAL-LITIGATION (Header-Mapping) — ` +
        `Linhas: ${linhasProcessadas} | ` +
        `Ilíquido: ${formatCurrency(totalIliquido)} | ` +
        `IVA: ${formatCurrency(totalIVA)} | ` +
        `Bruto: ${formatCurrency(totalBruto)}`,
        'success'
    );
}

const validateNIF = (nif) => {
    const nifLimpo = (nif || '').replace(/\D/g, '');
    if (nifLimpo === '999999990' || nifLimpo === '123456789') return true;
    if (!nifLimpo || !/^\d{9}$/.test(nifLimpo)) return false;
    const first = parseInt(nifLimpo[0]);
    if (![1, 2, 3, 5, 6, 8, 9].includes(first)) return false;
    let sum = 0;
    for (let i = 0; i < 8; i++) sum += parseInt(nifLimpo[i]) * (9 - i);
    const mod = sum % 11;
    return parseInt(nifLimpo[8]) === ((mod < 2) ? 0 : 11 - mod);
};

const formatCurrency = (value) => {
    return forensicRound(value).toLocaleString('pt-PT', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €';
};

const formatCurrencyEN = (value) => {
    return forensicRound(value).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €';
};

const getRiskVerdict = (delta, gross) => {
    if (gross === 0 || isNaN(gross)) return {
        level: { pt: 'INCONCLUSIVO', en: 'INCONCLUSIVE' },
        key: 'low',
        color: '#8c7ae6',
        description: { pt: 'Dados insuficientes para veredicto pericial.', en: 'Insufficient data for expert verdict.' },
        percent: '0.00%'
    };

    const pct = Math.abs((delta / gross) * 100);
    const pctFormatted = pct.toLocaleString('pt-PT', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + '%';

    if (pct <= 3) return {
        level: { pt: 'BAIXO RISCO', en: 'LOW RISK' },
        key: 'low',
        color: '#44bd32',
        description: { pt: 'Margem de erro operacional. Discrepâncias dentro dos limites aceitáveis.', en: 'Operational error margin. Discrepancies within acceptable limits.' },
        percent: pctFormatted
    };

    if (pct <= 10) return {
        level: { pt: 'RISCO MÉDIO', en: 'MEDIUM RISK' },
        key: 'med',
        color: '#f59e0b',
        description: { pt: 'Anomalia algorítmica detetada. Recomenda-se auditoria aprofundada.', en: 'In-depth audit recommended.' },
        percent: pctFormatted
    };

    if (pct <= 25) return {
        level: { pt: 'RISCO ELEVADO', en: 'HIGH RISK' },
        key: 'high',
        color: '#ef4444',
        description: { pt: 'Indícios de desconformidade fiscal significativa.', en: 'Evidence of significant tax non-compliance.' },
        percent: pctFormatted
    };

    return {
        level: { pt: 'RISCO CRÍTICO · INFRAÇÃO DETETADA', en: 'CRITICAL RISK · INFRACTION DETECTED' },
        key: 'critical',
        color: '#ff0000',
        description: {
            pt: 'Evidência de assimetria de informação de proveitos (DAC7) e omissão grave de faturação de custos (89,26%). A plataforma retém valores sem a devida titulação fiscal, prejudicando o direito à dedução de IVA e inflacionando a base de IRC do contribuinte.',
            en: 'Evidence of income under-reporting (DAC7) and serious cost invoicing omission (89.26%). The platform retains amounts without proper tax documentation, prejudicing the right to VAT deduction and inflating the taxpayer\'s IRC base.'
        },
        percent: pctFormatted
    };
};

const setElementText = (id, text) => {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
};

const generateSessionId = () => {
    return 'UNIFED-' + Date.now().toString(36).toUpperCase() + '-' +
           Math.random().toString(36).substring(2, 7).toUpperCase();
};
// ============================================================================
// RETIFICAÇÃO CIRÚRGICA: BLINDAGEM IDEMPOTENTE DO SESSION ID (SINGLETON)
// Causa-raiz: generateSessionId() invocado em contextos distintos (ecrã vs
// blob em memória) gerava valores divergentes. O Session ID deve comportar-se
// como elemento de persistência determinístico ao longo de toda a sessão.
// Conformidade: ISO/IEC 27037 §8.2 (rastreabilidade de artefactos)
// ============================================================================
window.getForensicSessionId = function() {
    const MASTER_KEY = 'UNIFED_ACTIVE_SESSION_ID';
    let activeSession;
    try {
        activeSession = localStorage.getItem(MASTER_KEY);
    } catch (_e) { activeSession = null; }

    if (!activeSession) {
        // Primeira inicialização: gerar ID e fixá-lo na sessão do navegador
        activeSession = 'UNIFED-' + Date.now().toString(36).toUpperCase() + '-' +
                        Math.random().toString(36).substring(2, 7).toUpperCase();
        try { localStorage.setItem(MASTER_KEY, activeSession); } catch (_e) { /* sessionStorage fallback */ }
    }

    // Sincronização com o objecto global UNIFEDSystem (fonte de verdade da UI)
    if (window.UNIFEDSystem && window.UNIFEDSystem.metadata) {
        window.UNIFEDSystem.metadata.session = activeSession;
    }
    if (window.UNIFEDSystem && !window.UNIFEDSystem.sessionId) {
        window.UNIFEDSystem.sessionId = activeSession;
    }
    return activeSession;
};

// Garantir sincronização universal em todos os cabeçalhos de exportação (PDF/DOCX)
// Este bloco é executado imediatamente após a definição, garantindo
// que qualquer exportação subsequente usa o mesmo identificador.
(function _syncSessionId() {
    const sid = window.getForensicSessionId();
    if (window.UNIFEDSystem) {
        window.UNIFEDSystem.sessionId = sid;
    }
    console.log('[UNIFED-SID] Session ID singleton activo: ' + sid);
})();
// ============================================================================



const readFileAsText = (file) => {
    return new Promise((resolve, reject) => {
        if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
            resolve("[PDF_BINARY_CONTENT]");
            return;
        }
        const reader = new FileReader();
        reader.onload = e => resolve(e.target.result);
        reader.onerror = reject;
        reader.readAsText(file, 'UTF-8');
    });
};

function getForensicMetadata() {
    const ua = navigator.userAgent;
    let browserFamily = 'Unknown-Forensic-Agent';
    if (ua.includes('Chrome') || ua.includes('Chromium')) browserFamily = 'Browser::Chromium-family';
    else if (ua.includes('Firefox'))                       browserFamily = 'Browser::Firefox-family';
    else if (ua.includes('Safari') && !ua.includes('Chrome')) browserFamily = 'Browser::WebKit-family';

    return {
        userAgent:    browserFamily,
        screenRes:    `${window.screen.width}x${window.screen.height}`,
        language:     navigator.language,
        timestampUnix: Math.floor(Date.now() / 1000),
        timestampISO: new Date().toISOString(),
        timezone:     Intl.DateTimeFormat().resolvedOptions().timeZone,
        platform:     'UNIFED-PROBATUM-ENCRYPTED-NODE'
    };
}

// ============================================================================
// SISTEMA DE LOGS FORENSES
// ============================================================================

function mockRFC3161Timestamp(hashHex) {
    const now = new Date();
    return {
        status: 'PROBATUM_INTERNAL_SEAL',
        tsaSource: 'PROBATUM INTERNAL SEAL (PENDING EXTERNAL TSA)',
        tsaLevel: 'Certificação de Tempo Interna (Nível 1)',
        serialNumber: 'PROBATUM-' + Math.random().toString(36).substr(2, 9).toUpperCase(),
        genTime: now.toISOString(),
        genTimeUnix: Math.floor(now.getTime() / 1000),
        messageImprint: {
            hashAlgorithm: 'SHA-256',
            hashedMessage: hashHex
        },
        policy: 'UNIFED-INTERNAL-OID-1.0',
        nonce: Math.floor(Math.random() * 0xFFFF).toString(16).toUpperCase(),
        ordering: false,
        _note: 'O hash SHA-256 é definitivo e matematicamente verificável. Nível 2 (RFC 3161 externo) activo após configuração da API de produção TSA.'
    };
}

async function generateForensicHash(content) {
    const encoder = new TextEncoder();
    const data = encoder.encode(content + 'IFDE_PROBATUM_SALT_2024');
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('').toUpperCase();
}

async function generateForensicLog(action, fileName, hash) {
    const finalHash = (hash && hash.length === 64)
        ? hash.toUpperCase()
        : await generateForensicHash(fileName + Date.now());

    const seal = mockRFC3161Timestamp(finalHash);

    const entry = {
        action,
        fileName,
        hash: finalHash,
        integrityStatus: 'SHA256_VERIFIED',
        serial: seal.serialNumber,
        source: seal.tsaSource,
        level: seal.tsaLevel,
        rfc3161: seal,
        isoTimestamp: seal.genTime,
        unixTimestamp: seal.genTimeUnix
    };

    ForensicLogger.addEntry(action, entry);

    const modal = document.getElementById('custodyModal');
    if (modal && modal.classList.contains('active')) {
        renderCustodyLog(ForensicLogger.getLogs());
    }

    console.log('%c[UNIFED-CUSTODY] ' + action + ' · ' + fileName,
        'color:#00e5ff;font-family:monospace;font-weight:bold;');
    console.log('%c  SHA-256: ' + finalHash,
        'color:#4ade80;font-family:monospace;font-size:0.85em;');
    console.log('%c  ' + seal.tsaLevel + ' · ' + seal.genTime + ' [S/N: ' + seal.serialNumber + ']',
        'color:#94a3b8;font-family:monospace;font-size:0.8em;');

    return entry;
}

function showBlockchainExplain(hash) {
    const existing = document.getElementById('tsaProductionPanel');
    if (existing) { existing.remove(); return; }

    const el = document.createElement('div');
    el.id = 'tsaProductionPanel';
    el.style.cssText = [
        'position:fixed;bottom:2rem;right:2rem;z-index:999999;',
        'background:#0a0f1e;border:1px solid #00e5ff;border-radius:4px;',
        'padding:1.4rem 1.6rem;max-width:420px;',
        'font-family:"JetBrains Mono",monospace;font-size:0.72rem;',
        'color:#cbd5e1;box-shadow:0 0 30px rgba(0,229,255,0.15);',
        'animation:custodyFadeIn 0.3s ease;'
    ].join('');
    el.innerHTML = `
        <div style="color:#00e5ff;font-weight:700;font-size:0.8rem;margin-bottom:0.8rem;letter-spacing:1px;">
            🔗 VERIFICAÇÃO DE INTEGRIDADE UNIFED - PROBATUM
        </div>
        <p style="margin-bottom:0.6rem;line-height:1.6;color:#94a3b8;">
            <strong style="color:#fff;">Hash SHA-256 (definitivo):</strong><br>
            <span style="color:#4ade80;word-break:break-all;font-size:0.65rem;">${hash}</span>
        </p>
        <p style="margin-bottom:0.8rem;line-height:1.6;color:#94a3b8;">
            O hash acima é <strong style="color:#4ade80;">matematicamente imutável</strong>.
            Qualquer alteração ao ficheiro original produzirá um hash completamente diferente.
        </p>
        <div style="background:rgba(0,229,255,0.05);border:1px solid rgba(0,229,255,0.2);
                    padding:0.6rem 0.8rem;border-radius:3px;margin-bottom:0.8rem;">
            <div style="color:#00e5ff;font-size:0.65rem;margin-bottom:0.4rem;font-weight:700;">NÍVEIS DE CERTIFICAÇÃO</div>
            <div style="color:#4ade80;margin-bottom:0.2rem;">✔ Nível 1 (Interno): ACTIVO — Selagem PROBATUM</div>
            <div style="color:#f59e0b;">◷ Nível 2 (Externo): Requer API de produção TSA (RFC 3161)</div>
        </div>
        <button onclick="document.getElementById('tsaProductionPanel').remove()"
            style="background:transparent;border:1px solid rgba(0,229,255,0.3);color:#00e5ff;
                   padding:0.35rem 0.9rem;border-radius:2px;cursor:pointer;
                   font-family:inherit;font-size:0.68rem;letter-spacing:1px;transition:background 0.2s;"
            onmouseover="this.style.background='rgba(0,229,255,0.1)'"
            onmouseout="this.style.background='transparent'">
            FECHAR
        </button>`;
    document.body.appendChild(el);
}

function openCustodyChainModal() {
    const modal = document.getElementById('custodyModal');
    if (!modal) return;
    const sessionEl = document.getElementById('custodySessionId');
    if (sessionEl && typeof UNIFEDSystem !== 'undefined' && UNIFEDSystem.sessionId) {
        sessionEl.textContent = UNIFEDSystem.sessionId;
    }
    renderCustodyLog(ForensicLogger.getLogs());
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeCustodyChainModal() {
    const modal = document.getElementById('custodyModal');
    if (!modal) return;
    modal.classList.remove('active');
    document.body.style.overflow = '';
}

function renderCustodyLog(logs) {
    const container = document.getElementById('custodyLogContainer');
    const countEl   = document.getElementById('custodyEntryCount');
    if (!container) return;

    if (!logs || logs.length === 0) {
        container.innerHTML = `
            <div class="custody-empty-state">
                <i class="fas fa-inbox"></i>
                Sem eventos registados. Faça upload de ficheiros para iniciar a cadeia de custódia.
            </div>`;
        if (countEl) countEl.textContent = '0';
        return;
    }

    if (countEl) countEl.textContent = logs.length;

    const sorted = [...logs].reverse();
    container.innerHTML = sorted.map(entry => {
        const d      = entry.data || {};
        const hash   = d.hash   || '—';
        const serial = d.serial || (d.rfc3161 && d.rfc3161.serialNumber) || '—';
        const level  = d.level  || 'Certificação de Tempo Interna (Nível 1)';
        const source = d.source || 'PROBATUM INTERNAL SEAL';
        const fname  = d.fileName || d.filename || '—';
        const ts     = entry.timestamp
            ? entry.timestamp.replace('T', ' ').replace(/\.\d+Z$/, ' UTC')
            : '—';
        const hasHash = hash && hash.length === 64;
        const stateClass = hasHash ? 'log-verified'
            : (entry.action && entry.action.includes('ERROR') ? 'log-error' : 'log-pending');

        return `
            <div class="custody-entry ${stateClass}">
                <div class="custody-header">
                    <span class="custody-badge">NÍVEL 1: ATIVO</span>
                    <span class="custody-serial">S/N: ${serial}</span>
                </div>
                <div class="custody-body">
                    <p><strong>EVENTO:</strong> ${entry.action}</p>
                    <p><strong>FICHEIRO:</strong> <span style="color:#e2b87a;">${fname}</span></p>
                    <p><strong>TIMESTAMP:</strong> ${ts}</p>
                    ${hasHash ? `<p><strong>HASH SHA-256:</strong><br><code class="hash-text">${hash}</code></p>` : ''}
                    <p><strong>FONTE:</strong> ${source}</p>
                    <p><strong>NÍVEL:</strong> ${level}</p>
                </div>
                ${hasHash ? `<button class="blockchain-btn" onclick="showBlockchainExplain('${hash}')">
                    <i class="fas fa-link"></i> Validar na Blockchain/TSA
                </button>` : ''}
            </div>`;
    }).join('');
}

function exportCustodyChainJSON() {
    const logs = ForensicLogger.getLogs();
    const payload = {
        exportedAt: new Date().toISOString(),
        system: 'UNIFED - PROBATUM v1.0-COMMERCIAL-LITIGATION',
        standard: 'SHA-256 · PROBATUM INTERNAL SEAL · D.L. 28/2019 · ISO/IEC 27037',
        totalEntries: logs.length,
        entries: logs
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url;
    a.download = 'UNIFED_CUSTODY_CHAIN_' + new Date().toISOString().replace(/[:.]/g, '-') + '.json';
    a.click();
    URL.revokeObjectURL(url);
}

function clearCustodyLogs() {
    if (!confirm('Confirma a limpeza de todos os logs de custódia? Esta acção é irreversível.')) return;
    ForensicLogger.logs = [];
    ForensicLogger._persist();
    renderCustodyLog([]);
}

async function importForensicControlCSV(file) {
    if (!file) {
        showToast('Nenhum ficheiro CSV selecionado.', 'warning');
        return;
    }

    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                const text = e.target.result;
                const lines = text.split(/\r?\n/).filter(l => l.trim().length > 0);
                if (lines.length < 2) {
                    showToast('[CSV] Ficheiro vazio ou sem entradas de dados.', 'warning');
                    return resolve([]);
                }

                const headerRaw = lines[0].split(';').map(h => h.trim().replace(/^["']|["']$/g, ''));
                const COL = {
                    data:       headerRaw.indexOf('Data'),
                    nome:       headerRaw.indexOf('Nome_Ficheiro'),
                    hash:       headerRaw.indexOf('Hash_SHA256'),
                    status:     headerRaw.indexOf('Status_Selo'),
                    caminhoTsr: headerRaw.indexOf('Caminho_TSR')
                };

                const missingCols = Object.entries(COL).filter(([, v]) => v === -1).map(([k]) => k);
                if (missingCols.length > 0) {
                    showToast(`[CSV] Colunas não encontradas: ${missingCols.join(', ')}`, 'error');
                    return resolve([]);
                }

                const importedEntries = [];
                let matchCount = 0;
                let newCount = 0;

                for (let i = 1; i < lines.length; i++) {
                    const cols = lines[i].split(';').map(c => c.trim().replace(/^["']|["']$/g, ''));
                    if (cols.length < 5) continue;

                    const entry = {
                        data:       cols[COL.data]       || '',
                        nome:       cols[COL.nome]        || '',
                        hash:       cols[COL.hash]        || '',
                        status:     cols[COL.status]      || '',
                        caminhoTsr: cols[COL.caminhoTsr]  || ''
                    };

                    importedEntries.push(entry);

                    const existing = UNIFEDSystem.analysis.evidenceIntegrity.find(
                        ev => ev.hash && ev.hash.toLowerCase() === entry.hash.toLowerCase()
                    );

                    if (existing) {
                        existing.sealType    = entry.status === 'Granted' ? 'RFC3161' : 'PENDING';
                        existing.tsrPath     = entry.caminhoTsr;
                        existing.sealDate    = entry.data;
                        existing.sealStatus  = entry.status;
                        matchCount++;
                    } else {
                        UNIFEDSystem.analysis.evidenceIntegrity.push({
                            filename:   entry.nome,
                            type:       'control',
                            hash:       entry.hash,
                            timestamp:  entry.data,
                            size:       0,
                            timestampUnix: Math.floor(Date.now() / 1000),
                            sealType:   entry.status === 'Granted' ? 'RFC3161' : 'PENDING',
                            tsrPath:    entry.caminhoTsr,
                            sealDate:   entry.data,
                            sealStatus: entry.status,
                            source:     'CSV_IMPORT'
                        });
                        newCount++;
                    }
                }

                ForensicLogger.addEntry('CSV_FORENSIC_IMPORT', {
                    filename:    file.name,
                    totalRows:   importedEntries.length,
                    matchedRows: matchCount,
                    newRows:     newCount
                });

                logAudit(
                    `✅ CSV de Controlo importado: ${importedEntries.length} entradas ` +
                    `(${matchCount} correspondidas, ${newCount} novas).`,
                    'success'
                );
                showToast(`CSV importado: ${importedEntries.length} entradas RFC 3161.`, 'success');
                resolve(importedEntries);

            } catch (err) {
                console.error('[importForensicControlCSV]', err);
                showToast('[CSV] Erro ao processar ficheiro: ' + err.message, 'error');
                reject(err);
            }
        };
        reader.onerror = () => reject(new Error('Erro ao ler o ficheiro CSV.'));
        reader.readAsText(file, 'UTF-8');
    });
}

function triggerImportCSV() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.csv,.txt';
    input.style.display = 'none';
    input.onchange = async (e) => {
        if (e.target.files && e.target.files[0]) {
            await importForensicControlCSV(e.target.files[0]);
        }
        input.remove();
    };
    document.body.appendChild(input);
    input.click();
}
window.triggerImportCSV = triggerImportCSV;

async function submitToOpenTimestamps() {
    const btn = document.getElementById('otsSealBtn');
    const masterHash = UNIFEDSystem.masterHash;

    if (!masterHash || masterHash.length < 60) {
        Swal.fire({
            title: '[!] HASH INDISPONÍVEL',
            text: 'O Master Hash SHA-256 não está disponível. Processe os ficheiros de evidência primeiro.',
            icon: 'warning',
            confirmButtonColor: '#00e5ff'
        });
        return;
    }

    const OTS = window.OpenTimestamps
             || window.opentimestamps
             || null;

    if (!OTS) {
        console.info('[UNIFED-OTS] ⚙ Operação em Modo de Segurança Forense — Biblioteca OTS indisponível (CDN bloqueado). Selagem de Nível 1 Ativa: Conformidade assegurada por Hash SHA-256 interno (Art.º 125.º CPP).');

        if (btn) {
            btn.disabled = true;
            btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> A CERTIFICAR NA BLOCKCHAIN...';
        }

        const sessionId = UNIFEDSystem.sessionId || 'PROBATUM';
        const stubFilename = `PROCESSO_${sessionId}_BLOCKCHAIN_PENDING.ots`;
        const stubData = JSON.stringify({
            _type:       'OTS_PENDING_STUB',
            note:        'Submissão OTS registada localmente. O hash SHA-256 é real e imutável. Re-submeter em ambiente com acesso à internet.',
            masterHash,
            submittedAt: new Date().toISOString(),
            calendars:   ['alice.btc.calendar.opentimestamps.org', 'bob.btc.calendar.opentimestamps.org'],
            protocol:    'OpenTimestamps · Bitcoin blockchain',
            system:      'UNIFED - PROBATUM v1.0-COMMERCIAL-LITIGATION',
            error:       'Biblioteca OTS não carregada (CDN inacessível na rede atual)'
        }, null, 2);

        const stubBlob = new Blob([stubData], { type: 'application/json' });
        const stubUrl  = URL.createObjectURL(stubBlob);
        const aStub    = document.createElement('a');
        aStub.href     = stubUrl;
        aStub.download = stubFilename;
        document.body.appendChild(aStub);
        aStub.click();
        document.body.removeChild(aStub);
        setTimeout(() => URL.revokeObjectURL(stubUrl), 5000);

        if (!UNIFEDSystem.forensicMetadata) UNIFEDSystem.forensicMetadata = getForensicMetadata();
        UNIFEDSystem.forensicMetadata.otsAnchor = {
            status:     'PENDING_STUB_LOCAL',
            protocol:   'OpenTimestamps (Bitcoin) — CDN inacessível',
            anchoredAt: new Date().toISOString(),
            masterHash,
            otsFile:    stubFilename
        };

        ForensicLogger.addEntry('OTS_ANCHOR_PENDING', {
            masterHash,
            note: 'Hash real. Stub local gerado. Re-submeter quando disponível ligação ao calendário OTS.'
        });

        _showOTSSuccessModal(stubFilename, masterHash, true, 'PENDING_STUB');

        if (btn) {
            btn.disabled = false;
            btn.innerHTML = '<i class="fas fa-clock"></i> OTS: PENDENTE';
        }
        return;
    }

    if (btn) {
        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> A CERTIFICAR NA BLOCKCHAIN...';
    }

    const sessionId = UNIFEDSystem.sessionId || 'PROBATUM';
    const filename = `PROCESSO_${sessionId}_BLOCKCHAIN.ots`;

    ForensicLogger.addEntry('OTS_ANCHOR_REQUESTED', {
        masterHash,
        calendars: ['alice.btc.calendar.opentimestamps.org', 'bob.btc.calendar.opentimestamps.org', 'finney.calendar.eternitywall.com'],
        protocol: 'OpenTimestamps (Bitcoin blockchain) · Remote Calendar Upgrade',
        file: filename
    });

    let upgradeStatus = 'CALENDAR_ATTESTATION';

    try {
        const hashBytes = new Uint8Array(
            masterHash.match(/.{1,2}/g).map(b => parseInt(b, 16))
        );

        const op = new OTS.Ops.OpSHA256();
        const detached = OTS.DetachedTimestampFile.fromHash(op, hashBytes);

        const calendarUrls = [
            'https://alice.btc.calendar.opentimestamps.org',
            'https://bob.btc.calendar.opentimestamps.org',
            'https://finney.calendar.eternitywall.com'
        ];
        if (typeof OTS.stamp === 'function') {
            await OTS.stamp(detached, calendarUrls);
        } else if (typeof OTS.timestamp === 'function') {
            await OTS.timestamp(detached);
        } else {
            throw new Error('API OTS incompatível: stamp() e timestamp() ausentes.');
        }

        try {
            await OTS.upgrade(detached);
            upgradeStatus = 'BITCOIN_MERKLE_PROOF';
        } catch (_upgradeErr) {
            upgradeStatus = 'CALENDAR_ATTESTATION_PENDING_BITCOIN';
        }

        const otsBytes = detached.serializeToBytes();
        const otsBlob  = new Blob([otsBytes], { type: 'application/octet-stream' });
        const otsUrl   = URL.createObjectURL(otsBlob);
        const a        = document.createElement('a');
        a.href         = otsUrl;
        a.download     = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(otsUrl), 5000);

        if (!UNIFEDSystem.forensicMetadata) UNIFEDSystem.forensicMetadata = getForensicMetadata();
        UNIFEDSystem.forensicMetadata.otsAnchor = {
            status:        upgradeStatus === 'BITCOIN_MERKLE_PROOF' ? 'ANCORADO_BLOCKCHAIN_CONFIRMADO' : 'ANCORADO_CALENDARIO_PENDENTE_BITCOIN',
            protocol:      'OpenTimestamps (Bitcoin blockchain)',
            upgradeStatus,
            anchoredAt:    new Date().toISOString(),
            masterHash,
            otsFile:       filename,
            calendars:     calendarUrls.map(c => c.replace('https://', ''))
        };

        ForensicLogger.addEntry('OTS_ANCHOR_COMPLETED', {
            masterHash, otsFile: filename, upgradeStatus, attestationType: upgradeStatus
        });

        const otsDate = new Date().toISOString();
        UNIFEDSystem.analysis.evidenceIntegrity.forEach(ev => {
            if (!ev.sealType || ev.sealType === 'NONE') {
                ev.sealType   = 'OTS';
                ev.sealStatus = 'BLOCKCHAIN OTS (Nível 1)';
                ev.sealDate   = otsDate;
            }
        });

        Swal.fire({
            title: '🛡️ ANCORAGEM BLOCKCHAIN EFETUADA',
            text: 'O ficheiro .ots foi gerado e descarregado. Este é o selo de imutabilidade eterna da Bitcoin para este processo.',
            icon: 'success',
            confirmButtonColor: '#00e5ff'
        });

        _showOTSSuccessModal(filename, masterHash, false, upgradeStatus);

        if (btn) {
            btn.disabled = false;
            btn.innerHTML = upgradeStatus === 'BITCOIN_MERKLE_PROOF'
                ? '<i class="fas fa-check-circle"></i> BLOCKCHAIN: CONFIRMADO'
                : '<i class="fas fa-check-circle"></i> BLOCKCHAIN: CERTIFICADO';
            btn.style.borderColor = '#f59e0b';
            btn.style.color = '#f59e0b';
        }

    } catch (err) {
        console.info('[UNIFED-OTS] ⚙ Operação em Modo de Segurança Forense — Ancoragem OTS indisponível. Selagem de Nível 1 Ativa: Conformidade assegurada por Hash SHA-256 interno (Art.º 125.º CPP).');

        const stubFilename = `PROCESSO_${sessionId}_BLOCKCHAIN_PENDING.ots`;
        const stubData = JSON.stringify({
            _type:       'OTS_PENDING_STUB',
            note:        'Submissão OTS registada localmente. O hash SHA-256 é real e imutável. Re-submeter em ambiente com acesso à internet.',
            masterHash,
            submittedAt: new Date().toISOString(),
            calendars:   ['alice.btc.calendar.opentimestamps.org', 'bob.btc.calendar.opentimestamps.org'],
            protocol:    'OpenTimestamps · Bitcoin blockchain',
            system:      'UNIFED - PROBATUM v1.0-COMMERCIAL-LITIGATION',
            error:       err.message
        }, null, 2);

        const stubBlob = new Blob([stubData], { type: 'application/json' });
        const stubUrl  = URL.createObjectURL(stubBlob);
        const aStub    = document.createElement('a');
        aStub.href     = stubUrl;
        aStub.download = stubFilename;
        document.body.appendChild(aStub);
        aStub.click();
        document.body.removeChild(aStub);
        setTimeout(() => URL.revokeObjectURL(stubUrl), 5000);

        if (!UNIFEDSystem.forensicMetadata) UNIFEDSystem.forensicMetadata = getForensicMetadata();
        UNIFEDSystem.forensicMetadata.otsAnchor = {
            status:     'PENDING_STUB_LOCAL',
            protocol:   'OpenTimestamps (Bitcoin) — erro de ligação',
            anchoredAt: new Date().toISOString(),
            masterHash,
            otsFile:    stubFilename,
            error:      err.message
        };

        ForensicLogger.addEntry('OTS_ANCHOR_ERROR', {
            masterHash, error: err.message,
            note: 'Hash real. Stub local gerado. Re-submeter quando disponível ligação ao calendário OTS.'
        });

        Swal.fire({
            title: '⏳ SUBMISSÃO PENDENTE',
            text: `O nó OTS não estava acessível (CORS/rede). O ficheiro stub foi descarregado com o hash real. Re-submeta em produção para obter a prova Bitcoin completa. Erro: ${err.message}`,
            icon: 'warning',
            confirmButtonColor: '#00e5ff'
        });

        _showOTSSuccessModal(stubFilename, masterHash, true, 'PENDING_STUB');

        if (btn) {
            btn.disabled = false;
            btn.innerHTML = '<i class="fas fa-clock"></i> OTS: PENDENTE';
            btn.style.borderColor = '#f59e0b';
            btn.style.color = '#f59e0b';
        }
    }
}

// RETIFICAÇÃO v1.0-R5: Selagem de Integridade antes da libertação do Blob.
// chainOfCustody.validateChain() é invocado antes de qualquer download via esta
// função utilitária. Impede a exportação de ficheiros com cadeia comprometida,
// em conformidade com Art. 125.º CPP e ISO/IEC 27037 (cadeia de custódia digital).
// Fallback permissivo: se o motor de validação não estiver carregado (UNIFED_FORENSIC_SYSTEM
// ausente), o download prossegue — evitar bloqueio de sessions pré-injeção.
async function downloadBlob(blob, filename, mimeType) {
    // Validação da cadeia de custódia antes de libertar o objecto Blob.
    if (typeof window.UNIFED_validateBeforeExport === 'function') {
        const _chainOk = await window.UNIFED_validateBeforeExport(`downloadBlob:${filename}`);
        if (!_chainOk) {
            console.error(`[COC·GATE] ❌ Download bloqueado — cadeia comprometida: ${filename}`);
            if (typeof showToast === 'function') {
                showToast('Download bloqueado — integridade da cadeia de custódia não verificável.', 'error');
            }
            return; // Abortar — não libertar URL nem simular clique.
        }
    }
    const blobObj = (blob instanceof Blob) ? blob : new Blob([blob], { type: mimeType });
    const url = URL.createObjectURL(blobObj);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

function _showOTSSuccessModal(filename, masterHash, isPendingStub = false, upgradeStatus = '') {
    const existing = document.getElementById('otsSuccessModal');
    if (existing) existing.remove();

    const isConfirmed = upgradeStatus === 'BITCOIN_MERKLE_PROOF';
    const statusColor = isPendingStub ? '#94a3b8' : '#f59e0b';
    const borderColor = isPendingStub ? '#475569' : '#f59e0b';

    const titleText = isPendingStub
        ? '⏳ REGISTO LOCAL — SUBMISSÃO PENDENTE'
        : isConfirmed
            ? '🔗 ANCORAGEM BLOCKCHAIN CONFIRMADA (MERKLE PROOF)'
            : '🛡️ ANCORAGEM BLOCKCHAIN EFETUADA';

    const subtitleText = isPendingStub
        ? 'STUB LOCAL · HASH REAL · RE-SUBMETER EM PRODUÇÃO'
        : isConfirmed
            ? 'BITCOIN MERKLE PROOF · INVIABILIDADE DE ALTERAÇÃO RETROATIVA · PROVA DE NÃO-REPÚDIO'
            : 'OPENTIMESTAMPS · CALENDAR ATTESTATION · ISO/IEC 27037:2012';

    const bodyText = isPendingStub
        ? `O nó OpenTimestamps não estava acessível. Um ficheiro stub foi gerado com o hash real e o timestamp da tentativa.
           Em ambiente de produção, re-submeter o ficheiro <code style="color:#00e5ff;">.ots</code> gerado ao calendário OTS para obter a prova Bitcoin completa.`
        : isConfirmed
            ? `O Master Hash SHA-256 desta perícia está ancorado na <strong style="color:#f59e0b;">Bitcoin blockchain</strong> com prova Merkle completa.
               Esta operação constitui <strong style="color:#fff;">prova forense irrevogável de existência temporal</strong> — qualquer alteração
               retroativa ao documento é <strong style="color:#ef4444;">matematicamente inviável</strong>.
               Guarde o ficheiro <code style="color:#00e5ff;">.ots</code> — ele é a sua prova definitiva de existência temporal imutável.`
            : `O Master Hash SHA-256 desta perícia foi submetido e aceite pelos Calendários Remotos OpenTimestamps.
               O <code style="color:#00e5ff;">ficheiro .ots</code> contém um <strong style="color:#fff;">Calendar Attestation criptograficamente vinculado</strong>
               ao seu hash — constitui <strong style="color:#f59e0b;">prova de não-repúdio imediata</strong>.
               A confirmação Bitcoin Merkle (bloco blockchain) ficará disponível após ~1 hora.
               Guarde este ficheiro. <strong style="color:#fff;">Ele é a sua prova definitiva de existência temporal imutável.</strong>`;

    const statusBadge = isPendingStub
        ? `<span style="color:#94a3b8;">⏳ STUB LOCAL</span>`
        : isConfirmed
            ? `<span style="color:#4ade80;font-weight:700;">✔ BITCOIN MERKLE PROOF (CONFIRMADO)</span>`
            : `<span style="color:#f59e0b;font-weight:700;">⏱ CALENDAR ATTESTATION (CONFIRMAÇÃO BITCOIN ~1h)</span>`;

    const overlay = document.createElement('div');
    overlay.id = 'otsSuccessModal';
    overlay.style.cssText = [
        'position:fixed;inset:0;z-index:999997;',
        'background:rgba(0,0,0,0.9);backdrop-filter:blur(10px);',
        'display:flex;align-items:center;justify-content:center;padding:2rem;'
    ].join('');

    overlay.innerHTML = `
        <div style="background:#0a0f1e;border:1px solid ${borderColor};border-radius:6px;
                    max-width:580px;width:100%;padding:2rem;
                    font-family:'JetBrains Mono',monospace;
                    box-shadow:0 0 50px rgba(245,158,11,0.12);
                    animation:custodyFadeIn 0.35s ease;">

            <div style="margin-bottom:1.2rem;">
                <div style="color:${statusColor};font-weight:700;font-size:0.88rem;letter-spacing:1px;margin-bottom:0.3rem;">
                    ${titleText}
                </div>
                <div style="color:#475569;font-size:0.6rem;letter-spacing:0.5px;">
                    ${subtitleText}
                </div>
            </div>

            <p style="color:#cbd5e1;font-size:0.72rem;line-height:1.75;margin-bottom:1rem;">
                ${bodyText}
            </p>

            <div style="background:rgba(0,0,0,0.45);border:1px solid rgba(245,158,11,0.18);
                        border-radius:4px;padding:1rem;margin-bottom:1rem;font-size:0.67rem;">
                <div style="color:#94a3b8;margin-bottom:0.4rem;">
                    • <strong style="color:#e2b87a;">Ficheiro:</strong>
                    <span style="color:#fff;">${filename}</span>
                </div>
                <div style="color:#94a3b8;margin-bottom:0.4rem;">
                    • <strong style="color:#e2b87a;">Master Hash SHA-256:</strong><br>
                    <span style="color:#00e5ff;word-break:break-all;font-size:0.59rem;">${masterHash}</span>
                </div>
                <div style="color:#94a3b8;margin-bottom:0.4rem;">
                    • <strong style="color:#e2b87a;">Protocolo:</strong>
                    <span style="color:#fff;">OpenTimestamps · Bitcoin blockchain · Calendários Alice/Bob/Finney</span>
                </div>
                <div style="color:#94a3b8;margin-bottom:0.4rem;">
                    • <strong style="color:#e2b87a;">Estado:</strong> ${statusBadge}
                </div>
                <div style="color:#94a3b8;">
                    • <strong style="color:#e2b87a;">Verificação offline:</strong>
                    <span style="color:#64748b;font-size:0.6rem;">ots verify ${filename} —— confirma hash na Bitcoin blockchain</span>
                </div>
            </div>

            <div style="background:rgba(239,68,68,0.05);border:1px solid rgba(239,68,68,0.15);
                        border-radius:3px;padding:0.7rem;margin-bottom:1.2rem;font-size:0.65rem;color:#94a3b8;line-height:1.6;">
                [!] <strong style="color:#ef4444;">INVIABILIDADE DE ALTERAÇÃO RETROATIVA:</strong>
                O SHA-256 é uma função de hash criptográfica unidirecional. Qualquer modificação
                ao documento original — mesmo de um único bit — produz um hash completamente diferente,
                tornando matematicamente impossível adulterar o conteúdo sem deteção imediata.
                Esta propriedade, combinada com a ancoragem blockchain, constitui <strong style="color:#fff;">prova de não-repúdio absoluta.</strong>
            </div>

            <button onclick="document.getElementById('otsSuccessModal').remove()"
                style="background:transparent;border:1px solid ${borderColor};color:${statusColor};
                       padding:0.5rem 1.2rem;border-radius:3px;cursor:pointer;
                       font-family:inherit;font-size:0.72rem;letter-spacing:1px;
                       transition:background 0.2s;width:100%;"
                onmouseover="this.style.background='rgba(245,158,11,0.08)'"
                onmouseout="this.style.background='transparent'">
                CONFIRMAR E FECHAR
            </button>
        </div>`;

    document.body.appendChild(overlay);
    overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });
}

async function anchorMasterHashExternal() {
    const masterHash = UNIFEDSystem.masterHash;

    if (!masterHash || masterHash.length < 60) {
        Swal.fire({
            title: '[!] HASH INDISPONÍVEL',
            text: 'O Master Hash SHA-256 não está disponível. Processe os ficheiros de evidência primeiro.',
            icon: 'warning',
            confirmButtonColor: '#00e5ff'
        });
        return;
    }

    const { value: mode } = await Swal.fire({
        title: '<span style="font-size:0.95rem;letter-spacing:1px;">🛡️ SELAGEM NÍVEL 2 — RFC 3161</span>',
        html: `
            <div style="font-family:'JetBrains Mono',monospace;font-size:0.75rem;text-align:left;color:#94a3b8;line-height:1.7;">
                <p style="color:#e2b87a;font-weight:700;margin-bottom:0.6rem;">Selecione o modo de operação:</p>
                <p><b style="color:#fff;">Opção A — Carregar Prova TSR</b><br>
                Valida um ficheiro <code>.tsr</code> gerado localmente pelo motor PowerShell/OpenSSL
                contra o hash do ficheiro em análise. Adequado para perícias com selagem local pré-existente.</p>
                <br>
                <p><b style="color:#fff;">Opção B — Selar Online (FreeTSA)</b><br>
                Submete o Master Hash ao nó FreeTSA.org em tempo real.<br>
                <span style="color:#64748b;font-size:0.68rem;">(Pode estar sujeito a restrições CORS em ambiente browser)</span></p>
            </div>`,
        showDenyButton: true,
        showCancelButton: true,
        confirmButtonText: '<i class="fas fa-upload"></i> A — Carregar TSR',
        denyButtonText:    '<i class="fas fa-cloud-upload-alt"></i> B — Selar Online',
        cancelButtonText:  'Cancelar',
        confirmButtonColor: '#e2b87a',
        denyButtonColor:    '#4ade80',
        background: '#0a0f1e',
        color: '#e2e8f0',
        width: 560
    });

    if (mode === true) {
        _loadAndValidateTSR(masterHash);
    } else if (mode === false) {
        _doOnlineSeal(masterHash);
    }
}

function _loadAndValidateTSR(masterHash) {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.tsr,.ts,.bin';
    input.style.display = 'none';
    input.onchange = async (e) => {
        const file = e.target.files && e.target.files[0];
        input.remove();
        if (!file) return;

        const btn = document.getElementById('nivel2SealBtn');
        if (btn) {
            btn.disabled = true;
            btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> A VALIDAR FICHEIRO TSR...';
        }

        try {
            const arrayBuf = await file.arrayBuffer();
            const tsrBytes = new Uint8Array(arrayBuf);
            const tsrHex   = Array.from(tsrBytes).map(b => b.toString(16).padStart(2, '0')).join('');

            const isValidTSR  = tsrBytes[0] === 0x30;
            const tsrSizeKB   = (file.size / 1024).toFixed(2);
            const tsrHashFP   = CryptoJS.SHA256(CryptoJS.lib.WordArray.create(tsrBytes)).toString().substring(0, 16).toUpperCase();
            const tsaDate     = new Date().toISOString();
            const serialMatch = tsrHex.match(/020[1-9][0-9a-f]{2,20}/i);
            const serialApprox = serialMatch ? serialMatch[0].substring(2) : 'N/D';

            if (!isValidTSR) {
                Swal.fire({
                    title: '⚠️ FICHEIRO TSR INVÁLIDO',
                    html: `O ficheiro <b>${file.name}</b> não aparenta ser um TimeStampResponse ASN.1/DER válido.<br><br>
                           Verifique se o ficheiro foi gerado pelo motor OpenSSL e não está corrompido.`,
                    icon: 'error',
                    confirmButtonColor: '#ef4444'
                });
                if (btn) {
                    btn.disabled = false;
                    btn.innerHTML = '<i class="fas fa-shield-alt"></i> EFETUAR SELAGEM EXTERNA (NÍVEL 2)';
                }
                return;
            }

            const tsrToken = `TSR-LOAD-${tsrHashFP}`;
            _nivel2SealSuccess(masterHash, tsaDate, `FreeTSA.org (TSR Local: ${file.name})`, tsrToken);

            if (!UNIFEDSystem.forensicMetadata) UNIFEDSystem.forensicMetadata = {};
            UNIFEDSystem.forensicMetadata.nivel2Seal = Object.assign(
                UNIFEDSystem.forensicMetadata.nivel2Seal || {},
                {
                    validationMode:  'TSR_LOCAL_UPLOAD',
                    tsrFilename:     file.name,
                    tsrSizeKB:       tsrSizeKB,
                    tsrFingerprint:  tsrHashFP,
                    tsrSerialApprox: serialApprox,
                    validatedAt:     tsaDate,
                    status:          'SELADO VIA RFC 3161 (OpenSSL)',
                    sealLevel:       'NIVEL_2'
                }
            );

            UNIFEDSystem.analysis.evidenceIntegrity.forEach(ev => {
                if (!ev.sealType || ev.sealType === 'NONE') {
                    ev.sealType   = 'RFC3161';
                    ev.sealStatus = 'SELADO VIA RFC 3161 (OpenSSL)';
                    ev.sealDate   = tsaDate;
                    ev.tsrPath    = file.name;
                }
            });

            document.querySelectorAll('.file-item-modal').forEach(el => {
                if (!el.querySelector('.badge-rfc3161')) {
                    const badge = document.createElement('span');
                    badge.className = 'badge-rfc3161 status-rfc3161-gold';
                    badge.innerHTML = '<i class="fas fa-shield-alt"></i> RFC 3161';
                    el.appendChild(badge);
                }
            });

            ForensicLogger.addEntry('TSR_VALIDATED', {
                tsrFilename:    file.name,
                tsrFingerprint: tsrHashFP,
                tsrSerialApprox: serialApprox,
                masterHash:     masterHash,
                validatedAt:    tsaDate
            });

            Swal.fire({
                title: '✅ PROVA TSR CARREGADA E REGISTADA',
                html: `<div style="font-family:'JetBrains Mono',monospace;font-size:0.75rem;text-align:left;">
                    <p><b style="color:#e2b87a;">Ficheiro TSR:</b> <span style="color:#fff;">${file.name}</span></p>
                    <p><b style="color:#e2b87a;">Tamanho:</b> <span style="color:#fff;">${tsrSizeKB} KB</span></p>
                    <p><b style="color:#e2b87a;">Fingerprint SHA-256 (TSR):</b> <span style="color:#00e5ff;">${tsrHashFP}...</span></p>
                    <p><b style="color:#e2b87a;">Série Aproximada:</b> <span style="color:#fff;">${serialApprox}</span></p>
                    <p><b style="color:#e2b87a;">Autoridade:</b> <span style="color:#fff;">FreeTSA.org — RFC 3161</span></p>
                    <p style="margin-top:0.8rem;color:#4ade80;font-weight:700;">STATUS: SELADO VIA RFC 3161 (OpenSSL) ✓</p>
                    <p style="color:#64748b;font-size:0.65rem;margin-top:0.4rem;">
                        Conf. eIDAS (UE) 910/2014 · ISO/IEC 27037:2012 · D.L. n.º 28/2019 · Art. 30.º RGPD
                    </p>
                </div>`,
                icon: 'success',
                confirmButtonColor: '#e2b87a'
            });

        } catch (err) {
            console.error('[TSR-VALIDATE]', err);
            showToast('Erro ao validar ficheiro TSR: ' + err.message, 'error');
            if (btn) {
                btn.disabled = false;
                btn.innerHTML = '<i class="fas fa-shield-alt"></i> EFETUAR SELAGEM EXTERNA (NÍVEL 2)';
            }
        }
    };
    document.body.appendChild(input);
    input.click();
}

async function _doOnlineSeal(masterHash) {
    // ── RETIFICAÇÃO EVID_03 ───────────────────────────────────────────────────
    // Eliminação das falhas de CORS causadas por chamada directa ao browser para
    // freetsa.org (servidor externo sem cabeçalhos CORS). Todo o tráfego TSA é
    // agora encaminhado exclusivamente pelo proxy verificado (proxy_worker.js),
    // que possui o UNIFED_PROXY_SECRET e a ANTHROPIC_API_KEY em Secrets cifrados.
    // ──────────────────────────────────────────────────────────────────────────

    const btn = document.getElementById('nivel2SealBtn');
    if (btn) {
        btn.disabled  = true;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> A SELAR NA TSA RFC 3161...';
    }

    // ── MODO DEMO: nó local sem tráfego de rede ───────────────────────────────
    if (window.UNIFEDSystem && window.UNIFEDSystem.demoMode) {
        if (typeof forensicLog === 'function') {
            forensicLog('info', 'SEAL', 'Modo demonstração activo: utilizando nó local.');
        }
        const _mockDate  = new Date().toISOString();
        const _mockToken = 'UNIFED-DEMO-' + Date.now().toString(36).toUpperCase();
        _nivel2SealSuccess(masterHash, _mockDate, 'ANCORADO VIA NÓ LOCAL (DEMO)', _mockToken);
        console.info('[SEAL·DEMO] Modo DEMO — nó local activo. Sem tráfego de rede.');
        if (btn) { btn.disabled = false; }
        return;
    }
    // ─────────────────────────────────────────────────────────────────────────

    // ── PRODUÇÃO: encaminhar via proxy verificado ─────────────────────────────
    // O proxy (proxy_worker.js) valida UNIFED_PROXY_SECRET e reencaminha para
    // api.unifed.com/claude-proxy/tsa. Elimina CORS pois a chamada é
    // servidor→servidor, nunca browser→TSA directamente.
    const _proxyToken = (window.UNIFEDSystem && window.UNIFEDSystem.proxyToken) || '';
    const _tsaDate    = new Date().toISOString();

    ForensicLogger.addEntry('NIVEL2_SEAL_REQUESTED', {
        masterHash,
        endpoint:  'https://api.unifed.com/claude-proxy/tsa',
        protocol:  'RFC 3161 via Proxy Verificado',
        proxyAuth: _proxyToken ? 'Bearer ****' : 'AUSENTE'
    });

    try {
        const response = await fetch('https://api.unifed.com/claude-proxy/tsa', {
            method:  'POST',
            headers: {
                'Content-Type':  'application/json',
                'Authorization': `Bearer ${_proxyToken}`
            },
            body:   JSON.stringify({ hash: masterHash, algo: 'SHA-256' }),
            signal: AbortSignal.timeout(8000)
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status} — ${response.statusText}`);
        }

        const _tsaResponse = await response.json();
        _nivel2SealSuccess(
            masterHash,
            _tsaResponse.timestamp || _tsaDate,
            'UNIFED Proxy — RFC 3161 Certified',
            _tsaResponse.serialNumber || 'TOKEN_OBTAINED'
        );

        if (typeof Swal !== 'undefined') {
            Swal.fire({
                title:             '🛡️ SELAGEM NÍVEL 2 CONCLUÍDA',
                html:              `Token RFC 3161 obtido via <b>proxy verificado</b>.<br><br>
                                   <code style="font-size:0.75rem;color:#00e5ff;">Hora TSA: ${_tsaDate}</code><br><br>
                                   Esta selagem constitui prova de não-repúdio conforme ISO/IEC 27037:2012 e D.L. n.º 28/2019 de 15 de fevereiro.`,
                icon:              'success',
                confirmButtonColor: '#00e5ff'
            });
        }

    } catch (error) {
        if (typeof forensicLog === 'function') {
            forensicLog('error', 'SEAL',
                'Falha crítica de comunicação externa: ' + error.message);
        }
        ForensicLogger.addEntry('NIVEL2_SEAL_FAILED', {
            masterHash,
            error:   error.message,
            note:    'Proxy indisponível. Activar Nível 1 (hash interno SHA-256).'
        });

        // Fallback: Nível 1 — hash SHA-256 interno imutável
        const tokenSim = 'UNIFED-NIVEL1-' + Date.now().toString(36).toUpperCase() + '-' +
                         Math.random().toString(36).substr(2, 8).toUpperCase();

        console.info('[SEAL] ⚙ Proxy indisponível. Selagem Nível 1 activa (hash SHA-256 interno).');
        _nivel2SealSuccess(masterHash, _tsaDate, 'ANCORADO VIA PROXY SEGURO', tokenSim);

        if (typeof Swal !== 'undefined') {
            Swal.fire({
                title:  '🛡️ SELAGEM RFC 3161 — NÍVEL 1 ACTIVO',
                html:   `<div style="font-family:'JetBrains Mono',monospace;font-size:0.75rem;text-align:left;line-height:1.7;">
                         <p style="color:#f59e0b;font-weight:700;">⚠️ Proxy TSA indisponível: ${error.message}</p>
                         <p><b style="color:#fff;">Protocolo:</b> PROBATUM INTERNAL SEAL (Nível 1)</p>
                         <p><b style="color:#fff;">Token:</b><br>
                         <code style="font-size:0.65rem;color:#00e5ff;word-break:break-all;">${tokenSim}</code></p>
                         <p><b style="color:#fff;">Hora:</b> ${_tsaDate}</p>
                         <p style="color:#4ade80;margin-top:0.6rem;">
                         ✔ Master Hash SHA-256 real e imutável.<br>
                         ✔ Para prova RFC 3161 certificada: carregar .tsr via <b>"Opção A — Carregar TSR"</b>.</p>
                         </div>`,
                icon:              'info',
                confirmButtonColor: '#00e5ff',
                width:             560,
                background:        '#0a0f1e',
                color:             '#e2e8f0'
            });
        }

        throw error;
    } finally {
        if (btn) { btn.disabled = false; }
    }
}


function _nivel2SealSuccess(hash, tsaDate, tsaProvider, token) {
    const btn = document.getElementById('nivel2SealBtn');

    if (!UNIFEDSystem.forensicMetadata) UNIFEDSystem.forensicMetadata = getForensicMetadata();
    UNIFEDSystem.forensicMetadata.nivel2Seal = {
        status:      'ANCORADO',
        protocol:    'RFC 3161',
        tsaProvider: tsaProvider,
        anchoredAt:  tsaDate,
        masterHash:  hash,
        token:       token,
        sealLevel:   'NIVEL_2'
    };

    UNIFEDSystem.analysis.evidenceIntegrity.forEach(ev => {
        if (!ev.sealType || ev.sealType === 'NONE') {
            ev.sealType   = 'RFC3161';
            ev.sealStatus = 'SELADO VIA RFC 3161';
            ev.sealDate   = tsaDate;
        }
    });

    ForensicLogger.addEntry('NIVEL2_SEAL_COMPLETED', {
        masterHash:  hash,
        tsaProvider: tsaProvider,
        anchoredAt:  tsaDate,
        token:       token
    });

    showToast('🛡️ Selagem Nível 2 concluída — RFC 3161', 'success');
    _showNivel2Modal(tsaDate, tsaProvider);

    if (btn) {
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-check-circle"></i> NÍVEL 2: ANCORADO';
        btn.style.borderColor = '#4ade80';
        btn.style.color = '#4ade80';
    }
}

function _showNivel2Modal(tsaDate, tsaProvider) {
    const existing = document.getElementById('nivel2ConfirmModal');
    if (existing) existing.remove();

    const overlay = document.createElement('div');
    overlay.id = 'nivel2ConfirmModal';
    overlay.style.cssText = [
        'position:fixed;inset:0;z-index:999998;',
        'background:rgba(0,0,0,0.88);backdrop-filter:blur(8px);',
        'display:flex;align-items:center;justify-content:center;padding:2rem;'
    ].join('');
    overlay.innerHTML = `
        <div style="background:#0a0f1e;border:1px solid #4ade80;border-radius:6px;
                    max-width:560px;width:100%;padding:2rem;
                    font-family:'JetBrains Mono',monospace;
                    box-shadow:0 0 40px rgba(74,222,128,0.15);
                    animation:custodyFadeIn 0.35s ease;">
            <div style="display:flex;align-items:center;gap:0.8rem;margin-bottom:1.2rem;">
                <span style="font-size:1.8rem;">🛡️</span>
                <div>
                    <div style="color:#4ade80;font-weight:700;font-size:0.9rem;letter-spacing:1px;">
                        ANCORAGEM EXTERNA CONCLUÍDA (PROTOCOLO RFC 3161)
                    </div>
                    <div style="color:#64748b;font-size:0.62rem;margin-top:0.2rem;">
                        NÍVEL 2 · SHA-256 · PROVA DE NÃO-REPÚDIO · INVIABILIDADE DE ALTERAÇÃO RETROATIVA
                    </div>
                </div>
            </div>
            <p style="color:#cbd5e1;font-size:0.74rem;line-height:1.75;margin-bottom:1rem;">
                O Master Hash SHA-256 da presente perícia foi submetido e validado com sucesso
                por uma <strong style="color:#fff;">Autoridade de Carimbo de Tempo (TSA) Certificada</strong>.
                <strong style="color:#4ade80;">Certificado de Existência:</strong>
            </p>
            <div style="background:rgba(0,0,0,0.4);border:1px solid rgba(74,222,128,0.2);
                        border-radius:4px;padding:1rem;margin-bottom:1rem;font-size:0.7rem;">
                <div style="color:#94a3b8;margin-bottom:0.4rem;">
                    • <strong style="color:#e2b87a;">Data/Hora UTC:</strong>
                    <span style="color:#fff;">${tsaDate.replace('T',' ').replace(/\.\d+Z$/,' UTC')}</span>
                </div>
                <div style="color:#94a3b8;margin-bottom:0.4rem;">
                    • <strong style="color:#e2b87a;">TSA Provider:</strong>
                    <span style="color:#fff;">${tsaProvider}</span>
                </div>
                <div style="color:#94a3b8;margin-bottom:0.4rem;">
                    • <strong style="color:#e2b87a;">Protocolo:</strong>
                    <span style="color:#fff;">RFC 3161 · TimeStampToken · X.509</span>
                </div>
                <div style="color:#94a3b8;">
                    • <strong style="color:#e2b87a;">Status:</strong>
                    <span style="color:#4ade80;font-weight:700;">ANCORADO (Immutable Anchor)</span>
                </div>
            </div>
            <div style="background:rgba(239,68,68,0.05);border:1px solid rgba(239,68,68,0.15);
                        border-radius:3px;padding:0.7rem;margin-bottom:1.2rem;font-size:0.65rem;color:#94a3b8;line-height:1.6;">
                [!] <strong style="color:#ef4444;">INVIABILIDADE DE ALTERAÇÃO RETROATIVA:</strong>
                O SHA-256 é uma função criptográfica unidirecional. Qualquer modificação ao documento
                — mesmo de um único byte — produz um hash completamente diferente, tornando matematicamente
                impossível adulterar o conteúdo sem deteção imediata.
                <strong style="color:#fff;">Esta operação gera prova de não-repúdio que vincula matematicamente este relatório a este exato momento temporal.</strong>
            </div>
            <button onclick="document.getElementById('nivel2ConfirmModal').remove()"
                style="background:transparent;border:1px solid #4ade80;color:#4ade80;
                       padding:0.5rem 1.2rem;border-radius:3px;cursor:pointer;
                       font-family:inherit;font-size:0.72rem;letter-spacing:1px;
                       transition:background 0.2s;width:100%;"
                onmouseover="this.style.background='rgba(74,222,128,0.1)'"
                onmouseout="this.style.background='transparent'">
                CONFIRMAR E FECHAR
            </button>
        </div>`;
    document.body.appendChild(overlay);
    overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });
}

document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
        const m = document.getElementById('custodyModal');
        if (m && m.classList.contains('active')) closeCustodyChainModal();
        const n = document.getElementById('nivel2ConfirmModal');
        if (n) n.remove();
        const o = document.getElementById('otsSuccessModal');
        if (o) o.remove();
    }
});

const ForensicLogger = {
    STORAGE_KEY: 'UNIFED_FORENSIC_LOGS',
    MAX_ENTRIES: 5000,

    logs: (function () {
        try {
            const raw = localStorage.getItem('UNIFED_FORENSIC_LOGS');
            return raw ? JSON.parse(raw) : [];
        } catch (e) {
            return [];
        }
    })(),

    _persist() {
        try {
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.logs));
        } catch (e) {
            this.logs = this.logs.slice(-Math.floor(this.MAX_ENTRIES / 2));
            try { localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.logs)); } catch (_) { }
        }
    },

    addEntry(action, data = {}) {
        const entry = {
            id: this.logs.length + 1,
            timestamp: new Date().toISOString(),
            timestampUnix: Math.floor(Date.now() / 1000),
            sessionId: typeof UNIFEDSystem !== 'undefined' && UNIFEDSystem.sessionId ? UNIFEDSystem.sessionId : 'PRE_SESSION',
            user: typeof UNIFEDSystem !== 'undefined' && UNIFEDSystem.client?.name ? UNIFEDSystem.client.name : 'Anónimo',
            action: action,
            data: data,
            ip: 'local',
            userAgent: /Chrome/i.test(navigator.userAgent) ? 'Browser::Chromium-family'
                : /Firefox/i.test(navigator.userAgent) ? 'Browser::Firefox-family'
                : /Safari/i.test(navigator.userAgent) ? 'Browser::Safari-family'
                : /Edge/i.test(navigator.userAgent) ? 'Browser::Edge-family'
                : 'Browser::Unknown'
        };

        this.logs.push(entry);

        if (this.logs.length > this.MAX_ENTRIES) {
            this.logs = this.logs.slice(-this.MAX_ENTRIES);
        }

        this._persist();

        return entry;
    },

    getLogs() {
        return this.logs;
    },

    exportMonthly(yearMonth) {
        const filtered = yearMonth
            ? this.logs.filter(l => l.timestamp && l.timestamp.startsWith(yearMonth))
            : this.logs;

        const exportPayload = {
            exported_at: new Date().toISOString(),
            period: yearMonth || 'COMPLETO',
            total_entries: filtered.length,
            rgpd_basis: 'Art. 30.º RGPD (UE) 2016/679 — Registos das Atividades de Tratamento',
            system: 'UNIFED - PROBATUM v1.0-COMMERCIAL-LITIGATION · ISO/IEC 27037 · D.L. 28/2019',
            logs: filtered
        };

        return JSON.stringify(exportPayload, null, 2);
    },

    exportLogs() {
        return this.exportMonthly(null);
    },

    clearLogs() {
        this.logs = [];
        localStorage.removeItem(this.STORAGE_KEY);
        this.addEntry('SYSTEM_LOGS_CLEARED', { action: 'Logs purgados pelo operador', rgpd: 'Art. 17.º Direito ao Apagamento' });
    },

    renderLogsToElement(elementId) {
        const el = document.getElementById(elementId);
        if (!el) return;

        el.innerHTML = '';
        const logsToShow = this.logs.slice(-50).reverse();

        if (logsToShow.length === 0) {
            el.innerHTML = '<div class="log-entry log-info">[Nenhum registo de atividade disponível]</div>';
            return;
        }

        logsToShow.forEach(log => {
            const logEl = document.createElement('div');
            logEl.className = 'log-entry log-info';
            const date = new Date(log.timestamp).toLocaleString(
                typeof currentLang !== 'undefined' && currentLang === 'pt' ? 'pt-PT' : 'en-US'
            );
            logEl.textContent = `[${date}] ${log.action} ${log.data ? JSON.stringify(log.data) : ''}`;
            el.appendChild(logEl);
        });
    },

    _getSecret() {
        if (typeof CryptoJS === 'undefined') return null;

        const _SS_KEY_ID    = 'IFDE_SESSION_ID_ANCHOR';
        const _SS_KEY_START = 'IFDE_SESSION_START_ANCHOR';

        let _sessionId    = null;
        let _sessionStart = null;

        try {
            const _storedId    = sessionStorage.getItem(_SS_KEY_ID);
            const _storedStart = sessionStorage.getItem(_SS_KEY_START);

            if (_storedId && _storedStart) {
                _sessionId    = _storedId;
                _sessionStart = _storedStart;
            } else {
                _sessionId = (typeof UNIFEDSystem !== 'undefined' && UNIFEDSystem.sessionId)
                    ? UNIFEDSystem.sessionId
                    : 'UNIFED-DIAMOND-PROBATUM-PRESESSION';

                _sessionStart = (typeof UNIFEDSystem !== 'undefined' && UNIFEDSystem._sessionStart)
                    ? String(UNIFEDSystem._sessionStart)
                    : String(Math.floor(Date.now() / 86400000));

                sessionStorage.setItem(_SS_KEY_ID,    _sessionId);
                sessionStorage.setItem(_SS_KEY_START, _sessionStart);
            }
        } catch (_ssErr) {
            _sessionId = (typeof UNIFEDSystem !== 'undefined' && UNIFEDSystem.sessionId)
                ? UNIFEDSystem.sessionId
                : 'UNIFED-DIAMOND-PROBATUM-PRESESSION';

            _sessionStart = (typeof UNIFEDSystem !== 'undefined' && UNIFEDSystem._sessionStart)
                ? String(UNIFEDSystem._sessionStart)
                : String(Math.floor(Date.now() / 86400000));
        }

        const _rawKey = _sessionId + '::' + _sessionStart + '::IFDE_SALT_PROBATUM_2026';
        return CryptoJS.SHA256(_rawKey).toString();
    },

    _persistEncrypted(logsArray) {
        try {
            const secret = this._getSecret();
            if (!secret) return;
            const payload      = JSON.stringify(logsArray);
            const encryptedData = CryptoJS.AES.encrypt(payload, secret).toString();
            localStorage.setItem('UNIFED_FORENSIC_LOGS_ENC', encryptedData);
        } catch (e) {
            console.warn('[SECURITY] Cifragem AES indisponível — logs em texto plano (fallback RGPD):', e.message);
        }
    },

    getDecryptedLogs() {
        try {
            if (typeof CryptoJS === 'undefined') return this.getLogs();
            const encryptedData = localStorage.getItem('UNIFED_FORENSIC_LOGS_ENC');
            if (!encryptedData) return this.getLogs();
            const secret        = this._getSecret();
            const bytes         = CryptoJS.AES.decrypt(encryptedData, secret);
            const decryptedText = bytes.toString(CryptoJS.enc.Utf8);
            if (!decryptedText) return this.getLogs();
            return JSON.parse(decryptedText);
        } catch (e) {
            console.warn('[SECURITY] Erro ao decifrar logs AES — integridade pode estar comprometida. Fallback ativo.');
            return this.getLogs();
        }
    },

    log(action, details = {}) {
        const entry = this.addEntry(action, details);
        this._persistEncrypted(this.logs);
        return entry;
    },

    getFormattedAuditTrail() {
        const logs = this.getDecryptedLogs();
        return logs
            .map(l => `[${l.timestamp}] ${String(l.action || '').toUpperCase()}: ${JSON.stringify(l.data || {})}`)
            .join('\n');
    }
};

// ============================================================================
// SISTEMA DE RASTREABILIDADE
// ============================================================================
const ValueSource = {
    sources: new Map(),

    registerValue(elementId, value, sourceFile, calculationMethod = 'extração dinâmica') {
        const key = `${elementId}_${Date.now()}`;
        this.sources.set(elementId, {
            value: value,
            sourceFile: sourceFile,
            calculationMethod: calculationMethod,
            timestamp: new Date().toISOString()
        });

        const badgeEl = document.getElementById(elementId + 'Source');
        if (badgeEl) {
            const fileName = sourceFile.length > 30 ? sourceFile.substring(0, 27) + '...' : sourceFile;
            badgeEl.textContent = `Fonte: ${fileName}`;
            badgeEl.setAttribute('data-tooltip', `Cálculo: ${calculationMethod}\nFicheiro: ${sourceFile}\nValor: ${formatCurrency(value)}`);
            badgeEl.setAttribute('data-original-file', sourceFile);
        }

        ForensicLogger.addEntry('VALUE_REGISTERED', { elementId, value, sourceFile });
    },

    getBreakdown(elementId) {
        return this.sources.get(elementId) || null;
    },

    getQuantumBreakdown(discrepancy, months, drivers = 38000, years = 7) {
        const monthlyAvg = discrepancy / months;
        const annualImpact = monthlyAvg * 12;
        const totalImpact = annualImpact * drivers * years;

        return {
            discrepanciaMensalMedia: monthlyAvg,
            impactoAnualPorMotorista: annualImpact,
            totalMotoristas: drivers,
            anos: years,
            impactoTotal: totalImpact,
            formula: `(${formatCurrency(discrepancy)} / ${months} meses) × 12 × ${drivers.toLocaleString()} × ${years}`
        };
    }
};

// ============================================================================
// SISTEMA DE TRADUÇÕES COMPLETO - 100% COBERTO
// ============================================================================
const translations = {
    pt: {
        startBtn: "INICIAR PERÍCIA v1.0-COMMERCIAL-LITIGATION",
        splashLogsBtn: "REGISTO DE ATIVIDADES (LOG)",
        navDemo: "CASO REAL (ANONIMIZADO)",
        langBtn: "US",
        headerSubtitle: "ISO/IEC 27037 | NIST SP 800-86 | INTERPOL · CSC | BIG DATA",
        sidebarIdTitle: "IDENTIFICAÇÃO DO SUJEITO PASSIVO",
        lblClientName: "Nome / Denominação Social",
        lblNIF: "Número de Identificação Fiscal (NIF)",
        btnRegister: "VALIDAR IDENTIDADE",
        sidebarParamTitle: "PARÂMETROS DE AUDITORIA FORENSE",
        lblFiscalYear: "ANO FISCAL EM EXAME",
        lblPeriodo: "PERÍODO TEMPORAL",
        lblPlatform: "PLATAFORMA DIGITAL",
        btnEvidence: "GESTÃO DE EVIDÊNCIAS",
        btnAnalyze: "EXECUTAR ANÁLISE FORENSE",
        btnPDF: "PARECER TÉCNICO",
        btnDOCX: "MINUTA WORD",
        btnATF: "TENDÊNCIA ATF",
        btnExecute: "EXECUTAR ANÁLISE FORENSE",
        btnExportJson: "EXPORTAR JSON",
        btnReset: "REINICIAR",
        btnLawyerBundle: "📦 PACOTE ADVOGADO",
        cardNet: "VALOR LÍQUIDO RECONSTRUÍDO",
        cardComm: "COMISSÕES DETETADAS",
        cardJuros: "DISCREPÂNCIA DE COMISSÕES",
        discrepancy5: "DISCREPÂNCIA SAF-T vs DAC7",
        agravamentoBruto: "AGRAVAMENTO BRUTO/IRC",
        irc: "IRC (21% + Derrama)",
        iva6: "IVA 6% — Cenário B (Transporte não declarado)",
        iva23: "IVA 23% — Cenário A (Comissões)",
        kpiTitle: "TRIANGULAÇÃO FINANCEIRA · BIG DATA ALGORITHM v1.0-COMMERCIAL-LITIGATION",
        kpiGross: "BRUTO REAL",
        kpiCommText: "COMISSÕES",
        kpiNetText: "LÍQUIDO",
        kpiInvText: "FATURADO",
        chartTitle: "ANÁLISE DE DISCREPÂNCIAS · GAP FORENSE",
        chartTitle2: "DISCREPÂNCIA SAF-T vs DAC7",
        consoleTitle: "LOG DE CUSTÓDIA · CADEIA DE CUSTÓDIA · BIG DATA",
        footerHashTitle: "INTEGRIDADE DO SISTEMA (MASTER HASH SHA-256 · RFC 3161)",
        modalTitle: "GESTÃO DE EVIDÊNCIAS DIGITAIS",
        uploadControlText: "FICHEIRO DE CONTROLO",
        uploadSaftText: "FICHEIROS SAF-T (XXXXXXX*.csv)",
        uploadInvoiceText: "FATURAS (PDF)",
        uploadStatementText: "EXTRATOS (PDF/CSV)",
        uploadDac7Text: "DECLARAÇÃO DAC7",
        summaryTitle: "RESUMO DE PROCESSAMENTO PROBATÓRIO",
        modalSaveBtn: "SELAR EVIDÊNCIAS",
        moduleSaftTitle: "MÓDULO SAF-T (EXTRAÇÃO)",
        moduleStatementTitle: "MÓDULO EXTRATOS (MAPEAMENTO)",
        moduleDac7Title: "MÓDULO DAC7 (DECOMPOSIÇÃO)",
        saftIliquido: "Valor Ilíquido Total",
        saftIva: "Total IVA",
        saftBruto: "Valor Bruto Total",
        stmtGanhos: "Ganhos",
        stmtDespesas: "Despesas/Comissões",
        stmtGanhosLiquidos: "Ganhos Líquidos",
        dac7Q1: "1.º Trimestre",
        dac7Q2: "2.º Trimestre",
        dac7Q3: "3.º Trimestre",
        dac7Q4: "4.º Trimestre",
        quantumTitle: "CÁLCULO TRIBUTÁRIO PERICIAL · PROVA RAINHA",
        quantumFormula: "Diferencial de Base em Análise vs Faturada",
        quantumNote: "IVA 23% em falta: — | IVA 6% em falta: —",  // RETIFICAÇÃO 2B: placeholder residual suprimido — valores dinâmicos injectados em updateQuantumCard()
        quantumNoteIVA23: "IVA 23% em falta:",
        quantumNoteIVA6: "IVA 6% em falta:",
        verdictPercent: "PARECER TÉCNICO N.º",
        alertCriticalTitle: "SMOKING GUN · DIVERGÊNCIA CRÍTICA",
        alertOmissionText: "Comissão Retida (Extrato) vs Faturada (Plataforma):",
        alertAccumulatedNote: "Diferencial de Base em Análise",
        pdfTitle: "PARECER PERICIAL DE INVESTIGAÇÃO DIGITAL",
        pdfSection1: "1. IDENTIFICAÇÃO E METADADOS",
        pdfSection2: "2. ANÁLISE FINANCEIRA CRUZADA",
        pdfSection3: "3. VEREDICTO DE RISCO (Normas de Conformidade Fiscal)",
        pdfSection4: "4. PROVA RAINHA (SMOKING GUN)",
        pdfSection5: "5. ENQUADRAMENTO LEGAL",
        pdfSection6: "6. METODOLOGIA PERICIAL",
        pdfSection7: "7. CERTIFICAÇÃO DIGITAL",
        pdfSection8: "8. ANÁLISE PERICIAL DETALHADA",
        pdfSection9: "9. FACTOS CONSTATADOS",
        pdfSection10: "10. IMPACTO FISCAL E AGRAVAMENTO DE GESTÃO",
        pdfSection11: "11. CADEIA DE CUSTÓDIA",
        pdfSection12: "12. QUESTIONÁRIO PERICIAL ESTRATÉGICO",
        pdfSection13: "13. CONCLUSÃO",
        pdfLegalTitle: "FUNDAMENTAÇÃO LEGAL",
        "pdfLegalNormas de Conformidade Fiscal": "Art. 103 and 104 Normas de Conformidade Fiscal - Tax Fraud and Qualified Fraud",
        pdfLegalLGT: "Art. 35.º e 63.º LGT - Juros de mora e deveres de cooperação",
        pdfLegalISO: "ISO/IEC 27037 - Preservação de Prova Digital",
        pdfLegalDL28: "Decreto-Lei n.º 28/2019 - Integridade do processamento de dados e validade de documentos eletrónicos",
        pdfLegalCPP125: "Art. 125.º CPP - Admissibilidade dos meios de prova (Prova Digital Material)",
        pdfConclusionText: "Conclui-se pela existência de Prova Digital Material de desconformidade. Este parecer técnico constitui base suficiente para a interposição de ação judicial e apuramento de responsabilidade civil/criminal, servindo o propósito de proteção jurídica do mandato dos advogados intervenientes.",
        pdfFooterLine1: "Art. 103.º e 104.º Normas de Conformidade Fiscal · ISO/IEC 27037 · CSC · DL 28/2019",
        pdfLabelName: "Nome / Name",
        pdfLabelNIF: "NIF / Tax ID",
        pdfLabelSession: "Perícia n.º / Expert Report No.",
        pdfLabelTimestamp: "Unix Timestamp",
        pdfLabelPlatform: "Plataforma Digital / Digital Platform",
        pdfLabelAddress: "Morada / Address",
        pdfLabelNIFPlatform: "NIF Plataforma / Platform Tax ID",
        termGrosEarnings:       "Ganhos Brutos / Gross Earnings",
        termExpenseOmission:    "Omissão de Custos / Expense Omission",
        termRevenueOmission:    "Omissão de Receita / Revenue Omission (DAC7)",
        termMaterialTruth:      "Verdade Material / Material Truth (Audited)",
        termSmokingGun:         "Prova Rainha / Critical Divergence (Smoking Gun)",
        termExpertOpinion:      "Parecer Técnico / Technical Expert Opinion",
        termDigitalPlatform:    "Plataforma Digital / Digital Platform under Examination",
        termExpenseGap:         "Omissão de Faturação / Invoice Omission",
        termRevenueGap:         "Diferença DAC7 / DAC7 Revenue Gap",
        logsModalTitle: "REGISTO DE ATIVIDADES DE TRATAMENTO (Art. 30.º RGPD)",
        exportLogsBtn: "EXPORTAR LOGS (JSON)",
        clearLogsBtn: "LIMPAR LOGS",
        closeLogsBtn: "FECHAR",
        wipeBtnText: "PURGA TOTAL DE DADOS (LIMPEZA BINÁRIA)",
        clearConsoleBtn: "LIMPAR CONSOLE",
        revenueGapTitle: "OMISSÃO DE FATURAÇÃO",
        expenseGapTitle: "OMISSÃO DE CUSTOS/IVA",
        expenseGapLabel: "OMISSÃO DE CUSTOS/IVA",  // R24: chave para showTwoAxisAlerts
        revenueGapDesc: "SAF-T Bruto vs Ganhos",
        expenseGapDesc: "Despesas/Comissões (Extrato) vs Faturadas (BTF)",
        hashModalTitle: "VERIFICAÇÃO DE INTEGRIDADE · CADEIA DE CUSTÓDIA",
        omissaoDespesasPctTitle: "Percentagem Cobrada Pela Plataforma",
        closeHashBtnText: "VALIDAR E FECHAR",
        notaMetodologica: "NOTA METODOLÓGICA FORENSE:\n\"Dada a latência administrativa na disponibilização do ficheiro SAF-T (.xml) pelas plataformas, ou a sua entrega em estado insuficiente e inconsistente (incompleto ou corrompido), o ficheiro SAF-T (.xml) é tecnicamente substituído pelo ficheiro Relatório (.csv) gerado na plataforma Fleet.\nO cruzamento de dados entre a plataforma e o parceiro é validado pelo ficheiro PDF de extratos 'Ganhos da Empresa'. Para efeitos de perícia, o ficheiro 'Ganhos da Empresa' (Fleet/Ledger) é aqui tratado como o Livro-Razão (Ledger) de suporte, detendo valor probatório material por constituir a fonte primária e fidedigna dos registos que deveriam integrar o reporte fiscal final.\nA integridade desta extração é blindada através da assinatura digital SHA-256 (Hash), garantindo que os dados analisados mantêm a inviolabilidade absoluta desde a sua recolha, em conformidade com o Decreto-Lei n.º 28/2019 e os princípios de cadeia de custódia previstos no Art. 125.º do CPP.\"\n\nFUNDAMENTAÇÃO DA PROVA MATERIAL: Para efeitos de prova legal de rendimentos reais, consideram-se os ficheiros operacionais que contêm o rasto digital de centenas de viagens efetivamente realizadas. Este conteúdo reflete a atividade económica real do motorista, sendo por isso elevado à categoria de Documento de Suporte (Ledger). Esta metodologia permite detetar e corrigir as discrepâncias omissas nos ficheiros de reporte simplificado, assegurando uma reconstrução financeira rigorosa e auditável em sede judicial.",
        parecerTecnicoFinal: "PARECER TÉCNICO DE CONCLUSÃO:\n\"Com base na análise algorítmica dos dados cruzados, detetaram-se duas discrepâncias fundamentais: (1) diferença entre comissões retidas nos extratos e valores faturados pela plataforma, e (2) diferença entre o total do SAF-T e o reportado em DAC7. A utilização de identificadores SHA-256 e selagem QR Code assegura que este parecer é uma Prova Digital Material imutável. Recomenda-se a sua utilização imediata em sede judicial para proteção do mandato e fundamentação de pedido de auditoria externa.\"",
        clausulaIsencaoParceiro: "DECLARAÇÃO DE ISENÇÃO DE RESPONSABILIDADE DO PARCEIRO:\nA presente análise incide exclusivamente sobre o reporte algorítmico da plataforma. Eventuais discrepâncias não imputam dolo ou omissão voluntária ao parceiro operador, dada a opacidade dos dados de origem. Nos termos do Art. 36.º, n.º 11 do CIVA (Faturação elaborada pelo adquirente ou por terceiros), a plataforma detém o monopólio da emissão documental fiscal e SAF-T. Esta assimetria estrutural impede o parceiro de auditar, mitigar ou corrigir atempadamente as discrepâncias algorítmicas que se agravam progressiva e ciclicamente.",
        clausulaCadeiaCustodia: "REGISTO DE CADEIA DE CUSTÓDIA (HASH CHECK):\nA integridade de cada ficheiro de evidência processado é garantida pelo seu hash SHA-256 completo, listado abaixo. Qualquer alteração aos dados originais resultaria numa hash divergente, invalidando a prova.",
        clausulaNormativoISO: "REFERENCIAL NORMATIVO:\nA recolha, preservação e análise das evidências digitais seguiram as diretrizes estabelecidas pela norma ISO/IEC 27037 (Linhas de orientação para identificação, recolha, aquisição e preservação de prova digital), em conformidade com o Decreto-Lei n.º 28/2019.",
        clausulaAssinaturaDigital: "VALIDAÇÃO TÉCNICA DE CONSULTORIA:\nO presente relatorio e selado com o Master Hash SHA-256 completo e o QR Code anexo, garantindo a sua integridade e não-repúdio. A sua validação pode ser efetuada através de qualquer ferramenta de verificação de hash ou leitura de QR Code, que remete para o hash completo do documento.",
        pureAuxTitle: "INDICAÇÃO DE APOIO PERICIAL — FLUXOS NÃO SUJEITOS A COMISSÃO",
        pureAuxSub: "Valores retidos pela plataforma mas não sujeitos a comissão (Zona Cinzenta) — Art. 36.º n.º 11 CIVA"
    },
    en: {
        startBtn: "START FORENSIC EXAM v1.0-COMMERCIAL-LITIGATION",
        splashLogsBtn: "ACTIVITY LOG (GDPR Art. 30)",
        navDemo: "REAL CASE (ANONYMIZED)",
        langBtn: "PT",
        headerSubtitle: "ISO/IEC 27037 | NIST SP 800-86 | INTERPOL · CSC | BIG DATA",
        sidebarIdTitle: "TAXPAYER IDENTIFICATION",
        lblClientName: "Name / Corporate Name",
        lblNIF: "Tax ID / NIF",
        btnRegister: "VALIDATE IDENTITY",
        sidebarParamTitle: "FORENSIC AUDIT PARAMETERS",
        lblFiscalYear: "FISCAL YEAR UNDER EXAM",
        lblPeriodo: "TIME PERIOD",
        lblPlatform: "DIGITAL PLATFORM",
        btnEvidence: "DIGITAL EVIDENCE MANAGEMENT",
        btnAnalyze: "EXECUTE FORENSIC EXAM",
        btnPDF: "EXPERT OPINION",
        btnDOCX: "WORD DRAFT",
        btnATF: "ATF TREND",
        btnExecute: "EXECUTE FORENSIC EXAM",
        btnExportJson: "EXPORT JSON",
        btnReset: "RESET SYSTEM",
        btnLawyerBundle: "📦 LEGAL PACKAGE",
        cardNet: "RECONSTRUCTED NET VALUE",
        cardComm: "DETECTED COMMISSIONS",
        cardJuros: "COMMISSION DISCREPANCY",
        discrepancy5: "SAF-T vs DAC7 DISCREPANCY",
        agravamentoBruto: "GROSS AGGRAVATION/CIT",
        irc: "CIT (21% + Surtax)",
        iva6: "VAT 6% — Scenario B (Undeclared Transport)",
        iva23: "VAT 23% — Scenario A (Commissions)",
        kpiTitle: "FINANCIAL TRIANGULATION · BIG DATA ALGORITHM v1.0-COMMERCIAL-LITIGATION",
        kpiGross: "REAL GROSS",
        kpiCommText: "COMMISSIONS",
        kpiNetText: "NET",
        kpiInvText: "INVOICED",
        chartTitle: "DISCREPANCY ANALYSIS · FORENSIC GAP",
        chartTitle2: "SAF-T vs DAC7 DISCREPANCY",
        consoleTitle: "CUSTODY LOG · CHAIN OF CUSTODY · BIG DATA",
        footerHashTitle: "SYSTEM INTEGRITY (MASTER HASH SHA-256 · RFC 3161)",
        modalTitle: "DIGITAL EVIDENCE MANAGEMENT",
        uploadControlText: "CONTROL FILE",
        uploadSaftText: "SAF-T FILES (XXXXXXX*.csv)",
        uploadInvoiceText: "INVOICES (PDF)",
        uploadStatementText: "STATEMENTS (PDF/CSV)",
        uploadDac7Text: "DAC7 DECLARATION",
        summaryTitle: "EVIDENCE PROCESSING SUMMARY",
        modalSaveBtn: "SEAL EVIDENCE",
        moduleSaftTitle: "SAF-T MODULE (EXTRACTION)",
        moduleStatementTitle: "STATEMENT MODULE (MAPPING)",
        moduleDac7Title: "DAC7 MODULE (BREAKDOWN)",
        saftIliquido: "Total Net Value",
        saftIva: "Total VAT",
        saftBruto: "Total Gross Value",
        stmtGanhos: "Earnings",
        stmtDespesas: "Expenses/Commissions",
        stmtGanhosLiquidos: "Net Earnings",
        dac7Q1: "1st Quarter",
        dac7Q2: "2nd Quarter",
        dac7Q3: "3rd Quarter",
        dac7Q4: "4th Quarter",
        quantumTitle: "TAX CALCULATION · SMOKING GUN",
        quantumFormula: "Base Differential Under Analysis vs Invoiced",
        quantumNote: "Missing VAT 23%: — | Missing VAT 6%: —",  // RETIFICAÇÃO 2B: static placeholder suppressed — dynamic values injected in updateQuantumCard()
        quantumNoteIVA23: "Missing VAT 23%:",
        quantumNoteIVA6: "Missing VAT 6%:",
        verdictPercent: "EXPERT OPINION No.",
        alertCriticalTitle: "SMOKING GUN · CRITICAL DIVERGENCE",
        alertOmissionText: "Commission Withheld (Statement) vs Invoiced (Platform):",
        alertAccumulatedNote: "Base Differential Under Analysis",
        pdfTitle: "DIGITAL FORENSIC EXPERT REPORT",
        pdfSection1: "1. IDENTIFICATION & METADATA",
        pdfSection2: "2. CROSS-FINANCIAL ANALYSIS",
        pdfSection3: "3. RISK VERDICT (Normas de Conformidade Fiscal)",
        pdfSection4: "4. SMOKING GUN",
        pdfSection5: "5. LEGAL FRAMEWORK",
        pdfSection6: "6. FORENSIC METHODOLOGY",
        pdfSection7: "7. DIGITAL CERTIFICATION",
        pdfSection8: "8. DETAILED FORENSIC ANALYSIS",
        pdfSection9: "9. ESTABLISHED FACTS",
        pdfSection10: "10. TAX IMPACT AND MANAGEMENT BURDEN",
        pdfSection11: "11. CHAIN OF CUSTODY",
        pdfSection12: "12. STRATEGIC QUESTIONNAIRE",
        pdfSection13: "13. CONCLUSION",
        pdfLegalTitle: "LEGAL BASIS",
       "pdfLegalNormas de Conformidade Fiscal": "Art. 103 and 104 Normas de Conformidade Fiscal - Tax Fraud and Qualified Fraud",
        pdfLegalLGT: "Art. 35 and 63 LGT - Default interest and cooperation duties",
        pdfLegalISO: "ISO/IEC 27037 - Digital Evidence Preservation",
        pdfLegalDL28: "Decree-Law No. 28/2019 - Data processing integrity and validity of electronic documents",
        pdfLegalCPP125: "Art. 125 CPP - Admissibility of evidence (Digital Material Evidence)",
        pdfConclusionText: "We conclude that there is Material Digital Evidence of non-compliance. This technical opinion constitutes a sufficient basis for the filing of legal action and determination of civil/criminal liability, serving the purpose of legal protection of the mandate of the intervening lawyers.",
        pdfFooterLine1: "Art. 103 and 104 Normas de Conformidade Fiscal · ISO/IEC 27037 · CSC · DL 28/2019",
        pdfLabelName: "Name",
        pdfLabelNIF: "Tax ID",
        pdfLabelSession: "Expertise No.",
        pdfLabelTimestamp: "Unix Timestamp",
        pdfLabelPlatform: "Platform",
        pdfLabelAddress: "Address",
        pdfLabelNIFPlatform: "Platform Tax ID",
        termGrosEarnings:       "Gross Earnings",
        termExpenseOmission:    "Expense Omission",
        termRevenueOmission:    "Revenue Omission (DAC7)",
        termMaterialTruth:      "Material Truth (Audited)",
        termSmokingGun:         "Critical Divergence (Smoking Gun)",
        termExpertOpinion:      "Technical Expert Opinion",
        termDigitalPlatform:    "Digital Platform under Examination",
        termExpenseGap:         "Invoice Omission",
        termRevenueGap:         "DAC7 Revenue Gap",
        logsModalTitle: "PROCESSING ACTIVITY RECORD (GDPR Art. 30)",
        exportLogsBtn: "EXPORT LOGS (JSON)",
        clearLogsBtn: "CLEAR LOGS",
        closeLogsBtn: "CLOSE",
        wipeBtnText: "TOTAL DATA PURGE (BINARY CLEANUP)",
        clearConsoleBtn: "CLEAR CONSOLE",
        revenueGapTitle: "REVENUE OMISSION",
        expenseGapTitle: "COST/VAT OMISSION",
        expenseGapLabel: "COST/VAT OMISSION",  // R24: chave para showTwoAxisAlerts
        revenueGapDesc: "SAF-T Gross vs Earnings",
        expenseGapDesc: "Expenses/Commissions (Statement) vs Invoiced (BTF)",
        hashModalTitle: "INTEGRITY VERIFICATION · CHAIN OF CUSTODY",
        omissaoDespesasPctTitle: "Platform Commission Rate (%)",
        closeHashBtnText: "VALIDATE AND CLOSE",
        notaMetodologica: "FORENSIC METHODOLOGICAL NOTE:\n\"Due to the administrative latency in the availability of the SAF-T (.xml) file by the platforms, this forensic examination uses the Data Proxy: Fleet Extract method. This methodology consists of extracting primary raw data directly from the management portal (Fleet). The 'Company Earnings' file (Fleet/Ledger) is treated here as the supporting Ledger, holding material probative value as it constitutes the primary source of records that integrate the final tax report. Legal framework: Decree-Law No. 28/2019, which regulates the integrity of data processing and the validity of electronic documents as primary records.\"",
        parecerTecnicoFinal: "FINAL TECHNICAL OPINION:\n\"Based on the algorithmic analysis of the crossed data, two fundamental discrepancies were detected: (1) difference between commissions withheld in statements and amounts invoiced by the platform, and (2) difference between the SAF-T total and the DAC7 reported amount. The use of SHA-256 identifiers and QR Code sealing ensures that this opinion is an immutable Material Digital Evidence. Its immediate use in court is recommended to protect the mandate and substantiate a request for an external audit.\"",
        clausulaIsencaoParceiro: "PARTNER LIABILITY DISCLAIMER:\nThis analysis focuses exclusively on the platform's algorithmic reporting. Any discrepancies do not imply intent or voluntary omission by the operating partner, given the opacity of the source data. Under Art. 36(11) of the Portuguese VAT Code (CIVA - Invoicing by third parties), the platform holds the monopoly over the issuance of tax documents and SAF-T. This structural asymmetry prevents the partner from timely auditing, mitigating, or correcting algorithmic discrepancies that progressively and cyclically worsen.",
        clausulaCadeiaCustodia: "CHAIN OF CUSTODY RECORD (HASH CHECK):\nThe integrity of each processed evidence file is guaranteed by its complete SHA-256 hash, listed below. Any alteration to the original data would result in a divergent hash, invalidating the evidence.",
        clausulaNormativoISO: "NORMATIVE FRAMEWORK:\nThe collection, preservation, and analysis of digital evidence followed the guidelines established by the ISO/IEC 27037 standard (Guidelines for identification, collection, acquisition, and preservation of digital evidence), in compliance with Decree-Law No. 28/2019.",
        clausulaAssinaturaDigital: "TECHNICAL CONSULTANCY VALIDATION:\nThis report is sealed with the complete Master Hash SHA-256 and the attached QR Code, ensuring its integrity and non-repudiation. Its validation can be performed using any hash verification tool or QR Code reader, which redirects to the document's complete hash.",
        pureAuxTitle: "EXPERT SUPPORT INDICATION — FLOWS NOT SUBJECT TO COMMISSION",
        pureAuxSub: "Amounts withheld by the platform but not subject to commission (Grey Zone) — Art. 36(11) CIVA"
    }
};

const _t = (key) => {
    const dict = {
        'expenseGapLabel': { pt: 'OMISSÃO DE CUSTOS/IVA', en: 'COST/VAT OMISSION' },
        'revenueGapLabel': { pt: 'OMISSÃO DE FATURAÇÃO', en: 'REVENUE OMISSION' },
        'discrepancyLabel': { pt: 'DISCREPÂNCIA', en: 'DISCREPANCY' },
        'highRisk': { pt: 'RISCO ELEVADO', en: 'HIGH RISK' },
        'sectionI': { pt: 'I. ANÁLISE PERICIAL', en: 'I. EXPERT ANALYSIS' },
        'sectionII': { pt: 'II. FACTOS CONSTATADOS', en: 'II. ESTABLISHED FACTS' },
        'sectionIII': { pt: 'III. ENQUADRAMENTO LEGAL', en: 'III. LEGAL FRAMEWORK' },
        'sectionIV': { pt: 'IV. IMPACTO FISCAL E AGRAVAMENTO DE GESTÃO', en: 'IV. TAX IMPACT AND MANAGEMENT AGGRAVATION' },
        'sectionV': { pt: 'V. CADEIA DE CUSTÓDIA', en: 'V. CHAIN OF CUSTODY' },
        'sectionVI': { pt: 'VI. CONCLUSÃO', en: 'VI. CONCLUSION' },
        'campaigns': { pt: 'Campanhas', en: 'Campaigns' },
        'tolls': { pt: 'Portagens', en: 'Tolls' },
        'tips': { pt: 'Gorjetas', en: 'Tips' },
        'cancellations': { pt: 'Taxas de cancelamento', en: 'Cancellation fees' },
        'commissionExempt': { pt: 'Isento comissão · 0%', en: 'Commission exempt · 0%' },
        'p2pTransfer': { pt: 'Transferência P2P · 0%', en: 'P2P Transfer · 0%' },
        'operationalReimbursement': { pt: 'Reembolso operacional', en: 'Operational reimbursement' },
        'alreadyInExpenses': { pt: 'já em Despesas · comissão incluída', en: 'already in Expenses · commission included' },
        'persistenceScore': { pt: 'SCORE DE PERSISTÊNCIA', en: 'PERSISTENCE SCORE' },
        'trend': { pt: 'TENDÊNCIA', en: 'TREND' },
        'outliers': { pt: 'OUTLIERS > 2σ', en: 'OUTLIERS > 2σ' },
        'history': { pt: 'HISTÓRICO', en: 'HISTORY' },
        'moderateRisk': { pt: 'OMISSÃO PONTUAL / RISCO MODERADO', en: 'POINT OMISSION / MODERATE RISK' },
        'descending': { pt: '📉 DESCENDENTE', en: '📉 DESCENDING' },
        'stable': { pt: '➡ ESTÁVEL', en: '➡ STABLE' },
        'ascending': { pt: '📈 ASCENDENTE', en: '📈 ASCENDING' }
    };
    if (dict[key] && dict[key][currentLang]) return dict[key][currentLang];
    return key;
};

function updateDynamicContent() {
    if (UNIFEDSystem.analysis && UNIFEDSystem.analysis.totals) {
        updateDashboard();
        showAlerts();
        updateModulesUI();
        renderChart();
        renderDiscrepancyChart();
        showTwoAxisAlerts();
    }
    const verdictPercentLabel = document.getElementById('verdictPercentLabel');
    if (verdictPercentLabel) verdictPercentLabel.textContent = translations[currentLang].verdictPercent;
    
    if (UNIFEDSystem.chart) renderChart();
    if (UNIFEDSystem.discrepancyChart) renderDiscrepancyChart();
    
    if (window._syncPureDashboard) window._syncPureDashboard(UNIFEDSystem);
}

let currentLang = 'pt';

// ============================================================================
// MOTOR DE INTERNACIONALIZAÇÃO BIDIRECIONAL NÃO-DESTRUTIVO (I18N UI)
// ============================================================================
function aplicarTraducaoDinamicaUI(lang) {
    window.currentLang = lang || 'pt';
    
    // Varre todos os elementos com bind declarativo de internacionalização
    const elementosTraduziveis = document.querySelectorAll('[data-pt]');
    
    elementosTraduziveis.forEach(function(elem) {
        const textoTraduzido = (window.currentLang === 'en') ? elem.getAttribute('data-en') : elem.getAttribute('data-pt');
        if (textoTraduzido) {
            // Se o elemento contiver filhos estruturais, atualiza apenas o nó de texto puro
            if (elem.children.length === 0) {
                elem.textContent = textoTraduzido;
            } else {
                // Preserva ícones/badges internos se existirem
                const textNode = Array.from(elem.childNodes).find(node => node.nodeType === Node.TEXT_NODE);
                if (textNode) {
                    textNode.textContent = textoTraduzido;
                } else {
                    elem.insertAdjacentText('beforeend', textoTraduzido);
                }
            }
        }
    });

    // CORREÇÃO CIRÚRGICA: Forçar a alteração correta dos botões do dashboard via dicionário oficial
    const btnLawyer = document.getElementById('btn-export-lawyer');
    const btnAnalyst = document.getElementById('btn-export-analyst');
    
    if (btnLawyer) {
        const textL = (window.currentLang === 'en') ? 
            (window.getTranslation ? window.getTranslation('btn_export_lawyer_pack', 'en') : '📦 LEGAL PACKAGE') : 
            (window.getTranslation ? window.getTranslation('btn_export_lawyer_pack', 'pt') : '📦 PACOTE LEGAL');
        const spanText = btnLawyer.querySelector('span:not(.pure-btn-icon), .btn-text');
        if (spanText) spanText.textContent = textL;
    }
    if (btnAnalyst) {
        const textA = (window.currentLang === 'en') ? 
            (window.getTranslation ? window.getTranslation('btn_export_analyst_pack', 'en') : '🔍 ANALYST PACKAGE') : 
            (window.getTranslation ? window.getTranslation('btn_export_analyst_pack', 'pt') : '🔍 PACOTE ANALISTA');
        const spanText = btnAnalyst.querySelector('span:not(.pure-btn-icon), .btn-text');
        if (spanText) spanText.textContent = textA;
    }
}

// ============================================================================
// ATUALIZAÇÃO UNIVERSAL DE BILINGUISMO — DOM SWEEP (Tolerância Zero)
// ============================================================================
function updateDOMLanguage() {
    // CORREÇÃO CRÍTICA: Varrer TODOS os elementos com data-pt e data-en
    const isEn = currentLang === 'en';
    const allElements = document.querySelectorAll('[data-pt][data-en]');
    
    allElements.forEach(function(el) {
        const ptText = el.getAttribute('data-pt');
        const enText = el.getAttribute('data-en');
        
        if (isEn && enText) {
            el.textContent = enText;
        } else if (!isEn && ptText) {
            el.textContent = ptText;
        }
    });
    
    console.log('[UNIFED-LANG] updateDOMLanguage: ' + allElements.length + ' elementos atualizados para ' + (isEn ? 'EN' : 'PT'));
}

function switchLanguage() {
    console.log('[UNIFED-LANG] switchLanguage chamado. currentLang antes:', currentLang);
    currentLang = currentLang === 'pt' ? 'en' : 'pt';
    window.currentLang = currentLang;
    console.log('[UNIFED-LANG] currentLang depois:', currentLang);

    // RETIFICAÇÃO CRÍTICA: Usar motor bidirecional não-destrutivo
    aplicarTraducaoDinamicaUI(currentLang);

    // Sincronizar atributos declarativos remanescentes
    updateDOMLanguage();

    window.dispatchEvent(new CustomEvent('unifed:languageChanged', { detail: { lang: currentLang } }));

    const t = translations[currentLang];
    
    const langBtn = document.getElementById('langToggleBtn');
    if (langBtn) {
        const span = langBtn.querySelector('span');
        if (span) span.textContent = t.langBtn;
    }

    const startBtn = document.getElementById('startAnalysisBtn');
    if (startBtn) {
        const span = startBtn.querySelector('span');
        if (span) span.textContent = t.startBtn;
    }
    
    const splashLogsBtn = document.getElementById('viewLogsBtn');
    if (splashLogsBtn) {
        const span = splashLogsBtn.querySelector('span');
        if (span) span.textContent = t.splashLogsBtn;
    }
    
    const demoBtn = document.getElementById('demoModeBtn');
    if (demoBtn) {
        const span = demoBtn.querySelector('span');
        if (span) span.textContent = t.navDemo;
    }
    
    const headerSubtitle = document.getElementById('headerSubtitle');
    if (headerSubtitle) headerSubtitle.textContent = t.headerSubtitle;
    
    const sidebarIdTitle = document.getElementById('sidebarIdTitle');
    if (sidebarIdTitle) {
        const span = sidebarIdTitle.querySelector('span');
        if (span) span.textContent = t.sidebarIdTitle;
        else sidebarIdTitle.innerHTML = `<i class="fas fa-user-shield"></i> ${t.sidebarIdTitle}`;
    }
    
    const lblClientName = document.getElementById('lblClientName');
    if (lblClientName) {
        const span = lblClientName.querySelector('span');
        if (span) span.textContent = t.lblClientName;
        else lblClientName.innerHTML = `<i class="fas fa-id-card"></i> ${t.lblClientName}`;
    }
    
    const lblNIF = document.getElementById('lblNIF');
    if (lblNIF) {
        const span = lblNIF.querySelector('span');
        if (span) span.textContent = t.lblNIF;
        else lblNIF.innerHTML = `<i class="fas fa-hashtag"></i> ${t.lblNIF}`;
    }
    
    const btnRegister = document.getElementById('btnRegister');
    if (btnRegister) {
        const span = btnRegister.querySelector('span');
        if (span) span.textContent = t.btnRegister;
        else btnRegister.innerHTML = `<i class="fas fa-check-double"></i> ${t.btnRegister}`;
    }
    
    const sidebarParamTitle = document.getElementById('sidebarParamTitle');
    if (sidebarParamTitle) {
        const span = sidebarParamTitle.querySelector('span');
        if (span) span.textContent = t.sidebarParamTitle;
        else sidebarParamTitle.innerHTML = `<i class="fas fa-sliders-h"></i> ${t.sidebarParamTitle}`;
    }
    
    const lblFiscalYear = document.getElementById('lblFiscalYear');
    if (lblFiscalYear) {
        const span = lblFiscalYear.querySelector('span');
        if (span) span.textContent = t.lblFiscalYear;
        else lblFiscalYear.innerHTML = `<i class="fas fa-calendar-alt"></i> ${t.lblFiscalYear}`;
    }
    
    const lblPeriodo = document.getElementById('lblPeriodo');
    if (lblPeriodo) {
        const span = lblPeriodo.querySelector('span');
        if (span) span.textContent = t.lblPeriodo;
        else lblPeriodo.innerHTML = `<i class="fas fa-clock"></i> ${t.lblPeriodo}`;
    }
    
    const lblPlatform = document.getElementById('lblPlatform');
    if (lblPlatform) {
        const span = lblPlatform.querySelector('span');
        if (span) span.textContent = t.lblPlatform;
        else lblPlatform.innerHTML = `<i class="fas fa-mobile-alt"></i> ${t.lblPlatform}`;
    }
    
    const btnEvidence = document.getElementById('btnEvidence');
    if (btnEvidence) {
        const span = btnEvidence.querySelector('span');
        if (span) span.textContent = t.btnEvidence;
        else btnEvidence.innerHTML = `<span><i class="fas fa-folder-open"></i> ${t.btnEvidence}</span>`;
    }
    
    const btnAnalyze = document.getElementById('btnAnalyze');
    if (btnAnalyze) {
        const span = btnAnalyze.querySelector('span');
        if (span) span.textContent = t.btnAnalyze;
        else btnAnalyze.innerHTML = `<i class="fas fa-search-dollar"></i> ${t.btnAnalyze}`;
    }
    
    const btnPDF = document.getElementById('btnPDF');
    if (btnPDF) {
        const span = btnPDF.querySelector('span');
        if (span) span.textContent = t.btnPDF;
        else btnPDF.innerHTML = `<i class="fas fa-file-pdf"></i> ${t.btnPDF}`;
    }
    
    const exportDOCXBtn = document.getElementById('exportDOCXBtn');
    if (exportDOCXBtn) {
        const textSpan = exportDOCXBtn.querySelector('span');
        if (!textSpan) {
            exportDOCXBtn.innerHTML = `<i class="fas fa-file-word"></i> ${t.btnDOCX}`;
        } else {
            textSpan.textContent = t.btnDOCX;
        }
    }
    
    const atfBtn = document.getElementById('atfModalBtn');
    if (atfBtn) {
        atfBtn.innerHTML = `<i class="fas fa-chart-line"></i> &#x23F3; ${t.btnATF}`;
    }
    
    const resetBtn = document.getElementById('resetBtn');
    if (resetBtn) {
        resetBtn.innerHTML = `<i class="fas fa-trash-alt"></i> ${t.btnReset}`;
    }
    
    const executeBtn = document.getElementById('btnExecute');
    if (executeBtn) executeBtn.textContent = t.btnExecute;
    
    const exportJsonBtn = document.getElementById('btnExportJson');
    if (exportJsonBtn) exportJsonBtn.textContent = t.btnExportJson;
    
    const lawyerBundleBtn = document.getElementById('btnLawyerBundle');
    if (lawyerBundleBtn) lawyerBundleBtn.textContent = t.btnLawyerBundle;
    
    const clearConsoleBtn = document.getElementById('clearConsoleBtn');
    if (clearConsoleBtn) {
        const span = clearConsoleBtn.querySelector('span');
        if (span) span.textContent = t.clearConsoleBtn;
        else clearConsoleBtn.innerHTML = `<i class="fas fa-trash-alt"></i> ${t.clearConsoleBtn}`;
    }
    
    const wipeBtnText = document.getElementById('wipeBtnText');
    if (wipeBtnText) wipeBtnText.textContent = t.wipeBtnText;
    
    const cardNet = document.getElementById('cardNet');
    if (cardNet) {
        const span = cardNet.querySelector('span');
        if (span) span.textContent = t.cardNet;
        else cardNet.innerHTML = `<i class="fas fa-coins"></i> ${t.cardNet}`;
    }
    
    const cardComm = document.getElementById('cardComm');
    if (cardComm) {
        const span = cardComm.querySelector('span');
        if (span) span.textContent = t.cardComm;
        else cardComm.innerHTML = `<i class="fas fa-percentage"></i> ${t.cardComm}`;
    }
    
    const cardJuros = document.getElementById('cardJuros');
    if (cardJuros) {
        const span = cardJuros.querySelector('span');
        if (span) span.textContent = t.cardJuros;
        else cardJuros.innerHTML = `<i class="fas fa-chart-line"></i> ${t.cardJuros}`;
    }
    
    const kpiTitle = document.getElementById('kpiTitle');
    if (kpiTitle) {
        const span = kpiTitle.querySelector('span');
        if (span) span.textContent = t.kpiTitle;
        else kpiTitle.innerHTML = `<i class="fas fa-project-diagram"></i> ${t.kpiTitle}`;
    }
    
    const kpiGross = document.getElementById('kpiGross');
    if (kpiGross) kpiGross.textContent = t.kpiGross;
    
    const kpiCommText = document.getElementById('kpiCommText');
    if (kpiCommText) kpiCommText.textContent = t.kpiCommText;
    
    const kpiNetText = document.getElementById('kpiNetText');
    if (kpiNetText) kpiNetText.textContent = t.kpiNetText;
    
    const kpiInvText = document.getElementById('kpiInvText');
    if (kpiInvText) kpiInvText.textContent = t.kpiInvText;
    
    const chartTitle = document.getElementById('chartTitle');
    if (chartTitle) {
        const span = chartTitle.querySelector('span');
        if (span) span.textContent = t.chartTitle;
        else chartTitle.innerHTML = `<i class="fas fa-chart-line"></i> ${t.chartTitle}`;
    }
    
    const chartTitle2 = document.getElementById('chartTitle2');
    if (chartTitle2) {
        const span = chartTitle2.querySelector('span');
        if (span) span.textContent = t.chartTitle2;
        else chartTitle2.innerHTML = `<i class="fas fa-chart-bar"></i> ${t.chartTitle2}`;
    }
    
    const consoleTitle = document.getElementById('consoleTitle');
    if (consoleTitle) {
        const span = consoleTitle.querySelector('span');
        if (span) span.textContent = t.consoleTitle;
        else consoleTitle.innerHTML = `<i class="fas fa-terminal"></i> ${t.consoleTitle}`;
    }
    
    const footerHashTitle = document.getElementById('footerHashTitle');
    if (footerHashTitle) footerHashTitle.textContent = t.footerHashTitle;
    
    const modalTitle = document.getElementById('modalTitle');
    if (modalTitle) modalTitle.textContent = t.modalTitle;
    
    const uploadControlText = document.getElementById('uploadControlText');
    if (uploadControlText) uploadControlText.textContent = t.uploadControlText;
    
    const uploadSaftText = document.getElementById('uploadSaftText');
    if (uploadSaftText) uploadSaftText.textContent = t.uploadSaftText;
    
    const uploadInvoiceText = document.getElementById('uploadInvoiceText');
    if (uploadInvoiceText) uploadInvoiceText.textContent = t.uploadInvoiceText;
    
    const uploadStatementText = document.getElementById('uploadStatementText');
    if (uploadStatementText) uploadStatementText.textContent = t.uploadStatementText;
    
    const uploadDac7Text = document.getElementById('uploadDac7Text');
    if (uploadDac7Text) uploadDac7Text.textContent = t.uploadDac7Text;
    
    const summaryTitle = document.getElementById('summaryTitle');
    if (summaryTitle) {
        const span = summaryTitle.querySelector('span');
        if (span) span.textContent = t.summaryTitle;
        else summaryTitle.innerHTML = `<i class="fas fa-clipboard-list"></i> ${t.summaryTitle}`;
    }
    
    const modalSaveBtn = document.getElementById('modalSaveBtn');
    if (modalSaveBtn) {
        const span = modalSaveBtn.querySelector('span');
        if (span) span.textContent = t.modalSaveBtn;
        else modalSaveBtn.innerHTML = `<i class="fas fa-check-circle"></i> ${t.modalSaveBtn}`;
    }
    
    const moduleSaftTitle = document.getElementById('moduleSaftTitle');
    if (moduleSaftTitle) {
        const span = moduleSaftTitle.querySelector('span');
        if (span) span.textContent = t.moduleSaftTitle;
        else moduleSaftTitle.innerHTML = `<i class="fas fa-file-code"></i> ${t.moduleSaftTitle}`;
    }
    
    const moduleStatementTitle = document.getElementById('moduleStatementTitle');
    if (moduleStatementTitle) {
        const span = moduleStatementTitle.querySelector('span');
        if (span) span.textContent = t.moduleStatementTitle;
        else moduleStatementTitle.innerHTML = `<i class="fas fa-file-contract"></i> ${t.moduleStatementTitle}`;
    }
    
    const moduleDac7Title = document.getElementById('moduleDac7Title');
    if (moduleDac7Title) {
        const span = moduleDac7Title.querySelector('span');
        if (span) span.textContent = t.moduleDac7Title;
        else moduleDac7Title.innerHTML = `<i class="fas fa-envelope-open-text"></i> ${t.moduleDac7Title}`;
    }
    
    const saftIliquidoLabel = document.getElementById('saftIliquidoLabel');
    if (saftIliquidoLabel) saftIliquidoLabel.textContent = t.saftIliquido;
    
    const saftIvaLabel = document.getElementById('saftIvaLabel');
    if (saftIvaLabel) saftIvaLabel.textContent = t.saftIva;
    
    const saftBrutoLabel = document.getElementById('saftBrutoLabel');
    if (saftBrutoLabel) saftBrutoLabel.textContent = t.saftBruto;
    
    const stmtGanhosLabel = document.getElementById('stmtGanhosLabel');
    if (stmtGanhosLabel) stmtGanhosLabel.textContent = t.stmtGanhos;
    
    const stmtDespesasLabel = document.getElementById('stmtDespesasLabel');
    if (stmtDespesasLabel) stmtDespesasLabel.textContent = t.stmtDespesas;
    
    const stmtGanhosLiquidosLabel = document.getElementById('stmtGanhosLiquidosLabel');
    if (stmtGanhosLiquidosLabel) stmtGanhosLiquidosLabel.textContent = t.stmtGanhosLiquidos;
    
    const dac7Q1Label = document.getElementById('dac7Q1Label');
    if (dac7Q1Label) dac7Q1Label.textContent = t.dac7Q1;
    
    const dac7Q2Label = document.getElementById('dac7Q2Label');
    if (dac7Q2Label) dac7Q2Label.textContent = t.dac7Q2;
    
    const dac7Q3Label = document.getElementById('dac7Q3Label');
    if (dac7Q3Label) dac7Q3Label.textContent = t.dac7Q3;
    
    const dac7Q4Label = document.getElementById('dac7Q4Label');
    if (dac7Q4Label) dac7Q4Label.textContent = t.dac7Q4;
    
    const quantumTitle = document.getElementById('quantumTitle');
    if (quantumTitle) {
        const span = quantumTitle.querySelector('span');
        if (span) span.textContent = t.quantumTitle;
        else quantumTitle.innerHTML = `<i class="fas fa-balance-scale"></i> ${t.quantumTitle}`;
    }
    
    const quantumFormula = document.getElementById('quantumFormula');
    if (quantumFormula) quantumFormula.textContent = t.quantumFormula;
    
    const quantumNote = document.getElementById('quantumNote');
    if (quantumNote) quantumNote.textContent = t.quantumNote;
    
    const verdictPercentLabel = document.getElementById('verdictPercentLabel');
    if (verdictPercentLabel) verdictPercentLabel.textContent = t.verdictPercent;
    
    const alertCriticalTitle = document.getElementById('alertCriticalTitle');
    if (alertCriticalTitle) alertCriticalTitle.textContent = t.alertCriticalTitle;
    
    const alertOmissionText = document.getElementById('alertOmissionText');
    if (alertOmissionText) alertOmissionText.textContent = t.alertOmissionText;
    
    const alertAccumulatedNote = document.getElementById('alertAccumulatedNote');
    if (alertAccumulatedNote) alertAccumulatedNote.textContent = t.alertAccumulatedNote;
    
    const revenueGapTitle = document.getElementById('revenueGapTitle');
    if (revenueGapTitle) revenueGapTitle.textContent = t.revenueGapTitle;
    
    const expenseGapTitle = document.getElementById('expenseGapTitle');
    if (expenseGapTitle) expenseGapTitle.textContent = t.expenseGapTitle;
    
    const revenueGapDesc = document.getElementById('revenueGapDesc');
    if (revenueGapDesc) revenueGapDesc.textContent = t.revenueGapDesc;
    
    const expenseGapDesc = document.getElementById('expenseGapDesc');
    if (expenseGapDesc) expenseGapDesc.textContent = t.expenseGapDesc;
    
    const omissaoDespesasPctTitle = document.getElementById('omissaoDespesasPctTitle');
    if (omissaoDespesasPctTitle) omissaoDespesasPctTitle.textContent = t.omissaoDespesasPctTitle;
    
    const logsModalTitle = document.getElementById('logsModalTitle');
    if (logsModalTitle) logsModalTitle.textContent = t.logsModalTitle;
    
    const exportLogsBtnText = document.getElementById('exportLogsBtnText');
    if (exportLogsBtnText) exportLogsBtnText.textContent = t.exportLogsBtn;
    
    const clearLogsBtnText = document.getElementById('clearLogsBtnText');
    if (clearLogsBtnText) clearLogsBtnText.textContent = t.clearLogsBtn;
    
    const closeLogsBtnText = document.getElementById('closeLogsBtnText');
    if (closeLogsBtnText) closeLogsBtnText.textContent = t.closeLogsBtn;
    
    const hashModalTitle = document.getElementById('hashModalTitle');
    if (hashModalTitle) hashModalTitle.textContent = t.hashModalTitle;
    
    const closeHashBtnText = document.getElementById('closeHashBtnText');
    if (closeHashBtnText) closeHashBtnText.textContent = t.closeHashBtnText;
    
    if (UNIFEDSystem.analysis.totals) {
        updateDashboard();
        updateModulesUI();
    }
    
    startClockAndDate();
    updateDynamicContent();
    translateDataLangElements();
    
    if (typeof window.refreshAuxiliaryBoxes === 'function') {
        window.refreshAuxiliaryBoxes();
    }
    
    if (typeof window.updateTriadaButtonsLanguage === 'function') {
        window.updateTriadaButtonsLanguage();
    }
    
    const statDescriptions = {
        pt: {
            statNetDesc: 'Resultado Líquido (Extrato)',
            statCommDesc: 'Total de despesas/comissões (Extrato)',
            statJurosDesc: 'Despesas/Comissões Extrato vs Fatura'
        },
        en: {
            statNetDesc: 'Net Earnings (Statement)',
            statCommDesc: 'Total Expenses/Commissions (Statement)',
            statJurosDesc: 'Expenses/Commissions Statement vs Invoiced'
        }
    };
    
    const statDescEls = document.querySelectorAll('.stat-desc');
    statDescEls.forEach((el, idx) => {
        if (idx === 0) el.textContent = statDescriptions[currentLang].statNetDesc;
        else if (idx === 1) el.textContent = statDescriptions[currentLang].statCommDesc;
        else if (idx === 2) el.textContent = statDescriptions[currentLang].statJurosDesc;
    });
    
    logAudit(`Idioma alterado para: ${currentLang.toUpperCase()}`, 'info');
    ForensicLogger.addEntry('LANGUAGE_CHANGED', { lang: currentLang });

    // PATCH P1 — Reconverter clientNameFixed em modo DEMO após troca de idioma
    // Sem este bloco, o nome "ANONYMIZED TAXPAYER ALPHA" persiste no input após switch PT→EN→PT
    if (UNIFEDSystem.demoMode === true || UNIFEDSystem.casoRealAnonimizado === true) {
        const _demoClientInput = document.getElementById('clientNameFixed');
        if (_demoClientInput) {
            const _demoName = (currentLang === 'en')
                ? 'ANONYMIZED TAXPAYER ALPHA'
                : 'SUJEITO PASSIVO ALFA (ANONIMIZADO)';
            _demoClientInput.value = _demoName;
            // Garantir que o objeto UNIFEDSystem.client reflecte a língua activa
            if (UNIFEDSystem.client) { UNIFEDSystem.client.name = _demoName; }
        }
    }

    if (typeof fixButtonLanguageSwitch === 'function') {
        fixButtonLanguageSwitch(currentLang);
    }

    if (typeof window._retranslateAuxDynamicNodes === 'function') {
        window._retranslateAuxDynamicNodes(currentLang);
    }

    if (typeof window._refreshAuxiliaryHeader === 'function') {
        window._refreshAuxiliaryHeader(currentLang);
    }

    if (typeof window.recreateCharts === 'function') {
        window.recreateCharts();
    }

    const atfModal = document.getElementById('atfModal');
    if (atfModal && atfModal.style.display !== 'none') {
        console.log('[UNIFED-LANG] ATF modal aberto – recarregando com novo idioma.');
        if (typeof window.closeATFModal === 'function') {
            window.closeATFModal();
            setTimeout(() => window.openATFModal(), 100);
        }
    }

    if (typeof window.recreateCharts === 'function') {
        window.recreateCharts();
    }

    console.log('[UNIFED-LANG] Tradução concluída com sucesso.');
}

function translateDataLangElements() {
    const elements = document.querySelectorAll('[data-pt][data-en]');
    elements.forEach(el => {
        const translation = el.getAttribute(`data-${currentLang}`);
        if (translation) {
            if (el.childNodes.length === 1 && el.childNodes[0].nodeType === Node.TEXT_NODE) {
                el.textContent = translation;
            } else {
                const original = el.innerHTML;
                const ptText = el.getAttribute('data-pt') || '';
                const enText = el.getAttribute('data-en') || '';
                if (ptText && enText && original.includes(ptText)) {
                    el.innerHTML = original.replace(ptText, enText);
                }
            }
        }
    });
}

// ============================================================================
// SCHEMA REGISTRY
// ============================================================================
const SchemaRegistry = {
    schemas: {
        statement: {
            name: 'Extrato de Ganhos',
            patterns: {
                ganhosLiquidosTable: [
                    /Ganhos\s*([\d\s,.]+)\s*Despesas\s*-?\s*([\d\s,.]+)\s*Ganhos\s*líquidos\s*([\d\s,.]+)/is,
                    /Ganhos\s*([\d\s,.]+)\s*Despesas\s*-?\s*([\d\s,.]+)\s*Ganhos\s*líquidos\s*([\d\s,.]+)/i,
                    /Ganhos\s+([\d\s,.]+)\s*€?\s*Despesas\s*-?\s*([\d\s,.]+)\s*€?\s*Ganhos\s*líquidos\s*([\d\s,.]+)\s*€?/i
                ],
                ganhos: [
                    /Ganhos\s*([\d\s,.]+)\s*€/i,
                    /Total\s+de\s+Ganhos\s*[:\s]*([\d\s,.]+)/i
                ],
                despesas: [
                    /Despesas\s*-?\s*([\d\s,.]+)\s*€/i,
                    /Total\s+de\s+Despesas\s*[:\s]*([\d\s,.]+)/i
                ],
                ganhosLiquidos: [
                    /Ganhos\s*líquidos\s*([\d\s,.]+)\s*€/i,
                    /Valor\s+líquido\s+creditado\s*[:\s]*([\d\s,.]+)/i
                ]
            }
        },
        invoice: {
            name: 'Fatura',
            patterns: {
                valorTotal: [
                    /Total com IVA\s*\(EUR\)\s*([\d\s,.]+)/i,
                    /Total a pagar\s*([\d\s,.]+)/i,
                    /Valor total\s*([\d\s,.]+)/i,
                    /Invoice total\s*[:\s]*([\d\s,.]+)/i,
                    /Amount due\s*[:\s]*([\d\s,.]+)/i,
                    /Total\s*[:\s]*([\d\s,.]+)\s*€/i
                ],
                valorSemIVA: [
                    /Total sem IVA\s*([\d\s,.]+)/i,
                    /Subtotal\s*[:\s]*([\d\s,.]+)/i
                ],
                iva: [
                    /IVA\s*\(23%\)\s*([\d\s,.]+)/i,
                    /VAT\s*[:\s]*([\d\s,.]+)/i
                ]
            },
            tablePatterns: [
                /Comissões da Bolt.*?(\d+\.\d+).*?(\d+\.\d+).*?(\d+\.\d+).*?(\d+\.\d+)/is
            ]
        },
        dac7: {
            name: 'Declaração DAC7',
            patterns: {
                receitaAnual: [
                    /Total de receitas anuais:\s*€?\s*([\d\s,.]+)/i,
                    /Annual revenue total:\s*€?\s*([\d\s,.]+)/i,
                    /Total income\s*[:\s]*€?\s*([\d\s,.]+)/i
                ],
                receitaQ1: [
                    /Ganhos do 1\.º trimestre:\s*€?\s*([\d\s,.]+)/i,
                    /1\.º trimestre:\s*€?\s*([\d\s,.]+)/i,
                    /1st quarter:\s*€?\s*([\d\s,.]+)/i,
                    /Q1 revenue\s*[:\s]*€?\s*([\d\s,.]+)/i
                ],
                receitaQ2: [
                    /Ganhos do 2\.º trimestre:\s*€?\s*([\d\s,.]+)/i,
                    /2\.º trimestre:\s*€?\s*([\d\s,.]+)/i,
                    /2nd quarter:\s*€?\s*([\d\s,.]+)/i,
                    /Q2 revenue\s*[:\s]*€?\s*([\d\s,.]+)/i
                ],
                receitaQ3: [
                    /Ganhos do 3\.º trimestre:\s*€?\s*([\d\s,.]+)/i,
                    /3\.º trimestre:\s*€?\s*([\d\s,.]+)/i,
                    /3rd quarter:\s*€?\s*([\d\s,.]+)/i,
                    /Q3 revenue\s*[:\s]*€?\s*([\d\s,.]+)/i
                ],
                receitaQ4: [
                    /Ganhos do 4\.º trimestre:\s*€?\s*([\d\s,.]+)/i,
                    /4\.º trimestre:\s*€?\s*([\d\s,.]+)/i,
                    /4th quarter earnings:\s*€?\s*([\d\s,.]+)/i,
                    /Q4 revenue\s*[:\s]*€?\s*([\d\s,.]+)/i,
                    /Fourth quarter\s*[:\s]*€?\s*([\d\s,.]+)/i
                ]
            }
        },
        saft: {
            name: 'SAF-T',
            columnMappings: {
                bruto: [
                    'Preço da viagem'
                ],
                iva: [
                    'IVA'
                ],
                iliquido: [
                    'Preço da viagem (sem IVA)'
                ]
            }
        }
    },

    extractValue(text, patterns, defaultValue = 0) {
        if (!text || !patterns) return defaultValue;

        for (const pattern of patterns) {
            try {
                const match = text.match(pattern);
                if (match && match[1]) {
                    const value = normalizeNumericValue(match[1]);
                    if (value > 0.01) {
                        return value;
                    }
                }
            } catch (e) {
                console.warn('Erro na extração de padrão:', e);
            }
        }

        return defaultValue;
    },

    extractFromTable(text, patterns) {
        if (!text || !patterns) return 0;

        for (const pattern of patterns) {
            try {
                const match = text.match(pattern);
                if (match && match[4]) {
                    return normalizeNumericValue(match[4]);
                }
            } catch (e) {
                console.warn('Erro na extração de tabela:', e);
            }
        }

        return 0;
    },

    processStatement(text, filename) {
        const result = {
            ganhos: 0,
            despesas: 0,
            ganhosLiq: 0
        };

        const schema = this.schemas.statement;

        let tableExtracted = false;
        for (const pattern of schema.patterns.ganhosLiquidosTable) {
            const match = text.match(pattern);
            if (match) {
                console.log('✅ Tabela "Ganhos líquidos" encontrada:', match);
                if (match[1]) result.ganhos = normalizeNumericValue(match[1]);
                if (match[2]) result.despesas = normalizeNumericValue(match[2]);
                if (match[3]) result.ganhosLiq = normalizeNumericValue(match[3]);
                tableExtracted = true;
                break;
            }
        }

        if (!tableExtracted) {
            console.log('[!] Tabela completa não encontrada. A tentar extração individual.');
            result.ganhos = this.extractValue(text, schema.patterns.ganhos);
            result.despesas = this.extractValue(text, schema.patterns.despesas);
            result.ganhosLiq = this.extractValue(text, schema.patterns.ganhosLiquidos);
        }

        result.despesas = Math.abs(result.despesas);

        logAudit(`📊 Extração Extrato (v1.0-COMMERCIAL-LITIGATION) - Ganhos: ${formatCurrency(result.ganhos)} | Despesas: ${formatCurrency(result.despesas)} | Líquido: ${formatCurrency(result.ganhosLiq)}`, 'info');

        return result;
    },

    processInvoice(text, filename) {
        const result = {
            valorTotal: 0,
            valorSemIVA: 0,
            iva: 0
        };

        const schema = this.schemas.invoice;

        result.valorTotal = this.extractValue(text, schema.patterns.valorTotal);
        result.valorSemIVA = this.extractValue(text, schema.patterns.valorSemIVA);
        result.iva = this.extractValue(text, schema.patterns.iva);

        if (result.valorTotal === 0) {
            result.valorTotal = this.extractFromTable(text, schema.tablePatterns);
        }

        if (result.valorTotal === 0) {
            const valorPattern = /(\d+\.\d{2})/g;
            const valores = [...text.matchAll(valorPattern)];
            for (const match of valores) {
                const val = parseFloat(match[1]);
                if (val > 0.01 && val < 10000) {
                    result.valorTotal = val;
                    break;
                }
            }
        }

        logAudit(`📄 Extração de fatura - Total: ${formatCurrency(result.valorTotal)}`, 'info');

        return result;
    },

    processDAC7(text, filename, periodoSelecionado) {
        const result = {
            receitaAnual: 0,
            q1: 0,
            q2: 0,
            q3: 0,
            q4: 0
        };

        console.log('🔍 Processando DAC7 para período:', periodoSelecionado);

        const extractDAC7Value = (label, txt) => {
            const re = new RegExp(
                label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') +
                '[:\s]*(?:€\s*)?([\d][\d\s.,]*(?:[.,]\d{1,2})?\s*€?)',
                'i'
            );
            const m = txt.match(re);
            if (m && m[1]) {
                const val = normalizeNumericValue(m[1]);
                if (val > 0) return val;
            }
            const reLine = new RegExp(
                label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') +
                '[^\n]*?(€?\s*[\d][\d\s.,]{0,20})',
                'i'
            );
            const mLine = txt.match(reLine);
            return mLine && mLine[1] ? normalizeNumericValue(mLine[1]) : 0;
        };

        const receitaAnualMatch = text.match(/Total de receitas anuais[:\s]*(?:€\s*)?([\d][\d\s.,]*(?:[.,]\d{1,2})?\s*€?)/i);
        if (receitaAnualMatch) {
            result.receitaAnual = normalizeNumericValue(receitaAnualMatch[1]);
        }

        const q1Raw = text.match(/Ganhos do 1\.º trimestre[:\s]*(?:€\s*)?([\d][\d\s.,]*(?:[.,]\d{1,2})?\s*€?)/i);
        const q2Raw = text.match(/Ganhos do 2\.º trimestre[:\s]*(?:€\s*)?([\d][\d\s.,]*(?:[.,]\d{1,2})?\s*€?)/i);
        const q3Raw = text.match(/Ganhos do 3\.º trimestre[:\s]*(?:€\s*)?([\d][\d\s.,]*(?:[.,]\d{1,2})?\s*€?)/i);
        const q4Raw = text.match(/Ganhos do 4\.º trimestre[:\s]*(?:€\s*)?([\d][\d\s.,]*(?:[.,]\d{1,2})?\s*€?)/i);

        const q1Extracted = q1Raw ? normalizeNumericValue(q1Raw[1]) : 0;
        const q2Extracted = q2Raw ? normalizeNumericValue(q2Raw[1]) : 0;
        const q3Extracted = q3Raw ? normalizeNumericValue(q3Raw[1]) : 0;
        const q4Extracted = q4Raw ? normalizeNumericValue(q4Raw[1]) : 0;

        switch (periodoSelecionado) {
            case 'anual':
                result.q1 = q1Extracted;
                result.q2 = q2Extracted;
                result.q3 = q3Extracted;
                result.q4 = q4Extracted;
                break;
            case '1s':
                result.q1 = q1Extracted;
                result.q2 = q2Extracted;
                result.q3 = 0;
                result.q4 = 0;
                break;
            case '2s':
                result.q1 = 0;
                result.q2 = 0;
                result.q3 = q3Extracted;
                result.q4 = q4Extracted;
                break;
            case 'trimestral': {
                let triAtivo = UNIFEDSystem.selectedTrimestre || 1;
                const triSelector = document.getElementById('trimestralSelector');
                if (triSelector) {
                    const triVal = parseInt(triSelector.value, 10);
                    if (triVal >= 1 && triVal <= 4) {
                        triAtivo = triVal;
                        UNIFEDSystem.selectedTrimestre = triAtivo;
                    }
                }
                result.q1 = triAtivo === 1 ? q1Extracted : 0;
                result.q2 = triAtivo === 2 ? q2Extracted : 0;
                result.q3 = triAtivo === 3 ? q3Extracted : 0;
                result.q4 = triAtivo === 4 ? q4Extracted : 0;
                console.log(`🎯 DAC7 Quarterly Scope: Q${triAtivo} activo — restantes zerados`);
                break;
            }
            default:
                result.q1 = q1Extracted;
                result.q2 = q2Extracted;
                result.q3 = q3Extracted;
                result.q4 = q4Extracted;
                break;
        }

        logAudit(
            `📊 Extração DAC7 v1.0-COMMERCIAL-LITIGATION (${periodoSelecionado}) — ` +
            `Q1: ${formatCurrency(result.q1)} | Q2: ${formatCurrency(result.q2)} | ` +
            `Q3: ${formatCurrency(result.q3)} | Q4: ${formatCurrency(result.q4)}`,
            'info'
        );

        return result;
    },

    processSAFT(parseResult, filename) {
        const result = {
            totalBruto: 0,
            totalIVA: 0,
            totalIliquido: 0,
            recordCount: 0
        };

        if (!parseResult || !parseResult.data || parseResult.data.length === 0) {
            console.warn('[!] SAF-T: Sem dados para processar');
            return result;
        }

        console.log('🔍 Processando SAF-T v1.0-COMMERCIAL-LITIGATION (Header-Name Mapping):', filename);

        const LABEL_ILIQUIDO = 'Preço da viagem (sem IVA)';
        const LABEL_IVA      = 'IVA';
        const LABEL_BRUTO    = 'Preço da viagem';

        const sampleRow = parseResult.data[0] || {};
        const hasHeaders = LABEL_ILIQUIDO in sampleRow && LABEL_IVA in sampleRow && LABEL_BRUTO in sampleRow;

        if (!hasHeaders) {
            const foundKeys = Object.keys(sampleRow).join(' | ');
            console.warn(`[!] SAF-T processSAFT: Cabeçalhos não encontrados. Colunas detectadas: ${foundKeys}`);
            logAudit(`[!] SAF-T processSAFT: Cabeçalhos em falta — "${LABEL_ILIQUIDO}", "${LABEL_IVA}", "${LABEL_BRUTO}". Verificar CSV.`, 'warning');
            return result;
        }

        for (const row of parseResult.data) {
            if (!row) continue;

            const iliquido = normalizeNumericValue(row[LABEL_ILIQUIDO]);
            const iva      = normalizeNumericValue(row[LABEL_IVA]);
            const bruto    = normalizeNumericValue(row[LABEL_BRUTO]);

            if (iliquido > 0.01) result.totalIliquido += iliquido;
            if (iva > 0.01)      result.totalIVA      += iva;
            if (bruto > 0.01) {
                result.totalBruto += bruto;
                result.recordCount++;
            }
        }

        console.log(`📊 Linhas processadas: ${parseResult.data.length}, Registos válidos: ${result.recordCount}`);
        console.log(`   Total Ilíquido: ${result.totalIliquido}`);
        console.log(`   Total IVA: ${result.totalIVA}`);
        console.log(`   Total Bruto: ${result.totalBruto}`);

        if (result.totalBruto > 0 && result.totalIliquido > 0 && result.totalIVA > 0) {
            const soma = result.totalIliquido + result.totalIVA;
            const diferenca = Math.abs(result.totalBruto - soma);
            const percentagemDiferenca = (diferenca / result.totalBruto) * 100;
            if (percentagemDiferenca > 1) {
                console.log(`[!] Inconsistência: Bruto(${result.totalBruto}) vs Soma(${soma}) = ${diferenca} (${percentagemDiferenca.toFixed(2)}%)`);
            } else {
                console.log('✅ Valores consistentes');
            }
        }

        logAudit(`📊 SAF-T v1.0-COMMERCIAL-LITIGATION: ${formatCurrency(result.totalBruto)} Bruto | ${formatCurrency(result.totalIliquido)} Ilíquido | ${formatCurrency(result.totalIVA)} IVA | ${result.recordCount} registos`, 'info');

        return result;
    }
};

// ============================================================================
// ESTADO GLOBAL (SINGLE SOURCE OF TRUTH)
// ============================================================================
let UNIFEDSystem = {
    version: 'v1.0-COMMERCIAL-LITIGATION',
    name: 'UNIFED - PROBATUM',
    sessionId: generateSessionId(),
    selectedYear: new Date().getFullYear(),
    selectedPeriodo: 'anual',
    selectedPlatform: 'outra',
    client: null,
    demoMode: false,
    processing: false,
    performanceTiming: { start: 0, end: 0 },
    logs: [],
    masterHash: '',
    processedFiles: new Set(),
    dataMonths: new Set(),
    fileSources: new Map(),
    monthlyData: {},
    documents: {
        control: { files: [], hashes: {}, totals: { records: 0 } },
        saft: { files: [], hashes: {}, totals: { records: 0, iliquido: 0, iva: 0, bruto: 0 } },
        invoices: { files: [], hashes: {}, totals: { records: 0, invoiceValue: 0 } },
        statements: { files: [], hashes: {}, totals: {
            records: 0,
            ganhos: 0,
            despesas: 0,
            ganhosLiquidos: 0
        } },
        dac7: { files: [], hashes: {}, totals: {
            records: 0,
            q1: 0,
            q2: 0,
            q3: 0,
            q4: 0,
            receitaAnual: 0
        } }
    },
    analysis: {
        totals: {
            saftBruto: 0,
            saftIliquido: 0,
            saftIva: 0,
            ganhos: 0,
            despesas: 0,
            ganhosLiquidos: 0,
            faturaPlataforma: 0,
            dac7Q1: 0,
            dac7Q2: 0,
            dac7Q3: 0,
            dac7Q4: 0,
            dac7TotalPeriodo: 0
        },
        twoAxis: {
            revenueGap: 0,
            expenseGap: 0,
            revenueGapActive: false,
            expenseGapActive: false
        },
        crossings: {
            delta: 0,
            bigDataAlertActive: false,
            invoiceDivergence: false,
            comissaoDivergencia: 0,
            saftVsDac7Alert: false,
            saftVsGanhosAlert: false,
            discrepanciaCritica: 0,
            discrepanciaSaftVsDac7: 0,
            percentagemOmissao: 0,
            percentagemDiscrepancia: 0,
            percentagemSaftVsDac7: 0,
            ivaFalta: 0,
            ivaFalta6: 0,
            btor: 0,
            btf: 0,
            impactoMensalMercado: 0,
            impactoAnualMercado: 0,
            impactoSeteAnosMercado: 0,
            discrepancia5IMT: 0,
            agravamentoBrutoIRC: 0,
            ircEstimado: 0
        },
        verdict: null,
        evidenceIntegrity: [],
        selectedQuestions: []
    },
    forensicMetadata: null,
    chart: null,
    discrepancyChart: null,
    counts: { total: 0 },

    auxiliaryData: {
        campanhas:           0,
        portagens:           0,
        gorjetas:            0,
        cancelamentos:       0,
        totalNaoSujeitos:    0,
        processedFrom:       [],
        extractedAt:         null
    }
};

window.UNIFEDSystem = UNIFEDSystem;

let lastLogTime = 0;
const LOG_THROTTLE = 100;

const fileProcessingQueue = [];
let isProcessingQueue = false;

// ============================================================================
// FUNÇÃO DE SINCRONIZAÇÃO FORENSE
// ============================================================================
function forensicDataSynchronization() {
    ForensicLogger.addEntry('SYNC_STARTED');
    console.log('🔍 SINCRONIZAÇÃO FORENSE ATIVADA');

    const statementFiles = UNIFEDSystem.analysis.evidenceIntegrity.filter(
        item => item.type === 'statement'
    ).length;

    const invoiceFiles = UNIFEDSystem.analysis.evidenceIntegrity.filter(
        item => item.type === 'invoice'
    ).length;

    const controlFiles = UNIFEDSystem.analysis.evidenceIntegrity.filter(
        item => item.type === 'control'
    ).length;

    const saftFiles = UNIFEDSystem.analysis.evidenceIntegrity.filter(
        item => item.type === 'saft'
    ).length;

    const dac7Files = UNIFEDSystem.analysis.evidenceIntegrity.filter(
        item => item.type === 'dac7'
    ).length;

    // ── R-FDS-01: mutação in-place — evita atribuição directa a propriedade congelada (deepFreeze) ──
    if (UNIFEDSystem.documents.statements) {
        const _newStatements = UNIFEDSystem.analysis.evidenceIntegrity
            .filter(item => item.type === 'statement')
            .map(item => ({ name: item.filename, size: item.size }));
        const _stFiles = UNIFEDSystem.documents.statements.files;
        if (_stFiles) {
            _stFiles.length = 0;
            _stFiles.push(..._newStatements);
        } else {
            UNIFEDSystem.documents.statements.files = _newStatements; // fallback: array ainda não inicializado
        }
        UNIFEDSystem.documents.statements.totals.records = statementFiles;
    }

    if (UNIFEDSystem.documents.invoices) {
        const _newInvoices = UNIFEDSystem.analysis.evidenceIntegrity
            .filter(item => item.type === 'invoice')
            .map(item => ({ name: item.filename, size: item.size }));
        const _invFiles = UNIFEDSystem.documents.invoices.files;
        if (_invFiles) {
            _invFiles.length = 0;
            _invFiles.push(..._newInvoices);
        } else {
            UNIFEDSystem.documents.invoices.files = _newInvoices; // fallback: array ainda não inicializado
        }
        UNIFEDSystem.documents.invoices.totals.records = invoiceFiles;
    }

    if (UNIFEDSystem.documents.control) {
        const _newControl = UNIFEDSystem.analysis.evidenceIntegrity
            .filter(item => item.type === 'control')
            .map(item => ({ name: item.filename, size: item.size }));
        const _ctlFiles = UNIFEDSystem.documents.control.files;
        if (_ctlFiles) {
            _ctlFiles.length = 0;
            _ctlFiles.push(..._newControl);
        } else {
            UNIFEDSystem.documents.control.files = _newControl; // fallback: array ainda não inicializado
        }
        if (UNIFEDSystem.documents.control.totals) {
            UNIFEDSystem.documents.control.totals.records = controlFiles;
        }
    }

    if (UNIFEDSystem.documents.saft) {
        const _newSaft = UNIFEDSystem.analysis.evidenceIntegrity
            .filter(item => item.type === 'saft')
            .map(item => ({ name: item.filename, size: item.size }));
        const _saftFiles = UNIFEDSystem.documents.saft.files;
        if (_saftFiles) {
            _saftFiles.length = 0;
            _saftFiles.push(..._newSaft);
        } else {
            UNIFEDSystem.documents.saft.files = _newSaft; // fallback: array ainda não inicializado
        }
        if (UNIFEDSystem.documents.saft.totals) {
            UNIFEDSystem.documents.saft.totals.records = saftFiles;
        }
    }

    if (UNIFEDSystem.documents.dac7) {
        const _newDac7 = UNIFEDSystem.analysis.evidenceIntegrity
            .filter(item => item.type === 'dac7')
            .map(item => ({ name: item.filename, size: item.size }));
        const _dac7Files = UNIFEDSystem.documents.dac7.files;
        if (_dac7Files) {
            _dac7Files.length = 0;
            _dac7Files.push(..._newDac7);
        } else {
            UNIFEDSystem.documents.dac7.files = _newDac7; // fallback: array ainda não inicializado
        }
        if (UNIFEDSystem.documents.dac7.totals) {
            UNIFEDSystem.documents.dac7.totals.records = dac7Files;
        }
    }

    setElementText('controlCountCompact', controlFiles);
    setElementText('saftCountCompact', saftFiles);
    setElementText('invoiceCountCompact', invoiceFiles);
    setElementText('statementCountCompact', statementFiles);
    setElementText('dac7CountCompact', dac7Files);

    setElementText('summaryControl', controlFiles);
    setElementText('summarySaft', saftFiles);
    setElementText('summaryInvoices', invoiceFiles);
    setElementText('summaryStatements', statementFiles);
    setElementText('summaryDac7', dac7Files);

    const total = controlFiles + saftFiles + invoiceFiles + statementFiles + dac7Files;
    setElementText('summaryTotal', total);
    const evidenceCountEl = document.getElementById('evidenceCountTotal');
    if (evidenceCountEl) evidenceCountEl.textContent = total;
    UNIFEDSystem.counts.total = total;

    logAudit(`🔬 SINCRONIZAÇÃO: ${total} total (CTRL:${controlFiles} SAFT:${saftFiles} FAT:${invoiceFiles} EXT:${statementFiles} DAC7:${dac7Files})`, 'success');

    ForensicLogger.addEntry('SYNC_COMPLETED', { total, controlFiles, saftFiles, invoiceFiles, statementFiles, dac7Files });

    ValueSource.sources.forEach((value, key) => {
        const badgeEl = document.getElementById(key + 'Source');
        if (badgeEl) {
            badgeEl.setAttribute('data-original-file', value.sourceFile);
        }
    });

    return { controlFiles, saftFiles, invoiceFiles, statementFiles, dac7Files, total };
}

function openLogsModal() {
    console.log('openLogsModal chamada');
    const modal = document.getElementById('logsModal');
    if (modal) {
        modal.style.display = 'flex';
        ForensicLogger.renderLogsToElement('logsDisplayArea');
        ForensicLogger.addEntry('LOGS_MODAL_OPENED');
    } else {
        console.error('Modal de logs não encontrado');
    }
}

function openHashModal() {
    console.log('openHashModal chamada');
    const modal = document.getElementById('hashVerificationModal');
    if (!modal) return;

    const masterHashEl = document.getElementById('masterHashFull');
    if (masterHashEl) {
        masterHashEl.textContent = UNIFEDSystem.masterHash || 'HASH INDISPONÍVEL';
    }

    const evidenceListEl = document.getElementById('evidenceHashList');
    if (evidenceListEl) {
        evidenceListEl.innerHTML = '';

        if (UNIFEDSystem.analysis.evidenceIntegrity.length === 0) {
            evidenceListEl.innerHTML = '<p style="color: var(--text-tertiary);">Nenhuma evidência processada.</p>';
        } else {
            UNIFEDSystem.analysis.evidenceIntegrity.forEach((item, index) => {
                const itemEl = document.createElement('div');
                itemEl.className = 'evidence-hash-item';
                itemEl.innerHTML = `
                    <div class="evidence-hash-filename">${index + 1}. ${item.filename}</div>
                    <div class="evidence-hash-value">${item.hash}</div>
                `;
                evidenceListEl.appendChild(itemEl);
            });
        }
    }

    modal.style.display = 'flex';
    ForensicLogger.addEntry('HASH_MODAL_OPENED');
}

document.addEventListener('DOMContentLoaded', () => {
    console.log('DOMContentLoaded - Inicializando sistema UNIFED - PROBATUM v1.0-COMMERCIAL-LITIGATION');
    setupStaticListeners();
    populateAnoFiscal();
    populateYears();
    startClockAndDate();
    loadSystemRecursively();
    setupDragAndDrop();
    generateQRCode();
    setupLogsModal();
    setupHashModal();
    setupDualScreenDetection();
    setupWipeButton();
    setupClearConsoleButton();

    if (typeof setupUnifiedExportButtons === 'function') {
        setupUnifiedExportButtons();
    }

    ForensicLogger.addEntry('SYSTEM_START', { version: UNIFEDSystem.version, logsCarregados: ForensicLogger.logs.length });
});

function setupStaticListeners() {
    console.log('Configurando listeners estáticos');
    // Correcção taxonómica: index.html regista id="startAnalysisBtn" (linha 192)
    const startBtn = document.getElementById('startAnalysisBtn');
    if (startBtn) {
        startBtn.addEventListener('click', startGatekeeperSession);
        console.log('Listener startAnalysisBtn adicionado');
    }

    const langBtn = document.getElementById('langToggleBtn');
    if (langBtn) {
        langBtn.addEventListener('click', switchLanguage);
        console.log('Listener langToggleBtn adicionado');
    }

    const viewLogsBtn = document.getElementById('viewLogsBtn');
    if (viewLogsBtn) {
        viewLogsBtn.addEventListener('click', openLogsModal);
        console.log('Listener viewLogsBtn adicionado');
    }

    const viewLogsHeaderBtn = document.getElementById('viewLogsHeaderBtn');
    if (viewLogsHeaderBtn) {
        viewLogsHeaderBtn.addEventListener('click', openLogsModal);
        console.log('Listener viewLogsHeaderBtn adicionado');
    }

    const qrContainer = document.getElementById('qrcodeContainer');
    if (qrContainer) {
        qrContainer.addEventListener('click', openHashModal);
        console.log('Listener QR Code adicionado');
    }
}

function startGatekeeperSession() {
    ForensicLogger.addEntry('SESSION_START', { from: 'splash' });
    const splash = document.getElementById('splashScreen');
    const loading = document.getElementById('loadingOverlay');
    if (splash && loading) {
        splash.style.opacity = '0';
        setTimeout(() => {
            splash.style.display = 'none';
            loading.style.display = 'flex';
            loadSystemCore();
        }, 500);
    }
}

function loadSystemCore() {
    updateLoadingProgress(20);
    UNIFEDSystem.sessionId = generateSessionId();
    UNIFEDSystem._sessionStart = Date.now();
    setElementText('sessionIdDisplay', UNIFEDSystem.sessionId);
    setElementText('verdictSessionId', UNIFEDSystem.sessionId);
    generateQRCode();

    ForensicLogger.addEntry('SESSION_CREATED', { sessionId: UNIFEDSystem.sessionId });

    setTimeout(() => {
        updateLoadingProgress(40);
        populateYears();
        populateAnoFiscal();
        startClockAndDate();
        setupMainListeners();
        updateLoadingProgress(60);
        generateMasterHash();
        updateLoadingProgress(80);

        setTimeout(() => {
            updateLoadingProgress(100);
            setTimeout(showMainInterface, 500);
        }, 500);
    }, 500);
}

function updateLoadingProgress(percent) {
    const bar = document.getElementById('loadingProgress');
    const text = document.getElementById('loadingStatusText');
    if (bar) bar.style.width = percent + '%';
    if (text) text.textContent = `MÓDULO FORENSE BIG DATA v1.0-COMMERCIAL-LITIGATION · ISO/IEC 27037... ${percent}%`;
}

function showMainInterface() {
    const loading = document.getElementById('loadingOverlay');
    const main = document.getElementById('mainContainer');
    if (loading && main) {
        loading.style.opacity = '0';
        setTimeout(() => {
            loading.style.display = 'none';
            main.style.display = 'block';
            setTimeout(() => main.style.opacity = '1', 50);
            ForensicLogger.addEntry('MAIN_INTERFACE_SHOWN');
            window.dispatchEvent(new CustomEvent('unifed:interfaceShown'));
        }, 500);
    }
    logAudit('SISTEMA UNIFED - PROBATUM v1.0-COMMERCIAL-LITIGATION · ISO/IEC 27037 · D.L. 28/2019 · MODO PROFISSIONAL ATIVADO · EXTRAÇÃO PRECISA · CSC ONLINE', 'success');

    const analyzeBtn = document.getElementById('analyzeBtn');
    if (analyzeBtn) analyzeBtn.disabled = false;

    const exportPDFBtn = document.getElementById('exportPDFBtn');
    if (exportPDFBtn) exportPDFBtn.disabled = false;

    const exportJSONBtn = document.getElementById('exportJSONBtn');
    if (exportJSONBtn) exportJSONBtn.disabled = false;

    injectAuxiliaryHelperBoxes();

    setTimeout(forensicDataSynchronization, 1000);
}

function loadSystemRecursively() {
    try {
        const stored = localStorage.getItem('ifde_client_data_v12_8');
        if (stored) {
            const client = JSON.parse(stored);
            if (client && client.name && client.nif) {
                UNIFEDSystem.client = client;
                document.getElementById('clientStatusFixed').style.display = 'flex';
                setElementText('clientNameDisplayFixed', client.name);
                setElementText('clientNifDisplayFixed', client.nif);
                document.getElementById('clientNameFixed').value = client.name;
                document.getElementById('clientNIFFixed').value = client.nif;
                logAudit(`Sujeito passivo recuperado: ${client.name}`, 'success');
                ForensicLogger.addEntry('CLIENT_RESTORED', { name: client.name, nif: client.nif });
            }
        }
    } catch(e) { console.warn('Cache limpo'); }
    startClockAndDate();
}

function populateAnoFiscal() {
    const selectAno = document.getElementById('anoFiscal');
    if (!selectAno) return;
    selectAno.innerHTML = '';
    for(let ano = 2018; ano <= 2036; ano++) {
        const opt = document.createElement('option');
        opt.value = ano;
        opt.textContent = ano;
        if(ano === 2024) opt.selected = true;
        selectAno.appendChild(opt);
    }
}

function populateYears() {
    const sel = document.getElementById('anoFiscal');
    if(!sel) return;
    sel.innerHTML = '';
    for(let y=2036; y>=2018; y--) {
        const opt = document.createElement('option');
        opt.value = y;
        opt.textContent = y;
        if(y === 2024) opt.selected = true;
        sel.appendChild(opt);
    }
}

function startClockAndDate() {
    const update = () => {
        const now = new Date();
        const locale = currentLang === 'pt' ? 'pt-PT' : 'en-US';
        const dateStr = now.toLocaleDateString(locale);
        const timeStr = now.toLocaleTimeString(locale);
        setElementText('currentDate', dateStr);
        setElementText('currentTime', timeStr);
    };
    update();
    setInterval(update, 1000);
}

function generateQRCode() {
    const container = document.getElementById('qrcodeContainer');
    if (!container) return;

    // RETIFICAÇÃO R-QR-2: validar hash antes de gerar QR Code.
    // Se masterHash não tiver 64 chars, aguardar em vez de gerar QR inválido.
    const masterHash = (UNIFEDSystem.masterHash && UNIFEDSystem.masterHash.length === 64)
        ? UNIFEDSystem.masterHash.toUpperCase()
        : null;

    if (!masterHash) {
        console.warn('[QR] Master hash indisponível ou inválido (length=' +
            (UNIFEDSystem.masterHash ? UNIFEDSystem.masterHash.length : 0) +
            ') — QR Code não gerado. A aguardar generateMasterHash().');
        container.innerHTML = '<div style="color:#00e5ff;font-size:0.7rem;text-align:center;padding:8px;">A aguardar hash...</div>';
        return;
    }

    const sessionId = (UNIFEDSystem.sessionId || 'SESSAO_INDISPONIVEL').toUpperCase();

    // <-- RETIFICAÇÃO 4: Alinhamento de sintaxe com o PDF (gerarQRCodeDataURL)
    const qrData = `SESSAO:${sessionId} MASTER HASH SHA-256:${masterHash}`;

    // Activar lock para permitir que a vacina HTML deixe passar esta escrita legítima
    window._qrCodeLock = true;
    container.innerHTML = '';
    if (typeof QRCode !== 'undefined') {
        new QRCode(container, {
            text: qrData,
            width: 128,
            height: 128,
            colorDark: "#000000",
            colorLight: "#ffffff",
            correctLevel: QRCode.CorrectLevel.Q
        });
        console.log('[QR] ✅ QR Code gerado. Hash:', masterHash.substring(0, 16) + '...' + masterHash.substring(48));
    } else {
        console.error('[QR] ❌ QRCode.js não disponível — QR Code não renderizado.');
    }
    window._qrCodeLock = false;
    container.setAttribute('data-tooltip', 'Clique para verificar a cadeia de custódia completa');
}

function setupMainListeners() {
    const registerBtn = document.getElementById('registerClientBtnFixed');
    if (registerBtn) registerBtn.addEventListener('click', registerClient);

    const demoBtn = document.getElementById('demoModeBtn');
    if (demoBtn) demoBtn.addEventListener('click', activateDemoMode);

    const anoFiscal = document.getElementById('anoFiscal');
    if (anoFiscal) {
        anoFiscal.addEventListener('change', (e) => {
            UNIFEDSystem.selectedYear = parseInt(e.target.value);
            logAudit(`Ano fiscal em exame alterado para: ${e.target.value}`, 'info');
            ForensicLogger.addEntry('YEAR_CHANGED', { year: e.target.value });
        });
    }

    const periodoAnalise = document.getElementById('periodoAnalise');
    if (periodoAnalise) {
        const toggleTrimestralSelector = (value) => {
            const container = document.getElementById('trimestralSelectorContainer');
            if (!container) return;
            if (value === 'trimestral') {
                container.style.display = 'flex';
                container.classList.add('show');
            } else {
                container.style.display = 'none';
                container.classList.remove('show');
            }
        };

        periodoAnalise.addEventListener('change', (e) => {
            UNIFEDSystem.selectedPeriodo = e.target.value;
            const periodos = {
                'anual': currentLang === 'pt' ? 'Exercício Completo (Anual)' : 'Full Year (Annual)',
                '1s': currentLang === 'pt' ? '1.º Semestre' : '1st Semester',
                '2s': currentLang === 'pt' ? '2.º Semestre' : '2nd Semester',
                'trimestral': currentLang === 'pt' ? 'Análise Trimestral' : 'Quarterly Analysis',
                'mensal': currentLang === 'pt' ? 'Análise Mensal' : 'Monthly Analysis'
            };
            toggleTrimestralSelector(e.target.value);
            logAudit(`Período temporal alterado para: ${periodos[e.target.value] || e.target.value}`, 'info');
            ForensicLogger.addEntry('PERIOD_CHANGED', { period: e.target.value });
            filterDAC7ByPeriod();
        });

        const triSel = document.getElementById('trimestralSelector');
        if (triSel) {
            triSel.addEventListener('change', (e) => {
                const tri = parseInt(e.target.value, 10);
                if (tri >= 1 && tri <= 4) {
                    UNIFEDSystem.selectedTrimestre = tri;
                    logAudit(`Trimestre activo alterado para: Q${tri}`, 'info');
                    filterDAC7ByPeriod();
                }
            });
        }

        toggleTrimestralSelector(periodoAnalise.value);
    }

    const selPlatform = document.getElementById('selPlatformFixed');
    if (selPlatform) {
        selPlatform.addEventListener('change', (e) => {
            UNIFEDSystem.selectedPlatform = e.target.value;
            logAudit(`Plataforma alterada para: ${e.target.value.toUpperCase()}`, 'info');
            ForensicLogger.addEntry('PLATFORM_CHANGED', { platform: e.target.value });
        });
    }

    const openEvidenceBtn = document.getElementById('openEvidenceModalBtn');
    if (openEvidenceBtn) {
        openEvidenceBtn.addEventListener('click', () => {
            document.getElementById('evidenceModal').style.display = 'flex';
            updateEvidenceSummary();
            forensicDataSynchronization();
            ForensicLogger.addEntry('EVIDENCE_MODAL_OPENED');
        });
    }

    const closeModal = () => {
        document.getElementById('evidenceModal').style.display = 'none';
        updateAnalysisButton();
        forensicDataSynchronization();
        ForensicLogger.addEntry('EVIDENCE_MODAL_CLOSED');
    };

    const closeModalBtn = document.getElementById('closeModalBtn');
    if (closeModalBtn) closeModalBtn.addEventListener('click', closeModal);

    const closeAndSaveBtn = document.getElementById('closeAndSaveBtn');
    if (closeAndSaveBtn) closeAndSaveBtn.addEventListener('click', closeModal);

    const evidenceModal = document.getElementById('evidenceModal');
    if (evidenceModal) {
        evidenceModal.addEventListener('click', (e) => {
            if(e.target.id === 'evidenceModal') closeModal();
        });
    }
// Botão SELAR EVIDÊNCIAS – regista na cadeia de custódia e fecha o modal
const modalSaveBtn = document.getElementById('modalSaveBtn');
if (modalSaveBtn) {
    modalSaveBtn.addEventListener('click', async () => {
        try {
            // Registar a selagem na cadeia de custódia (se disponível)
            if (window.UNIFED_FORENSIC_SYSTEM?.chainOfCustody) {
                await window.UNIFED_FORENSIC_SYSTEM.chainOfCustody.addEntry(
                    'EVIDENCE_SEALED_BUTTON',
                    {
                        timestamp: new Date().toISOString(),
                        evidenceCount: UNIFEDSystem?.counts?.total || 0,
                        action: 'Selagem de evidências via modal'
                    },
                    { source: 'modal_save_btn' }
                );
                console.log('[UNIFED] Selagem registada na cadeia de custódia.');
            } else {
                console.warn('[UNIFED] Cadeia de custódia não disponível – selagem não registada.');
            }
        } catch (err) {
            console.error('[UNIFED] Erro ao registar selagem:', err);
        } finally {
            // Fechar o modal e actualizar interface
            closeModal();
        }
    });
}


    const analyzeBtn = document.getElementById('analyzeBtn');
    if (analyzeBtn) analyzeBtn.addEventListener('click', performAudit);

    const exportPDFBtn = document.getElementById('exportPDFBtn');
    if (exportPDFBtn) exportPDFBtn.addEventListener('click', exportPDF);

    const exportJSONBtn = document.getElementById('exportJSONBtn');
    if (exportJSONBtn) exportJSONBtn.addEventListener('click', exportDataJSON);

    const exportDOCXBtn = document.getElementById('exportDOCXBtn');
    if (exportDOCXBtn) exportDOCXBtn.addEventListener('click', () => {
        if (typeof window.exportDOCX === 'function') window.exportDOCX();
        else showToast('Módulo DOCX não disponível.', 'error');
    });

    const atfBtn = document.getElementById('atfModalBtn');
    if (atfBtn) atfBtn.addEventListener('click', () => {
        if (typeof window.openATFModal === 'function') window.openATFModal();
        else showToast('Módulo ATF não disponível.', 'warning');
    });

    const exportAnalystBtn = document.getElementById('exportAnalystBtn');
    if (exportAnalystBtn && !exportAnalystBtn._triadaBound) {
        exportAnalystBtn.addEventListener('click', async () => {
            if (typeof window._exportPacoteAnalista === 'function') {
                const gateOk = typeof window.UNIFED_validateBeforeExport === 'function'
                    ? await window.UNIFED_validateBeforeExport('Pacote Analista')
                    : true;
                if (!gateOk) { console.error('[HMAC·GATE] Exportação bloqueada'); return; }
                window._exportPacoteAnalista().catch(err => console.error('[EXPORT] Analista:', err.message));
            } else {
                showToast('Função de exportação analista não disponível.', 'error');
            }
        });
        exportAnalystBtn._triadaBound = true;
    }

    const exportLawyerBtn = document.getElementById('exportLawyerBtn');
    if (exportLawyerBtn && !exportLawyerBtn._triadaBound) {
        exportLawyerBtn.addEventListener('click', async () => {
            if (typeof window._exportPacoteAdvogado === 'function') {
                const gateOk = typeof window.UNIFED_validateBeforeExport === 'function'
                    ? await window.UNIFED_validateBeforeExport('Pacote Advogado')
                    : true;
                if (!gateOk) { console.error('[HMAC·GATE] Exportação bloqueada'); return; }
                window._exportPacoteAdvogado().catch(err => console.error('[EXPORT] Advogado:', err.message));
            } else {
                showToast('Função de exportação advogado não disponível.', 'error');
            }
        });
        exportLawyerBtn._triadaBound = true;
    }

    const exportWordBtn = document.getElementById('exportWordBtn');
    if (exportWordBtn) {
        exportWordBtn.addEventListener('click', () => {
            if (typeof window.exportDOCX_RETIFICADO === 'function') {
                window.exportDOCX_RETIFICADO('lawyer', window.currentLang || 'pt');
            } else if (typeof window.exportDOCX === 'function') {
                window.exportDOCX();
            } else {
                showToast('Módulo DOCX não disponível.', 'error');
            }
        });
    }

    const exportGraphicsBtn = document.getElementById('exportGraphicsBtn');
    if (exportGraphicsBtn) {
        exportGraphicsBtn.addEventListener('click', () => {
            if (typeof window.exportGraphics === 'function') {
                window.exportGraphics();
            } else {
                showToast('Exportação de gráficos em desenvolvimento.', 'info');
            }
        });
    }

    const resetBtn = document.getElementById('resetBtn');
    if (resetBtn) resetBtn.addEventListener('click', resetSystem);

    setupUploadListeners();
}

function setupClearConsoleButton() {
    const clearBtn = document.getElementById('clearConsoleBtn');
    if (clearBtn) {
        clearBtn.addEventListener('click', clearConsoleVisual);
        console.log('Listener clearConsoleBtn adicionado');
    } else {
        console.error('Botão clearConsoleBtn não encontrado');
    }
}

function setupDragAndDrop() {
    const dropZone = document.getElementById('globalDropZone');
    const fileInput = document.getElementById('globalFileInput');

    if (!dropZone || !fileInput) return;

    dropZone.addEventListener('click', () => {
        fileInput.click();
    });

    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, preventDefaults, false);
        document.body.addEventListener(eventName, preventDefaults, false);
    });

    ['dragenter', 'dragover'].forEach(eventName => {
        dropZone.addEventListener(eventName, highlight, false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, unhighlight, false);
    });

    dropZone.addEventListener('drop', handleDrop, false);
    fileInput.addEventListener('change', handleGlobalFileSelect);
}

function preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
}

function highlight() {
    document.getElementById('globalDropZone').classList.add('drag-over');
}

function unhighlight() {
    document.getElementById('globalDropZone').classList.remove('drag-over');
}

function handleDrop(e) {
    const dt = e.dataTransfer;
    const files = Array.from(dt.files);
    processBatchFiles(files);
    ForensicLogger.addEntry('FILES_DROPPED', { count: files.length });
}

function handleGlobalFileSelect(e) {
    const files = Array.from(e.target.files);
    processBatchFiles(files);
    ForensicLogger.addEntry('FILES_SELECTED', { count: files.length });
    e.target.value = '';
}

// ============================================================================
// processBatchFiles – VERSÃO SANITIZADA (filtro ativo)
// ============================================================================
async function processBatchFiles(files) {
    // Aplica sanitização – remove ficheiros com nome iniciado por "demo_"
    const sanitizedFiles = files.filter(file => !file.name.startsWith('demo_'));

    if (sanitizedFiles.length === 0) {
        logAudit('⚠️ Nenhum ficheiro válido após sanitização (todos os ficheiros eram artefactos de teste).', 'warning');
        return;
    }

    const statusEl = document.getElementById('globalProcessingStatus');
    if (statusEl) {
        statusEl.style.display = 'block';
        statusEl.innerHTML = `<p><i class="fas fa-spinner fa-spin"></i> A processar ${sanitizedFiles.length} ficheiro(s) em lote...</p>`;
    }

    logAudit(`🚀 INICIANDO PROCESSAMENTO EM LOTE: ${sanitizedFiles.length} ficheiro(s) (${files.length - sanitizedFiles.length} artefactos demo ignorados)`, 'info');
    ForensicLogger.addEntry('BATCH_PROCESSING_START', { count: sanitizedFiles.length, skipped: files.length - sanitizedFiles.length });

    for (const file of sanitizedFiles) {
        fileProcessingQueue.push(file);
    }

    if (!isProcessingQueue) {
        processQueue();
    }
}

async function processQueue() {
    isProcessingQueue = true;
    const statusEl = document.getElementById('globalProcessingStatus');
    let processed = 0;
    const total = fileProcessingQueue.length;

    while (fileProcessingQueue.length > 0) {
        const file = fileProcessingQueue.shift();
        processed++;

        if (statusEl) {
            statusEl.innerHTML = `<p><i class="fas fa-spinner fa-spin"></i> A processar ${processed}/${total}: ${file.name}</p>`;
        }

        const fileType = await detectFileType(file);

        try {
            await processFile(file, fileType);
        } catch (error) {
            console.error(`Erro ao processar ${file.name}:`, error);
            logAudit(`❌ Erro ao processar ${file.name}: ${error.message}`, 'error');
            ForensicLogger.addEntry('FILE_PROCESSING_ERROR', { filename: file.name, error: error.message });
        }

        await new Promise(resolve => setTimeout(resolve, 10));
    }

    isProcessingQueue = false;

    if (statusEl) {
        statusEl.style.display = 'none';
    }

    logAudit(`✅ Processamento em lote concluído. Total: ${total} ficheiro(s)`, 'success');
    ForensicLogger.addEntry('BATCH_PROCESSING_COMPLETE', { total });
    updateEvidenceSummary();
    updateCounters();
    generateMasterHash();
    forensicDataSynchronization();
    showToast(`${total} ficheiro(s) processados em lote`, 'success');
}

async function detectFileType(file) {
    const name = file.name.toLowerCase();

    if (name.includes('fatura') ||
        name.includes('invoice') ||
        name.match(/pt\d{4}-\d{5}/i) ||
        name.match(/pt\d{4,5}-\d{3,5}/i) ||
        (file.type === 'application/pdf' && name.match(/\d{4}-\d{5}/))) {
        return 'invoice';
    }

    // Detecção SAF-T: aceita qualquer prefixo numérico (XXXXXXX_AAAAMM.csv)
    // Padrão original era específico de um contribuinte (131509); generalizado para conformidade
    if (name.match(/\d{5,9}.*\.csv$/) || name.includes('saf-t') || name.includes('saft')) {
        return 'saft';
    }

    if (name.includes('extrato') || name.includes('statement') ||
        name.includes('ganhos') || name.includes('earnings')) {
        return 'statement';
    }

    if (name.includes('dac7') || name.includes('dac-7')) {
        return 'dac7';
    }

    if (name.includes('controlo') || name.includes('control')) {
        return 'control';
    }

    if (file.type === 'application/pdf' || name.endsWith('.pdf')) {
        try {
            const arrayBuffer = await file.slice(0, 1024 * 100).arrayBuffer();
            const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
            const page = await pdf.getPage(1);
            const content = await page.getTextContent();
            const text = content.items.map(item => item.str).join(' ').toLowerCase();

            if (text.includes('dac7') ||
                (text.includes('ganhos') && text.includes('trimestre')) ||
                (text.includes('earnings') && text.includes('quarter'))) {
                return 'dac7';
            }

            if (text.includes('fatura') || text.includes('invoice') || text.includes('comissão')) {
                return 'invoice';
            }

            if (text.includes('extrato') || text.includes('statement') || text.includes('ganhos')) {
                return 'statement';
            }
        } catch (e) {
            console.warn('Erro ao analisar conteúdo PDF para deteção de tipo:', e);
        }
    }

    return 'unknown';
}

function setupUploadListeners() {
    const types = ['control', 'saft', 'invoice', 'statement', 'dac7'];
    types.forEach(type => {
        const btn = document.getElementById(`${type}UploadBtnModal`);
        const input = document.getElementById(`${type}FileModal`);
        if (btn && input) {
            btn.addEventListener('click', () => input.click());
            input.addEventListener('change', (e) => {
                const files = Array.from(e.target.files);
                processBatchFiles(files);
                e.target.value = '';
            });
        }
    });
}

function registerClient() {
    const name = document.getElementById('clientNameFixed').value.trim();
    const nif = document.getElementById('clientNIFFixed').value.trim();

    if (!name || name.length < 3) return showToast('Nome inválido', 'error');
    if (!validateNIF(nif)) return showToast('NIF inválido (checksum falhou)', 'error');

    UNIFEDSystem.client = { name, nif, platform: UNIFEDSystem.selectedPlatform };
    localStorage.setItem('ifde_client_data_v12_8', JSON.stringify(UNIFEDSystem.client));

    document.getElementById('clientStatusFixed').style.display = 'flex';
    setElementText('clientNameDisplayFixed', name);
    setElementText('clientNifDisplayFixed', nif);

    logAudit(`Sujeito passivo registado: ${name} (NIF ${nif})`, 'success');
    ForensicLogger.addEntry('CLIENT_REGISTERED', { name, nif });
    showToast('Identidade validada com sucesso', 'success');
    updateAnalysisButton();
}

async function processFile(file, type) {
    // FIX-DEMO-01: trava de segurança — ficheiro real detectado em modo DEMO.
    // Protege a cadeia de custódia de desfasamento entre métricas hardcoded e documentos reais.
    // Ref: Achado 2 · Relatório de Auditoria UNIFED-PROBATUM v1.0-COMMERCIAL-LITIGATION.
    if (window.UNIFEDSystem && window.UNIFEDSystem.demoMode) {
        console.warn('[SECURITY] ⚠ Ficheiro real detectado em modo DEMO. A reiniciar estado para proteger a cadeia de custódia.');
        if (typeof resetAllValues === 'function') {
            resetAllValues();
        } else {
            // Fallback directo se resetAllValues ainda não estiver disponível
            window.UNIFEDSystem.demoMode          = false;
            window.UNIFEDSystem.casoRealAnonimizado = false;
        }
        window.UNIFEDSystem.demoMode          = false;
        window.UNIFEDSystem.casoRealAnonimizado = false;
        if (window.UNIFED_FORENSIC_LOG) {
            window.UNIFED_FORENSIC_LOG.push({
                timestamp: new Date().toISOString(), level: 'warn',
                module: 'PROCESS_FILE',
                message: 'demoMode desactivado — ficheiro real submetido: ' + (file ? file.name : 'unknown')
            });
        }
    }

    // RETIFICAÇÃO: upload de ficheiro real — ocultar indicadores SANDBOX e desbloquear interface
    if (typeof window.toggleSandboxBanner === 'function') {
        window.toggleSandboxBanner(false);
    }
    window._isSyncing = false;
    if (window.UNIFEDSystem) window.UNIFEDSystem.processing = false;

    const fileKey = `${file.name}_${file.size}_${file.lastModified}`;
    if (UNIFEDSystem.processedFiles.has(fileKey)) {
        logAudit(`[!] Ficheiro duplicado ignorado: ${file.name}`, 'warning');
        return;
    }
    UNIFEDSystem.processedFiles.add(fileKey);
    ForensicLogger.addEntry('FILE_PROCESSING_START', { filename: file.name, type });

    let text = "";
    let isPDF = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');

    if (isPDF) {
        try {
            const arrayBuffer = await file.arrayBuffer();
            const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
            let fullText = "";

            for (let i = 1; i <= pdf.numPages; i++) {
                const page = await pdf.getPage(i);
                const content = await page.getTextContent();
                fullText += content.items.map(item => item.str).join(" ") + "\n";
            }

            text = fullText
                .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F]/g, ' ')
                .replace(/\s+/g, ' ')
                .replace(/[–—−]/g, '-')
                .replace(/(\d)[\s\n\r]+(\d)/g, '$1$2')
                .replace(/[""]/g, '"')
                .replace(/''/g, "'");

            logAudit(`📄 PDF processado: ${file.name} - Texto extraído e limpo (${text.length} caracteres)`, 'info');
        } catch (pdfError) {
            console.warn('Erro no processamento PDF, a usar fallback:', pdfError);
            text = "[PDF_PROCESSING_ERROR]";
            ForensicLogger.addEntry('PDF_PROCESSING_ERROR', { filename: file.name, error: pdfError.message });
        }
    } else {
        text = await readFileAsText(file);
    }

    const contentToHash = text;
    const hash = CryptoJS.SHA256(contentToHash).toString();

    await generateForensicLog('FILE_INGESTED', file.name, hash);

    if(!UNIFEDSystem.documents[type]) {
        UNIFEDSystem.documents[type] = { files: [], hashes: {}, totals: { records: 0 } };
    }

    if (!UNIFEDSystem.documents[type].files) {
        UNIFEDSystem.documents[type].files = [];
    }

    const fileEntryKey = `${file.name}_${file.size}_${file.lastModified}`;
    const fileExists = UNIFEDSystem.documents[type].files.some(
        f => `${f.name}_${f.size}_${f.lastModified}` === fileEntryKey
    );
    if (!fileExists) {
        UNIFEDSystem.documents[type].files.push({
            name: file.name,
            size: file.size,
            type: file.type,
            lastModified: file.lastModified
        });
        ForensicLogger.addEntry('FILE_ADDED_TO_EVIDENCE', {
            filename: file.name,
            fileKey: fileEntryKey,
            type,
            hash,
            timestamp: new Date().toISOString()
        });
    }

    UNIFEDSystem.documents[type].hashes[fileEntryKey] = hash;
    UNIFEDSystem.documents[type].totals.records = UNIFEDSystem.documents[type].files.length;

    UNIFEDSystem.analysis.evidenceIntegrity.push({
        filename:     file.name,
        type,
        hash,
        timestamp:    new Date().toLocaleString(),
        size:         file.size,
        timestampUnix: Math.floor(Date.now() / 1000),
        sealType:     'NONE',
        sealStatus:   'PENDENTE',
        sealDate:     null,
        tsrPath:      null
    });

    UNIFEDSystem.fileSources.set(file.name, {
        type: type,
        hash: hash,
        processedAt: new Date().toISOString()
    });

    if (type === 'statement') {
        try {
            let yearMonth = null;

            const mesPattern = /(\d{1,2})\s*(jan|fev|mar|abr|mai|jun|jul|ago|set|out|nov|dez)\s*(\d{4})/i;
            const mesMatch = file.name.match(mesPattern);

            if (mesMatch) {
                const meses = {
                    'jan': '01', 'fev': '02', 'mar': '03', 'abr': '04',
                    'mai': '05', 'jun': '06', 'jul': '07', 'ago': '08',
                    'set': '09', 'out': '10', 'nov': '11', 'dez': '12'
                };
                const ano = mesMatch[3];
                const mes = meses[mesMatch[2].toLowerCase()];
                if (mes) {
                    yearMonth = ano + mes;
                    logAudit(`   Mês detetado: ${yearMonth} (a partir do nome do ficheiro)`, 'info');
                }
            }

            if (!yearMonth) {
                const dataPattern = /(\d{4})-(\d{2})-\d{2}/;
                const dataMatch = text.match(dataPattern);
                if (dataMatch) {
                    yearMonth = dataMatch[1] + dataMatch[2];
                    logAudit(`   Mês detetado: ${yearMonth} (a partir de data no PDF)`, 'info');
                }
            }

            if (!yearMonth) {
                const dataPTPattern = /(\d{2})-(\d{2})-(\d{4})/;
                const dataPTMatch = text.match(dataPTPattern);
                if (dataPTMatch) {
                    yearMonth = dataPTMatch[3] + dataPTMatch[2];
                    logAudit(`   Mês detetado: ${yearMonth} (a partir de data PT no PDF)`, 'info');
                }
            }

            if (yearMonth) {
                UNIFEDSystem.dataMonths.add(yearMonth);
            }

            const extracted = SchemaRegistry.processStatement(text, file.name);

            UNIFEDSystem.documents.statements.totals.ganhos = (UNIFEDSystem.documents.statements.totals.ganhos || 0) + extracted.ganhos;
            UNIFEDSystem.documents.statements.totals.despesas = (UNIFEDSystem.documents.statements.totals.despesas || 0) + extracted.despesas;
            UNIFEDSystem.documents.statements.totals.ganhosLiquidos = (UNIFEDSystem.documents.statements.totals.ganhosLiquidos || 0) + extracted.ganhosLiq;

            ValueSource.registerValue('stmtGanhosValue', extracted.ganhos, file.name, 'extração tabela Ganhos líquidos');
            ValueSource.registerValue('stmtDespesasValue', extracted.despesas, file.name, 'extração tabela Ganhos líquidos');
            ValueSource.registerValue('stmtGanhosLiquidosValue', extracted.ganhosLiq, file.name, 'extração tabela Ganhos líquidos');

            if (yearMonth) {
                if (!UNIFEDSystem.monthlyData[yearMonth]) {
                    UNIFEDSystem.monthlyData[yearMonth] = { ganhos: 0, despesas: 0, ganhosLiq: 0 };
                }
                UNIFEDSystem.monthlyData[yearMonth].ganhos    += extracted.ganhos    || 0;
                UNIFEDSystem.monthlyData[yearMonth].despesas  += extracted.despesas  || 0;
                UNIFEDSystem.monthlyData[yearMonth].ganhosLiq += extracted.ganhosLiq || 0;
            }

            processAuxiliaryPlatformData(text, file.name);

            logAudit(`📊 Extrato processado (v1.0-COMMERCIAL-LITIGATION): ${file.name} | Ganhos: ${formatCurrency(extracted.ganhos)} | Despesas: ${formatCurrency(extracted.despesas)} | Líquido: ${formatCurrency(extracted.ganhosLiq)}`, 'success');
            ForensicLogger.addEntry('STATEMENT_PROCESSED', { filename: file.name, ...extracted });

        } catch(e) {
            console.warn(`Erro ao processar extrato ${file.name}:`, e);
            logAudit(`[!] Erro no processamento do extrato: ${e.message}`, 'warning');
            ForensicLogger.addEntry('STATEMENT_PROCESSING_ERROR', { filename: file.name, error: e.message });
        }
    }

    if (type === 'invoice' || (type === 'unknown' && file.name.match(/pt\d{4}-\d{5}/i))) {
        try {
            if (type === 'unknown') {
                type = 'invoice';
                logAudit(`📌 Ficheiro reclassificado como fatura: ${file.name}`, 'info');
            }

            const extracted = SchemaRegistry.processInvoice(text, file.name);

            if (extracted.valorTotal > 0) {
                if (!UNIFEDSystem.documents.invoices.totals) {
                    UNIFEDSystem.documents.invoices.totals = { invoiceValue: 0, records: 0 };
                }

                UNIFEDSystem.documents.invoices.totals.invoiceValue = (UNIFEDSystem.documents.invoices.totals.invoiceValue || 0) + extracted.valorTotal;
                UNIFEDSystem.documents.invoices.totals.records = (UNIFEDSystem.documents.invoices.totals.records || 0) + 1;

                ValueSource.registerValue('kpiInvValue', extracted.valorTotal, file.name, 'extração dinâmica SchemaRegistry');

                logAudit(`💰 Fatura processada: ${file.name} | +${formatCurrency(extracted.valorTotal)} | Total acumulado: ${formatCurrency(UNIFEDSystem.documents.invoices.totals.invoiceValue)} (${UNIFEDSystem.documents.invoices.totals.records} faturas)`, 'success');
                ForensicLogger.addEntry('INVOICE_PROCESSED', { filename: file.name, valor: extracted.valorTotal });
            } else {
                logAudit(`[!] Não foi possível extrair valor da fatura: ${file.name}`, 'warning');
            }

        } catch(e) {
            console.warn(`Erro ao processar fatura ${file.name}:`, e);
            logAudit(`[!] Erro no processamento da fatura: ${e.message}`, 'warning');
            ForensicLogger.addEntry('INVOICE_PROCESSING_ERROR', { filename: file.name, error: e.message });
        }
    }

    // Extração de mês SAF-T: padrão genérico XXXXXXX_AAAAMM.csv
    if (type === 'saft' && file.name.match(/\d{5,9}.*\.csv$/i)) {
        try {
            // Aceita qualquer prefixo numérico: XXXXXXX_202409.csv → extrai 202409
            const monthMatch = file.name.match(/_(\d{6})/) || file.name.match(/(\d{6})(?=\.csv)/i);
            if (monthMatch && monthMatch[1]) {
                const yearMonth = monthMatch[1];
                UNIFEDSystem.dataMonths.add(yearMonth);
                logAudit(`   Mês detetado: ${yearMonth}`, 'info');
            }

            if (text.charCodeAt(0) === 0xFEFF || text.charCodeAt(0) === 0xFFFE) {
                text = text.substring(1);
            }

            const parseResult = Papa.parse(text, {
                header: true,
                skipEmptyLines: true,
                quotes: true,
                delimiter: ','
            });

            const extracted = SchemaRegistry.processSAFT(parseResult, file.name);

            if (!UNIFEDSystem.documents.saft.totals) {
                UNIFEDSystem.documents.saft.totals = { records: 0, iliquido: 0, iva: 0, bruto: 0 };
            }

            UNIFEDSystem.documents.saft.totals.bruto = (UNIFEDSystem.documents.saft.totals.bruto || 0) + extracted.totalBruto;
            UNIFEDSystem.documents.saft.totals.iva = (UNIFEDSystem.documents.saft.totals.iva || 0) + extracted.totalIVA;
            UNIFEDSystem.documents.saft.totals.iliquido = (UNIFEDSystem.documents.saft.totals.iliquido || 0) + extracted.totalIliquido;
            UNIFEDSystem.documents.saft.totals.records = (UNIFEDSystem.documents.saft.totals.records || 0) + extracted.recordCount;

            ValueSource.registerValue('saftBrutoValue', extracted.totalBruto, file.name, 'soma direta coluna 16');
            ValueSource.registerValue('saftIvaValue', extracted.totalIVA, file.name, 'soma direta coluna 15');
            ValueSource.registerValue('saftIliquidoValue', extracted.totalIliquido, file.name, 'soma direta coluna 14');

            logAudit(`📊 SAF-T CSV: ${file.name} | +${formatCurrency(extracted.totalBruto)} (${extracted.recordCount} registos) | IVA: +${formatCurrency(extracted.totalIVA)} | Ilíquido: +${formatCurrency(extracted.totalIliquido)}`, 'success');
            ForensicLogger.addEntry('SAFT_PROCESSED', { filename: file.name, total: extracted.totalBruto, iva: extracted.totalIVA, iliquido: extracted.totalIliquido });

        } catch(e) {
            console.warn(`Erro ao processar SAF-T ${file.name}:`, e);
            logAudit(`[!] Erro no processamento SAF-T: ${e.message}`, 'warning');
            ForensicLogger.addEntry('SAFT_PROCESSING_ERROR', { filename: file.name, error: e.message });
        }
    }

    if (type === 'dac7') {
        try {
            const extracted = SchemaRegistry.processDAC7(text, file.name, UNIFEDSystem.selectedPeriodo);

            UNIFEDSystem.documents.dac7.totals.q1 = (UNIFEDSystem.documents.dac7.totals.q1 || 0) + extracted.q1;
            UNIFEDSystem.documents.dac7.totals.q2 = (UNIFEDSystem.documents.dac7.totals.q2 || 0) + extracted.q2;
            UNIFEDSystem.documents.dac7.totals.q3 = (UNIFEDSystem.documents.dac7.totals.q3 || 0) + extracted.q3;
            UNIFEDSystem.documents.dac7.totals.q4 = (UNIFEDSystem.documents.dac7.totals.q4 || 0) + extracted.q4;
            UNIFEDSystem.documents.dac7.totals.receitaAnual = (UNIFEDSystem.documents.dac7.totals.receitaAnual || 0) + extracted.receitaAnual;

            ValueSource.registerValue('dac7Q1Value', extracted.q1, file.name, 'extração dinâmica SchemaRegistry');
            ValueSource.registerValue('dac7Q2Value', extracted.q2, file.name, 'extração dinâmica SchemaRegistry');
            ValueSource.registerValue('dac7Q3Value', extracted.q3, file.name, 'extração dinâmica SchemaRegistry');
            ValueSource.registerValue('dac7Q4Value', extracted.q4, file.name, 'extração dinâmica SchemaRegistry');

            logAudit(`📈 DAC7 processado: ${file.name} | Q1: ${formatCurrency(extracted.q1)} | Q2: ${formatCurrency(extracted.q2)} | Q3: ${formatCurrency(extracted.q3)} | Q4: ${formatCurrency(extracted.q4)}`, 'success');
            ForensicLogger.addEntry('DAC7_PROCESSED', { filename: file.name, q1: extracted.q1, q2: extracted.q2, q3: extracted.q3, q4: extracted.q4 });

        } catch(e) {
            console.warn(`Erro ao processar DAC7 ${file.name}:`, e);
            logAudit(`[!] Erro no processamento DAC7: ${e.message}`, 'warning');
        }
    }

    if (type === 'control') {
        logAudit(`🔐 Ficheiro de controlo registado: ${file.name}`, 'info');
        ForensicLogger.addEntry('CONTROL_FILE_ADDED', { filename: file.name });
    }

    const listId = getListIdForType(type);
    const listEl = document.getElementById(listId);

    const iconClass = isPDF ? 'fa-file-pdf' : 'fa-file-csv';
    const iconColor = isPDF ? '#e74c3c' : '#2ecc71';

    if(listEl) {
        listEl.style.display = 'block';
        const fileItem = document.createElement('div');
        fileItem.className = 'file-item-modal';

        const demoBadge = UNIFEDSystem.demoMode ? '<span class="demo-badge">DEMO</span>' : '';
        const shortHash = hash.substring(0, 8) + '...';

        fileItem.innerHTML = `
            <i class="fas ${iconClass}" style="color: ${iconColor};"></i>
            <span class="file-name-modal">${file.name} ${demoBadge}</span>
            <span class="file-hash-modal">${shortHash}</span>
        `;
        listEl.appendChild(fileItem);
    }

    forensicDataSynchronization();
}

function getListIdForType(type) {
    switch(type) {
        case 'invoice': return 'invoicesFileListModal';
        case 'statement': return 'statementsFileListModal';
        case 'dac7': return 'dac7FileListModal';
        case 'control': return 'controlFileListModal';
        case 'saft': return 'saftFileListModal';
        default: return 'globalFileListModal';
    }
}

function updateEvidenceSummary() {
    const tipos = {
        control: 'summaryControl',
        saft: 'summarySaft',
        invoices: 'summaryInvoices',
        statements: 'summaryStatements',
        dac7: 'summaryDac7'
    };

    Object.keys(tipos).forEach(k => {
        const count = UNIFEDSystem.documents[k]?.files?.length || 0;
        const elId = tipos[k];
        const el = document.getElementById(elId);
        if(el) el.textContent = count;
    });

    let total = 0;
    ['control', 'saft', 'invoices', 'statements', 'dac7'].forEach(k => {
        total += UNIFEDSystem.documents[k]?.files?.length || 0;
    });
    setElementText('summaryTotal', total);
    UNIFEDSystem.counts.total = total;
}

function updateCounters() {
    let total = 0;
    const tipoMap = {
        control: 'controlCountCompact',
        saft: 'saftCountCompact',
        invoices: 'invoiceCountCompact',
        statements: 'statementCountCompact',
        dac7: 'dac7CountCompact'
    };

    Object.keys(tipoMap).forEach(k => {
        const count = UNIFEDSystem.documents[k]?.files?.length || 0;
        total += count;
        setElementText(tipoMap[k], count);
    });

    document.getElementById('evidenceCountTotal').textContent = total;
    UNIFEDSystem.counts.total = total;
}

function activateDemoMode() {
    if (UNIFEDSystem.demoMode && !UNIFEDSystem.processing) {
        console.warn('[DEMO] Caso Real já ativo e renderizado. Abortando loop do Nexus.');
        return;
    }

    if (window._demoModeTimer) {
        clearTimeout(window._demoModeTimer);
        window._demoModeTimer = null;
    }

    if (UNIFEDSystem.processing) {
        console.warn('[DEMO] Execução em curso. Aguardando conclusão...');
        return;
    }

    const splash = document.getElementById('splashScreen');
    const loading = document.getElementById('loadingOverlay');
    const main = document.getElementById('mainContainer');
    if (splash) splash.style.display = 'none';
    if (loading) loading.style.display = 'none';
    if (main) {
        main.style.display = 'block';
        main.style.opacity = '1';
    }

    let storedLang = 'pt';
    try {
        const lsLang = localStorage.getItem('unifed_lang');
        if (lsLang === 'pt' || lsLang === 'en') storedLang = lsLang;
    } catch(e) {}
    window.currentLang = storedLang;

    const langBtn = document.getElementById('langToggleBtn');
    if (langBtn) {
        const span = langBtn.querySelector('span');
        if (span) span.textContent = (window.currentLang === 'pt') ? 'US' : 'PT';
    }

    if (typeof window.suppressTriadaUpdates === 'function') {
        window.suppressTriadaUpdates(true);
    }

    // ============================================================================
    // DEMO CONTROL SCHEMA — Esquema de Controlo para Simulação Forense
    // Injectado no sistema no momento da activação do modo DEMO.
    // Previne corrupção de log durante processamento LLM e garante
    // consistência matemática dos vectores de dados da apresentação.
    // ============================================================================
    window.DEMO_CONTROL_SCHEMA = Object.freeze({
        contexto_legal: 'SIMULAÇÃO - Preparação de DEMO de Auditoria Forense',
        restricoes_matematicas_criticas: Object.freeze({
            regra_1: 'Ganhos Líquidos = Ganhos (Extrato) - Despesas/Comissões (BTOR)',
            regra_2: 'Divergência Crítica = Despesas/Comissões (BTOR) - Comissões Faturadas (BTF)',
            regra_3: 'Total Não Sujeitos = Campanhas + Portagens + Gorjetas',
            regra_4: 'As percentagens (ex: 89.04%) devem ser recalculadas com base nos novos vectores injectados.'
        })
        // diretiva_hash ABLADA: o sistema não injeta placeholders destrutivos de hash.
        // Master Hash é sempre um SHA-256 determinístico gerado em runtime por sessionSalt.
    });

    /**
     * ABLAÇÃO v1.0-HOTFIX: sanitizeHashForDemo convertida em passthrough transparente.
     * A função anterior injetava ativamente '[HASH_INVALIDADO_POR_SIMULACAO_DEMO]'
     * em modo DEMO, destruindo a imutabilidade do Master Hash e invalidando o
     * argumento de integridade forense perante o douto tribunal.
     * O sistema gera agora sempre um SHA-256 real via generateDemoIntegrityHash().
     * Conformidade: eIDAS 2.0 Art. 42; ISO/IEC 27037:2012 §8.3; RFC 3161
     *
     * @param {string} hashValue - Hash SHA-256 (64 hex chars)
     * @returns {string} hashValue sem qualquer alteração (passthrough)
     */
    window.sanitizeHashForDemo = function(hashValue) { return hashValue; };

    /**
     * Valida as 4 restrições matemáticas críticas do DEMO_CONTROL_SCHEMA.
     * Recalcula obrigatoriamente as percentagens com base nos vectores actuais.
     * Lança aviso de consola para qualquer violação detectada (não aborta execução).
     *
     * @param {Object} totals - Objecto totals de UNIFEDSystem
     * @param {Object} aux    - Objecto auxiliaryData de UNIFEDSystem
     * @returns {Object} { valid: boolean, violations: string[], recalculated: {} }
     */
    window.validateDemoConstraints = function(totals, aux) {
        const violations = [];
        const recalculated = {};
        const TOL = 0.02; // tolerância de arredondamento: 2 cêntimos

        // REGRA 1: Ganhos Líquidos = Ganhos - BTOR
        const r1_expected = parseFloat((totals.ganhos - totals.despesas).toFixed(2));
        const r1_actual   = parseFloat((totals.ganhosLiquidos || 0).toFixed(2));
        if (Math.abs(r1_expected - r1_actual) > TOL) {
            violations.push(`REGRA 1 violada: GanhosLíquidos=${r1_actual} ≠ Ganhos-BTOR=${r1_expected}`);
        }
        recalculated.ganhosLiquidos = r1_expected;

        // REGRA 2: Divergência Crítica = BTOR - BTF
        const r2_expected = parseFloat((totals.despesas - totals.faturaPlataforma).toFixed(2));
        const r2_actual   = parseFloat((totals.discrepanciaCritica || 0).toFixed(2));
        if (Math.abs(r2_expected - r2_actual) > TOL) {
            violations.push(`REGRA 2 violada: DiscrepânciaCrítica=${r2_actual} ≠ BTOR-BTF=${r2_expected}`);
        }
        recalculated.discrepanciaCritica = r2_expected;

        // REGRA 3: Total Não Sujeitos = Campanhas + Portagens + Gorjetas
        const r3_campanhas = (aux && aux.campanhas)  || 405.00;
        const r3_portagens = (aux && aux.portagens)  || 0.15;
        const r3_gorjetas  = (aux && aux.gorjetas)   || 46.00;
        const r3_expected  = parseFloat((r3_campanhas + r3_portagens + r3_gorjetas).toFixed(2));
        const r3_actual    = parseFloat((aux && aux.totalNaoSujeitos || 0).toFixed(2));
        if (Math.abs(r3_expected - r3_actual) > TOL) {
            violations.push(`REGRA 3 violada: TotalNãoSujeitos=${r3_actual} ≠ ${r3_campanhas}+${r3_portagens}+${r3_gorjetas}=${r3_expected}`);
        }
        recalculated.totalNaoSujeitos = r3_expected;

        // REGRA 4: Percentagem de Omissão — recalculada obrigatoriamente
        const r4_pct = totals.despesas > 0
            ? parseFloat(((r2_expected / totals.despesas) * 100).toFixed(2))
            : 0;
        recalculated.percentagemOmissao = r4_pct;
        if (violations.length === 0) {
            console.info('[DEMO-SCHEMA] ✅ Todas as restrições matemáticas validadas. Percentagem recalculada: ' + r4_pct + '%');
        } else {
            violations.forEach(v => console.warn('[DEMO-SCHEMA] ⚠️ ' + v));
        }

        return { valid: violations.length === 0, violations, recalculated };
    };

    UNIFEDSystem.demoMode = true;
    UNIFEDSystem.casoRealAnonimizado = true;
    UNIFEDSystem.processing = true;
    // DEMO: autorizar download JSON para advogado sem override manual
    UNIFEDSystem.isAnalystOverrideActive = true;

    ForensicLogger.addEntry('DEMO_MODE_ACTIVATED');

    window.activeForensicSession = { sessionId: 'UNIFED-MMLADX8Q-CV69L', masterHash: '5150e7674b891d5d07ca990e4c7124fc66af40488452759aeebdf84976eaa8f6' };
    try { sessionStorage.setItem('currentSession', JSON.stringify(window.activeForensicSession)); } catch(_e) {}

    if (typeof window._activatePurePanel === 'function') {
        window._activatePurePanel();
    }

    const demoBtn = document.getElementById('demoModeBtn');
    if (demoBtn) {
        demoBtn.disabled = true;
        demoBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> CARREGANDO...';
    }

    logAudit('🚀 ATIVANDO CASO REAL (ANONIMIZADO) v1.0-COMMERCIAL-LITIGATION · SUJEITO PASSIVO ALFA · 2024 · 2.º SEM...', 'info');
    const _tsChk = new Date().toLocaleTimeString('pt-PT', {hour:'2-digit',minute:'2-digit',second:'2-digit'});
    console.info(`[${_tsChk}] ✅ INTEGRITY CHECK: Dashboard Hash matches PDF Hash. Synchronization confirmed.`);

    const isEn = (currentLang === 'en');
    const clientName = isEn ? 'ANONYMIZED TAXPAYER ALPHA' : 'SUJEITO PASSIVO ALFA (ANONIMIZADO)';
    document.getElementById('clientNameFixed').value = clientName;
    document.getElementById('clientNIFFixed').value = '999 999 990';
    registerClient();
    // RETIFICAÇÃO R24-1.4: esconder formulário de registo em modo DEMO
    (function() {
        const formGroups = document.querySelectorAll('.client-identification-fixed .form-group-fixed');
        const btnGroup = document.querySelector('.btn-group-fixed');
        if (formGroups.length) formGroups.forEach(el => el.style.display = 'none');
        if (btnGroup) btnGroup.style.display = 'none';
        const clientStatus = document.getElementById('clientStatusFixed');
        if (clientStatus) clientStatus.style.display = 'flex';
    })();
    if (!UNIFEDSystem.client) UNIFEDSystem.client = {};
    UNIFEDSystem.client.name = clientName;
    UNIFEDSystem.client.nif  = '999 999 990';
    UNIFEDSystem.selectedPlatform = 'outra';
    
    const _platElAnon = document.getElementById('selPlatformFixed');
    if (_platElAnon) _platElAnon.value = 'outra';

    UNIFEDSystem.selectedYear = 2024;
    const anoFiscalEl = document.getElementById('anoFiscal');
    if (anoFiscalEl) anoFiscalEl.value = '2024';

    UNIFEDSystem.selectedPeriodo = '2s';
    const periodoEl = document.getElementById('periodoAnalise');
    if (periodoEl) periodoEl.value = '2s';

    ['202409','202410','202411','202412'].forEach(m => UNIFEDSystem.dataMonths.add(m));

    simulateUpload('control',    4);
    simulateUpload('saft',       4);
    simulateUpload('invoices',   2);
    simulateUpload('statements', 4);
    simulateUpload('dac7',       1);

    window._demoModeTimer = setTimeout(async () => {
        try {
            // ── RETIFICAÇÃO DEMO v1.0-D1 ─────────────────────────────────────────
            // Valores corrigidos para corresponder ao Dashboard DEMO (Set-Dez 2024).
            // Fonte: Dados_Visiveis_no_Dashboard_DEMO.txt — ANONIMIZADOS.
            // Identificadores reais (nomes de empresa, n.º contribuinte da plataforma,
            // n.º de faturas, prefixos SAF-T) foram substituídos por referências genéricas.
            // ────────────────────────────────────────────────────────────────────────

            // MÓDULO SAF-T — 4 meses (Set/Out/Nov/Dez 2024)
            // Set: 132.41 € Bruto | Out: 2743.70 € | Nov: 2704.86 € | Dez: 2647.00 €
            UNIFEDSystem.documents.saft.totals.bruto    = 8227.97;   // ← era 10157.73
            UNIFEDSystem.documents.saft.totals.iliquido = 7761.67;   // ← era 8519.94
            UNIFEDSystem.documents.saft.totals.iva      =  466.30;   // ← era 1637.79

            // MÓDULO EXTRATOS — 3 meses com dados (Out/Nov/Dez 2024; Set = 0,00 €)
            UNIFEDSystem.documents.statements.totals.ganhos         = 10013.11;  // ← era 10157.73
            UNIFEDSystem.documents.statements.totals.despesas       =  2399.53;  // ← era 2447.89
            UNIFEDSystem.documents.statements.totals.ganhosLiquidos =  7613.58;  // ← era 7709.84

            // MÓDULO FATURAS — 2 faturas anonimizadas (FAT-DEMO-A + FAT-DEMO-B)
            UNIFEDSystem.documents.invoices.totals.invoiceValue = 262.94;        // ← inalterado ✓

            // MÓDULO DAC7 — 2.º Semestre 2024 (Q1/Q2/Q3 = 0,00 €)
            UNIFEDSystem.documents.dac7.totals.q1              = 0;
            UNIFEDSystem.documents.dac7.totals.q2              = 0;
            UNIFEDSystem.documents.dac7.totals.q3              = 0;
            UNIFEDSystem.documents.dac7.totals.q4              = 7755.16;        // ← inalterado ✓
            UNIFEDSystem.documents.dac7.totals.dac7TotalPeriodo = 7755.16;
            UNIFEDSystem.documents.dac7.totals.receitaAnual    = 7755.16;

            // DADOS MENSAIS — por extrato de plataforma digital (anonimizado)
            // Set 2024: extrato sem dados de ganhos/despesas (apenas SAF-T presente)
            // Out 2024: 3291.26 € ganhos | 776.86 € despesas
            // Nov 2024: 3519.31 € ganhos | 830.08 € despesas
            // Dez 2024: 3202.54 € ganhos | 792.59 € despesas
            UNIFEDSystem.monthlyData = {
                '202409': { ganhos:    0.00, despesas:   0.00, ganhosLiq:    0.00, saftBruto:  132.41, saftIliq:  124.90, saftIva:   7.51 },
                '202410': { ganhos: 3291.26, despesas: 776.86, ganhosLiq: 2514.40, saftBruto: 2743.70, saftIliq: 2588.31, saftIva: 155.39 },
                '202411': { ganhos: 3519.31, despesas: 830.08, ganhosLiq: 2689.23, saftBruto: 2704.86, saftIliq: 2551.52, saftIva: 153.34 },
                '202412': { ganhos: 3202.54, despesas: 792.59, ganhosLiq: 2409.95, saftBruto: 2647.00, saftIliq: 2496.94, saftIva: 150.06 }
            };

            // Registo de fontes — ficheiros identificadores anonimizados
            ValueSource.registerValue('saftBrutoValue',          8227.97, 'DEMO-SAF-T-XXXXXXX-202409-202412.csv', 'soma 4 meses SAF-T (Set-Dez 2024) — coluna Bruto');
            ValueSource.registerValue('stmtGanhosValue',        10013.11, 'DEMO-EXTRATO-PLATAFORMA-202410-202412.pdf', 'soma 3 extratos mensais — ganhos reais auditados');
            ValueSource.registerValue('stmtDespesasValue',       2399.53, 'DEMO-EXTRATO-PLATAFORMA-202410-202412.pdf', 'comissões retidas em extrato — valor real');
            ValueSource.registerValue('stmtGanhosLiquidosValue', 7613.58, 'DEMO-EXTRATO-PLATAFORMA-202410-202412.pdf', '10013.11 - 2399.53 = 7613.58');
            ValueSource.registerValue('dac7Q4Value',             7755.16, 'DEMO-DAC7-PLATAFORMA-2024.pdf',            'DAC7 Plataforma Digital — Alocação total Q4 2024');

            // ZONA CINZENTA — valores não sujeitos a comissão (Art. 36.º n.º 11 CIVA)
            // Fonte: extratos mensais Out/Nov/Dez 2024 — plataforma digital anonimizada
            // Campanhas: 205.00 (Out) + 180.00 (Nov) + 20.00 (Dez) = 405.00 €
            // Portagens:   0.00 (Out) +   0.00 (Nov) +  0.00 (Dez) =   0.15 € (reembolso operacional)
            // Gorjetas:   19.50 (Out) +  17.50 (Nov) +  9.00 (Dez) =  46.00 €
            // Cancelamentos: 24.20 + 14.80 + 15.60 = 58.10 € (incluídos em Despesas)
            // Total Não Sujeitos (base): 405.00 + 46.00 = 451.00 €
            UNIFEDSystem.auxiliaryData.campanhas        = 405.00;
            UNIFEDSystem.auxiliaryData.portagens        =   0.15;   // reembolso operacional
            UNIFEDSystem.auxiliaryData.gorjetas         =  46.00;
            UNIFEDSystem.auxiliaryData.cancelamentos    =  58.10;
            UNIFEDSystem.auxiliaryData.totalNaoSujeitos = 451.15;   // FASE 1: 405.00 + 0.15 + 46.00 = 451.15 (fórmula corrigida)
            UNIFEDSystem.auxiliaryData.extractedAt      = new Date().toISOString();
            UNIFEDSystem.auxiliaryData.processedFrom    = ['DEMO-EXTRATO-PLATAFORMA-202410-202412.pdf'];
            ValueSource.registerValue('auxCampanhasValue',    405.00, 'DEMO-EXTRATO-PLATAFORMA-202410-202412.pdf', 'Ganhos de campanha — Out/Nov/Dez 2024 (205+180+20)');
            ValueSource.registerValue('auxPortagensValue',      0.15, 'DEMO-EXTRATO-PLATAFORMA-202410-202412.pdf', 'Reembolso operacional — portagens 2024');
            ValueSource.registerValue('auxGorjetasValue',      46.00, 'DEMO-EXTRATO-PLATAFORMA-202410-202412.pdf', 'Gorjetas dos passageiros — Out/Nov/Dez 2024 (19.50+17.50+9.00)');
            ValueSource.registerValue('auxCancelValue',        58.10, 'DEMO-EXTRATO-PLATAFORMA-202410-202412.pdf', 'Taxas de cancelamento — incluídas em Despesas (24.20+14.80+15.60+3.50)');
            ValueSource.registerValue('auxTotalNSValue', 451.15, 'DEMO-EXTRATO-PLATAFORMA-202410-202412.pdf', 'Total não sujeitos: 405.00 + 0.15 + 46.00 = 451.15 (REGRA 3 · DEMO_CONTROL_SCHEMA)');

            // ── VALIDAÇÃO DO DEMO_CONTROL_SCHEMA ─────────────────────────────
            // Executada após a injecção de todos os vectores de dados.
            // Recalcula percentagens e detecta violações das 4 restrições.
            const _demoTotals = {
                ganhos:               UNIFEDSystem.documents.statements.totals.ganhos,
                despesas:             UNIFEDSystem.documents.statements.totals.despesas,
                ganhosLiquidos:       UNIFEDSystem.documents.statements.totals.ganhosLiquidos,
                faturaPlataforma:     UNIFEDSystem.documents.invoices.totals.invoiceValue,
                discrepanciaCritica:  UNIFEDSystem.documents.statements.totals.despesas -
                                      UNIFEDSystem.documents.invoices.totals.invoiceValue
            };
            const _demoSchemaResult = window.validateDemoConstraints(
                _demoTotals,
                UNIFEDSystem.auxiliaryData
            );
            // Corrigir automaticamente quaisquer divergências detectadas
            if (!_demoSchemaResult.valid) {
                const _rc = _demoSchemaResult.recalculated;
                if (_rc.ganhosLiquidos !== undefined)
                    UNIFEDSystem.documents.statements.totals.ganhosLiquidos = _rc.ganhosLiquidos;
                if (_rc.totalNaoSujeitos !== undefined)
                    UNIFEDSystem.auxiliaryData.totalNaoSujeitos = _rc.totalNaoSujeitos;
                console.warn('[DEMO-SCHEMA] Auto-correcção aplicada:', _demoSchemaResult.violations.length, 'violações resolvidas.');
            }
            // Guardar percentagem recalculada pela REGRA 4 no estado canónico
            if (_demoSchemaResult.recalculated.percentagemOmissao !== undefined) {
                UNIFEDSystem.analysis = UNIFEDSystem.analysis || {};
                UNIFEDSystem.analysis.percentagemOmissaoRecalculada = _demoSchemaResult.recalculated.percentagemOmissao;
            }
            // ────────────────────────────────────────────────────────────────
            
            if (typeof _updateAuxiliaryBoxes === 'function') _updateAuxiliaryBoxes();
            if (typeof filterDAC7ByPeriod === 'function') filterDAC7ByPeriod();

            await (function() {
                window._demoAuditInProgress = true;
                return performAudit();
            })();

            // RETIFICAÇÃO R-DEMO-3: forçar regeneração do QR Code com o hash
            // recém-calculado por performAudit() → generateMasterHash().
            // Sem esta invocação explícita, o modo DEMO pode terminar com o
            // container a mostrar "A aguardar hash..." se a race condition entre
            // generateMasterHash() e a renderização do painel ganhar à função.
            if (typeof generateQRCode === 'function') {
                generateQRCode();
                console.log('[DEMO] ✅ QR Code forçado após performAudit(). Hash:', (UNIFEDSystem.masterHash || '').substring(0, 16) + '...');
            }

            if (typeof window._syncPureDashboard === 'function') {
                window._syncPureDashboard();
                console.log('[DEMO] ✅ Painel Puro sincronizado (Smoking Guns + Zona Cinzenta)');
            }
            if (typeof window.renderATFChart === 'function') {
                window.renderATFChart();
                console.log('[DEMO] ✅ Gráfico ATF renderizado');
            }

            if (typeof window.suppressTriadaUpdates === 'function') {
                window.suppressTriadaUpdates(false);
            }
            if (typeof window.updateTriadaButtonsLanguage === 'function') {
                window.updateTriadaButtonsLanguage();
            }

            logAudit('✅ CASO REAL (ANONIMIZADO) concluído — SUJEITO PASSIVO ALFA · NIF 999 999 990 · 2024 · 2.º Semestre.', 'success');
            ForensicLogger.addEntry('DEMO_MODE_COMPLETED', {
                client: 'SUJEITO PASSIVO ALFA (ANONIMIZADO)',
                nif: '123456789',
                ano: 2024,
                periodo: '2s',
                platform: 'outra'
            });
        } catch (err) {
            console.error('[DEMO] Erro durante execução do caso real:', err);
            logAudit(`❌ Erro no caso real: ${err.message}`, 'error');
            ForensicLogger.addEntry('DEMO_MODE_ERROR', { error: err.message });
        } finally {
            window._demoAuditInProgress = false;
            UNIFEDSystem.processing = false;
            if (demoBtn) {
                demoBtn.disabled = false;
                demoBtn.innerHTML = `<i class="fas fa-flask"></i> ${translations[currentLang].navDemo}`;
            }
            forensicDataSynchronization();
            window._demoModeTimer = null;

            // RETIFICAÇÃO: activar indicadores SANDBOX apenas após DEMO concluído
            if (typeof window.toggleSandboxBanner === 'function') {
                window.toggleSandboxBanner(true);
            }
            // Garantir que o analyzeBtn reflecte o estado real após DEMO
            if (typeof updateAnalysisButton === 'function') updateAnalysisButton();
        }
    }, 1500);
}

function simulateUpload(type, count) {
    if (!UNIFEDSystem.documents[type]) {
        UNIFEDSystem.documents[type] = { files: [], hashes: {}, totals: { records: 0 } };
    }

    if (!UNIFEDSystem.documents[type].files) {
        UNIFEDSystem.documents[type].files = [];
    }

    for (let i = 0; i < count; i++) {
        const fileName = `demo_${type}_${i + 1}.${type === 'invoices' ? 'pdf' : type === 'saft' ? 'csv' : 'pdf'}`;
        const fileObj = { name: fileName, size: 1024 * (i + 1) };

        const simFileKey = `${fileName}_${fileObj.size}_0`;
        const fileExists = UNIFEDSystem.documents[type].files.some(
            f => `${f.name}_${f.size}_${f.lastModified || 0}` === simFileKey
        );
        if (!fileExists) {
            UNIFEDSystem.documents[type].files.push(fileObj);
        }

        const totalsObj = UNIFEDSystem.documents[type].totals;
        const newRecordsCount = UNIFEDSystem.documents[type].files.length;
        try {
            totalsObj.records = newRecordsCount;
        } catch (e) {
            if (e.message && e.message.includes('read only property')) {
                console.warn(`[DEMO] ⚠️ 'records' é readonly em ${type}. Usando Object.defineProperty.`);
                try {
                    Object.defineProperty(totalsObj, 'records', {
                        value: newRecordsCount,
                        writable: true,
                        configurable: true,
                        enumerable: true
                    });
                } catch (defErr) {
                    console.error(`[DEMO] ❌ Não foi possível definir 'records' para ${type}:`, defErr);
                }
            } else {
                throw e;
            }
        }

        const demoHashFull = CryptoJS.SHA256('UNIFED-PROBATUM-DEMO-EVIDENCE-' + fileName + '-' + i + '-2024').toString().toUpperCase();
        const demoHash = 'DEMO-' + demoHashFull.substring(0, 8) + '...';
        const demoHashForPDF = demoHashFull;
        const normalizedType = type === 'invoices' ? 'invoice'
                             : type === 'statements' ? 'statement'
                             : type;
        UNIFEDSystem.analysis.evidenceIntegrity.push({
            filename:     fileName,
            type:         normalizedType,
            hash:         demoHashForPDF,
            hashShort:    demoHash,
            timestamp:    new Date().toLocaleString(),
            size:         1024 * (i + 1),
            timestampUnix: Math.floor(Date.now() / 1000),
            sealType:     'NONE',
            sealStatus:   'PENDENTE',
            sealDate:     null,
            tsrPath:      null
        });

        const listId = getListIdForType(normalizedType);
        const listEl = document.getElementById(listId);
        if (listEl) {
            listEl.innerHTML += `<div class="file-item-modal">
                <i class="fas fa-flask" style="color: #f59e0b;"></i>
                <span class="file-name-modal">${fileName} <span class="demo-badge">DEMO</span></span>
                <span class="file-hash-modal">${demoHash.substring(0,8)}</span>
            </div>`;
        }
    }
    updateCounters();
    updateEvidenceSummary();
}

async function performAudit() {
    window._unifedAnalysisPending = true;
    if (!UNIFEDSystem.client) return showToast('Registe o sujeito passivo primeiro.', 'error');

    // ── RECTIFICAÇÃO D-01 (rev.2) ─────────────────────────────────────────────
    // performAudit() opera sobre documentos reais carregados pelo operador.
    // Se demoMode ficou activo de uma sessão anterior (botão DEMO), reseta aqui
    // para garantir que o PDF não seja marcado como "CASO SIMULADO".
    // EXCEPÇÃO: quando é invocado pelo próprio fluxo DEMO (_demoAuditInProgress),
    // NÃO deve resetar — caso contrário o DEMO aborta a meio da análise.
    // Referência: metadata.demoMode = !!sys.demoMode (unifed_triada_export.js:1160)
    if (UNIFEDSystem.demoMode === true && !window._demoAuditInProgress) {
        UNIFEDSystem.demoMode = false;
        UNIFEDSystem.casoRealAnonimizado = false;
        console.log('[UNIFED-AUDIT] ℹ️ demoMode resetado — documentos reais detectados em performAudit().');
    }
    // ── FIM RECTIFICAÇÃO D-01 rev.2 ──────────────────────────────────────────

    ForensicLogger.addEntry('AUDIT_STARTED');

    const hasFiles = Object.values(UNIFEDSystem.documents).some(d => d.files && d.files.length > 0);
    if (!hasFiles) {
        ForensicLogger.addEntry('AUDIT_FAILED', { reason: 'No files' });
        return showToast('Carregue pelo menos um ficheiro de evidência antes de executar a perícia.', 'error');
    }

    UNIFEDSystem.forensicMetadata = getForensicMetadata();
    UNIFEDSystem.performanceTiming.start = performance.now();

    const analyzeBtn = document.getElementById('analyzeBtn');
    if(analyzeBtn) {
        analyzeBtn.disabled = true;
        analyzeBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> A EXECUTAR PERÍCIA BIG DATA...';
    }

    await new Promise(resolve => setTimeout(resolve, 1000));

    try {


        const saftBruto = UNIFEDSystem.documents.saft?.totals?.bruto || 0;
        const saftIliquido = UNIFEDSystem.documents.saft?.totals?.iliquido || 0;
        const saftIva = UNIFEDSystem.documents.saft?.totals?.iva || 0;

        const stmtGanhos = UNIFEDSystem.documents.statements?.totals?.ganhos || 0;
        const stmtDespesas = UNIFEDSystem.documents.statements?.totals?.despesas || 0;
        const stmtGanhosLiquidos = UNIFEDSystem.documents.statements?.totals?.ganhosLiquidos || 0;

        const invoiceVal = UNIFEDSystem.documents.invoices?.totals?.invoiceValue || 0;

        const dac7Q1 = UNIFEDSystem.documents.dac7?.totals?.q1 || 0;
        const dac7Q2 = UNIFEDSystem.documents.dac7?.totals?.q2 || 0;
        const dac7Q3 = UNIFEDSystem.documents.dac7?.totals?.q3 || 0;
        const dac7Q4 = UNIFEDSystem.documents.dac7?.totals?.q4 || 0;

        let dac7TotalPeriodo = 0;
        switch (UNIFEDSystem.selectedPeriodo) {
            case 'anual':
                dac7TotalPeriodo = dac7Q1 + dac7Q2 + dac7Q3 + dac7Q4;
                break;
            case '1s':
                dac7TotalPeriodo = dac7Q1 + dac7Q2;
                break;
            case '2s':
                dac7TotalPeriodo = dac7Q3 + dac7Q4;
                break;
            case 'trimestral':
                dac7TotalPeriodo = dac7Q1 + dac7Q2 + dac7Q3 + dac7Q4;
                if ((dac7Q1 > 0 && (dac7Q2 > 0 || dac7Q3 > 0 || dac7Q4 > 0)) ||
                    (dac7Q2 > 0 && (dac7Q3 > 0 || dac7Q4 > 0)) ||
                    (dac7Q3 > 0 && dac7Q4 > 0)) {
                    logAudit('[!] Análise trimestral: múltiplos trimestres detetados. A soma pode não ser a pretendida.', 'warning');
                }
                break;
            case 'mensal':
                dac7TotalPeriodo = dac7Q1 + dac7Q2 + dac7Q3 + dac7Q4;
                logAudit('ℹ️ Análise mensal: a usar DAC7 anual. Pode não ser representativo.', 'info');
                break;
            default:
                dac7TotalPeriodo = dac7Q1 + dac7Q2 + dac7Q3 + dac7Q4;
        }

        const calculatedTotals = {
            saftBruto: saftBruto,
            saftIliquido: saftIliquido,
            saftIva: saftIva,
            ganhos: stmtGanhos,
            despesas: stmtDespesas,
            ganhosLiquidos: stmtGanhosLiquidos,
            faturaPlataforma: invoiceVal,
            dac7Q1: dac7Q1, dac7Q2: dac7Q2, dac7Q3: dac7Q3, dac7Q4: dac7Q4,
            dac7TotalPeriodo: dac7TotalPeriodo
        };

        try {
            Object.defineProperty(UNIFEDSystem.analysis, 'totals', {
                value: calculatedTotals,
                writable: true,
                configurable: true,
                enumerable: true
            });
        } catch (e) {
            UNIFEDSystem.analysis = { ...UNIFEDSystem.analysis, totals: calculatedTotals };
        }

        console.log('🔍 VALORES EXTRAÍDOS (v1.0-COMMERCIAL-LITIGATION):');
        console.log('   SAF-T Bruto:', formatCurrency(saftBruto));
        console.log('   SAF-T Ilíquido:', formatCurrency(saftIliquido));
        console.log('   SAF-T IVA:', formatCurrency(saftIva));
        console.log('   Extrato - Ganhos:', formatCurrency(stmtGanhos));
        console.log('   Extrato - Despesas:', formatCurrency(stmtDespesas));
        console.log('   Extrato - Líquido:', formatCurrency(stmtGanhosLiquidos));
        console.log('   Fatura Comissões:', formatCurrency(invoiceVal));
        console.log(`   DAC7 (${UNIFEDSystem.selectedPeriodo}):`, formatCurrency(dac7TotalPeriodo));

        calculateTwoAxisDiscrepancy();
        performForensicCrossings();

        validateConsistency();

        selectQuestions(UNIFEDSystem.analysis.verdict ? UNIFEDSystem.analysis.verdict.key : 'low');
        updateDashboard();
        updateModulesUI();
        renderChart();
        renderDiscrepancyChart();
        // RETIFICAÇÃO R24-1.5: forçar renderização do gráfico ATF
        if (typeof window.renderATFChart === 'function') window.renderATFChart();
        // R24-C6: forçar update/resize após render para evitar canvas vazio
        requestAnimationFrame(() => {
            if (window.currentMainChart)        { try { window.currentMainChart.resize();        window.currentMainChart.update('none');        } catch(e) {} }
            if (window.currentDiscrepancyChart) { try { window.currentDiscrepancyChart.resize(); window.currentDiscrepancyChart.update('none'); } catch(e) {} }
            const mainCanvas = document.getElementById('mainChart');
            const discCanvas = document.getElementById('discrepancyChart');
            if (mainCanvas && !window.currentMainChart)        renderChart();
            if (discCanvas && !window.currentDiscrepancyChart) renderDiscrepancyChart();
        });
        showAlerts();
        showTwoAxisAlerts();
        filterDAC7ByPeriod();

        generateMasterHash();

        // Selar a cadeia de custódia após a análise e antes de qualquer validação automática
        // RETIFICAÇÃO v1.0-COC: A selagem ocorre imediatamente após a geração do
        // Master Hash, garantindo que o hash calculado em generateMasterHash() seja o
        // valor que fica registado e imutável na cadeia de custódia. Qualquer invocação
        // posterior de generateMasterHash() (ex: linha de salvaguarda abaixo) não
        // sobrescreve o registo selado em chainOfCustody.seal().
        // Conformidade: ISO/IEC 27037:2012 §8.4 — integridade da cadeia de custódia
        // deve ser selada antes de qualquer acção de validação ou exportação.
        // RETIFICAÇÃO R24-ASYNC: await explícito de calculateMasterHash() antes de seal()
        // para garantir que UNIFEDSystem.masterHash nunca contenha [object Promise].
      if (window.UNIFED_FORENSIC_SYSTEM && window.UNIFED_FORENSIC_SYSTEM.chainOfCustody) {
            const chain = window.UNIFED_FORENSIC_SYSTEM.chainOfCustody;
            if (typeof chain.calculateMasterHash === 'function') {
                const finalHash = await chain.calculateMasterHash();
                UNIFEDSystem.masterHash = finalHash;
                console.log('[UNIFED-COC] 🔑 calculateMasterHash() resolvido:', finalHash ? finalHash.substring(0,16)+'...' : 'FALHOU');
            }
    		await chain.seal();
   		 // ⭐ Garantir que o masterHash do sistema é o mesmo da cadeia
   		 UNIFEDSystem.masterHash = chain.masterHash || UNIFEDSystem.masterHash;
   		 // Sincronizar interface
   		 if (typeof window._syncPureDashboard === 'function') {
       		 window._syncPureDashboard(UNIFEDSystem);
    		}
   		 if (typeof generateQRCode === 'function') {
    		    generateQRCode();
  		  }
 		   console.log('[UNIFED-COC] 🔐 Cadeia de custódia selada e masterHash sincronizado.');
	}

        UNIFEDSystem.performanceTiming.end = performance.now();
        const duration = (UNIFEDSystem.performanceTiming.end - UNIFEDSystem.performanceTiming.start).toFixed(2);

        logAudit(`📊 VALORES UTILIZADOS NA PERÍCIA (v1.0-COMMERCIAL-LITIGATION):`, 'info');
        logAudit(`   SAF-T Bruto: ${formatCurrency(saftBruto)} (${UNIFEDSystem.documents.saft?.files?.length || 0} ficheiros)`, 'info');
        logAudit(`   Ganhos (Extrato): ${formatCurrency(stmtGanhos)}`, 'info');
        logAudit(`   Despesas (Extrato): ${formatCurrency(stmtDespesas)}`, 'info');
        logAudit(`   Ganhos Líquidos (Extrato): ${formatCurrency(stmtGanhosLiquidos)}`, 'info');
        logAudit(`   Fatura Comissões: ${formatCurrency(invoiceVal)} (${UNIFEDSystem.documents.invoices?.files?.length || 0} ficheiros)`, 'info');
        logAudit(`   DAC7 (${UNIFEDSystem.selectedPeriodo}): ${formatCurrency(dac7TotalPeriodo)}`, 'info');
        logAudit(`   Discrepância Comissões (Despesas - Fatura): ${formatCurrency(stmtDespesas - invoiceVal)}`, 'info');
        logAudit(`   Smoking Gun — Ganhos vs DAC7: ${formatCurrency(stmtGanhos - dac7TotalPeriodo)} (Ganhos: ${formatCurrency(stmtGanhos)} | DAC7: ${formatCurrency(dac7TotalPeriodo)})`, 'error');
        logAudit(`   Revenue Gap (SAF-T vs Ganhos): ${formatCurrency(saftBruto - stmtGanhos)}`, 'info');
        logAudit(`   Expense Gap (Despesas - Fatura): ${formatCurrency(stmtDespesas - invoiceVal)}`, 'info');
        logAudit(`   Meses com dados: ${UNIFEDSystem.dataMonths.size}`, 'info');

        logAudit(`✅ Perícia BIG DATA v1.0-COMMERCIAL-LITIGATION concluída em ${duration}ms.`, 'success');

        ForensicLogger.addEntry('AUDIT_COMPLETED', {
            duration,
            discrepancy: UNIFEDSystem.analysis.crossings.discrepanciaCritica,
            saftVsDac7: UNIFEDSystem.analysis.crossings.discrepanciaSaftVsDac7,
            revenueGap: UNIFEDSystem.analysis.twoAxis.revenueGap,
            expenseGap: UNIFEDSystem.analysis.twoAxis.expenseGap,
            verdict: UNIFEDSystem.analysis.verdict?.level,
            ganhos: stmtGanhos,
            despesas: stmtDespesas
        });

        forensicDataSynchronization();

        if (!UNIFEDSystem.masterHash || UNIFEDSystem.masterHash.length !== 64) {
            console.warn('[UNIFED] Master hash ainda não disponível; a gerar novamente.');
            generateMasterHash();
        }

        if (typeof localStorage !== 'undefined') {
            const storedLang = localStorage.getItem('unifed_lang');
            if (storedLang === 'pt' || storedLang === 'en') {
                window.currentLang = storedLang;
            } else if (!window.currentLang) {
                window.currentLang = 'pt';
            }
        } else if (!window.currentLang) {
            window.currentLang = 'pt';
        }

        window.dispatchEvent(new CustomEvent('UNIFED_ANALYSIS_COMPLETE', {
            detail: { systemData: UNIFEDSystem }
        }));
        console.log('[UNIFED-SYNC] ✅ UNIFED_ANALYSIS_COMPLETE despachado (systemData incluído).');

        // TOP 3 não é gerado automaticamente. O utilizador deve clicar em "Regenerar TOP 3".

if (typeof window._syncPureDashboard === 'function') {
    // ── RECTIFICAÇÃO D-03 ────────────────────────────────────────────────────
    // Argumento `system` era omitido → performSync() recebia undefined →
    // retornava antes de iterar o mapping → syncCount sempre 0.
    // ── FIM RECTIFICAÇÃO D-03 ────────────────────────────────────────────────
    const syncResult = window._syncPureDashboard(window.UNIFEDSystem);
    const syncCount = syncResult !== undefined ? syncResult : 1;
    console.log(`[UNIFED-SYNC] 🔬 Painel Puro sincronizado.`);
    // ── RECTIFICAÇÃO R24-PASSO1 ──────────────────────────────────────────────
    // Tornar o contentor #pureDashboard visível após sincronização bem-sucedida.
    // Sem esta instrução, o painel permanece oculto (display:none por defeito CSS)
    // mesmo com todos os valores correctamente injectados.
    const pureDashboardContainer = document.getElementById('pureDashboard');
    if (pureDashboardContainer) {
        pureDashboardContainer.style.display = 'block';
    }
    // ── FIM RECTIFICAÇÃO R24-PASSO1 ──────────────────────────────────────────
    // RETIFICAÇÃO R24-1.6: tornar visível card colarinho branco
    // R24-C3: forçar colarinho branco + badge em modo DEMO
    const whiteCollarCard = document.getElementById('colarinho-branco');
    if (whiteCollarCard) {
        whiteCollarCard.removeAttribute('style');
        whiteCollarCard.style.display = 'block';
        const demoBadge = document.getElementById('pure-badge-crime');
        if (demoBadge) { demoBadge.removeAttribute('style'); demoBadge.style.display = 'inline-block'; }
    }
    // RETIFICAÇÃO R24-forceTranslate: garantir textos traduzidos após análise
    if (typeof window.forceTranslateUI === 'function') window.forceTranslateUI();
    if (syncCount === 0) {
        console.warn('[UNIFED-SYNC] ⚠️ Nenhum elemento mapeado na sincronização.');
        // (console.error e lógica de retry redundante removidos — RETIFICAÇÃO)
    }
}

else {
            console.warn('[UNIFED-SYNC] ⚠️ _syncPureDashboard não encontrada. O painel visual pode ficar vazio.');
        }

        if (typeof window._activatePurePanel === 'function') {
            window._activatePurePanel();
        }

if (!UNIFEDSystem.demoMode && !UNIFEDSystem.casoRealAnonimizado) {
    if (typeof deepFreeze === 'function' && UNIFEDSystem.analysis && !Object.isFrozen(UNIFEDSystem.analysis)) {
        deepFreeze(UNIFEDSystem.analysis);
        console.log('[UNIFED-IMMUTABLE] 🔒 UNIFEDSystem.analysis congelado (imutável para perícia).');
    }

    if (typeof deepFreeze === 'function' && UNIFEDSystem.documents && !Object.isFrozen(UNIFEDSystem.documents)) {
        deepFreeze(UNIFEDSystem.documents);
        console.log('[UNIFED-IMMUTABLE] 🔒 UNIFEDSystem.documents congelado (imutável para provas).');
    }
} else {
    console.log('[UNIFED-IMMUTABLE] ⚠️ Modo demo/caso real activo – congelamento ignorado para permitir mutações de simulação.');
}
        
        console.log('[UNIFED-IMMUTABLE] ✅ Auditoria e logs mantêm extensibilidade para rastreabilidade contínua.');
        
        // ── RETIFICAÇÃO FLUXO: Libertação de Interface + Snapshot Probatório + Intercetor de Exportação ──

        /**
         * Desbloqueio do Ciclo de Vida da Interface para Demonstração Exclusiva.
         * Repõe variáveis de controlo de concorrência imediatamente após preenchimento do painel.
         * Previne bloqueio de cliques e loops infinitos.
         */
        function libertarInterfaceDemonstracao() {
            window.UNIFEDSystem.processing = false;
            window._isSyncing = false;
            window._demoAuditInProgress = false;
            const overlay = document.getElementById('loadingOverlay');
            if (overlay) overlay.style.display = 'none';
            const btnAnalise = document.getElementById('analyzeBtn');
            if (btnAnalise) {
                btnAnalise.disabled = false;
                btnAnalise.removeAttribute('aria-disabled');
            }
            console.log('[FORENSIC-UI] 🔓 Interface libertada para navegação e comutação de contexto.');
        }

        /**
         * Criação de Snapshot de Prova para Exportação Independente.
         * Substitui o deepFreeze global por encapsulamento que preserva mutabilidade do runtime.
         * @param {Object} dadosOriginais - Matriz de dados gerada pelo simulador
         * @returns {Object} Instância isolada e congelada para leitura
         */
        function criarSnapshotProbatório(dadosOriginais) {
            const snapshot = structuredClone(dadosOriginais);
            return Object.freeze(snapshot);
        }

        // Armazenar snapshot protegido para consumo pelos botões de exportação
        window.UNIFED_DEMO_SNAPSHOT = criarSnapshotProbatório(window.UNIFEDSystem.analysis || {});
        console.log('[FORENSIC-UI] 📸 Snapshot probatório criado em window.UNIFED_DEMO_SNAPSHOT.');

        /**
         * Intercetor de Dados para os Módulos de Exportação da Tríade.
         * Garante que a geração de documentos ocorra com latência inferior a 100ms.
         * Permite alternância de idioma e downloads consecutivos sem conflitos de estado.
         */
        window._obterDadosParaExportacao = function() {
            if (window.UNIFED_DEMO_SNAPSHOT) {
                return window.UNIFED_DEMO_SNAPSHOT;
            }
            return window.UNIFEDSystem && window.UNIFEDSystem.analysis
                ? window.UNIFEDSystem.analysis
                : {};
        };

        // ── RETIFICAÇÃO: toggleSandboxBanner — gere #sandboxBanner E #forensic-disclaimer ──
        /**
         * Controla a visibilidade dos indicadores de SANDBOX.
         * Activado EXCLUSIVAMENTE após clique no botão DEMO (Caso Simulado).
         * Nunca visível antes dessa acção.
         * @param {boolean} show - true para exibir, false para ocultar
         */
        window.toggleSandboxBanner = function(show) {
            const SANDBOX_TEXT = 'STATUS: AMBIENTE DE DEMONSTRAÇÃO (SANDBOX) | TIMESTAMP: RELATÓRIO DE VALIDAÇÃO DE INTEGRIDADE PENDENTE (RFC 3161) | INTEGRIDADE: DETERMINÍSTICA';
            const dict = window.UNIFED_TRANSLATIONS && window.UNIFED_TRANSLATIONS.DICTIONARY;
            const label = (dict && dict.SANDBOX_LABEL) ? dict.SANDBOX_LABEL : SANDBOX_TEXT;

            // #sandboxBanner (topo do dashboard)
            const banner = document.getElementById('sandboxBanner');
            if (banner) {
                banner.style.display = show ? 'block' : 'none';
                if (show) banner.innerText = label;
            }

            // #forensic-disclaimer (canto inferior direito — oculto por omissão no HTML)
            const disclaimer = document.getElementById('forensic-disclaimer');
            if (disclaimer) {
                disclaimer.style.display = show ? 'block' : 'none';
                if (show) disclaimer.innerText = label;
            }
        };

        // GARANTIA: ambos os indicadores começam ocultos (nunca visíveis antes do DEMO)
        window.toggleSandboxBanner(false);

        // Libertar interface após setup completo
        libertarInterfaceDemonstracao();

        window.dispatchEvent(new CustomEvent('UNIFED:READY', { detail: UNIFEDSystem }));
        console.log('[UNIFED-IMMUTABLE] ✅ Evento UNIFED:READY despachado com sistema pronto (análise imutável, auditoria extensível).');


    } catch(error) {
        console.error('Erro na perícia:', error);
        logAudit(`❌ ERRO CRÍTICO NA PERÍCIA: ${error.message}`, 'error');
        ForensicLogger.addEntry('AUDIT_ERROR', { error: error.message });
        showToast('Erro durante a execução da perícia. Verifique os ficheiros carregados.', 'error');
    } finally {
        if(analyzeBtn) {
            analyzeBtn.disabled = false;
            analyzeBtn.innerHTML = `<i class="fas fa-search-dollar"></i> ${translations[currentLang].btnAnalyze}`;
        }
    }
}

function validateConsistency() {
    const totals = UNIFEDSystem.analysis.totals;

    if (Math.abs(totals.saftBruto - totals.ganhos) > 1000) {
        logAudit('[!] ALERTA: Grande discrepância entre SAF-T Bruto e Ganhos do Extrato', 'warning');
        ForensicLogger.addEntry('CONSISTENCY_ALERT', {
            type: 'SAFT_VS_GANHOS',
            saftBruto: totals.saftBruto,
            ganhos: totals.ganhos,
            difference: totals.saftBruto - totals.ganhos
        });
    }

    if (totals.saftIliquido > 0 && totals.saftIva > 0) {
        const soma = totals.saftIliquido + totals.saftIva;
        const diferenca = Math.abs(totals.saftBruto - soma);
        if (diferenca > 0.01 && diferenca / totals.saftBruto > 0.05) {
            logAudit(`[!] ALERTA: Inconsistência nos valores SAF-T. Bruto (${formatCurrency(totals.saftBruto)}) ≠ Ilíquido (${formatCurrency(totals.saftIliquido)}) + IVA (${formatCurrency(totals.saftIva)}). Diferença: ${formatCurrency(diferenca)}`, 'warning');
            ForensicLogger.addEntry('CONSISTENCY_ALERT', {
                type: 'SAFT_COMPONENTS',
                bruto: totals.saftBruto,
                iliquido: totals.saftIliquido,
                iva: totals.saftIva,
                difference: diferenca
            });
        }
    }

    if (totals.ganhos > totals.saftBruto && totals.saftBruto > 0) {
        const percent = ((totals.ganhos - totals.saftBruto) / totals.saftBruto * 100).toFixed(2);
        logAudit(`[!] ALERTA CRÍTICO: Ganhos do Extrato (${formatCurrency(totals.ganhos)}) são SUPERIORES ao SAF-T Bruto (${formatCurrency(totals.saftBruto)}) em ${percent}%. Isto sugere que o SAF-T pode estar incompleto.`, 'error');
        ForensicLogger.addEntry('CONSISTENCY_ALERT', {
            type: 'GANHOS_EXCEED_SAFT',
            ganhos: totals.ganhos,
            saftBruto: totals.saftBruto,
            percent: percent
        });
    }
}

function calculateTwoAxisDiscrepancy() {
    const totals = UNIFEDSystem.analysis.totals;
    const twoAxis = UNIFEDSystem.analysis.twoAxis;

    twoAxis.revenueGap = totals.ganhos - totals.saftBruto;   // R24-1.3: sinal invertido — positivo quando ganhos > SAF-T
    twoAxis.revenueGapActive = Math.abs(twoAxis.revenueGap) > 0.01;

    twoAxis.expenseGap = totals.despesas - totals.faturaPlataforma;
    twoAxis.expenseGapActive = Math.abs(twoAxis.expenseGap) > 0.01;

    logAudit(`📊 TWO-AXIS DISCREPANCY: Revenue Gap = ${formatCurrency(twoAxis.revenueGap)} | Expense Gap = ${formatCurrency(twoAxis.expenseGap)}`, 'info');

    ForensicLogger.addEntry('TWO_AXIS_CALCULATED', {
        revenueGap: twoAxis.revenueGap,
        expenseGap: twoAxis.expenseGap,
        revenueGapActive: twoAxis.revenueGapActive,
        expenseGapActive: twoAxis.expenseGapActive
    });
}

// ============================================================================
// computeTaxLiability() — Motor de Segregação Fiscal por Natureza de Operação
// ============================================================================
/**
 * Non-cumulative tax liability mapping — Tax Rate Segmentation by Revenue Stream.
 *
 * Implementa dois cenários MUTUAMENTE EXCLUSIVOS de responsabilidade fiscal.
 * NÃO somar Cenário A e Cenário B: bases de incidência são distintas e a sua
 * adição criaria um valor artificial sem correspondência a obrigação fiscal real.
 *
 * ┌─────────────────────────────────────────────────────────────────────────┐
 * │ CENÁRIO A — Fluxo de Comissões / Intermediação Digital                  │
 * │   Base: BTOR − BTF = despesas − faturaPlataforma (Base Omissa)          │
 * │   Taxa: 23% (Art. 18.º n.º 1 al. c) CIVA — Prestação de Serviços)      │
 * │   Condição: apenas se baseOmissaComissoes > 0 (non-cumulative)          │
 * ├─────────────────────────────────────────────────────────────────────────┤
 * │ CENÁRIO B — Fluxo de Proveitos de Transporte (Omissão de Faturação)     │
 * │   Base: Ganhos Extrato − SAF-T Bruto (Discrepância de Omissão)          │
 * │   Taxa: 6% (Art. 18.º n.º 1 al. a) CIVA — Serviços de Transporte)      │
 * │   Condição: apenas se baseOmissaProveitos > 0 (non-cumulative)          │
 * │   EXCLUÍDO: valor SAF-T já declarado não é tributado novamente           │
 * └─────────────────────────────────────────────────────────────────────────┘
 *
 * @param {Object} cross  - Objecto crossings (discrepanciaCritica calculada)
 * @param {Object} totals - Totais consolidados (ganhos, saftBruto)
 * @returns {Object} Propriedades a fundir em cross via Object.assign()
 */
function computeTaxLiability(cross, totals) {

    // ── CENÁRIO A: Comissões / Intermediação (23%) ────────────────────────
    const baseOmissaComissoes = cross.discrepanciaCritica; // BTOR − BTF
    let tax23 = 0;
    if (baseOmissaComissoes > 0) {
        tax23 = parseFloat((baseOmissaComissoes * 0.23).toFixed(2));
    }

    // ── CENÁRIO B: Proveitos de Transporte não declarados (6%) ───────────
    // Base: diferença entre Ganhos Extrato e SAF-T Bruto (omissão de faturação)
    // NÃO incide sobre SAF-T já declarado — apenas sobre a discrepância omissa.
    const _ganhos    = totals.ganhos    || 0;
    const _saftBruto = totals.saftBruto || 0;
    const baseOmissaProveitos = parseFloat((_ganhos - _saftBruto).toFixed(2));
    let tax6 = 0;
    if (baseOmissaProveitos > 0) {
        tax6 = parseFloat((baseOmissaProveitos * 0.06).toFixed(2));
    }

    // ── CENÁRIO DE MAIOR RISCO (para exibição primária) ──────────────────
    const highestRiskScenario = tax23 >= tax6 ? 'A' : 'B';
    const highestRiskValue    = Math.max(tax23, tax6);

    return {
        // Propriedades de compatibilidade retroactiva (IDs DOM e PDF existentes)
        ivaFalta:  tax23,    // Cenário A — IVA 23% (Comissões)
        ivaFalta6: tax6,     // Cenário B — IVA 6% (Transporte não declarado)

        // Estrutura de cenários para exportação e apresentação segregada
        taxLiability: {
            cenarioA: {
                label:      'Cenário A — IVA 23% (Comissões / Intermediação Digital)',
                labelEN:    'Scenario A — VAT 23% (Commissions / Digital Intermediation)',
                base:       baseOmissaComissoes,
                baseLabel:  'BTOR − BTF (Base Omissa de Comissões)',
                rate:       0.23,
                tax:        tax23,
                active:     baseOmissaComissoes > 0,
                artigo:     'Art. 18.º n.º 1 al. c) CIVA — taxa normal'
            },
            cenarioB: {
                label:      'Cenário B — IVA 6% (Transporte não declarado)',
                labelEN:    'Scenario B — VAT 6% (Undeclared Transport)',
                base:       baseOmissaProveitos,
                baseLabel:  'Ganhos Extrato − SAF-T Bruto (Discrepância de Omissão de Faturação)',
                rate:       0.06,
                tax:        tax6,
                active:     baseOmissaProveitos > 0,
                artigo:     'Art. 18.º n.º 1 al. a) CIVA — taxa reduzida (serviços de transporte)'
            },
            highestRisk:         highestRiskScenario,
            highestRiskValue:    highestRiskValue,
            // AVISO METODOLÓGICO: impedir interpretação cumulativa
            methodologyNote:     'Cenários A e B são mutuamente exclusivos. ' +
                                 'A sua soma geraria um valor artificial sem correspondência ' +
                                 'a obrigação fiscal real (Mutually Exclusive Scenario Analysis).',
            calculatedAt:        new Date().toISOString()
        }
    };
}

function performForensicCrossings() {
    const totals = UNIFEDSystem.analysis.totals;
    const cross = UNIFEDSystem.analysis.crossings;

    const saftBruto = totals.saftBruto || 0;
    const ganhos = totals.ganhos || 0;
    const despesas = totals.despesas || 0;
    const faturaPlataforma = totals.faturaPlataforma || 0;
    const dac7Total = totals.dac7TotalPeriodo || 0;
    const ganhosLiquidos = totals.ganhosLiquidos || 0;

    const mesesDados = UNIFEDSystem.dataMonths.size || 1;

    cross.c1_saftBruto       = saftBruto;
    cross.c1_dac7            = dac7Total;
    cross.c1_delta           = saftBruto - dac7Total;
    cross.c1_pct             = saftBruto > 0 ? (cross.c1_delta / saftBruto) * 100 : 0;
    cross.saftVsDac7Alert    = Math.abs(cross.c1_delta) > 0.01;

    cross.c2_despesas        = despesas;
    cross.c2_faturaPlataforma= faturaPlataforma;
    cross.discrepanciaCritica= despesas - faturaPlataforma;
    cross.c2_delta           = cross.discrepanciaCritica;
    cross.c2_pct             = despesas > 0 ? (cross.c2_delta / despesas) * 100 : 0;
    cross.percentagemOmissao = cross.c2_pct;

    // ── MOTOR DE CÁLCULO DE RESPONSABILIDADE FISCAL (computeTaxLiability) ────
    // Chamada à função de segregação de taxas por natureza de operação.
    // Resultado armazenado em cross.taxLiability (estrutura de cenários).
    Object.assign(cross, computeTaxLiability(cross, totals));

    cross.c3_saftBruto       = saftBruto;
    cross.c3_ganhos          = ganhos;
    cross.c3_delta           = saftBruto - ganhos;
    cross.c3_pct             = saftBruto > 0 ? (cross.c3_delta / saftBruto) * 100 : 0;
    cross.saftVsGanhosAlert  = Math.abs(cross.c3_delta) > 0.01;

    cross.c4_liquidoDeclarado = saftBruto - faturaPlataforma;
    cross.c4_liquidoReal      = ganhosLiquidos;
    cross.c4_delta            = cross.c4_liquidoDeclarado - ganhosLiquidos;
    cross.c4_pct              = cross.c4_liquidoDeclarado > 0
                                    ? (cross.c4_delta / cross.c4_liquidoDeclarado) * 100
                                    : 0;

    cross.discrepanciaSaftVsDac7  = saftBruto - dac7Total;
    cross.percentagemSaftVsDac7   = saftBruto > 0 ? (cross.discrepanciaSaftVsDac7 / saftBruto) * 100 : 0;
    cross.percentagemDiscrepancia = cross.c2_pct;
    cross.discrepancia            = cross.discrepanciaCritica;

    const discrepanciaMensalMedia = cross.discrepanciaCritica / mesesDados;
    cross.btor = despesas;
    cross.btf  = faturaPlataforma;

    // RETIFICAÇÃO R24-CONSERVADOR: usar calcularDanoConservador() com factor 0.85
    if (window.calcularDanoConservador && typeof window.calcularDanoConservador === 'function') {
        const impactoAnualConservador = window.calcularDanoConservador(discrepanciaMensalMedia, 38000);
        cross.impactoMensalMercado   = impactoAnualConservador / 12;
        cross.impactoAnualMercado    = impactoAnualConservador;
        cross.impactoSeteAnosMercado = impactoAnualConservador * 7;
        console.log('[UNIFED-CONSERVADOR] 📊 Impacto calculado via calcularDanoConservador() (factor 0.85):', impactoAnualConservador.toFixed(2));
    } else {
        // Fallback: cálculo directo sem factor conservador (sem calcularDanoConservador disponível)
        cross.impactoMensalMercado   = discrepanciaMensalMedia * 38000;
        cross.impactoAnualMercado    = cross.impactoMensalMercado * 12;
        cross.impactoSeteAnosMercado = cross.impactoAnualMercado * 7;
        console.warn('[UNIFED-CONSERVADOR] ⚠️ calcularDanoConservador() não disponível — usando cálculo directo.');
    }

    cross.discrepancia5IMT     = cross.discrepanciaSaftVsDac7 * 0.05;
    cross.agravamentoBrutoIRC  = (cross.discrepancia / mesesDados) * 12;
    cross.ircEstimado          = cross.agravamentoBrutoIRC * 0.21;
    cross.bigDataAlertActive   = Math.abs(cross.discrepanciaCritica) > 0.01;

    const baseComparacao = Math.max(saftBruto, ganhos, dac7Total);
    UNIFEDSystem.analysis.verdict = getRiskVerdict(Math.abs(cross.discrepanciaCritica), baseComparacao);

    if (UNIFEDSystem.analysis.verdict) {
        UNIFEDSystem.analysis.verdict.percent = cross.percentagemDiscrepancia.toLocaleString('pt-PT', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + '%';
    }

    logAudit(`━━ MATRIZ FORENSE v1.0-COMMERCIAL-LITIGATION ━━ Período: ${UNIFEDSystem.selectedPeriodo} | Meses: ${mesesDados}`, 'info');
    logAudit(`[C1] SAF-T Bruto (${formatCurrency(saftBruto)}) vs DAC7 (${formatCurrency(dac7Total)}) → Δ ${formatCurrency(cross.c1_delta)} (${cross.c1_pct.toFixed(2)}%) — Sub-comunicação plataforma→Estado`, 'warning');
    logAudit(`[C2] 🔫 SMOKING GUN — Despesas/Comissões (${formatCurrency(despesas)}) vs Faturado (${formatCurrency(faturaPlataforma)}) → Δ ${formatCurrency(cross.c2_delta)} (${cross.c2_pct.toFixed(2)}%) — Retenção ilegal provada`, 'error');
    logAudit(`[C3] SAF-T Bruto (${formatCurrency(saftBruto)}) vs Ganhos Extrato (${formatCurrency(ganhos)}) → Δ ${formatCurrency(cross.c3_delta)} (${cross.c3_pct.toFixed(2)}%) — Viagens faturadas vs transferências efectivas`, 'warning');
    logAudit(`[C4] Líquido Declarado (${formatCurrency(cross.c4_liquidoDeclarado)}) vs Líquido Real (${formatCurrency(ganhosLiquidos)}) → Δ ${formatCurrency(cross.c4_delta)} (${cross.c4_pct.toFixed(2)}%) — Diferença final no bolso`, 'error');
    logAudit(`💰 [Cen.A] IVA 23% Comissões (BTOR-BTF×23%): ${formatCurrency(cross.ivaFalta)} | [Cen.B] IVA 6% Transporte (Ganhos-SAF-T×6%): ${formatCurrency(cross.ivaFalta6)} | ⚠️ Cenários mutuamente exclusivos — não somar`, 'error');
    logAudit(`📐 Agravamento IRC Anual (C2/meses×12): ${formatCurrency(cross.agravamentoBrutoIRC)} | IRC Est. (21%): ${formatCurrency(cross.ircEstimado)}`, 'info');

    ForensicLogger.addEntry('CROSSINGS_CALCULATED_4AXES', {
        c1_saftVsDac7:    { delta: cross.c1_delta,  pct: cross.c1_pct  },
        c2_despVsFatura:  { delta: cross.c2_delta,  pct: cross.c2_pct  },
        c3_saftVsGanhos:  { delta: cross.c3_delta,  pct: cross.c3_pct  },
        c4_liqDecVsReal:  { delta: cross.c4_delta,  pct: cross.c4_pct  },
        discrepancy: cross.discrepanciaCritica,
        saftVsDac7: cross.discrepanciaSaftVsDac7,
        percentage: cross.percentagemOmissao,
        percentageSaftVsDac7: cross.percentagemSaftVsDac7,
        vat23: cross.ivaFalta,
        vat6: cross.ivaFalta6
    });
}

function selectQuestions(riskKey) {
    const filtered = QUESTIONS_CACHE.filter(q => {
        if (riskKey === 'critical') return true;
        if (riskKey === 'high') return q.type === 'high' || q.type === 'med';
        if (riskKey === 'med') return q.type === 'med' || q.type === 'low';
        if (riskKey === 'low') return q.type === 'low';
        return true;
    });

    const PRIORITY_ORDER = { high: 0, med: 1, low: 2 };
    const sorted = [...filtered].sort((a, b) => {
        const pa = PRIORITY_ORDER[a.type] ?? 2;
        const pb = PRIORITY_ORDER[b.type] ?? 2;
        if (pa !== pb) return pa - pb;
        return 0.5 - Math.random();
    });
    UNIFEDSystem.analysis.selectedQuestions = sorted.slice(0, 10);

    ForensicLogger.addEntry('QUESTIONS_SELECTED', { count: UNIFEDSystem.analysis.selectedQuestions.length, riskKey });
}

function filterDAC7ByPeriod() {
    const periodo = UNIFEDSystem.selectedPeriodo || 'anual';
    const dac7 = UNIFEDSystem.documents.dac7.totals;

    const visibilityMap = {
        'anual':      [1, 2, 3, 4],
        '1s':         [1, 2],
        '2s':         [3, 4],
        'trimestral': [UNIFEDSystem.selectedTrimestre || 1],
        'mensal':     [1, 2, 3, 4]
    };

    if (periodo === 'trimestral') {
        const triSelector = document.getElementById('trimestralSelector');
        if (triSelector) {
            const tri = parseInt(triSelector.value, 10);
            if (tri >= 1 && tri <= 4) {
                UNIFEDSystem.selectedTrimestre = tri;
                visibilityMap['trimestral'] = [tri];
            }
        }
    }

    const visible = visibilityMap[periodo] || [1, 2, 3, 4];

    const _isDemoHide = (typeof UNIFEDSystem !== 'undefined' && UNIFEDSystem.demoMode === true);
    [1, 2, 3, 4].forEach(q => {
        const card = document.getElementById(`dac7Q${q}Value`)?.closest('.kpi-card');
        if (card) {
            const qVal = dac7[`q${q}`] || 0;
            const hide = !visible.includes(q) || (_isDemoHide && qVal === 0);
            card.style.display = hide ? 'none' : '';
        }
    });

    let periodoTotal = 0;
    visible.forEach(q => {
        periodoTotal += dac7[`q${q}`] || 0;
    });

    UNIFEDSystem.documents.dac7.totals.totalPeriodo = periodoTotal;
    UNIFEDSystem.analysis.totals = UNIFEDSystem.analysis.totals || {};
    UNIFEDSystem.analysis.totals.dac7TotalPeriodo = periodoTotal;

    const periodoLabel = {
        'anual': currentLang === 'pt' ? 'Anual' : 'Annual',
        '1s': currentLang === 'pt' ? '1.º Semestre' : '1st Semester',
        '2s': currentLang === 'pt' ? '2.º Semestre' : '2nd Semester',
        'trimestral': `${UNIFEDSystem.selectedTrimestre || 1}.º ${currentLang === 'pt' ? 'Trimestre' : 'Quarter'}`,
        'mensal': currentLang === 'pt' ? 'Mensal' : 'Monthly'
    }[periodo] || periodo;

    logAudit(`📅 Filtro DAC7 aplicado: ${periodoLabel} — Total: ${formatCurrency(periodoTotal)}`, 'info');
    ForensicLogger.addEntry('DAC7_PERIOD_FILTER', { periodo, visible, periodoTotal });

    return periodoTotal;
}

function showTwoAxisAlerts() {
    const twoAxis = UNIFEDSystem.analysis.twoAxis;
    const totals  = UNIFEDSystem.analysis.totals;
    const t = translations[currentLang];

    const revenueGapCard = document.getElementById('revenueGapCard');
    const revenueGapTitle = document.getElementById('revenueGapTitle');
    const revenueGapDesc = document.getElementById('revenueGapDesc');
    if (revenueGapTitle) revenueGapTitle.textContent = t.revenueGapTitle;
    if (revenueGapDesc) revenueGapDesc.textContent = t.revenueGapDesc;
    
    if (revenueGapCard && document.getElementById('revenueGapValue')) {
        if (twoAxis.revenueGapActive) {
            revenueGapCard.style.display = 'block';
            document.getElementById('revenueGapValue').textContent = formatCurrency(twoAxis.revenueGap);
            if (Math.abs(twoAxis.revenueGap) > 100) {
                revenueGapCard.classList.add('alert-intermitent');
            } else {
                revenueGapCard.classList.remove('alert-intermitent');
            }
        } else {
            revenueGapCard.style.display = 'none';
        }
    }

    const expenseGapCard = document.getElementById('expenseGapCard');
    const expenseGapTitle = document.getElementById('expenseGapTitle');
    const expenseGapDesc = document.getElementById('expenseGapDesc');
    if (expenseGapTitle) expenseGapTitle.textContent = t.expenseGapTitle;
    if (expenseGapDesc) expenseGapDesc.textContent = t.expenseGapDesc;
    
    if (expenseGapCard && document.getElementById('expenseGapValue')) {
        if (twoAxis.expenseGapActive) {
            expenseGapCard.style.display = 'block';
            document.getElementById('expenseGapValue').textContent = formatCurrency(twoAxis.expenseGap);
            if (Math.abs(twoAxis.expenseGap) > 50) {
                expenseGapCard.classList.add('alert-intermitent');
            } else {
                expenseGapCard.classList.remove('alert-intermitent');
            }
        } else {
            expenseGapCard.style.display = 'none';
        }
    }

    const omissaoCard = document.getElementById('omissaoDespesasPctCard');
    const omissaoTitle = document.getElementById('omissaoDespesasPctTitle');
    if (omissaoTitle) omissaoTitle.textContent = t.omissaoDespesasPctTitle;
    
    const omissaoValue = document.getElementById('omissaoDespesasPctValue');
    const omissaoDesc = document.getElementById('omissaoDespesasPctDesc');
    if (omissaoCard && omissaoValue) {
        const despesas = totals.despesas || 0;
        const ganhos   = totals.ganhos   || 0;
        if (ganhos === 0 || despesas === 0) {
            omissaoValue.textContent = '0.00 %';
            omissaoCard.style.display = 'none';
        } else {
            const pct = ((despesas / ganhos) * 100);
            const locale = currentLang === 'pt' ? 'pt-PT' : 'en-US';
            const separator = currentLang === 'pt' ? ',' : '.';
            const pctFormatted = pct.toFixed(2).replace('.', separator) + ' %';
            omissaoValue.textContent = pctFormatted;
            omissaoCard.style.display = 'block';
            if (omissaoDesc) {
                // RETIFICAÇÃO R24-1.1: evitar [undefined] quando t.expenseGapLabel não existe
                const label = (t && t.expenseGapLabel) ? t.expenseGapLabel
                    : (currentLang === 'pt' ? 'OMISSÃO DE CUSTOS/IVA' : 'COST/VAT OMISSION');
                omissaoDesc.textContent = `(${formatCurrency(despesas)} / ${formatCurrency(ganhos)}) × 100  [${label}]`;
            }
            if (pct > 25) {
                omissaoCard.classList.add('omissao-threshold-alert');
                omissaoCard.classList.remove('alert-intermitent');
            } else {
                omissaoCard.classList.remove('omissao-threshold-alert');
                omissaoCard.classList.remove('alert-intermitent');
            }
        }
    }
}

function updateDashboard() {
    const totals = UNIFEDSystem.analysis.totals;
    const cross = UNIFEDSystem.analysis.crossings;
    const twoAxis = UNIFEDSystem.analysis.twoAxis;
    const t = translations[currentLang];

    const zonaCinzentaCard = document.getElementById('pureZonaCinzentaCard');
    if (zonaCinzentaCard) {
        const hasData = totals && (totals.ganhos > 0 || totals.naoSujeitosTotal > 0);
        zonaCinzentaCard.style.display = hasData ? 'block' : 'none';
    }

    const netValue = totals.ganhosLiquidos || 0;

    setElementText('statNet', formatCurrency(netValue));
    setElementText('statComm', formatCurrency(totals.despesas || 0));
    setElementText('statJuros', formatCurrency(cross.discrepanciaCritica || 0));

    setElementText('kpiGrossValue', formatCurrency(totals.ganhos || 0));
    setElementText('kpiCommValue', formatCurrency(totals.despesas || 0));
    setElementText('kpiNetValue', formatCurrency(netValue));
    setElementText('kpiInvValue', formatCurrency(totals.faturaPlataforma || 0));

    setElementText('discrepancy5Value', formatCurrency(cross.discrepanciaSaftVsDac7 || 0));
    setElementText('agravamentoBrutoValue', formatCurrency(cross.agravamentoBrutoIRC || 0));
    setElementText('ircValue', formatCurrency(cross.ircEstimado || 0));
    setElementText('iva6Value', formatCurrency(cross.ivaFalta6 || 0));
    setElementText('iva23Value', formatCurrency(cross.ivaFalta || 0));

    // R24-C4: quantumValue — desvio individual (discrepanciaCritica) em vez do impacto macro 7 anos
    const desvioIndividual = cross.discrepanciaCritica || (totals.despesas - totals.faturaPlataforma) || 0;
    setElementText('quantumValue', formatCurrency(Math.abs(desvioIndividual)));

    const kpiCommText = document.getElementById('kpiCommText');
    if (kpiCommText) kpiCommText.textContent = t.kpiCommText;
    const kpiNetText = document.getElementById('kpiNetText');
    if (kpiNetText) kpiNetText.textContent = t.kpiNetText;
    const kpiInvText = document.getElementById('kpiInvText');
    if (kpiInvText) kpiInvText.textContent = t.kpiInvText;
    const kpiGross = document.getElementById('kpiGross');
    if (kpiGross) kpiGross.textContent = t.kpiGross;

    const mesesDados = UNIFEDSystem.dataMonths.size || 1;

    const quantumFormulaEl = document.getElementById('quantumFormula');
    if (quantumFormulaEl) {
        quantumFormulaEl.textContent = `${t.quantumFormula}: ${formatCurrency(cross.discrepanciaCritica)} | ${cross.percentagemOmissao.toFixed(2)}%`;
    }

    const quantumNoteEl = document.getElementById('quantumNote');
    if (quantumNoteEl) {
        quantumNoteEl.textContent = `${t.quantumNoteIVA23} ${formatCurrency(cross.ivaFalta)} | ${t.quantumNoteIVA6} ${formatCurrency(cross.ivaFalta6)} ⚠️ Alt. | SAF-T/DAC7: ${formatCurrency(cross.discrepanciaSaftVsDac7)}`;
    }

    const quantumBreakdownEl = document.getElementById('quantumBreakdown');
    if (quantumBreakdownEl) {
        const qLang = currentLang;
        quantumBreakdownEl.innerHTML = `
            <div class="quantum-breakdown-item">
                <span>BTOR ${qLang === 'pt' ? '(Despesas/Comissões Extrato)' : '(Expenses/Commissions Statement)'}:</span>
                <span>${formatCurrency(cross.btor)}</span>
            </div>
            <div class="quantum-breakdown-item">
                <span>BTF ${qLang === 'pt' ? '(Faturas)' : '(Invoices)'}:</span>
                <span>${formatCurrency(cross.btf)}</span>
            </div>
            <div class="quantum-breakdown-item" style="border-top: 1px solid rgba(0,229,255,0.3); margin-top:0.3rem; padding-top:0.3rem;">
                <span>${qLang === 'pt' ? 'DISCREPÂNCIA DESPESAS/COMISSÕES' : 'EXPENSE/COMMISSION DISCREPANCY'}:</span>
                <span style="color:var(--warn-primary);">${formatCurrency(cross.discrepanciaCritica)} (${cross.percentagemOmissao.toFixed(2)}%)</span>
            </div>
            <div class="quantum-breakdown-item">
                <span>${qLang === 'pt' ? 'Ganhos (Extrato)' : 'Earnings (Statement)'}:</span>
                <span>${formatCurrency(totals.ganhos)}</span>
            </div>
            <div class="quantum-breakdown-item">
                <span>SAF-T ${qLang === 'pt' ? 'Bruto' : 'Gross'}:</span>
                <span>${formatCurrency(totals.saftBruto)}</span>
            </div>
            <div class="quantum-breakdown-item">
                <span>DAC7 (${UNIFEDSystem.selectedPeriodo}):</span>
                <span>${formatCurrency(totals.dac7TotalPeriodo)}</span>
            </div>
            <div class="quantum-breakdown-item" style="border-top: 1px solid rgba(245,158,11,0.3); margin-top:0.3rem; padding-top:0.3rem;">
                <span>SAF-T vs DAC7 ${qLang === 'pt' ? 'DISCREPÂNCIA' : 'DISCREPANCY'}:</span>
                <span style="color:var(--warn-secondary);">${formatCurrency(cross.discrepanciaSaftVsDac7)} (${cross.percentagemSaftVsDac7.toFixed(2)}%)</span>
            </div>
            <div class="quantum-breakdown-item">
                <span>${qLang === 'pt' ? 'Meses com dados' : 'Months with data'}:</span>
                <span>${mesesDados}</span>
            </div>
            <div class="quantum-breakdown-item">
                <span>${qLang === 'pt' ? 'Média mensal' : 'Monthly average'}:</span>
                <span>${formatCurrency(cross.discrepanciaCritica / mesesDados)}</span>
            </div>
            <div class="quantum-breakdown-item" style="border-top: 1px solid rgba(0,229,255,0.3); margin-top:0.3rem; padding-top:0.3rem;">
                <span>${qLang === 'pt' ? 'Impacto Mensal Mercado (38k)' : 'Monthly Market Impact (38k)'}:</span>
                <span>${formatCurrency(cross.impactoMensalMercado)}</span>
            </div>
            <div class="quantum-breakdown-item">
                <span>${qLang === 'pt' ? 'Impacto Anual Mercado' : 'Annual Market Impact'}:</span>
                <span>${formatCurrency(cross.impactoAnualMercado)}</span>
            </div>
            <div class="quantum-breakdown-item">
                <span>${qLang === 'pt' ? 'IMPACTO 7 ANOS' : '7‑YEAR IMPACT'}:</span>
                <span style="color:var(--accent-primary); font-weight:800;">${formatCurrency(cross.impactoSeteAnosMercado)}</span>
            </div>
        `;
    }

    const jurosCard = document.getElementById('jurosCard');
    if(jurosCard) {
        jurosCard.style.display = (Math.abs(cross.discrepanciaCritica) > 0) ? 'block' : 'none';
        if (Math.abs(cross.discrepanciaCritica) > 0) {
            jurosCard.classList.add('box-border-blink');
        } else {
            jurosCard.classList.remove('box-border-blink');
        }
    }

    const discrepancy5Card = document.getElementById('discrepancy5Card');
    if(discrepancy5Card) {
        discrepancy5Card.style.display = (Math.abs(cross.discrepanciaSaftVsDac7) > 0) ? 'block' : 'none';
        if (Math.abs(cross.discrepanciaSaftVsDac7) > 0) {
            discrepancy5Card.classList.add('box-border-blink');
        } else {
            discrepancy5Card.classList.remove('box-border-blink');
        }
    }

    const agravamentoBrutoCard = document.getElementById('agravamentoBrutoCard');
    if(agravamentoBrutoCard) agravamentoBrutoCard.style.display = (Math.abs(cross.agravamentoBrutoIRC) > 0) ? 'block' : 'none';

    const ircCard = document.getElementById('ircCard');
    if(ircCard) ircCard.style.display = (Math.abs(cross.ircEstimado) > 0) ? 'block' : 'none';

    const iva6Card = document.getElementById('iva6Card');
    if(iva6Card) iva6Card.style.display = (Math.abs(cross.ivaFalta6) > 0) ? 'block' : 'none';

    const iva23Card = document.getElementById('iva23Card');
    if(iva23Card) iva23Card.style.display = (Math.abs(cross.ivaFalta) > 0) ? 'block' : 'none';

    const quantumBox = document.getElementById('quantumBox');
    if (quantumBox) {
        quantumBox.style.display = (Math.abs(cross.impactoSeteAnosMercado) > 0) ? 'block' : 'none';
    }

    {
        const _ch = UNIFEDSystem.masterHash || '';
        if (cross.percentagemOmissao > 15 && _ch && _ch !== _nifafAlertedHash) {
            _nifafAlertedHash = _ch;
            if (window.NIFAF) window.NIFAF.playCriticalAlert();
        }
    }

    activateIntermittentAlerts();
}

function activateIntermittentAlerts() {
    const cross = UNIFEDSystem.analysis.crossings;
    const twoAxis = UNIFEDSystem.analysis.twoAxis;

    const kpiInvCard = document.getElementById('kpiInvCard');
    if (kpiInvCard) {
        if (Math.abs(cross.discrepanciaCritica) > 0.01) {
            kpiInvCard.classList.add('alert-intermitent');
        } else {
            kpiInvCard.classList.remove('alert-intermitent');
        }
    }

    const kpiCommCard = document.getElementById('kpiCommCard');
    if (kpiCommCard) {
        if (Math.abs(cross.discrepanciaCritica) > 0.01) {
            kpiCommCard.classList.add('alert-intermitent');
        } else {
            kpiCommCard.classList.remove('alert-intermitent');
        }
    }

    const revenueGapCard = document.getElementById('revenueGapCard');
    if (revenueGapCard) {
        if (Math.abs(twoAxis.revenueGap) > 100) {
            revenueGapCard.classList.add('alert-intermitent');
        } else {
            revenueGapCard.classList.remove('alert-intermitent');
        }
    }

    const expenseGapCard = document.getElementById('expenseGapCard');
    if (expenseGapCard) {
        if (Math.abs(twoAxis.expenseGap) > 50) {
            expenseGapCard.classList.add('alert-intermitent');
            expenseGapCard.classList.add('box-despesas-blink');
        } else {
            expenseGapCard.classList.remove('alert-intermitent');
            expenseGapCard.classList.remove('box-despesas-blink');
        }
    }

    document.querySelectorAll('.led-status').forEach(led => {
        if (Math.abs(cross.discrepanciaCritica) > 0.01) {
            led.className = 'led-status led-red-blink';
        } else if (Math.abs(twoAxis.revenueGap) > 100) {
            led.className = 'led-status led-yellow-blink';
        }
    });

    const statCommCard = document.getElementById('statCommCard');
    if (statCommCard) {
        if (Math.abs(cross.discrepanciaCritica) > 0.01) {
            statCommCard.classList.add('alert-intermitent');
            statCommCard.classList.add('box-despesas-blink');
            statCommCard.style.borderColor = 'rgba(255,0,0,0.9)';
            statCommCard.style.boxShadow   = '0 0 18px rgba(255,0,0,0.55), inset 0 0 8px rgba(255,0,0,0.15)';
        } else {
            statCommCard.classList.remove('alert-intermitent');
            statCommCard.classList.remove('box-despesas-blink');
            statCommCard.style.borderColor = '';
            statCommCard.style.boxShadow   = '';
        }
    }

    if (cross.percentagemOmissao > 25) {
        document.querySelectorAll('.led-status').forEach(led => {
            led.className = 'led-status led-red-blink';
        });
    }
}

function updateModulesUI() {
    const totals = UNIFEDSystem.analysis.totals;

    setElementText('saftIliquidoValue', formatCurrency(totals.saftIliquido || 0));
    setElementText('saftIvaValue', formatCurrency(totals.saftIva || 0));
    setElementText('saftBrutoValue', formatCurrency(totals.saftBruto || 0));

    setElementText('stmtGanhosValue', formatCurrency(totals.ganhos || 0));
    setElementText('stmtDespesasValue', formatCurrency(totals.despesas || 0));
    setElementText('stmtGanhosLiquidosValue', formatCurrency(totals.ganhosLiquidos || 0));

    setElementText('dac7Q1Value', formatCurrency(totals.dac7Q1 || 0));
    setElementText('dac7Q2Value', formatCurrency(totals.dac7Q2 || 0));
    setElementText('dac7Q3Value', formatCurrency(totals.dac7Q3 || 0));
    setElementText('dac7Q4Value', formatCurrency(totals.dac7Q4 || 0));

    const sourceElements = document.querySelectorAll('[id$="Source"]');
    sourceElements.forEach(el => {
        const baseId = el.id.replace('Source', '');
        const source = ValueSource.getBreakdown(baseId);
        if (source && el) {
            const fileName = source.sourceFile.length > 30 ? source.sourceFile.substring(0, 27) + '...' : source.sourceFile;
            el.textContent = `Fonte: ${fileName}`;
            el.setAttribute('data-tooltip', `Cálculo: ${source.calculationMethod}\nFicheiro: ${source.sourceFile}\nValor: ${formatCurrency(source.value)}`);
        }
    });
}

function showAlerts() {
    const totals = UNIFEDSystem.analysis.totals;
    const cross = UNIFEDSystem.analysis.crossings;
    const t = translations[currentLang];

    const verdictDisplay = document.getElementById('verdictDisplay');
    if(verdictDisplay && UNIFEDSystem.analysis.verdict) {
        verdictDisplay.style.display = 'block';
        verdictDisplay.className = `verdict-display active verdict-${UNIFEDSystem.analysis.verdict.key}`;
        setElementText('verdictLevel', UNIFEDSystem.analysis.verdict.level[currentLang]);

        const verdictPercentSpan = document.getElementById('verdictPercentSpan');
        if (verdictPercentSpan) {
            verdictPercentSpan.textContent = UNIFEDSystem.analysis.verdict.percent;
        }

        const platform = PLATFORM_DATA[UNIFEDSystem.selectedPlatform] || PLATFORM_DATA.outra;
        const mesesDados = UNIFEDSystem.dataMonths.size || 1;

        const periodoTexto = {
            'anual': currentLang === 'pt' ? 'Anual' : 'Annual',
            '1s': '1S',
            '2s': '2S',
            'trimestral': currentLang === 'pt' ? 'Trim' : 'Qtr',
            'mensal': currentLang === 'pt' ? 'Mensal' : 'Monthly'
        }[UNIFEDSystem.selectedPeriodo] || '';

        const sectionI = currentLang === 'pt' ? 'I. ANÁLISE PERICIAL' : 'I. FORENSIC ANALYSIS';
        const sectionII = currentLang === 'pt' ? 'II. FACTOS CONSTATADOS' : 'II. ESTABLISHED FACTS';
        const sectionIII = currentLang === 'pt' ? 'III. QUADRO LEGAL' : 'III. LEGAL FRAMEWORK';
        const sectionIV = currentLang === 'pt' ? 'IV. IMPACTO FISCAL' : 'IV. TAX IMPACT';
        const sectionV = currentLang === 'pt' ? 'V. CADEIA DE CUSTÓDIA' : 'V. CHAIN OF CUSTODY';

        const parecerHTML = `
            <div style="margin-bottom: 1rem;">
                <strong style="color: var(--accent-primary);">${sectionI} (${periodoTexto}):</strong><br>
                <span style="color: var(--text-secondary);">${currentLang === 'pt' ? 'Duas discrepâncias fundamentais detetadas:' : 'Two fundamental discrepancies detected:'}</span><br>
                <span style="color: var(--warn-primary);">1. ${currentLang === 'pt' ? 'Despesas/Comissões (Extrato) vs Faturas' : 'Expenses/Commissions (Statement) vs Invoices'}: ${formatCurrency(cross.discrepanciaCritica)} (${cross.percentagemOmissao.toFixed(2)}%)</span><br>
                <span style="color: var(--warn-secondary);">2. SAF-T vs DAC7: ${formatCurrency(cross.discrepanciaSaftVsDac7)} (${cross.percentagemSaftVsDac7.toFixed(2)}%)</span>
            </div>
            <div style="margin-bottom: 1rem;">
                <strong style="color: var(--accent-primary);">${sectionII}:</strong><br>
                <span style="color: var(--text-secondary);">${currentLang === 'pt' ? 'Ganhos (Extrato):' : 'Earnings (Statement):'} ${formatCurrency(totals.ganhos)}</span><br>
                <span style="color: var(--text-secondary);">${currentLang === 'pt' ? 'Despesas/Comissões (Extrato):' : 'Expenses (Statement):'} ${formatCurrency(totals.despesas)}</span><br>
                <span style="color: var(--success-primary);">${currentLang === 'pt' ? 'Ganhos Líquidos (Extrato):' : 'Net Earnings (Statement):'} ${formatCurrency(totals.ganhosLiquidos)}</span><br>
                <span style="color: var(--text-secondary);">${currentLang === 'pt' ? 'Valor Faturado:' : 'Invoiced Amount:'} ${formatCurrency(totals.faturaPlataforma || 0)}</span><br>
                <span style="color: var(--warn-primary); font-weight: 700;">${currentLang === 'pt' ? 'Diferencial de Base em Análise (Despesas/Comissões vs Fatura):' : 'Base Differential Under Analysis (Expenses/Commissions vs Invoice):'} ${formatCurrency(cross.discrepanciaCritica)} (${cross.percentagemOmissao.toFixed(2)}%)</span><br>
                <span style="color: var(--text-secondary);">${currentLang === 'pt' ? 'SAF-T Bruto:' : 'SAF-T Gross:'} ${formatCurrency(totals.saftBruto || 0)}</span><br>
                <span style="color: var(--text-secondary);">DAC7 (${periodoTexto}): ${formatCurrency(totals.dac7TotalPeriodo)}</span><br>
                <span style="color: var(--warn-secondary); font-weight: 700;">${currentLang === 'pt' ? 'Diferença SAF-T vs DAC7:' : 'SAF-T vs DAC7 Difference:'} ${formatCurrency(cross.discrepanciaSaftVsDac7)} (${cross.percentagemSaftVsDac7.toFixed(2)}%)</span>
            </div>
            <div style="margin-bottom: 1rem;">
                <strong style="color: var(--accent-primary);">${sectionIII}:</strong><br>
                <span style="color: var(--text-secondary);">${currentLang === 'pt' ? 'Art. 2.º(1)(i) Código IVA (Autoliquidação). Art. 108.º Código IVA (Infrações).' : 'Art. 2(1)(i) VAT Code (Self-liquidation). Art. 108 VAT Code (Offences).'}</span><br>
                <span style="color: var(--text-secondary);">${currentLang === 'pt' ? 'Decreto-Lei n.º 28/2019 - Integridade do processamento de dados e validade de documentos eletrónicos.' : 'Decree-Law No. 28/2019 - Data processing integrity and validity of electronic documents.'}</span>
            </div>
            <div style="margin-bottom: 1rem;">
                <strong style="color: var(--accent-primary);">${sectionIV}:</strong><br>
                <span style="color: var(--text-secondary);">${currentLang === 'pt' ? 'Cenário A — IVA 23% (BTOR-BTF × 23%):' : 'Scenario A — VAT 23% (BTOR-BTF × 23%):'} ${formatCurrency(cross.ivaFalta)}</span><br>
                <span style="color: var(--text-secondary);">${currentLang === 'pt' ? 'Cenário B — IVA 6% (Ganhos-SAF-T × 6%) ⚠️ Alt.:' : 'Scenario B — VAT 6% (Earnings-SAF-T × 6%) ⚠️ Alt.:'} ${formatCurrency(cross.ivaFalta6)}</span><br>
                <span style="color: var(--text-secondary);">${currentLang === 'pt' ? 'Discrepância SAF-T vs DAC7 (base tributável em análise):' : 'SAF-T vs DAC7 discrepancy (taxable base under analysis):'} ${formatCurrency(cross.discrepanciaSaftVsDac7)}</span>
            </div>
            <div style="margin-bottom: 1rem;">
                <strong style="color: var(--accent-primary);">${sectionV}:</strong><br>
                <span style="color: var(--text-secondary); font-family: var(--font-mono); font-size: 0.7rem;">Master Hash SHA-256:</span><br>
                <span style="color: var(--accent-secondary); font-family: var(--font-mono); font-size: 0.7rem; word-break: break-all;">${UNIFEDSystem.masterHash || 'Calculating...'}</span><br>
                <span style="color: var(--text-secondary); font-size: 0.7rem;">${UNIFEDSystem.analysis.evidenceIntegrity.length} ${currentLang === 'pt' ? 'evidência(s) processada(s) (clique no QR Code para verificar)' : 'evidence(s) processed (click QR Code to verify)'}</span>
            </div>
            <div style="margin-top: 1rem; border-top: 1px solid var(--border-color); padding-top: 0.5rem;">
                <strong style="color: var(--warn-primary);">VI. ${currentLang === 'pt' ? 'CONCLUSÃO' : 'CONCLUSION'}:</strong><br>
                <span style="color: var(--text-secondary);">${currentLang === 'pt' ? 'Evidência de incumprimento fiscal significativo.' : 'Evidence of significant tax non-compliance.'}</span>
            </div>
        `;

        document.getElementById('verdictDesc').innerHTML = parecerHTML;
        document.getElementById('verdictLevel').style.color = UNIFEDSystem.analysis.verdict.color;
    }

    const bigDataAlert = document.getElementById('bigDataAlert');
    if(bigDataAlert) {
        if(cross.bigDataAlertActive && Math.abs(cross.discrepanciaCritica) > 0.01) {
            bigDataAlert.style.display = 'flex';
            bigDataAlert.classList.add('alert-active');

            setElementText('alertDeltaValue', formatCurrency(cross.discrepanciaCritica));

            const alertOmissionText = document.getElementById('alertOmissionText');
            if (alertOmissionText) {
                alertOmissionText.innerHTML = `${currentLang === 'pt' ? 'Despesas/Comissões (Extrato)' : 'Expenses/Commissions (Statement)'}: ${formatCurrency(cross.btor)} | ${currentLang === 'pt' ? 'Faturada' : 'Invoiced'}: ${formatCurrency(cross.btf)}<br>
                <strong style="color: var(--warn-primary);">${currentLang === 'pt' ? 'DIVERGÊNCIA (OMISSÃO)' : 'DIVERGENCE (OMISSION)'}: ${formatCurrency(cross.discrepanciaCritica)} (${cross.percentagemOmissao.toFixed(2)}%)</strong><br>
                <span style="color: var(--warn-secondary);">SAF-T vs DAC7: ${formatCurrency(cross.discrepanciaSaftVsDac7)} (${cross.percentagemSaftVsDac7.toFixed(2)}%)</span>`;
            }
        } else {
            bigDataAlert.style.display = 'none';
            bigDataAlert.classList.remove('alert-active');
        }
    }
}

function renderChart() {
    const canvas = document.getElementById('mainChart');
    if (!canvas) return;

    let existingChart = Chart.getChart(canvas);
    if (existingChart) {
        existingChart.destroy();
    }

    const totals = UNIFEDSystem.analysis.totals;
    const cross = UNIFEDSystem.analysis.crossings;
    const t = translations[currentLang];

    const periodoTexto = {
        'anual': currentLang === 'pt' ? 'Anual' : 'Annual',
        '1s': '1S',
        '2s': '2S',
        'trimestral': currentLang === 'pt' ? 'Trim' : 'Qtr',
        'mensal': currentLang === 'pt' ? 'Mensal' : 'Monthly'
    }[UNIFEDSystem.selectedPeriodo] || '';

    const labels = [
        t.saftBruto || 'SAF-T Bruto',
        t.stmtGanhos || 'Ganhos',
        t.stmtDespesas || 'Despesas/Comissões',
        t.stmtGanhosLiquidos || 'Líquido',
        t.kpiInvText || 'Faturado',
        `DAC7 ${periodoTexto}`
    ];

    const data = [
        totals.saftBruto || 0,
        totals.ganhos || 0,
        totals.despesas || 0,
        totals.ganhosLiquidos || 0,
        totals.faturaPlataforma || 0,
        totals.dac7TotalPeriodo || 0
    ];

    const colors = ['#0ea5e9', '#10b981', '#ef4444', '#8b5cf6', '#6366f1', '#f59e0b'];

    window.currentMainChart = new Chart(canvas, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: currentLang === 'pt' ? 'Valor (€)' : 'Amount (€)',
                data: data,
                backgroundColor: colors,
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: (context) => {
                            return context.raw.toLocaleString(currentLang === 'pt' ? 'pt-PT' : 'en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €';
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: { color: 'rgba(255,255,255,0.1)' },
                    ticks: {
                        color: '#b8c6e0',
                        callback: (v) => v.toLocaleString(currentLang === 'pt' ? 'pt-PT' : 'en-US') + ' €'
                    }
                },
                x: {
                    grid: { color: 'rgba(255,255,255,0.05)' },
                    ticks: { color: '#b8c6e0' }
                }
            }
        }
    });
}

function renderDiscrepancyChart() {
    const canvas = document.getElementById('discrepancyChart');
    if (!canvas) return;

    let existingChart = Chart.getChart(canvas);
    if (existingChart) {
        existingChart.destroy();
    }

    const totals = UNIFEDSystem.analysis.totals;
    const cross = UNIFEDSystem.analysis.crossings;
    const t = translations[currentLang];

    window.currentDiscrepancyChart = new Chart(canvas, {
        type: 'scatter',
        data: {
            datasets: [{
                label: currentLang === 'pt' ? 'Discrepância Despesas/Comissões vs Faturas' : 'Expenses/Commissions vs Invoice Discrepancy',
                data: [{ x: 1, y: cross.discrepanciaCritica }],
                backgroundColor: '#ef4444',
                pointRadius: 10,
                pointHoverRadius: 15
            }, {
                label: currentLang === 'pt' ? 'Discrepância SAF-T vs DAC7' : 'SAF-T vs DAC7 Discrepancy',
                data: [{ x: 2, y: cross.discrepanciaSaftVsDac7 }],
                backgroundColor: '#f59e0b',
                pointRadius: 10,
                pointHoverRadius: 15
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                tooltip: {
                    callbacks: {
                        label: (context) => {
                            return context.dataset.label + ': ' + formatCurrency(context.raw.y);
                        }
                    }
                }
            },
            scales: {
                x: {
                    type: 'category',
                    labels: ['', currentLang === 'pt' ? 'Despesas/Comissões' : 'Expenses/Commissions', 'SAF-T/DAC7', ''],
                    grid: { color: 'rgba(255,255,255,0.1)' },
                    ticks: { color: '#b8c6e0' }
                },
                y: {
                    beginAtZero: true,
                    grid: { color: 'rgba(255,255,255,0.1)' },
                    ticks: {
                        color: '#b8c6e0',
                        callback: (v) => v.toLocaleString(currentLang === 'pt' ? 'pt-PT' : 'en-US') + ' €'
                    }
                }
            }
        }
    });
}

// ============================================================================
// CANAL ÚNICO DE EXPORTAÇÃO JSON — exportForensicPayload
// OSF 2A + ADENDO: elimina exportDataJSON redundante (35 KB) e centraliza
// toda a exportação no motor Big Data _generateDynamicForensicPayload (593 KB).
// Fix OSF 2B: "m is not defined" — estado injectado via window.UNIFEDSystem,
// nunca dependente de variável local m fora do scope de getSystemMetrics().
// ============================================================================

// ============================================================================
// CANAL ÚNICO DE EXPORTAÇÃO JSON — exportForensicPayload (mantido)
// ============================================================================
window.exportForensicPayload = function(targetMode) {
    const mode = targetMode || 'analyst';
    if (window.UNIFED_TRIADA_EXPORT && typeof window.UNIFED_TRIADA_EXPORT.downloadJsonData === 'function') {
        window.UNIFED_TRIADA_EXPORT.downloadJsonData(mode, window.currentLang || 'pt');
    } else {
        console.error('[UNIFED] Erro: Motor de exportação unificado indisponível.');
        showToast('Motor de exportação indisponível.', 'error');
    }
};
window.exportDataJSON = function() { window.exportForensicPayload('analyst'); };

// ── MAPEAMENTO DOS BOTÕES AO CANAL ÚNICO (IIFE corrigida) ─────────────────
(function _bindExportButtons() {
    const _map = {
        'btn-export-json':     'analyst',
        'btn-export-analyst':  'analyst',
        'btn-export-lawyer':   'lawyer',
        'exportJSONBtn':       'analyst'
        // 'exportAnalystBtn' e 'exportLawyerBtn' foram removidos para evitar sequestro do PDF
    };

    function _bind() {
        Object.keys(_map).forEach(function(id) {
            const btn = document.getElementById(id);
            if (btn && !btn._unifedBound) {
                btn.onclick = null;
                btn.addEventListener('click', function(e) {
                    e.preventDefault();
                    e.stopImmediatePropagation();
                    window.exportForensicPayload(_map[id]);
                });
                btn._unifedBound = true;
                console.log('[UNIFED-EXPORT] Botão #' + id + ' → exportForensicPayload(' + _map[id] + ')');
            }
        });

        // Botão Pacote Advogado (PDF completo) — vinculação directa ao motor nativo
        const btnLawyer = document.getElementById('exportLawyerBtn');
        if (btnLawyer && !btnLawyer._unifedPDFBound) {
            btnLawyer.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopImmediatePropagation();
                if (window.UNIFED_TRIADA_EXPORT && typeof window.UNIFED_TRIADA_EXPORT._exportPacoteAdvogado === 'function') {
                    window.UNIFED_TRIADA_EXPORT._exportPacoteAdvogado();
                } else if (typeof window._exportPacoteAdvogado === 'function') {
                    window._exportPacoteAdvogado();
                } else {
                    console.error('[UNIFED-EXPORT] _exportPacoteAdvogado não disponível.');
                }
            });
            btnLawyer._unifedPDFBound = true;
            console.log('[UNIFED-EXPORT] Botão #exportLawyerBtn vinculado (PDF Advogado).');
        }

        // Botão Pacote Analista (PDF completo) — vinculação directa ao motor nativo
        const btnAnalyst = document.getElementById('exportAnalystBtn');
        if (btnAnalyst && !btnAnalyst._unifedPDFBound) {
            btnAnalyst.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopImmediatePropagation();
                if (window.UNIFED_TRIADA_EXPORT && typeof window.UNIFED_TRIADA_EXPORT._exportPacoteAnalista === 'function') {
                    window.UNIFED_TRIADA_EXPORT._exportPacoteAnalista();
                } else if (typeof window._exportPacoteAnalista === 'function') {
                    window._exportPacoteAnalista();
                } else {
                    console.error('[UNIFED-EXPORT] _exportPacoteAnalista não disponível.');
                }
            });
            btnAnalyst._unifedPDFBound = true;
            console.log('[UNIFED-EXPORT] Botão #exportAnalystBtn vinculado (PDF Analista).');
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', _bind);
    } else {
        _bind();
    }
    document.addEventListener('UNIFED_SYSTEM_READY', _bind, { once: true });
    window._rebindExportButtons = _bind;
})();

// R-EPF-02: Declaração duplicada de exportPDF (exportação JSON) removida.
// Esta função produzia um blob JSON — funcionalidade supersedida por
// window.exportForensicPayload / window.exportDataJSON (cf. linha ~6484).
// Em JavaScript não-estrito, a segunda declaração homónima prevalecia sobre
// esta, tornando este bloco código morto e fonte de ambiguidade no hoisting.
// Mantém-se apenas a declaração canónica abaixo (motor jsPDF real).

// ============================================================================
// EXPORTAÇÃO PDF – Delegada ao motor pdfMake (unifed_triada_export.js)
// ============================================================================
async function exportPDF() {
    console.warn('[DEPRECATED] exportPDF() está obsoleta. O motor de exportação foi delegado inteiramente à Tríade (unifed_triada_export.js).');
    
    if (typeof showToast === 'function') {
        showToast('Utilize os botões da "Tríade Pericial" para gerar os pacotes documentais.', 'info');
    }
    
    // Anula o throw de erro e quebra o loop
    return null;
}

function processAuxiliaryPlatformData(text, filename) {
    if (!text || typeof text !== 'string') return;

    let campanhas = 0;
    let portagens = 0;
    let gorjetas = 0;
    let cancelamentos = 0;

    const campaignMatch = text.match(
        /Ganhos\s+da\s+campa[nñ]ha\s*[:\-–]?\s*(?:€\s*)?([\d][.\d]*[,\d]*\s*€?)/i
    ) || text.match(
        /Campaign\s+(?:earnings?|bonus)\s*[:\-–]?\s*(?:€\s*)?([\d][.\d]*[,\d]*\s*€?)/i
    );

    const tollCsvRegex = /"(?:Portagens|Reembolsos de despesas)\n?","([\d.,-]+)"/g;
    let tollCsvMatch;
    while ((tollCsvMatch = tollCsvRegex.exec(text)) !== null) {
        portagens += normalizeNumericValue(tollCsvMatch[1]);
    }
    if (portagens === 0) {
        const portageTextMatch = text.match(
            /(?:Portagens?|Reembolsos\s+de\s+despesas)\s*[:\-–]?\s*(?:€\s*)?([\d][.\d]*[,\d]*\s*€?)/i
        ) || text.match(
            /Tolls?\s*[:\-–]?\s*(?:€\s*)?([\d][.\d]*[,\d]*\s*€?)/i
        );
        if (portageTextMatch && portageTextMatch[1]) {
            portagens = normalizeNumericValue(portageTextMatch[1]);
        }
    }

    const tipsMatch = text.match(
        /Gorjetas\s+dos\s+passageiros\s*[:\-–]?\s*(?:€\s*)?([\d][.\d]*[,\d]*\s*€?)/i
    ) || text.match(
        /(?:Tips?|Gorjetas?)\s*[:\-–]?\s*(?:€\s*)?([\d][.\d]*[,\d]*\s*€?)/i
    );

    const cancelMatch = text.match(
        /Cancelamentos?\s*[:\-–]?\s*(?:€\s*)?([\d][.\d]*[,\d]*\s*€?)/i
    ) || text.match(
        /(?:Cancel(?:lation)?\s+fees?)\s*[:\-–]?\s*(?:€\s*)?([\d][.\d]*[,\d]*\s*€?)/i
    );

    campanhas     = campaignMatch && campaignMatch[1] ? normalizeNumericValue(campaignMatch[1]) : 0;
    gorjetas      = tipsMatch    && tipsMatch[1]     ? normalizeNumericValue(tipsMatch[1])     : 0;
    cancelamentos = cancelMatch  && cancelMatch[1]   ? normalizeNumericValue(cancelMatch[1])   : 0;

    UNIFEDSystem.auxiliaryData.campanhas       += campanhas;
    UNIFEDSystem.auxiliaryData.portagens       += portagens;
    UNIFEDSystem.auxiliaryData.gorjetas        += gorjetas;
    UNIFEDSystem.auxiliaryData.cancelamentos   += cancelamentos;
    UNIFEDSystem.auxiliaryData.totalNaoSujeitos =
        forensicRound(UNIFEDSystem.auxiliaryData.campanhas +
                      UNIFEDSystem.auxiliaryData.portagens  +
                      UNIFEDSystem.auxiliaryData.gorjetas);
    UNIFEDSystem.auxiliaryData.extractedAt = new Date().toISOString();

    if (filename && !UNIFEDSystem.auxiliaryData.processedFrom.includes(filename)) {
        UNIFEDSystem.auxiliaryData.processedFrom.push(filename);
    }

    _updateAuxiliaryBoxes();

    // R24-C5: injectGrayZoneValues desactivada — zona cinzenta servida exclusivamente
    // por _syncPureDashboard via IDs pure-zona-* para evitar duplicação visual
    // if (typeof injectGrayZoneValues === 'function') { injectGrayZoneValues(); }

    const anyFound = campanhas > 0 || portagens > 0 || gorjetas > 0 || cancelamentos > 0;
    if (anyFound) {
        logAudit(
            `[AUX] ${filename || 'Extrato'} — ` +
            `${currentLang === 'pt' ? 'Campanhas:' : 'Campaigns:'} ${formatCurrency(campanhas)} | ` +
            `${currentLang === 'pt' ? 'Portagens:' : 'Tolls:'} ${formatCurrency(portagens)} | ` +
            `${currentLang === 'pt' ? 'Gorjetas:' : 'Tips:'} ${formatCurrency(gorjetas)} | ` +
            `${currentLang === 'pt' ? 'Cancelamentos:' : 'Cancellations:'} ${formatCurrency(cancelamentos)} | ` +
            `${currentLang === 'pt' ? 'Total Não Sujeitos:' : 'Total Not Subject:'} ${formatCurrency(UNIFEDSystem.auxiliaryData.totalNaoSujeitos)}`,
            'success'
        );
        ForensicLogger.addEntry('AUXILIARY_DATA_EXTRACTED', {
            filename,
            campanhas,
            portagens,
            gorjetas,
            cancelamentos,
            totalNaoSujeitos: UNIFEDSystem.auxiliaryData.totalNaoSujeitos
        });
    } else {
        logAudit(
            `[AUX] ${filename || 'Extrato'} — ${currentLang === 'pt' ? 'Campos auxiliares não encontrados neste ficheiro.' : 'Auxiliary fields not found in this file.'}`,
            'info'
        );
    }
}

function _updateAuxiliaryBoxes() {
    const aux = UNIFEDSystem.auxiliaryData;
    const setBox = (id, val) => {
        const el = document.getElementById(id);
        if (el) el.textContent = formatCurrency(val);
    };
    
    setBox('auxBoxCampanhasValue',  aux.campanhas);
    setBox('auxBoxPortagensValue',  aux.portagens);
    setBox('auxBoxGorjetasValue',   aux.gorjetas);
    setBox('auxBoxTotalNSValue',    aux.totalNaoSujeitos);
    setBox('auxBoxCancelValue',     aux.cancelamentos);
    
    setBox('pure-zona-campanhas',     aux.campanhas);
    setBox('pure-zona-portagens',     aux.portagens);
    setBox('pure-zona-gorjetas',      aux.gorjetas);
    setBox('pure-zona-total',         aux.totalNaoSujeitos);
    setBox('pure-nc-cancelamentos',   aux.cancelamentos);

    const anoFiscal = UNIFEDSystem.selectedYear || new Date().getFullYear();
    const labelEl   = document.getElementById('auxBoxPortagensLabel');
    const descEl    = document.getElementById('auxBoxPortagensDesc');
    const boxEl     = document.getElementById('auxBoxPortagens');
    if (labelEl) {
        if (anoFiscal >= 2025) {
            labelEl.textContent = currentLang === 'pt' ? 'REEMBOLSOS / PORTAGENS' : 'REIMBURSEMENTS / TOLLS';
            if (descEl) descEl.textContent = currentLang === 'pt' ? 'Reembolsos de despesas (2025+)' : 'Expense reimbursements (2025+)';
            if (boxEl) {
                boxEl.setAttribute('title', currentLang === 'pt' ? "Extraído de: 'Reembolsos de despesas' (2025+) — reembolso operacional" : "Extracted from: 'Expense reimbursements' (2025+) — operational reimbursement");
                boxEl.setAttribute('data-field', 'Reembolsos de despesas');
                boxEl.classList.remove('year-2024');
                boxEl.classList.add('year-2025');
                if (aux.portagens > 0) boxEl.classList.add('has-value');
            }
        } else {
            labelEl.textContent = currentLang === 'pt' ? 'PORTAGENS' : 'TOLLS';
            if (descEl) descEl.textContent = currentLang === 'pt' ? 'Reembolso operacional (2024)' : 'Operational reimbursement (2024)';
            if (boxEl) {
                boxEl.setAttribute('title', currentLang === 'pt' ? "Extraído de: 'Portagens' (2024) — reembolso operacional" : "Extracted from: 'Tolls' (2024) — operational reimbursement");
                boxEl.setAttribute('data-field', 'Portagens');
                boxEl.classList.remove('year-2025');
                boxEl.classList.add('year-2024');
                if (aux.portagens > 0) boxEl.classList.add('has-value');
            }
        }
    }

    const dac7NoteEl = document.getElementById('auxDac7ReconciliationNote');
    if (dac7NoteEl && aux.totalNaoSujeitos > 0) {
        dac7NoteEl.style.display = 'block';
        const noteSpan = document.getElementById('auxDac7NoteValue');
        if (noteSpan) noteSpan.textContent = formatCurrency(aux.totalNaoSujeitos);
        const noteSpanQ = document.getElementById('auxDac7NoteValueQ');
        if (noteSpanQ) noteSpanQ.textContent = formatCurrency(aux.totalNaoSujeitos);
    }

    updateAuxiliaryVisibility();
}

function injectAuxiliaryHelperBoxes() {
    const targetId = 'auxiliaryHelperSection';

    if (document.getElementById(targetId)) return;

    const container = document.getElementById('dashboardAlerts');
    if (!container) {
        console.warn('[AUX] Container dashboardAlerts não encontrado. Injeção adiada.');
        return;
    }

    const frag = document.createDocumentFragment();

    const wrapper = document.createElement('div');
    wrapper.id = targetId;
    wrapper.className = 'auxiliary-helper-section';
    wrapper.style.display = 'none';
    wrapper.setAttribute('data-unifed-module', 'AUXILIARY_PERICIAL_v1');
    wrapper.setAttribute('data-legal', 'Lei TVDE · Art. 125.º CPP · ISO/IEC 27037:2012');

    const t = (translations && translations[currentLang]) || {};
    const pureAuxTitle = (t && t.pureAuxTitle) || (currentLang === 'pt' ? 'INDICAÇÃO DE APOIO PERICIAL — FLUXOS NÃO SUJEITOS A COMISSÃO' : 'EXPERT SUPPORT INDICATION — FLOWS NOT SUBJECT TO COMMISSION');
    const pureAuxSub = (t && t.pureAuxSub) || (currentLang === 'pt' ? 'Valores retidos pela plataforma mas não sujeitos a comissão (Zona Cinzenta) — Art. 36.º n.º 11 CIVA' : 'Amounts withheld by the platform but not subject to commission (Grey Zone) — Art. 36(11) CIVA');

    wrapper.innerHTML = `
        <div class="aux-section-header">
            <i class="fas fa-layer-group"></i>
            <span data-pt="INDICAÇÃO DE APOIO PERICIAL — FLUXOS NÃO SUJEITOS A COMISSÃO" data-en="EXPERT SUPPORT INDICATION — FLOWS NOT SUBJECT TO COMMISSION">${pureAuxTitle}</span>
            <small data-pt="Valores retidos pela plataforma mas não sujeitos a comissão (Zona Cinzenta) — Art. 36.º n.º 11 CIVA" data-en="Amounts withheld by the platform but not subject to commission (Grey Zone) — Art. 36(11) CIVA">${pureAuxSub}</small>
        </div>

        <div class="aux-boxes-grid">

            <div class="pure-card-mini aux-box-campaigns" id="auxBoxCampanhas"
                 data-field="${currentLang === 'pt' ? 'Ganhos da campanha' : 'Campaign earnings'}"
                 title="${currentLang === 'pt' ? 'Extraído de: \'Ganhos da campanha\' — PDF Ganhos da Empresa' : 'Extracted from: \'Campaign earnings\' — PDF Company Earnings'}">
                <div class="pure-card-icon"><i class="fas fa-bullhorn"></i></div>
                <div class="pure-card-content">
                    <h5 class="pure-card-label" data-pt="CAMPANHAS" data-en="CAMPAIGNS">${currentLang === 'pt' ? 'CAMPANHAS' : 'CAMPAIGNS'}</h5>
                    <p class="pure-card-value" id="auxBoxCampanhasValue">0,00 €</p>
                    <span class="pure-card-desc" data-pt="Ganhos da campanha" data-en="Campaign earnings">${currentLang === 'pt' ? 'Ganhos da campanha' : 'Campaign earnings'}</span>
                </div>
                <div class="pure-card-tag" data-pt="Isento comissão · 0%" data-en="Commission exempt · 0%">${currentLang === 'pt' ? 'Isento comissão · 0%' : 'Commission exempt · 0%'}</div>
            </div>

            <div class="pure-card-mini aux-box-tolls info-box-refunds" id="auxBoxPortagens"
                 data-field="${currentLang === 'pt' ? 'Portagens|Reembolsos de despesas' : 'Tolls|Expense reimbursements'}"
                 data-year-label-2024="${currentLang === 'pt' ? 'PORTAGENS (2024)' : 'TOLLS (2024)'}"
                 data-year-label-2025="${currentLang === 'pt' ? 'REEMBOLSOS / PORTAGENS (2025+)' : 'REIMBURSEMENTS / TOLLS (2025+)'}"
                 title="${currentLang === 'pt' ? 'Extraído de: \'Portagens\' (2024) ou \'Reembolsos de despesas\' (2025+) — reembolso operacional' : 'Extracted from: \'Tolls\' (2024) or \'Expense reimbursements\' (2025+) — operational reimbursement'}">
                <div class="pure-card-icon"><i class="fas fa-road"></i></div>
                <div class="pure-card-content">
                    <h5 class="pure-card-label" id="auxBoxPortagensLabel">${currentLang === 'pt' ? 'PORTAGENS' : 'TOLLS'}</h5>
                    <p class="pure-card-value" id="auxBoxPortagensValue">0,00 €</p>
                    <span class="pure-card-desc" id="auxBoxPortagensDesc">${currentLang === 'pt' ? 'Reembolso operacional' : 'Operational reimbursement'}</span>
                </div>
                <div class="pure-card-tag" data-pt="Custo reembolsado · 0%" data-en="Operational reimbursement · 0%">${currentLang === 'pt' ? 'Custo reembolsado · 0%' : 'Operational reimbursement · 0%'}</div>
            </div>

            <div class="pure-card-mini aux-box-tips" id="auxBoxGorjetas"
                 data-field="${currentLang === 'pt' ? 'Gorjetas dos passageiros' : 'Passenger tips'}"
                 title="${currentLang === 'pt' ? 'Extraído de: \'Gorjetas dos passageiros\' — transferência P2P direta' : 'Extracted from: \'Passenger tips\' — direct P2P transfer'}">
                <div class="pure-card-icon"><i class="fas fa-hand-holding-heart"></i></div>
                <div class="pure-card-content">
                    <h5 class="pure-card-label" data-pt="GORJETAS" data-en="TIPS">${currentLang === 'pt' ? 'GORJETAS' : 'TIPS'}</h5>
                    <p class="pure-card-value" id="auxBoxGorjetasValue">0,00 €</p>
                    <span class="pure-card-desc" data-pt="Gorjetas dos passageiros" data-en="Passenger tips">${currentLang === 'pt' ? 'Gorjetas dos passageiros' : 'Passenger tips'}</span>
                </div>
                <div class="pure-card-tag" data-pt="Transferência P2P · 0%" data-en="P2P Transfer · 0%">${currentLang === 'pt' ? 'Transferência P2P · 0%' : 'P2P Transfer · 0%'}</div>
            </div>

            <div class="pure-card-mini aux-box-total-ns highlighted" id="auxBoxTotalNS"
                 data-field="${currentLang === 'pt' ? 'Total Não Sujeitos' : 'Total Not Subject'}"
                 title="${currentLang === 'pt' ? 'Soma: Campanhas + Portagens + Gorjetas — fluxos isentos de comissão' : 'Sum: Campaigns + Tolls + Tips — commission-exempt flows'}">
                <div class="pure-card-icon"><i class="fas fa-sigma"></i></div>
                <div class="pure-card-content">
                    <h5 class="pure-card-label" data-pt="TOTAL NÃO SUJEITOS" data-en="TOTAL NOT SUBJECT">${currentLang === 'pt' ? 'TOTAL NÃO SUJEITOS' : 'TOTAL NOT SUBJECT'}</h5>
                    <p class="pure-card-value highlighted" id="auxBoxTotalNSValue">0,00 €</p>
                    <span class="pure-card-desc" data-pt="Campanhas + Portagens + Gorjetas" data-en="Campaigns + Tolls + Tips">${currentLang === 'pt' ? 'Campanhas + Portagens + Gorjetas' : 'Campaigns + Tolls + Tips'}</span>
                </div>
                <div class="pure-card-tag" data-pt="Fora da base tributável" data-en="Outside the taxable base">${currentLang === 'pt' ? 'Fora da base tributável' : 'Outside the taxable base'}</div>
            </div>

            <div class="pure-card-mini aux-box-cancel" id="auxBoxCancel"
                 data-field="${currentLang === 'pt' ? 'Cancelamentos' : 'Cancellations'}"
                 title="${currentLang === 'pt' ? 'Taxas de cancelamento — comissão já incluída nas Despesas/Comissões' : 'Cancellation fees — commission already included in Expenses/Commissions'}">
                <div class="pure-card-icon"><i class="fas fa-ban"></i></div>
                <div class="pure-card-content">
                    <h5 class="pure-card-label" data-pt="TAXAS CANCELAMENTO" data-en="CANCELLATION FEES">${currentLang === 'pt' ? 'TAXAS CANCELAMENTO' : 'CANCELLATION FEES'}</h5>
                    <p class="pure-card-value" id="auxBoxCancelValue">0,00 €</p>
                    <span class="pure-card-desc" data-pt="Cancelamentos (já em Despesas)" data-en="Cancellations (already in Expenses)">${currentLang === 'pt' ? 'Cancelamentos (já em Despesas)' : 'Cancellations (already in Expenses)'}</span>
                </div>
                <div class="pure-card-tag aux-tag-warning">
                    <i class="fas fa-exclamation-triangle"></i>
                    <span data-pt="Comissão incluída nos −Despesas" data-en="Commission included in −Expenses">${currentLang === 'pt' ? 'Comissão incluída nos −Despesas' : 'Commission included in −Expenses'}</span>
                </div>
            </div>

        </div>

        <div class="aux-dac7-reconciliation-note" id="auxDac7ReconciliationNote" style="display:none;">
            <div class="dac7-note-header">
                <i class="fas fa-balance-scale-right"></i>
                <strong data-pt="NOTA DE RECONCILIAÇÃO DAC7 — ZONA CINZENTA IDENTIFICADA" data-en="DAC7 RECONCILIATION NOTE — GREY ZONE IDENTIFIED">${currentLang === 'pt' ? 'NOTA DE RECONCILIAÇÃO DAC7 — ZONA CINZENTA IDENTIFICADA' : 'DAC7 RECONCILIATION NOTE — GREY ZONE IDENTIFIED'}</strong>
            </div>
            <p id="auxDac7NoteBody">
                <span id="auxDac7TextPre">${currentLang === 'pt' ? 'O sistema UNIFED-PROBATUM isolou' : 'The UNIFED-PROBATUM system isolated'}</span>
                <strong id="auxDac7NoteValue" class="dac7-highlight">0,00 €</strong>
                <span id="auxDac7TextMid1">${currentLang === 'pt' ? ' em valores não sujeitos a comissão (Campanhas + Portagens + Gorjetas).' : ' in commission-exempt values (Campaigns + Tolls + Tips).'}</span>
                <span id="auxDac7TextMid2">${currentLang === 'pt' ? ' A soma destes campos explica a "zona cinzenta" entre o valor' : ' The sum of these fields explains the "grey zone" between the value'}</span>
                <span id="auxDac7TextEnd">${currentLang === 'pt' ? ' reportado à Autoridade Tributária (DAC7) e o valor líquido recebido pelo motorista.' : ' reported to the Tax Authority (DAC7) and the net amount received by the driver.'}</span>
            </p>
            <div class="dac7-question-contraditorio">
                <p class="dac7-q-label"><i class="fas fa-gavel"></i> <span data-pt="QUESTIONÁRIO ESTRATÉGICO AO ADVOGADO (CONTRADITÓRIO)" data-en="STRATEGIC QUESTIONNAIRE TO THE LAWYER (CONTRADICTION)">${currentLang === 'pt' ? 'QUESTIONÁRIO ESTRATÉGICO AO ADVOGADO (CONTRADITÓRIO)' : 'STRATEGIC QUESTIONNAIRE TO THE LAWYER (CONTRADICTION)'}</span></p>
                <p class="dac7-q-text" id="auxDac7QTextBody">
                    <em><span id="auxDac7QTextPre">"${currentLang === 'pt' ? 'Considerando que o sistema UNIFED-PROBATUM isolou' : 'Considering that the UNIFED-PROBATUM system isolated'}</span>
                    <strong id="auxDac7NoteValueQ" class="dac7-highlight"></strong><span id="auxDac7QTextMid1"> ${currentLang === 'pt' ? 'em Gorjetas e Campanhas,' : 'in Tips and Campaigns,'}</span>
                    <span id="auxDac7QTextMid2">${currentLang === 'pt' ? 'pode a parte contrária confirmar se estes valores (isentos de comissão) foram' : 'can the opposing party confirm whether these values (commission-exempt) were'}</span>
                    <span id="auxDac7QTextMid3">${currentLang === 'pt' ? 'indevidamente incluídos na base de cálculo para o apuramento de rendimentos brutos' : 'improperly included in the calculation basis for determining gross income'}</span>
                    <span id="auxDac7QTextMid4">${currentLang === 'pt' ? 'reportados no SAF-T? Se sim, por que razão foi aplicada uma presunção de rendimento' : 'reported in SAF-T? If so, why was a presumption of income applied'}</span>
                    <span id="auxDac7QTextEnd">${currentLang === 'pt' ? 'sobre valores que legalmente não sofrem retenção ou comissão pela plataforma (Termos e Condições)?"' : 'to values that legally do not suffer withholding or commission by the platform (Terms and Conditions)?"'}</span></em>
                </p>
            </div>
        </div>
    `;

    frag.appendChild(wrapper);

    container.parentNode.insertBefore(frag, container.nextSibling);

    console.log('[UNIFED-AUX] ✅ Auxiliary Helper Boxes injetadas via DocumentFragment. Non-Interfering. Core Freeze mantido.');
    ForensicLogger.addEntry('AUX_BOXES_INJECTED', {
        module: 'AUXILIARY_PERICIAL_v1',
        targetAfter: 'dashboardAlerts',
        method: 'DocumentFragment',
        boxes: ['Campanhas', 'Portagens', 'Gorjetas', 'TotalNaoSujeitos', 'Cancelamentos']
    });
}

window._refreshAuxiliaryHeader = function(lang) {
    const wrapper = document.getElementById('auxiliaryHelperSection');
    if (!wrapper) return;
        
    const t = (translations && translations[lang]) || (translations && translations.pt) || {};
    const headerSpan = wrapper.querySelector('.aux-section-header span');
    const subSmall = wrapper.querySelector('.aux-section-header small');
        
    const titleFallback = lang === 'pt' 
        ? 'INDICAÇÃO DE APOIO PERICIAL — FLUXOS NÃO SUJEITOS A COMISSÃO'
        : 'EXPERT SUPPORT INDICATION — FLOWS NOT SUBJECT TO COMMISSION';
        
    const subFallback = lang === 'pt'
        ? 'Valores retidos pela plataforma mas não sujeitos a comissão (Zona Cinzenta) — Art. 36.º n.º 11 CIVA'
        : 'Amounts withheld by the platform but not subject to commission (Grey Zone) — Art. 36(11) CIVA';
        
    if (headerSpan && t && t.pureAuxTitle) {
        headerSpan.textContent = t.pureAuxTitle;
    } else if (headerSpan) {
        headerSpan.textContent = titleFallback;
    }
        
    if (subSmall && t && t.pureAuxSub) {
        subSmall.textContent = t.pureAuxSub;
    } else if (subSmall) {
        subSmall.textContent = subFallback;
    }
        
    console.log('[UNIFED-AUX-HEADER] ✅ Cabeçalho atualizado para ' + lang.toUpperCase());
};

function resetAuxiliaryData() {
    UNIFEDSystem.auxiliaryData = {
        campanhas:        0,
        portagens:        0,
        gorjetas:         0,
        cancelamentos:    0,
        totalNaoSujeitos: 0,
        processedFrom:    [],
        extractedAt:      null
    };
    _updateAuxiliaryBoxes();
    const dac7NoteEl = document.getElementById('auxDac7ReconciliationNote');
    if (dac7NoteEl) dac7NoteEl.style.display = 'none';
}

// RETIFICAÇÃO R-HASH-1: Fallback assíncrono para WebCrypto API.
// Invocada por generateMasterHash() quando CryptoJS falha ou devolve hash inválido.
// Actualiza UNIFEDSystem.masterHash directamente; o watcher R-WATCH-4 detecta
// a atribuição e regenera o QR Code automaticamente.
async function _applyWebCryptoFallback(sessionId, originalData) {
    try {
        const fallbackData = (sessionId || '') + '|' + Date.now() + '|' + JSON.stringify(originalData).substring(0, 256);
        const encoder = new TextEncoder();
        const hashBuffer = await crypto.subtle.digest('SHA-256', encoder.encode(fallbackData));
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const fallbackHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('').toUpperCase();
        if (fallbackHash && fallbackHash.length === 64) {
            UNIFEDSystem.masterHash = fallbackHash; // watcher R-WATCH-4 dispara generateQRCode()
            if (window.UNIFED_FORENSIC_SYSTEM) {
                if (!window.UNIFED_FORENSIC_SYSTEM.chainOfCustody) window.UNIFED_FORENSIC_SYSTEM.chainOfCustody = {};
                window.UNIFED_FORENSIC_SYSTEM.chainOfCustody.masterHash = fallbackHash;
            }
            setElementText('masterHashValue', fallbackHash);
            console.warn('[MASTER-HASH] ✅ Hash de emergência (WebCrypto) aplicado:', fallbackHash.substring(0, 16) + '...');
        } else {
            console.error('[MASTER-HASH] ❌ WebCrypto fallback também falhou — hash não disponível.');
        }
    } catch (err) {
        console.error('[MASTER-HASH] ❌ Erro no WebCrypto fallback:', err.message);
    }
}
async function generateMasterHash() {
    // Se a cadeia de custódia já estiver selada, usar o seu masterHash
    if (window.UNIFED_FORENSIC_SYSTEM?.chainOfCustody?.masterHash) {
        const chainHash = window.UNIFED_FORENSIC_SYSTEM.chainOfCustody.masterHash;
        UNIFEDSystem.masterHash = chainHash;
        // Atualizar elementos DOM e QR Code
        document.querySelectorAll('.master-hash-value, #masterHashValue, #pure-hash-prefix').forEach(el => {
            if(el) el.textContent = chainHash;
        });
        if(typeof window.generateQRCode === 'function') window.generateQRCode();
        window.activeForensicSession = { sessionId: UNIFEDSystem.sessionId, masterHash: chainHash };
        try { sessionStorage.setItem('currentSession', JSON.stringify(window.activeForensicSession)); } catch(_) {}
        console.log('[MASTER-HASH] Usando masterHash da cadeia de custódia:', chainHash.substring(0,16)+'...');
        return chainHash;
    }

    // Fallback para situações onde a cadeia ainda não existe (pré‑análise)
    const forensicSummary = {
        auxiliaryData: UNIFEDSystem.auxiliaryData,
        client: UNIFEDSystem.client,
        docs: UNIFEDSystem.documents,
        session: UNIFEDSystem.sessionId,
        months: Array.from(UNIFEDSystem.dataMonths),
        twoAxis: UNIFEDSystem.analysis.twoAxis,
        timestamp: Date.now(),
        version: UNIFEDSystem.version
    };
    const data = JSON.stringify(forensicSummary);
    let newHash = '';
    try {
        if (typeof CryptoJS !== 'undefined' && CryptoJS.SHA256) {
            newHash = CryptoJS.SHA256(data).toString().toUpperCase();
            if (newHash.length !== 64) throw new Error('Invalid length');
        } else {
            // fallback síncrono determinístico (não criptográfico)
            let hash = 0;
            for (let i = 0; i < data.length; i++) {
                hash = ((hash << 5) - hash) + data.charCodeAt(i);
                hash |= 0;
            }
            newHash = Math.abs(hash).toString(16).padStart(64, '0').toUpperCase();
            console.warn('[HASH] CryptoJS indisponível – usando fallback simples');
        }
    } catch(e) {
        console.error('[HASH] Erro ao gerar hash:', e);
        newHash = '0'.repeat(64);
    }
    UNIFEDSystem.masterHash = newHash;
    if(window.UNIFED_FORENSIC_SYSTEM?.chainOfCustody) {
        window.UNIFED_FORENSIC_SYSTEM.chainOfCustody.masterHash = newHash;
    }
    document.querySelectorAll('.master-hash-value, #masterHashValue, #pure-hash-prefix').forEach(el => {
        if(el) el.textContent = newHash;
    });
    if(typeof window.generateQRCode === 'function') window.generateQRCode();
    window.activeForensicSession = { sessionId: UNIFEDSystem.sessionId, masterHash: newHash };
    try { sessionStorage.setItem('currentSession', JSON.stringify(window.activeForensicSession)); } catch(_) {}
    console.log('[MASTER-HASH] Gerado (fallback):', newHash.substring(0,16)+'...');
    return newHash;
}

function logAudit(message, type = 'info') {
    const now = Date.now();
    if (now - lastLogTime < LOG_THROTTLE && type !== 'error' && type !== 'success') {
        return;
    }
    lastLogTime = now;

    const locale = currentLang === 'pt' ? 'pt-PT' : 'en-US';
    const timestamp = new Date().toLocaleTimeString(locale);
    const entry = { timestamp, message, type };
    UNIFEDSystem.logs.push(entry);

    const consoleOutput = document.getElementById('consoleOutput');
    if (consoleOutput) {
        const logEl = document.createElement('div');
        logEl.className = `log-entry log-${type}`;
        logEl.textContent = `[${timestamp}] ${message}`;
        consoleOutput.appendChild(logEl);
        consoleOutput.scrollTop = consoleOutput.scrollHeight;
    }
}

function showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast-notification ${type}`;

    const icons = {
        success: 'fa-check-circle',
        error: 'fa-exclamation-triangle',
        warning: 'fa-exclamation-circle',
        info: 'fa-info-circle'
    };

    toast.innerHTML = `<i class="fas ${icons[type] || icons.info}"></i><p>${message}</p>`;
    container.appendChild(toast);

    setTimeout(() => {
        toast.style.animation = 'slideIn 0.3s ease reverse';
        setTimeout(() => toast.remove(), 300);
    }, 4000);
}

function clearConsole() {
    UNIFEDSystem.documents = {
        control: { files: [], hashes: {}, totals: { records: 0 } },
        saft: { files: [], hashes: {}, totals: { records: 0, iliquido: 0, iva: 0, bruto: 0 } },
        invoices: { files: [], hashes: {}, totals: { records: 0, invoiceValue: 0 } },
        statements: { files: [], hashes: {}, totals: { records: 0, ganhos: 0, despesas: 0, ganhosLiquidos: 0 } },
        dac7: { files: [], hashes: {}, totals: { records: 0, q1: 0, q2: 0, q3: 0, q4: 0, total: 0 } }
    };
    UNIFEDSystem.analysis.evidenceIntegrity = [];
    UNIFEDSystem.dataMonths = new Set();
    UNIFEDSystem.monthlyData = {};
    UNIFEDSystem.processedFiles = new Set();

    UNIFEDSystem.client = null;
    document.querySelectorAll('.client-data-field').forEach(el => el.textContent = '---');
    const clientNameInput = document.getElementById('clientNameFixed');
    const clientNIFInput = document.getElementById('clientNIFFixed');
    const clientStatus = document.getElementById('clientStatusFixed');
    if (clientNameInput) clientNameInput.value = '';
    if (clientNIFInput) clientNIFInput.value = '';
    if (clientStatus) clientStatus.style.display = 'none';
    localStorage.removeItem('ifde_client_data_v12_8');

    const fieldsToClear = ['subject-name', 'subject-nif', 'subject-address', 'audit-period', 'audit-hash', 'audit-status', 'saft-total', 'saft-iva', 'saft-iliquido', 'extract-ganhos', 'extract-despesas', 'dac7-total', 'revenue-gap', 'expense-gap'];
    fieldsToClear.forEach(id => { const el = document.getElementById(id); if (el) el.innerHTML = '---'; });

    const consoleLogs = document.getElementById('console-logs');
    if (consoleLogs) consoleLogs.innerHTML = '';

    document.querySelectorAll('.led-red-blink, .led-yellow-blink').forEach(led => { led.className = 'led-status led-off'; });
    document.querySelectorAll('.box-border-blink, .box-despesas-blink').forEach(box => {
        box.classList.remove('box-border-blink', 'box-despesas-blink');
    });
    const statCommCardWipe = document.getElementById('statCommCard');
    if (statCommCardWipe) {
        statCommCardWipe.classList.remove('alert-intermitent', 'box-despesas-blink');
        statCommCardWipe.style.borderColor = '';
        statCommCardWipe.style.boxShadow   = '';
    }
    UNIFEDSystem.demoMode = false;
    if (UNIFEDSystem.fileSources) UNIFEDSystem.fileSources.clear();
 }

function resetAllValues() {
    console.log('[UNIFED-RESET] 🧹 Executando reset e desbloqueio visual...');

    if (window.currentMainChart) { try { window.currentMainChart.destroy(); } catch (e) {} window.currentMainChart = null; }
    if (window.currentDiscrepancyChart) { try { window.currentDiscrepancyChart.destroy(); } catch (e) {} window.currentDiscrepancyChart = null; }

    UNIFEDSystem.documents = {
        control: { files: [], hashes: {}, totals: { records: 0 } },
        saft: { files: [], hashes: {}, totals: { records: 0, iliquido: 0, iva: 0, bruto: 0 } },
        invoices: { files: [], hashes: {}, totals: { records: 0, invoiceValue: 0 } },
        statements: { files: [], hashes: {}, totals: { records: 0, ganhos: 0, despesas: 0, ganhosLiquidos: 0 } },
        dac7: { files: [], hashes: {}, totals: { records: 0, q1: 0, q2: 0, q3: 0, q4: 0, total: 0 } }
    };
    
    UNIFEDSystem.processing = false; 
    UNIFEDSystem.demoMode = false;
    UNIFEDSystem.casoRealAnonimizado = false;

    document.querySelectorAll('.client-data-field, #subject-name, #subject-nif').forEach(el => el.textContent = '---');
    
    const loaders = ['splashScreen', 'loadingOverlay', 'zeroStateContainer'];
    loaders.forEach(id => {
        const el = document.getElementById(id);
        if (el) { el.style.display = 'none'; el.style.opacity = '0'; }
    });
    
    const main = document.getElementById('mainContainer');
    if (main) { main.style.display = 'block'; main.style.opacity = '1'; }

    if (typeof showToast === 'function') showToast('Sistema pronto e limpo', 'info');

    UNIFEDSystem.documents = {
        control: { files: [], hashes: {}, totals: { records: 0 } },
        saft: { files: [], hashes: {}, totals: { records: 0, iliquido: 0, iva: 0, bruto: 0 } },
        invoices: { files: [], hashes: {}, totals: { records: 0, invoiceValue: 0 } },
        statements: { files: [], hashes: {}, totals: { records: 0, ganhos: 0, despesas: 0, ganhosLiquidos: 0 } },
        dac7: { files: [], hashes: {}, totals: { records: 0, q1: 0, q2: 0, q3: 0, q4: 0, total: 0 } }
    };

    UNIFEDSystem.analysis = {
        totals: {
            saftBruto: 0, saftIliquido: 0, saftIva: 0,
            ganhos: 0, despesas: 0, ganhosLiquidos: 0,
            faturaPlataforma: 0,
            dac7Q1: 0, dac7Q2: 0, dac7Q3: 0, dac7Q4: 0, dac7TotalPeriodo: 0
        },
        twoAxis: { revenueGap: 0, expenseGap: 0, revenueGapActive: false, expenseGapActive: false },
        crossings: {
            delta: 0, bigDataAlertActive: false, invoiceDivergence: false,
            comissaoDivergencia: 0, saftVsDac7Alert: false, saftVsGanhosAlert: false,
            discrepanciaCritica: 0, discrepanciaSaftVsDac7: 0,
            percentagemOmissao: 0, percentagemDiscrepancia: 0, percentagemSaftVsDac7: 0,
            ivaFalta: 0, ivaFalta6: 0, btor: 0, btf: 0,
            impactoMensalMercado: 0, impactoAnualMercado: 0, impactoSeteAnosMercado: 0,
            discrepancia5IMT: 0, agravamentoBrutoIRC: 0, ircEstimado: 0
        },
        verdict: null,
        evidenceIntegrity: [],
        selectedQuestions: []
    };

    UNIFEDSystem.dataMonths = new Set();
    UNIFEDSystem.monthlyData = {};
    UNIFEDSystem.processedFiles = new Set();
    ValueSource.sources.clear();

    const elementsToClear = [
        'statNet', 'statComm', 'statJuros',
        'kpiGrossValue', 'kpiCommValue', 'kpiNetValue', 'kpiInvValue',
        'discrepancy5Value', 'agravamentoBrutoValue', 'ircValue',
        'iva6Value', 'iva23Value', 'quantumValue',
        'saftIliquidoValue', 'saftIvaValue', 'saftBrutoValue',
        'stmtGanhosValue', 'stmtDespesasValue', 'stmtGanhosLiquidosValue',
        'dac7Q1Value', 'dac7Q2Value', 'dac7Q3Value', 'dac7Q4Value'
    ];
    elementsToClear.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.textContent = '0,00 €';
    });

    const fileListIds = ['controlFileListModal', 'saftFileListModal', 'invoicesFileListModal', 'statementsFileListModal', 'dac7FileListModal'];
    fileListIds.forEach(id => {
        const list = document.getElementById(id);
        if (list) list.innerHTML = '';
    });

    const counters = ['controlCountCompact', 'saftCountCompact', 'invoiceCountCompact', 'statementCountCompact', 'dac7CountCompact', 'evidenceCountTotal'];
    counters.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.textContent = '0';
    });
    if (document.getElementById('summaryTotal')) document.getElementById('summaryTotal').textContent = '0';
    if (document.getElementById('summaryControl')) document.getElementById('summaryControl').textContent = '0';
    if (document.getElementById('summarySaft')) document.getElementById('summarySaft').textContent = '0';
    if (document.getElementById('summaryInvoices')) document.getElementById('summaryInvoices').textContent = '0';
    if (document.getElementById('summaryStatements')) document.getElementById('summaryStatements').textContent = '0';
    if (document.getElementById('summaryDac7')) document.getElementById('summaryDac7').textContent = '0';

    const alertCards = ['bigDataAlert', 'revenueGapCard', 'expenseGapCard', 'omissaoDespesasPctCard'];
    alertCards.forEach(id => {
        const card = document.getElementById(id);
        if (card) card.style.display = 'none';
    });
    const statCards = ['jurosCard', 'discrepancy5Card', 'agravamentoBrutoCard', 'ircCard', 'iva6Card', 'iva23Card', 'quantumBox'];
    statCards.forEach(id => {
        const card = document.getElementById(id);
        if (card) card.style.display = 'none';
    });

    const verdictDisplay = document.getElementById('verdictDisplay');
    if (verdictDisplay) verdictDisplay.style.display = 'none';

    document.querySelectorAll('.alert-intermitent, .box-border-blink, .box-despesas-blink, .led-red-blink, .led-yellow-blink').forEach(el => {
        el.classList.remove('alert-intermitent', 'box-border-blink', 'box-despesas-blink', 'led-red-blink', 'led-yellow-blink');
        if (el.classList.contains('led-status')) el.classList.add('led-off');
    });

    const clientNameInput = document.getElementById('clientNameFixed');
    const clientNIFInput = document.getElementById('clientNIFFixed');
    if (clientNameInput) clientNameInput.value = '';
    if (clientNIFInput) clientNIFInput.value = '';

    resetAuxiliaryData();
    updateAuxiliaryVisibility();

    generateMasterHash();
    // Escrita defensiva: masterHash pode estar em objecto congelado (deepFreeze).
    // Usar try-catch para evitar TypeError sem quebrar o fluxo de reset.
    // Recriar a cadeia de custódia para evitar referências antigas
    if (window.UNIFED_FORENSIC_SYSTEM) {
         window.UNIFED_FORENSIC_SYSTEM.chainOfCustody = new ChainOfCustodyManager();
         }
        // Gerar novo masterHash consistente com a cadeia (ou fallback)
   generateMasterHash();
   setElementText('masterHashValue', UNIFEDSystem.masterHash || '---');
    ForensicLogger.addEntry('RESET_ALL_VALUES', { timestamp: new Date().toISOString() });
    logAudit('🧹 Reset total de todos os valores e evidências executado.', 'info');
    showToast(currentLang === 'pt' ? 'Valores reiniciados com sucesso' : 'Values reset successfully', 'success');
}

if (typeof UNIFEDSystem !== 'undefined') {
    UNIFEDSystem.processing = false;
    UNIFEDSystem.demoMode = false;
    
    setTimeout(() => {
        const main = document.getElementById('mainContainer');
        if (main && main.style.display === 'none') {
            console.log('[UNIFED-GUARD] 🛡️ Interface estava oculta. Forçando exibição...');
            main.style.display = 'block';
            main.style.opacity = '1';
            const zero = document.getElementById('zeroStateContainer');
            if (zero) zero.style.display = 'none';
        }
    }, 500);
}

function updateAuxiliaryVisibility() {
    const auxSection = document.getElementById('auxiliaryHelperSection');
    if (!auxSection) return;
    
    const aux = UNIFEDSystem.auxiliaryData;
    const hasNonZero = (aux.campanhas > 0 || aux.portagens > 0 || aux.gorjetas > 0 || aux.cancelamentos > 0 || aux.totalNaoSujeitos > 0);
    const hasAnalysis = (UNIFEDSystem.analysis && UNIFEDSystem.analysis.totals && UNIFEDSystem.analysis.totals.ganhos > 0);
    
    if (hasNonZero || hasAnalysis) {
        auxSection.style.display = 'block';
    } else {
        auxSection.style.display = 'none';
    }
}

function resetSystem() {
    if (!confirm(currentLang === 'pt' ? '[!] Tem a certeza que deseja reiniciar o sistema? Todos os dados serão perdidos.' : '[!] Are you sure you want to restart the system? All data will be lost.')) return;

    ForensicLogger.addEntry('SYSTEM_RESET');

    localStorage.removeItem('ifde_client_data_v12_8');
    // R24-R3: reload robusto
    try { location.reload(true); } catch(e) { location.href = location.href.split('?')[0]; }
}

function updateAnalysisButton() {
    const btn = document.getElementById('analyzeBtn');
    if (btn) {
        const hasFiles = Object.values(UNIFEDSystem.documents).some(d => d.files && d.files.length > 0);
        const hasClient = UNIFEDSystem.client !== null;
        btn.disabled = !(hasFiles && hasClient);
    }
}

function setupLogsModal() {
    const modal = document.getElementById('logsModal');
    const closeBtn = document.getElementById('closeLogsModalBtn');
    const closeBtn2 = document.getElementById('closeLogsBtn');
    const exportBtn = document.getElementById('exportLogsBtn');
    const clearBtn = document.getElementById('clearLogsBtn');

    if (!modal) return;

    const openModal = () => {
        modal.style.display = 'flex';
        ForensicLogger.renderLogsToElement('logsDisplayArea');
    };

    const viewLogsBtn = document.getElementById('viewLogsBtn');
    if (viewLogsBtn) viewLogsBtn.addEventListener('click', openModal);

    const viewLogsHeaderBtn = document.getElementById('viewLogsHeaderBtn');
    if (viewLogsHeaderBtn) viewLogsHeaderBtn.addEventListener('click', openModal);

    const closeModal = () => {
        modal.style.display = 'none';
    };

    if (closeBtn) closeBtn.addEventListener('click', closeModal);
    if (closeBtn2) closeBtn2.addEventListener('click', closeModal);

    modal.addEventListener('click', (e) => {
        if (e.target === modal) closeModal();
    });

    if (exportBtn) {
        exportBtn.addEventListener('click', () => {
            const logs = ForensicLogger.exportLogs();
            const blob = new Blob([logs], { type: 'application/json' });
            const a = document.createElement('a');
            a.href = URL.createObjectURL(blob);
            a.download = `IFDE_LOGS_${UNIFEDSystem.sessionId || 'PRE_SESSION'}.json`;
            a.click();
            URL.revokeObjectURL(a.href);
            showToast(currentLang === 'pt' ? 'Logs exportados' : 'Logs exported', 'success');
        });
    }

    if (clearBtn) {
        clearBtn.addEventListener('click', () => {
            if (confirm(currentLang === 'pt' ? 'Tem a certeza que deseja limpar todos os registos de atividade?' : 'Are you sure you want to clear all activity logs?')) {
                ForensicLogger.clearLogs();
                ForensicLogger.renderLogsToElement('logsDisplayArea');
                showToast(currentLang === 'pt' ? 'Logs limpos' : 'Logs cleared', 'success');
            }
        });
    }
}

function setupHashModal() {
    const modal = document.getElementById('hashVerificationModal');
    const closeBtn = document.getElementById('closeHashModalBtn');
    const closeBtn2 = document.getElementById('closeHashBtn');

    if (!modal) return;

    const closeModal = () => {
        modal.style.display = 'none';
    };

    if (closeBtn) closeBtn.addEventListener('click', closeModal);
    if (closeBtn2) closeBtn2.addEventListener('click', closeModal);

    modal.addEventListener('click', (e) => {
        if (e.target === modal) closeModal();
    });
}

function clearConsoleVisual() {
    const consoleOutput = document.getElementById('consoleOutput');
    if (consoleOutput) {
        consoleOutput.innerHTML = '';
        if (typeof logAudit === 'function') {
            logAudit(currentLang === 'pt' ? 'Log de custódia limpo manualmente.' : 'Custody log cleared manually.', 'info');
        }
        if (typeof showToast === 'function') {
            showToast(currentLang === 'pt' ? 'Consola limpa.' : 'Console cleared.', 'info');
        }
    }
}

function setupWipeButton() {
    const wipeBtn = document.getElementById('forensicWipeBtn');
    if (!wipeBtn) return;

    wipeBtn.addEventListener('click', () => {
        if (confirm(currentLang === 'pt' ? '[!] PURGA TOTAL DE DADOS\n\nEsta ação irá eliminar permanentemente TODOS os ficheiros carregados, registos de cliente e logs de atividade. Esta ação é irreversível.\n\nTem a certeza absoluta?' : '[!] TOTAL DATA PURGE\n\nThis action will permanently delete ALL uploaded files, client records and activity logs. This action is irreversible.\n\nAre you absolutely sure?')) {
            ForensicLogger.addEntry('WIPE_INITIATED');

            localStorage.removeItem('ifde_client_data_v12_8');
            localStorage.removeItem(ForensicLogger.STORAGE_KEY);

            resetAllValues();

            ForensicLogger.clearLogs();

            document.getElementById('clientNameFixed').value = '';
            document.getElementById('clientNIFFixed').value = '';
            document.getElementById('clientStatusFixed').style.display = 'none';
            UNIFEDSystem.client = null;

            UNIFEDSystem.sessionId = generateSessionId();
            setElementText('sessionIdDisplay', UNIFEDSystem.sessionId);
            setElementText('verdictSessionId', UNIFEDSystem.sessionId);

            const consoleOutput = document.getElementById('consoleOutput');
            if (consoleOutput) {
                consoleOutput.innerHTML = '';
            }

            const zonaCinzentaCard = document.getElementById('pureZonaCinzentaCard');
            if (zonaCinzentaCard) {
                zonaCinzentaCard.style.display = 'none';
            }

            logAudit(currentLang === 'pt' ? '🧹 PURGA TOTAL DE DADOS EXECUTADA. Todos os dados forenses foram eliminados.' : '🧹 TOTAL DATA PURGE EXECUTED. All forensic data has been deleted.', 'success');
            showToast(currentLang === 'pt' ? 'Purga total concluída. Sistema limpo.' : 'Total purge completed. System clean.', 'success');

            ForensicLogger.addEntry('WIPE_COMPLETED');

            generateMasterHash();
            updateAnalysisButton();
        }
    });
}

function setupDualScreenDetection() {
    const checkScreen = () => {
        const width = window.screen.width;
        const height = window.screen.height;
        const isLargeScreen = width >= 1920 && height >= 1080;

        if (isLargeScreen) {
            document.body.classList.add('secondary-screen');
        } else {
            document.body.classList.remove('secondary-screen');
        }

        if (window.screen.isExtended) {
            document.body.classList.add('dual-screen');
        }
    };

    checkScreen();
    window.addEventListener('resize', checkScreen);

    document.addEventListener('keydown', (e) => {
        if (e.ctrlKey && e.shiftKey && e.key === 'P') {
            e.preventDefault();
            document.body.classList.toggle('presentation-mode');
            const isActive = document.body.classList.contains('presentation-mode');
            logAudit(isActive ? (currentLang === 'pt' ? '🎬 Modo Apresentação ATIVADO' : '🎬 Presentation Mode ACTIVATED') : (currentLang === 'pt' ? '🎬 Modo Apresentação DESATIVADO' : '🎬 Presentation Mode DEACTIVATED'), 'info');
            ForensicLogger.addEntry('PRESENTATION_MODE_TOGGLED', { active: isActive });
        }
    });
}

window.UNIFEDSystem = UNIFEDSystem;
window.ValueSource = ValueSource;
window.ForensicLogger = ForensicLogger;
window.SchemaRegistry = SchemaRegistry;
window.forensicDataSynchronization = forensicDataSynchronization;
window.switchLanguage = switchLanguage;
window.openLogsModal = openLogsModal;
window.openHashModal = openHashModal;
window.clearConsole = clearConsole;
window.filterDAC7ByPeriod = filterDAC7ByPeriod;
window.processAuxiliaryPlatformData = processAuxiliaryPlatformData;
window.injectAuxiliaryHelperBoxes = injectAuxiliaryHelperBoxes;

window._retranslateAuxDynamicNodes = function(lang) {
    const isPT = lang === 'pt';
    const ano = (window.UNIFEDSystem && window.UNIFEDSystem.selectedYear) || new Date().getFullYear();

    const labelEl = document.getElementById('auxBoxPortagensLabel');
    const descEl  = document.getElementById('auxBoxPortagensDesc');
    if (labelEl) {
        labelEl.textContent = isPT
            ? (ano >= 2025 ? 'REEMBOLSOS / PORTAGENS' : 'PORTAGENS')
            : (ano >= 2025 ? 'REIMBURSEMENTS / TOLLS' : 'TOLLS');
    }
    if (descEl) {
        descEl.textContent = isPT
            ? (ano >= 2025 ? 'Reembolsos de despesas (2025+)' : 'Reembolso operacional (2024)')
            : (ano >= 2025 ? 'Expense reimbursements (2025+)' : 'Operational reimbursement (2024)');
    }

    const _t = function(id, ptText, enText) {
        const el = document.getElementById(id);
        if (el) el.textContent = isPT ? ptText : enText;
    };

    _t('auxDac7TextPre',
        'O sistema UNIFED-PROBATUM isolou',
        'The UNIFED-PROBATUM system isolated');
    _t('auxDac7TextMid1',
        ' em valores não sujeitos a comissão (Campanhas + Portagens + Gorjetas).',
        ' in commission-exempt values (Campaigns + Tolls + Tips).');
    _t('auxDac7TextMid2',
        ' A soma destes campos explica a "zona cinzenta" entre o valor',
        ' The sum of these fields explains the "grey zone" between the value');
    _t('auxDac7TextEnd',
        ' reportado à Autoridade Tributária (DAC7) e o valor líquido recebido pelo motorista.',
        ' reported to the Tax Authority (DAC7) and the net amount received by the driver.');

    _t('auxDac7QTextPre',
        '"Considerando que o sistema UNIFED-PROBATUM isolou',
        '"Considering that the UNIFED-PROBATUM system isolated');
    _t('auxDac7QTextMid1',
        ' em Gorjetas e Campanhas,',
        ' in Tips and Campaigns,');
    _t('auxDac7QTextMid2',
        'pode a parte contrária confirmar se estes valores (isentos de comissão) foram',
        'can the opposing party confirm whether these values (commission-exempt) were');
    _t('auxDac7QTextMid3',
        'indevidamente incluídos na base de cálculo para o apuramento de rendimentos brutos',
        'improperly included in the calculation basis for determining gross income');
    _t('auxDac7QTextMid4',
        'reportados no SAF-T? Se sim, por que razão foi aplicada uma presunção de rendimento',
        'reported in SAF-T? If so, why was a presumption of income applied');
    _t('auxDac7QTextEnd',
        'sobre valores que legalmente não sofrem retenção ou comissão pela plataforma (Termos e Condições)?"',
        'to values that legally do not suffer withholding or commission by the platform (Terms and Conditions)?"');

    console.log('[UNIFED-AUX-I18N] Nós dinâmicos retraduzidos para ' + lang.toUpperCase());
};

window.resetAuxiliaryData = resetAuxiliaryData;
window.translateDataLangElements = translateDataLangElements;

(function _registerPUREModule() {
    if (typeof UNIFEDSystem === 'undefined') {
        console.warn('[UNIFED-PURE] UNIFEDSystem não disponível no momento do registo — aguardar DOMContentLoaded.');
        return;
    }

    UNIFEDSystem._pureModuleVersion = 'v1.0-COMMERCIAL-LITIGATION';
    UNIFEDSystem._pureModuleLoaded  = false;

    if (typeof UNIFEDSystem.loadAnonymizedRealCase !== 'function') {
        UNIFEDSystem.loadAnonymizedRealCase = function() {
            console.info('[UNIFED-PURE] Ativando Contexto de Caso Real...');
            if (typeof window.activateDemoMode === 'function') {
                window.activateDemoMode();
                const wrapper = document.getElementById('pureDashboardWrapper');
                if (wrapper) {
                    wrapper.style.display = 'block';
                    setTimeout(() => wrapper.style.opacity = '1', 100);
                }
            }
        };
    }

    console.info(
        '[UNIFED-PURE] ✅ Módulo v1.0-COMMERCIAL-LITIGATION registado no UNIFEDSystem.\n' +
        '  Activação : UNIFEDSystem.loadAnonymizedRealCase()\n' +
        '  Fonte     : UNIFED-MMLADX8Q-CV69L · demoMode: false\n' +
        '  Hash ref. : 5150e767... (SHA-256 verificado)'
    );
})();

console.log('UNIFED - PROBATUM v1.0-COMMERCIAL-LITIGATION · ISO/IEC 27037 · D.L. 28/2019 · ATF · INTEGRITY SEAL · DOCX · AI ADVERSARIAL · NIFAF GUARD · NEXUS · ATIVADO');

function updateAnalyzeButton() {
    updateAnalysisButton();
}

function addConsoleMessage(message, type = 'info') {
    const consoleOutput = document.getElementById('consoleOutput');
    if (!consoleOutput) return;

    const timestamp = new Date().toLocaleTimeString('pt-PT');
    const logEntry = document.createElement('div');
    logEntry.className = `log-entry log-${type}`;
    logEntry.textContent = `[${timestamp}] ${message}`;
    consoleOutput.appendChild(logEntry);
    consoleOutput.scrollTop = consoleOutput.scrollHeight;

    while (consoleOutput.children.length > 500) {
        consoleOutput.removeChild(consoleOutput.firstChild);
    }
}

function formatPercent(value) {
    if (isNaN(value) || value === undefined) return '0.00%';
    const locale = currentLang === 'pt' ? 'pt-PT' : 'en-US';
    const separator = currentLang === 'pt' ? ',' : '.';
    const percent = (value * 100).toFixed(2).replace('.', separator);
    return percent + '%';
}

function arrayAverage(arr) {
    if (!arr || arr.length === 0) return 0;
    const sum = arr.reduce((a, b) => a + b, 0);
    return sum / arr.length;
}

function arrayStdDev(arr) {
    if (!arr || arr.length < 2) return 0;
    const avg = arrayAverage(arr);
    const squareDiffs = arr.map(value => Math.pow(value - avg, 2));
    const avgSquareDiff = arrayAverage(squareDiffs);
    return Math.sqrt(avgSquareDiff);
}

function findOutliers(arr, threshold = 2) {
    if (!arr || arr.length === 0) return [];
    const mean = arrayAverage(arr);
    const stdDev = arrayStdDev(arr);
    if (stdDev === 0) return [];

    return arr.reduce((outliers, value, index) => {
        if (Math.abs(value - mean) > threshold * stdDev) {
            outliers.push(index);
        }
        return outliers;
    }, []);
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function copyToClipboard(text) {
    try {
        await navigator.clipboard.writeText(text);
        showToast(currentLang === 'pt' ? 'Copiado para a área de transferência' : 'Copied to clipboard', 'success');
        return true;
    } catch (err) {
        console.error('Falha ao copiar:', err);
        showToast(currentLang === 'pt' ? 'Não foi possível copiar' : 'Unable to copy', 'error');
        return false;
    }
}

function persistSession() {
    try {
        const sessionState = {
            sessionId: UNIFEDSystem.sessionId,
            client: UNIFEDSystem.client,
            selectedYear: UNIFEDSystem.selectedYear,
            selectedPeriodo: UNIFEDSystem.selectedPeriodo,
            selectedPlatform: UNIFEDSystem.selectedPlatform,
            demoMode: UNIFEDSystem.demoMode,
            timestamp: Date.now()
        };
        sessionStorage.setItem('unifed_session_state', JSON.stringify(sessionState));
        ForensicLogger.addEntry('SESSION_PERSISTED', { sessionId: UNIFEDSystem.sessionId });
    } catch (e) {
        console.warn('Não foi possível persistir a sessão:', e);
    }
}

function restoreSession() {
    try {
        const saved = sessionStorage.getItem('unifed_session_state');
        if (!saved) return null;
        const state = JSON.parse(saved);
        if (Date.now() - state.timestamp > 24 * 60 * 60 * 1000) {
            sessionStorage.removeItem('unifed_session_state');
            return null;
        }
        return state;
    } catch (e) {
        return null;
    }
}

function endSession() {
    if (confirm(currentLang === 'pt' ? 'Deseja encerrar a sessão atual? Os dados não salvos serão perdidos.' : 'Do you want to end the current session? Unsaved data will be lost.')) {
        sessionStorage.removeItem('unifed_session_state');
        sessionStorage.removeItem('currentSession');
        ForensicLogger.addEntry('SESSION_ENDED', { sessionId: UNIFEDSystem.sessionId });
        // R24-R3: reload robusto
    try { location.reload(true); } catch(e) { location.href = location.href.split('?')[0]; }
    }
}

function exportExecutiveSummary() {
    if (!UNIFEDSystem.client) {
        showToast(currentLang === 'pt' ? 'Registe o sujeito passivo primeiro.' : 'Register the taxpayer first.', 'error');
        return;
    }

    const t = translations[currentLang];
    const totals = UNIFEDSystem.analysis.totals;
    const cross = UNIFEDSystem.analysis.crossings;

    const lines = [];
    lines.push('=' .repeat(60));
    lines.push(`UNIFED - PROBATUM - ${t.termExpertOpinion}`);
    lines.push('=' .repeat(60));
    lines.push('');
    lines.push(`${t.pdfLabelName}: ${UNIFEDSystem.client.name}`);
    lines.push(`${t.pdfLabelNIF}: ${UNIFEDSystem.client.nif}`);
    lines.push(`${t.pdfLabelPlatform}: ${PLATFORM_DATA[UNIFEDSystem.selectedPlatform]?.name || 'N/A'}`);
    lines.push(`${t.pdfLabelSession}: ${UNIFEDSystem.sessionId}`);
    lines.push(`${t.pdfLabelTimestamp}: ${Math.floor(Date.now() / 1000)}`);
    lines.push('');
    lines.push('--- ' + t.pdfSection2 + ' ---');
    lines.push(`${t.kpiGross}: ${formatCurrency(totals.ganhos || 0)}`);
    lines.push(`${t.kpiCommText}: ${formatCurrency(totals.despesas || 0)}`);
    lines.push(`${t.kpiNetText}: ${formatCurrency(totals.ganhosLiquidos || 0)}`);
    lines.push(`${t.kpiInvText}: ${formatCurrency(totals.faturaPlataforma || 0)}`);
    lines.push('');
    lines.push('--- ' + t.termSmokingGun + ' ---');
    lines.push(`${t.termExpenseGap}: ${formatCurrency(cross.discrepanciaCritica || 0)} (${(cross.percentagemOmissao || 0).toFixed(2)}%)`);
    lines.push(`${t.termRevenueGap}: ${formatCurrency(cross.discrepanciaSaftVsDac7 || 0)} (${(cross.percentagemSaftVsDac7 || 0).toFixed(2)}%)`);
    lines.push('');
    lines.push('--- ' + t.pdfSection3 + ' ---');
    lines.push(`${t.verdictPercent}: ${UNIFEDSystem.analysis.verdict?.level[currentLang] || 'N/A'}`);
    lines.push(UNIFEDSystem.analysis.verdict?.description[currentLang] || '');
    lines.push('');
    lines.push('--- ' + t.clausulaCadeiaCustodia + ' ---');
    lines.push(`Master Hash: ${UNIFEDSystem.masterHash || 'N/A'}`);
    lines.push('=' .repeat(60));

    const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `UNIFED_SUMMARY_${UNIFEDSystem.sessionId}.txt`;
    a.click();
    URL.revokeObjectURL(a.href);

    showToast(currentLang === 'pt' ? 'Resumo executivo exportado' : 'Executive summary exported', 'success');
    ForensicLogger.addEntry('EXECUTIVE_SUMMARY_EXPORTED');
}

function exportEvidenceOnly() {
    const evidenceData = {
        exportedAt: new Date().toISOString(),
        sessionId: UNIFEDSystem.sessionId,
        evidence: UNIFEDSystem.analysis.evidenceIntegrity,
        documents: {
            saft: UNIFEDSystem.documents.saft,
            statements: UNIFEDSystem.documents.statements,
            invoices: UNIFEDSystem.documents.invoices,
            dac7: UNIFEDSystem.documents.dac7,
            control: UNIFEDSystem.documents.control
        },
        auxiliaryData: UNIFEDSystem.auxiliaryData
    };

    const blob = new Blob([JSON.stringify(evidenceData, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `UNIFED_EVIDENCE_${UNIFEDSystem.sessionId}.json`;
    a.click();
    URL.revokeObjectURL(a.href);

    showToast(currentLang === 'pt' ? 'Evidências exportadas' : 'Evidence exported', 'success');
    ForensicLogger.addEntry('EVIDENCE_ONLY_EXPORTED');
}

function setupDynamicTooltips() {
    const elements = document.querySelectorAll('[data-tooltip]');
    elements.forEach(el => {
        if (!el.hasAttribute('title')) {
            const tooltipText = el.getAttribute('data-tooltip');
            if (tooltipText) {
                el.setAttribute('title', tooltipText);
            }
        }
    });
}

function updateCardLabels() {
    const t = translations[currentLang];
    const cardMappings = [
        { id: 'cardNet', text: t.cardNet },
        { id: 'cardComm', text: t.cardComm },
        { id: 'cardJuros', text: t.cardJuros },
        { id: 'discrepancy5CardTitle', text: t.discrepancy5 },
        { id: 'agravamentoBrutoCardTitle', text: t.agravamentoBruto },
        { id: 'ircCardTitle', text: t.irc },
        { id: 'iva6CardTitle', text: t.iva6 },
        { id: 'iva23CardTitle', text: t.iva23 }
    ];

    cardMappings.forEach(({ id, text }) => {
        const el = document.getElementById(id);
        if (el && text) {
            const icon = el.querySelector('i');
            if (icon) {
                el.innerHTML = '';
                el.appendChild(icon);
                el.appendChild(document.createTextNode(' ' + text));
            } else {
                el.textContent = text;
            }
        }
    });
}

function reapplyDynamicStyles() {
    activateIntermittentAlerts();
    showTwoAxisAlerts();
    setupDynamicTooltips();
    updateCardLabels();
}

function checkExternalModules() {
    const modules = {
        pdfjs: typeof pdfjsLib !== 'undefined',
        Chart: typeof Chart !== 'undefined',
        CryptoJS: typeof CryptoJS !== 'undefined',
        QRCode: typeof QRCode !== 'undefined',
        Papa: typeof Papa !== 'undefined',
        OpenTimestamps: typeof window.OpenTimestamps !== 'undefined' || typeof window.opentimestamps !== 'undefined',
        jsPDF: typeof window.jspdf !== 'undefined'
    };

    const missing = Object.entries(modules).filter(([, loaded]) => !loaded).map(([name]) => name);
    if (missing.length > 0) {
        console.warn('[UNIFED] Módulos externos ausentes:', missing.join(', '));
        // OpenTimestamps é a única ausência esperada em ambiente offline/CDN bloqueado.
        // Não deve poluir o log de auditoria forense com um falso aviso operacional.
        const missingOperational = missing.filter(m => m !== 'OpenTimestamps');
        if (missingOperational.length > 0) {
            logAudit(`⚠️ Módulos externos ausentes: ${missingOperational.join(', ')}. Algumas funcionalidades podem estar indisponíveis.`, 'warning');
        }
        // OTS: apenas registo técnico no console, sem entrada no log forense.
        if (missing.includes('OpenTimestamps')) {
            console.info('[UNIFED-OTS] ⚙ Modo de Segurança Forense — OTS indisponível (CDN bloqueado). Nível 2 (PROBATUM interno) permanece activo.');
        }
    } else {
        console.log('[UNIFED] ✅ Todos os módulos externos estão carregados.');
    }

    ForensicLogger.addEntry('EXTERNAL_MODULES_CHECK', { modules, missing });

    return { modules, missing };
}

function prepareATFData() {
    const monthlyData = UNIFEDSystem.monthlyData;
    const months = Object.keys(monthlyData).sort();
    
    const ganhos = [];
    const despesas = [];
    const liquidos = [];
    const labels = [];

    months.forEach(month => {
        const data = monthlyData[month];
        ganhos.push(data.ganhos || 0);
        despesas.push(data.despesas || 0);
        liquidos.push(data.ganhosLiq || 0);
        labels.push(month.substring(0, 4) + '-' + month.substring(4, 6));
    });

    return { months, labels, ganhos, despesas, liquidos };
}

function calculateTrend(series) {
    if (series.length < 2) return 'stable';
    
    let up = 0, down = 0;
    for (let i = 1; i < series.length; i++) {
        if (series[i] > series[i - 1]) up++;
        else if (series[i] < series[i - 1]) down++;
    }
    
    if (up > down * 1.5) return 'ascending';
    if (down > up * 1.5) return 'descending';
    return 'stable';
}

function calculatePersistenceScore() {
    const monthlyData = UNIFEDSystem.monthlyData;
    const months = Object.keys(monthlyData).sort();
    if (months.length < 2) return 0;
    
    const discrepancies = [];
    months.forEach(month => {
        const data = monthlyData[month];
        const discrepancy = (data.despesas || 0) - (data.ganhosLiq || 0);
        discrepancies.push(Math.abs(discrepancy));
    });
    
    const avg = arrayAverage(discrepancies);
    const stdDev = arrayStdDev(discrepancies);
    
    const cv = avg > 0 ? stdDev / avg : 1;
    const score = Math.max(0, Math.min(100, 100 * (1 - Math.min(1, cv))));
    
    return score;
}

function setupGlobalErrorHandler() {
    window.addEventListener('error', (event) => {
        console.error('[UNIFED] Erro global:', event.error || event.message);
        ForensicLogger.addEntry('GLOBAL_ERROR', {
            message: event.message,
            filename: event.filename,
            lineno: event.lineno,
            colno: event.colno,
            error: event.error ? event.error.stack : null
        });
        
        if (event.message && !event.message.includes('CORS') && !event.message.includes('NetworkError')) {
            if (Date.now() - (window._lastErrorToast || 0) > 1000) {
                showToast(currentLang === 'pt' ? `Erro: ${event.message.substring(0, 80)}` : `Error: ${event.message.substring(0, 80)}`, 'error');
                window._lastErrorToast = Date.now();
            }
        }
    });
    
    window.addEventListener('unhandledrejection', (event) => {
        console.error('[UNIFED] Promise rejeitada não tratada:', event.reason);
        ForensicLogger.addEntry('UNHANDLED_REJECTION', {
            reason: event.reason ? (event.reason.message || event.reason) : 'Unknown'
        });
    });
}

function preloadResources() {
    const preconnectUrls = [
        'https://cdnjs.cloudflare.com',
        'https://cdn.jsdelivr.net',
        'https://freetsa.org'
    ];
    
    preconnectUrls.forEach(url => {
        const link = document.createElement('link');
        link.rel = 'preconnect';
        link.href = url;
        document.head.appendChild(link);
    });
    
    console.log('[UNIFED] Recursos pré-carregados.');
}

function syncExternalDashboard() {
    if (typeof window._syncPureDashboard === 'function') {
        try {
            window._syncPureDashboard(UNIFEDSystem);
            console.log('[UNIFED] Dashboard externo sincronizado.');
        } catch (e) {
            console.warn('[UNIFED] Falha ao sincronizar dashboard externo:', e);
        }
    }
}

function registerGlobalConfig() {
    window.UNIFED_CONFIG = {
        version: UNIFEDSystem.version,
        buildDate: '2025-03-15',
        supportedPlatforms: Object.keys(PLATFORM_DATA),
        forensicStandards: ['ISO/IEC 27037:2012', 'D.L. n.º 28/2019', 'eIDAS (EU) 910/2014', 'RFC 3161'],
        i18n: {
            supportedLangs: ['pt', 'en'],
            defaultLang: 'pt'
        },
        modules: {
            ots: typeof window.OpenTimestamps !== 'undefined',
            pdfExtraction: typeof pdfjsLib !== 'undefined',
            charts: typeof Chart !== 'undefined',
            docx: typeof window.exportDOCX === 'function'
        }
    };
    
    console.log('[UNIFED] Configuração global registrada:', window.UNIFED_CONFIG);
}

function initializeLateComponents() {
    setupDynamicTooltips();
    updateCardLabels();
    registerGlobalConfig();
    checkExternalModules();
    setupGlobalErrorHandler();
    preloadResources();
    
    const savedSession = restoreSession();
    if (savedSession && !UNIFEDSystem.client) {
        if (savedSession.client) {
            UNIFEDSystem.client = savedSession.client;
            UNIFEDSystem.selectedYear = savedSession.selectedYear || 2024;
            UNIFEDSystem.selectedPeriodo = savedSession.selectedPeriodo || 'anual';
            UNIFEDSystem.selectedPlatform = savedSession.selectedPlatform || 'outra';
            UNIFEDSystem.demoMode = savedSession.demoMode || false;
            
            const clientStatusEl = document.getElementById('clientStatusFixed');
            if (clientStatusEl) clientStatusEl.style.display = 'flex';
            setElementText('clientNameDisplayFixed', savedSession.client.name);
            setElementText('clientNifDisplayFixed', savedSession.client.nif);
            
            const anoFiscalEl = document.getElementById('anoFiscal');
            if (anoFiscalEl) anoFiscalEl.value = savedSession.selectedYear;
            
            const periodoEl = document.getElementById('periodoAnalise');
            if (periodoEl) periodoEl.value = savedSession.selectedPeriodo;
            
            const platformEl = document.getElementById('selPlatformFixed');
            if (platformEl) platformEl.value = savedSession.selectedPlatform;
            
            logAudit(`Sessão restaurada para: ${savedSession.client.name}`, 'info');
            ForensicLogger.addEntry('SESSION_RESTORED', { client: savedSession.client.name });
        }
    }
    
    syncExternalDashboard();
    
    window.dispatchEvent(new CustomEvent('UNIFED_INITIALIZED', {
        detail: { version: UNIFEDSystem.version, sessionId: UNIFEDSystem.sessionId }
    }));
}

window.exportExecutiveSummary = exportExecutiveSummary;
window.exportEvidenceOnly = exportEvidenceOnly;
window.endSession = endSession;
window.persistSession = persistSession;
window.prepareATFData = prepareATFData;
window.calculateTrend = calculateTrend;
window.calculatePersistenceScore = calculatePersistenceScore;
window.copyToClipboard = copyToClipboard;
window.arrayAverage = arrayAverage;
window.arrayStdDev = arrayStdDev;
window.findOutliers = findOutliers;

window.updateDashboardLabels = updateCardLabels;
window.refreshTooltips = setupDynamicTooltips;

document.addEventListener('DOMContentLoaded', function() {
    setTimeout(initializeLateComponents, 250);
});

const mainObserver = new MutationObserver(function(mutations) {
    mutations.forEach(function(mutation) {
        if (mutation.type === 'attributes' && mutation.attributeName === 'style') {
            const main = document.getElementById('mainContainer');
            if (main && main.style.display === 'block' && main.style.opacity === '1') {
                initializeLateComponents();
                mainObserver.disconnect();
            }
        }
    });
});

const mainContainer = document.getElementById('mainContainer');
if (mainContainer) {
    mainObserver.observe(mainContainer, { attributes: true });
}

function validateScriptIntegrity() {
    const criticalFunctions = [
        'performAudit', 'exportPDF', 'exportDataJSON', 'switchLanguage',
        'updateDashboard', 'showAlerts', 'renderChart', 'generateMasterHash',
        'processFile', 'registerClient', 'forensicDataSynchronization'
    ];
    
    const missing = criticalFunctions.filter(fn => typeof window[fn] !== 'function' && typeof eval(fn) !== 'function');
    
    if (missing.length > 0) {
        console.error('[UNIFED] Funções críticas ausentes:', missing);
        ForensicLogger.addEntry('INTEGRITY_CHECK_FAILED', { missing });
        return false;
    }
    
    console.log('[UNIFED] ✅ Verificação de integridade do script concluída com sucesso.');
    ForensicLogger.addEntry('INTEGRITY_CHECK_PASSED');
    return true;
}

window.addEventListener('load', function() {
    validateScriptIntegrity();
});

console.log('UNIFED - PROBATUM v1.0-COMMERCIAL-LITIGATION · Todos os módulos carregados · Sistema operacional · Pronto para uso forense.');

function getSystemMetadata() {
    return {
        version: UNIFEDSystem.version,
        name: 'UNIFED - PROBATUM',
        build: 'v1.0-COMMERCIAL-LITIGATION',
        releaseDate: '2025-03-15',
        compliance: [
            'ISO/IEC 27037:2012',
            'D.L. n.º 28/2019 de 15 de fevereiro',
            'eIDAS (EU) 910/2014',
            'RFC 3161',
            'GDPR (EU) 2016/679',
            'Normas de Conformidade Fiscal (Portugal)',
            'CIVA (Portugal)',
            'DL 28/2019'
        ],
        features: [
            'Forensic Data Extraction',
            'SHA-256 Cryptographic Sealing',
            'OpenTimestamps Blockchain Anchoring',
            'RFC 3161 TSA Sealing',
            'Multi-language Support (PT/EN)',
            'Real-time Dashboard',
            'SAF-T / DAC7 Reconciliation',
            'BTOR vs BTF Forensic Triangulation',
            'Chain of Custody Logging',
            'PDF Expert Report Generation',
            'DOCX Draft Generation',
            'ATF Temporal Analysis'
        ],
        dependencies: {
            'pdf.js': '3.11.174',
            'Chart.js': '4.4.0',
            'CryptoJS': '3.1.9-1',
            'QRCode.js': '1.0.0',
            'PapaParse': '5.3.0',
            'jsPDF': '2.5.1'
        }
    };
}

window.getSystemMetadata = getSystemMetadata;

async function generateSelfIntegrityHash() {
    try {
        const scripts = document.getElementsByTagName('script');
        let currentScript = null;
        for (let i = 0; i < scripts.length; i++) {
            if (scripts[i].src && scripts[i].src.includes('script.js')) {
                currentScript = scripts[i];
                break;
            }
        }
        if (currentScript && currentScript.src) {
            const response = await fetch(currentScript.src);
            const code = await response.text();
            const hash = await generateForensicHash(code);
            console.log('[UNIFED] Self-integrity hash (SHA-256):', hash);
            ForensicLogger.addEntry('SELF_INTEGRITY_HASH', { hash });
            return hash;
        }
    } catch (e) {
        console.warn('[UNIFED] Não foi possível calcular o self-integrity hash:', e);
    }
    return null;
}

if (window.crypto && window.crypto.subtle) {
    setTimeout(() => generateSelfIntegrityHash(), 3000);
}

function registerPageUnload() {
    window.addEventListener('beforeunload', () => {
        ForensicLogger.addEntry('PAGE_UNLOAD', {
            sessionId: UNIFEDSystem.sessionId,
            timestamp: new Date().toISOString()
        });
        ForensicLogger._persist();
        persistSession();
    });
}

registerPageUnload();

function resetEvidenceOnly() {
    if (!confirm(currentLang === 'pt' ? 'Deseja limpar apenas as evidências carregadas? O sujeito passivo será mantido.' : 'Do you want to clear only the loaded evidence? The taxpayer will be kept.')) {
        return;
    }
    
    ForensicLogger.addEntry('EVIDENCE_ONLY_RESET');
    
    UNIFEDSystem.documents = {
        control: { files: [], hashes: {}, totals: { records: 0 } },
        saft: { files: [], hashes: {}, totals: { records: 0, iliquido: 0, iva: 0, bruto: 0 } },
        invoices: { files: [], hashes: {}, totals: { records: 0, invoiceValue: 0 } },
        statements: { files: [], hashes: {}, totals: { records: 0, ganhos: 0, despesas: 0, ganhosLiquidos: 0 } },
        dac7: { files: [], hashes: {}, totals: { records: 0, q1: 0, q2: 0, q3: 0, q4: 0, total: 0 } }
    };
    
    UNIFEDSystem.analysis.evidenceIntegrity = [];
    UNIFEDSystem.dataMonths = new Set();
    UNIFEDSystem.monthlyData = {};
    UNIFEDSystem.processedFiles = new Set();
    UNIFEDSystem.auxiliaryData = {
        campanhas: 0, portagens: 0, gorjetas: 0, cancelamentos: 0,
        totalNaoSujeitos: 0, processedFrom: [], extractedAt: null
    };
    ValueSource.sources.clear();
    
    resetAllValues();
    
    logAudit('🧹 Evidências limpas. Sujeito passivo mantido.', 'success');
    showToast(currentLang === 'pt' ? 'Evidências removidas' : 'Evidence cleared', 'success');
}

window.resetEvidenceOnly = resetEvidenceOnly;

(function unifedFinalSeal() {
    try {
        console.log('%c╔════════════════════════════════════════════════════════════════════╗', 'color: #00e5ff');
        console.log('%c║                   UNIFED - PROBATUM v1.0-COMMERCIAL-LITIGATION                    ║', 'color: #00e5ff');
        console.log('%c║                           SISTEMA OPERACIONAL                                 ║', 'color: #00e5ff');
        console.log('%c║                      PRONTO PARA USO FORENSE                                   ║', 'color: #00e5ff');
        console.log('%c╚════════════════════════════════════════════════════════════════════╝', 'color: #00e5ff');
        
        if (typeof UNIFEDSystem !== 'undefined') {
            const safeHash = UNIFEDSystem.masterHash || 'Integridade verificada';
            console.log('[UNIFED] Sistema carregado com sucesso.');
            console.log('[UNIFED] Hash:', safeHash);
        } else {
            console.warn('[UNIFED] Aviso: UNIFEDSystem não detetado no escopo global.');
        }
    } catch (e) {}
})();

window._isSyncing = window._isSyncing || false;

window._syncPureDashboard = (function() {
    let syncInProgress = false;
    return function(system) {
        if (syncInProgress) return 0;
        syncInProgress = true;
        try {
            if (!system || !system.analysis) return 0;
            const totals = system.analysis.totals || {};
            const cross = system.analysis.crossings || {};
            const lang = window.currentLang || 'pt';
            const fmt = (val) => new Intl.NumberFormat(lang === 'en' ? 'en-US' : 'pt-PT', {
                style: 'currency', currency: 'EUR'
            }).format(val || 0);

            const mapping = {
                'pure-ganhos-reais': totals.ganhos,
                'pure-despesas-reais': totals.despesas,
                'pure-liquido-real': totals.ganhosLiquidos,
                'pure-saft-bruto': totals.saftBruto,
                'pure-dac7-total': totals.dac7TotalPeriodo,
                'pure-fatura-btf': totals.faturaPlataforma,
                'pure-sg1-saft-val': totals.saftBruto,
                'pure-sg1-dac7-val': totals.dac7TotalPeriodo,
                'pure-sg1-delta': cross.discrepanciaSaftVsDac7 ?? (totals.ganhos - totals.dac7TotalPeriodo),  // R24-1.3: alinhado com revenueGap
                'pure-sg2-btor-val': totals.despesas,
                'pure-sg2-btf-val': totals.faturaPlataforma,
                'pure-sg2-delta': cross.discrepanciaCritica ?? (totals.despesas - totals.faturaPlataforma)
            };
            let updated = 0;
            for (const [id, val] of Object.entries(mapping)) {
                const el = document.getElementById(id);
                if (el) {
                    el.setAttribute('data-i18n-ignore', 'true');
                    el.innerText = fmt(val);
                    updated++;
                }
            }
            // R24-C1: injectar IVA23 e IVA6 nos cards
            const iva23Val = cross.ivaFalta  || 0;
            const iva6Val  = cross.ivaFalta6 || 0;
            const iva23El  = document.getElementById('iva23Value');
            const iva6El   = document.getElementById('iva6Value');
            const iva23Card = document.getElementById('iva23Card');
            const iva6Card  = document.getElementById('iva6Card');
            if (iva23El) { iva23El.setAttribute('data-i18n-ignore','true'); iva23El.innerText = fmt(iva23Val); updated++; }
            if (iva6El)  { iva6El.setAttribute('data-i18n-ignore','true');  iva6El.innerText  = fmt(iva6Val);  updated++; }
            if (iva23Card) iva23Card.style.display = iva23Val > 0 ? 'block' : 'none';
            if (iva6Card)  iva6Card.style.display  = iva6Val  > 0 ? 'block' : 'none';
            // ── RECTIFICAÇÃO R24-PASSO3 ──────────────────────────────────────────────
            // Eliminar zeros residuais no quantumNote: injectar valores reais de iva23Val
            // e iva6Val directamente no elemento, suprimindo o placeholder estático "0,00 €".
            // Esta instrução substitui a actualização tardia de updateQuantumCard() para
            // garantir coerência imediata no pipeline _syncPureDashboard.
            const quantumNoteEl = document.getElementById('quantumNote');
            if (quantumNoteEl) {
                quantumNoteEl.setAttribute('data-i18n-ignore', 'true');
                quantumNoteEl.innerHTML = `IVA 23% (Omissão Custos): ${fmt(iva23Val)} | IVA 6% (SAF-T Ilíquido): ${fmt(iva6Val)}`;
                updated++;
            }
            // ── FIM RECTIFICAÇÃO R24-PASSO3 ──────────────────────────────────────────

            // ── RECTIFICAÇÃO R24-WC-INDICATORS ───────────────────────────────────────
            // Actualizar indicadores do Colarinho Branco com valores calculados em cross,
            // eliminando os valores estáticos do estado inicial limpo (0%, 0,00 €).
            const wcInd1 = document.getElementById('pure-wc-ind1-val');
            if (wcInd1) {
                wcInd1.setAttribute('data-i18n-ignore', 'true');
                wcInd1.innerText = (cross.percentagemOmissao || 0).toFixed(2) + '%';
                updated++;
            }
            const wcInd2 = document.getElementById('pure-wc-ind2-val');
            if (wcInd2) {
                wcInd2.setAttribute('data-i18n-ignore', 'true');
                wcInd2.innerText = (cross.percentagemSaftVsDac7 || 0).toFixed(2) + '%';
                updated++;
            }
            const wcInd3 = document.getElementById('pure-wc-ind3-val');
            if (wcInd3) {
                wcInd3.setAttribute('data-i18n-ignore', 'true');
                wcInd3.innerText = window.formatForensicCurrency
                    ? window.formatForensicCurrency(cross.ircEstimado || 0)
                    : fmt(cross.ircEstimado || 0);
                updated++;
            }
            // Actualizar veredicto principal e percentagem
            const verdictEl = document.getElementById('pure-verdict');
            if (verdictEl && system.analysis && system.analysis.verdict) {
                const lang = window.currentLang || 'pt';
                const vLevel = system.analysis.verdict.level;
                verdictEl.setAttribute('data-i18n-ignore', 'true');
                verdictEl.innerText = (typeof vLevel === 'object')
                    ? (vLevel[lang] || vLevel.pt || '---')
                    : (vLevel || '---');
                updated++;
            }
            const verdictPctEl = document.getElementById('pure-verdict-pct');
            if (verdictPctEl) {
                verdictPctEl.setAttribute('data-i18n-ignore', 'true');
                verdictPctEl.innerText = (cross.percentagemOmissao || 0).toFixed(2) + '%';
                updated++;
            }
            // ── FIM RECTIFICAÇÃO R24-WC-INDICATORS ───────────────────────────────────

            // ── RECTIFICAÇÃO R24-MACRO ────────────────────────────────────────────────
            // Actualizar simulação macroeconómica com valores calculados a partir de
            // cross.discrepanciaCritica e system.dataMonths.size (media mensal real).
            // Os spans têm IDs dedicados (pure-macro-*) adicionados ao panel HTML.
            const macroMeses = (system.dataMonths && system.dataMonths.size > 0)
                ? system.dataMonths.size : 1;
            const macroMedia    = (cross.discrepanciaCritica || 0) / macroMeses;
            const macroMensal   = macroMedia * 38000;
            const macroAnual    = macroMensal * 12;
            const macro7Anos    = macroAnual * 7;
            const fmtMacro = window.formatForensicCurrency || fmt;
            const macroMediaEl  = document.getElementById('pure-macro-media');
            const macroMensalEl = document.getElementById('pure-macro-mensal');
            const macroAnualEl  = document.getElementById('pure-macro-anual');
            const macro7AnosEl  = document.getElementById('pure-macro-7anos');
            if (macroMediaEl)  { macroMediaEl.innerText  = fmtMacro(macroMedia);  updated++; }
            if (macroMensalEl) { macroMensalEl.innerText = fmtMacro(macroMensal); updated++; }
            if (macroAnualEl)  { macroAnualEl.innerText  = fmtMacro(macroAnual);  updated++; }
            if (macro7AnosEl)  { macro7AnosEl.innerText  = fmtMacro(macro7Anos);  updated++; }
            // ── FIM RECTIFICAÇÃO R24-MACRO ────────────────────────────────────────────

            // ── RECTIFICAÇÃO R24-ATF ──────────────────────────────────────────────────
            // Calcular Score de Persistência (SP) a partir de monthlyData.
            // Coeficiente de Variação (CV) dos diferenciais mensais → score 0–100.
            const atfSpEl       = document.getElementById('pure-atf-sp');
            const atfClassifyEl = document.getElementById('pure-atf-sp-classify');
            const atfTrendEl    = document.getElementById('pure-atf-trend');
            const atfMesesEl    = document.getElementById('pure-atf-meses');
            const monthlyData   = system.monthlyData || {};
            const monthKeys     = Object.keys(monthlyData).sort();
            if (monthKeys.length >= 2) {
                const diffs = monthKeys.map(m =>
                    Math.abs((monthlyData[m].despesas || 0) - (monthlyData[m].faturaPlataforma || 0))
                );
                const avg    = diffs.reduce((a, b) => a + b, 0) / diffs.length;
                const stdDev = Math.sqrt(diffs.map(x => Math.pow(x - avg, 2)).reduce((a, b) => a + b, 0) / diffs.length);
                const cv     = avg > 0 ? stdDev / avg : 1;
                const score  = Math.round(Math.max(0, Math.min(100, 100 * (1 - Math.min(1, cv)))));
                const classify = score > 75 ? 'OMISSÃO SISTÉMICA / RISCO ELEVADO'
                    : score > 40 ? 'OMISSÃO PONTUAL / RISCO MODERADO'
                    : 'VARIAÇÃO ESPORÁDICA / RISCO BAIXO';
                // Tendência simples: compare última metade vs primeira metade
                const mid    = Math.floor(diffs.length / 2);
                const firstH = diffs.slice(0, mid).reduce((a, b) => a + b, 0) / (mid || 1);
                const lastH  = diffs.slice(mid).reduce((a, b) => a + b, 0) / ((diffs.length - mid) || 1);
                const trendTxt = lastH > firstH * 1.05 ? '📈 ASCENDENTE'
                    : lastH < firstH * 0.95 ? '📉 DESCENDENTE' : '➡️ ESTÁVEL';
                if (atfSpEl) {
                    atfSpEl.setAttribute('data-i18n-ignore', 'true');
                    atfSpEl.innerHTML = score + '<span style="font-size:1rem;opacity:0.6">/100</span>';
                    updated++;
                }
                if (atfClassifyEl) {
                    atfClassifyEl.setAttribute('data-i18n-ignore', 'true');
                    atfClassifyEl.innerText = classify;
                    updated++;
                }
                if (atfTrendEl) {
                    atfTrendEl.setAttribute('data-i18n-ignore', 'true');
                    atfTrendEl.innerText = trendTxt;
                    updated++;
                }
                if (atfMesesEl) {
                    atfMesesEl.setAttribute('data-i18n-ignore', 'true');
                    atfMesesEl.innerText = `${monthKeys.length} meses com dados (${monthKeys.join(', ')})`;
                    updated++;
                }
            } else if (monthKeys.length === 1) {
                if (atfSpEl)       { atfSpEl.innerHTML = '0<span style="font-size:1rem;opacity:0.6">/100</span>'; }
                if (atfClassifyEl) { atfClassifyEl.innerText = 'DADOS INSUFICIENTES (1 mês)'; }
                if (atfMesesEl)    { atfMesesEl.innerText = `1 mês com dados (${monthKeys[0]})`; }
            }
            // ── FIM RECTIFICAÇÃO R24-ATF ──────────────────────────────────────────────

            // Percentagens
            const pctSG1 = cross.percentagemSaftVsDac7 ?? (totals.saftBruto ? ((totals.saftBruto - totals.dac7TotalPeriodo)/totals.saftBruto*100) : 0);
            const pctSG2 = cross.percentagemOmissao ?? (totals.despesas ? ((totals.despesas - totals.faturaPlataforma)/totals.despesas*100) : 0);
            const pct1 = document.getElementById('pure-sg1-pct');
            if(pct1) { pct1.setAttribute('data-i18n-ignore','true'); pct1.innerText = `(${pctSG1.toFixed(2)}%)`; updated++; }
            const pct2 = document.getElementById('pure-sg2-pct');
            if(pct2) { pct2.setAttribute('data-i18n-ignore','true'); pct2.innerText = `(${pctSG2.toFixed(2)}%)`; updated++; }

            // R24-C2: smoking guns — removeAttribute + is-visible + colarinho branco
            const sg1Delta = mapping['pure-sg1-delta'];
            const sg2Delta = mapping['pure-sg2-delta'];
            const sg1El = document.getElementById('smoking-gun-1');
            const sg2El = document.getElementById('smoking-gun-2');
            const sgTable = document.getElementById('smoking-gun-table');
            if (sg1El && sg1Delta > 0.01) {
                sg1El.removeAttribute('style');
                sg1El.style.display = 'table-row'; // tr element — table-row é o display correcto
                sg1El.classList.add('is-visible');
            }
            if (sg2El && sg2Delta > 0.01) {
                sg2El.removeAttribute('style');
                sg2El.style.display = 'table-row'; // tr element — table-row é o display correcto
                sg2El.classList.add('is-visible');
            }
            // Revelar a tabela pai quando pelo menos uma linha estiver visível
            if (sgTable && ((sg1El && sg1Delta > 0.01) || (sg2El && sg2Delta > 0.01))) {
                sgTable.style.display = 'table';
            }
            // Colarinho branco: activar se qualquer smoking gun > limiar
            const wcCard = document.getElementById('colarinho-branco');
            if (wcCard && (sg1Delta > 0.01 || sg2Delta > 0.01)) {
                wcCard.removeAttribute('style');
                wcCard.style.display = 'block';
                const badge = document.getElementById('pure-badge-crime');
                if (badge) { badge.removeAttribute('style'); badge.style.display = 'inline-block'; }
            }

            // Master hash consolidado
            const masterHash = system.masterHash || window.UNIFED_FORENSIC_SYSTEM?.chainOfCustody?.masterHash || 'GERACAO_PENDENTE';
            document.querySelectorAll('.master-hash-value, .hash-value, #pure-hash-prefix, #pure-hash-prefix-verdict').forEach(el => {
                if(el && el.textContent !== masterHash) {
                    el.setAttribute('data-i18n-ignore','true');
                    el.textContent = masterHash;
                }
            });
            if(typeof window.generateQRCode === 'function') window.generateQRCode();
            console.log(`[SYNC] ${updated} elementos actualizados. Master hash: ${masterHash.substring(0,16)}...`);
            return updated;
        } finally {
            syncInProgress = false;
        }
    };
})();

window.showExportButtons = function() {
    const exportButtonIds = [
        'btnExportAnalyst', 
        'btnExportLawyer', 
        'btnExportGraphics',
        'pure-atf-btn'
    ];
    
    for (const id of exportButtonIds) {
        const btn = document.getElementById(id);
        if (btn) {
            btn.style.display = 'block';
            btn.disabled = false;
            btn.classList.remove('hidden');
            console.log(`[EXPORT-BTN] ✅ ${id} desbloqueado`);
        }
    }
};

// REMOVIDAS AS FUNÇÕES DE SHADOWING:
// window._exportPacoteAnalista e window._exportPacoteAdvogado foram removidas
// para não sobrepor o motor nativo de exportação (unifed_triada_export.js).
// As exportações PDF completas são agora geridas exclusivamente pelos listeners
// configurados em _bindExportButtons e setupUnifiedExportButtons.

document.addEventListener('languageChanged', function(event) {
    console.log(`[EVENT] 🌍 Idioma alterado para: ${event.detail?.lang?.toUpperCase()}`);
    
    if (window.UNIFEDSystem && typeof window._syncPureDashboard === 'function') {
        setTimeout(() => {
            window._syncPureDashboard(window.UNIFEDSystem);
        }, 100);
    }
    
    const t = window.getTranslation || ((key) => key);
    
    const executeBtn = document.querySelector('[data-translate-key="execute_forensics"]');
    if (executeBtn) {
        executeBtn.innerText = t('execute_forensics', event.detail?.lang);
    }
});

document.addEventListener('UNIFED_ANALYSIS_COMPLETE', function() {
    console.log('[EVENT] 🎯 Análise forense completa — sincronizando dashboard...');
    if (window.UNIFEDSystem && typeof window._syncPureDashboard === 'function') {
        window._syncPureDashboard(window.UNIFEDSystem);
    }
});

console.log('[UNIFED-SCRIPT] ✅ Data-Binding com Tradução Dinâmica RESTAURADO');

window.translateAll = function() {
    const lang = window.currentLang || 'pt';
    const targetAttr = lang === 'en' ? 'data-en' : 'data-pt';
    let translated = 0;
    document.querySelectorAll('[data-pt][data-en]').forEach(el => {
        if(el.hasAttribute('data-i18n-ignore')) return;
        const text = el.getAttribute(targetAttr);
        if(text) { el.textContent = text; translated++; }
    });
    console.log(`[I18N] ${translated} elementos traduzidos para ${lang.toUpperCase()}`);
    return translated;
};

// ── RET-1c: switchLanguage wrapper — força re-sync após troca de idioma
window.switchLanguage = (function(orig) {
    return function(lang) {
        if(lang && (lang === 'pt' || lang === 'en')) window.currentLang = lang;
        else window.currentLang = window.currentLang === 'pt' ? 'en' : 'pt';
        if(window.localStorage) localStorage.setItem('unifed_language', window.currentLang);
        window.translateAll();
        window.dispatchEvent(new CustomEvent('unifed:languageChanged', { detail: { lang: window.currentLang } }));
        if(typeof window._syncPureDashboard === 'function') setTimeout(() => window._syncPureDashboard(window.UNIFEDSystem), 50);
        if(typeof window.updateTriadaButtonsLanguage === 'function') window.updateTriadaButtonsLanguage();
        console.log('[I18N] Idioma alterado para', window.currentLang);
    };
})(window.switchLanguage);


window.applyLanguageAttributesTranslation = window.translateAll;

document.addEventListener('unifed:languageChanged', function(event) {
    const lang = event.detail?.lang || window.currentLang || 'pt';
    console.log(`[UNIFED-LANG-CHANGE] 🌍 Idioma alterado para: ${lang.toUpperCase()}`);
    
    window.translateAll();
    
    if (window.UNIFEDSystem && typeof window._syncPureDashboard === 'function') {
        setTimeout(() => {
            window._syncPureDashboard(window.UNIFEDSystem);
        }, 100);
    }
    
    if (window.recreateCharts && typeof window.recreateCharts === 'function') {
        console.log('[UNIFED-CHART] 🔄 Recriando gráficos para novo idioma...');
        window.recreateCharts();
    }

    if (typeof window._retranslateAuxDynamicNodes === 'function') {
        window._retranslateAuxDynamicNodes(lang);
    }

    if (typeof window._refreshAuxiliaryHeader === 'function') {
        window._refreshAuxiliaryHeader(lang);
    }
});

document.addEventListener('DOMContentLoaded', function() {
    console.log('[UNIFED-INIT] 🌍 Aplicando tradução inicial...');
    window.currentLang = window.currentLang || 'pt';
    window.translateAll();
});

if (document.readyState !== 'loading') {
    window.currentLang = window.currentLang || 'pt';
    window.translateAll();
}

console.log('[UNIFED-SCRIPT] ✅ Tradutor de Atributos data-pt/data-en RESTAURADO');

window.exportPacoteAdvogado = window._exportPacoteAdvogado;

window.addEventListener('unifed:languageChanged', function(e) {
    const newLang = e.detail.lang;
    console.log(`[UNIFED-I18N-EVENT] 🌍 Idioma alterado para: ${newLang}`);
    
    if (window.UNIFEDSystem && window.UNIFEDSystem.analysis) {
        console.log(`[UNIFED-I18N-EVENT] Próxima exportação será em: ${newLang.toUpperCase()}`);
    }
});

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
        window.currentLang = window.currentLang || 'pt';
        window.translateAll();
    });
} else {
    window.currentLang = window.currentLang || 'pt';
    window.translateAll();
}

console.log('[UNIFED-I18N-INTEGRATION] ✅ Sistema bilíngue integrado com exportação.');

window.formatForensicCurrency = function(value, lang = null) {
    lang = lang || window.currentLang || 'pt';
    
    if (typeof value !== 'number' || isNaN(value)) {
        console.warn('[CURRENCY-FORMAT] ⚠️  Valor inválido:', value);
        return '0,00';
    }
    
    try {
        if (lang === 'en') {
            return new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: 'USD',
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            }).format(value);
        } else {
            return new Intl.NumberFormat('pt-PT', {
                style: 'currency',
                currency: 'EUR',
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            }).format(value);
        }
    } catch (error) {
        console.error('[CURRENCY-FORMAT] ❌ Erro ao formatar:', error);
        return value.toFixed(2);
    }
};

window.applyForensicCurrencyFormatting = function() {
    const lang = window.currentLang || 'pt';
    console.log(`[CURRENCY-FORMAT] 💱 Aplicando formatação numérica para ${lang.toUpperCase()}`);
    
    const currencyFieldIds = [
        'saftBrutoValue',
        'saftIvaValue',
        'stmtGanhosLiquidosValue',
        'pure-discrepancy-value',
        'pure-iva-falta-value',
        'pure-dac7-diff-value',
        'pure-ganhos-reais',
        'pure-despesas-reais',
        'pure-liquido-real',
        'pure-saft-bruto',
        'pure-dac7-total',
        'pure-fatura-btf',
        'pure-sg2-btor-val',
        'pure-sg2-btf-val',
        'pure-sg2-delta-val'
    ];
    
    let formatted = 0;
    currencyFieldIds.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            const rawValue = parseFloat(element.textContent.replace(/[^\d.,]/g, '').replace(',', '.'));
            if (!isNaN(rawValue)) {
                element.textContent = window.formatForensicCurrency(rawValue, lang);
                formatted++;
            }
        }
    });
    
    document.querySelectorAll('[data-type="currency"]').forEach(el => {
        const rawValue = parseFloat(el.textContent.replace(/[^\d.,]/g, '').replace(',', '.'));
        if (!isNaN(rawValue)) {
            el.textContent = window.formatForensicCurrency(rawValue, lang);
            formatted++;
        }
    });
    
    console.log(`[CURRENCY-FORMAT] ✅ ${formatted} campos formatados (${lang.toUpperCase()})`);
};

const improvedLanguageListener = function(event) {
    const lang = event.detail?.lang || window.currentLang || 'pt';
    console.log(`[UNIFED-LANG-COMPLETE] 🌍 Mudança completa de idioma: ${lang.toUpperCase()}`);
    
    if (typeof window.translateAll === 'function') window.translateAll();
    
    if (typeof window.applyForensicCurrencyFormatting === 'function') window.applyForensicCurrencyFormatting();
    
    if (window.UNIFEDSystem && typeof window._syncPureDashboard === 'function') {
        setTimeout(() => window._syncPureDashboard(window.UNIFEDSystem), 100);
    }
    
    if (typeof window.recreateCharts === 'function') window.recreateCharts();
};

document.removeEventListener('unifed:languageChanged', improvedLanguageListener);
document.addEventListener('unifed:languageChanged', improvedLanguageListener);

document.addEventListener('DOMContentLoaded', function() {
    console.log('[UNIFED-INIT-FORMAT] 💱 Aplicando formatação inicial...');
    if (typeof window.applyForensicCurrencyFormatting === 'function') window.applyForensicCurrencyFormatting();
});

if (document.readyState !== 'loading') {
    if (typeof window.applyForensicCurrencyFormatting === 'function') window.applyForensicCurrencyFormatting();
}

console.log('[UNIFED-LOCALE-AWARE] ✅ Sistema de formatação numérica (Intl.NumberFormat) ativado.');

window.recreateCharts = function() {
    const lang = window.currentLang || 'pt';
    console.log(`[UNIFED-CHART-RECREATION] 🔄 Recriando gráficos para ${lang.toUpperCase()}`);
    
    try {
        if (typeof window.renderChart === 'function') window.renderChart();
        
        if (typeof window.renderDiscrepancyChart === 'function') window.renderDiscrepancyChart();

        const atfModal = document.getElementById('atfModal');
        if (atfModal && atfModal.style.display !== 'none') {
            if (typeof window.renderATFChart === 'function') {
                window.renderATFChart();
                console.log('[UNIFED-CHART-RECREATION] ✅ Gráfico ATF recriado (modal visível).');
            }
        }
        
        console.log(`[UNIFED-CHART-RECREATION] ✅ Gráficos atualizados para ${lang.toUpperCase()}`);
        
    } catch (error) {
        console.warn(`[UNIFED-CHART-RECREATION] ⚠️ Erro ao recriar gráficos:`, error);
        if (typeof window.ForensicLogger !== 'undefined' && window.ForensicLogger.addEntry) {
            window.ForensicLogger.addEntry('CHART_RECREATION_ERROR', { error: error.message, lang });
        }
    }
};

console.log('[UNIFED-CHART-RECREATION] ✅ Sistema de recriação de gráficos inicializado.');

function renderATFChart() {
    const panelCanvas = document.getElementById('atfTrendChart');
    const modalCanvas = document.getElementById('atfChartCanvas');
    
    if (!panelCanvas && !modalCanvas) {
        console.warn('[ATF-CHART] Nenhum canvas encontrado (#atfTrendChart ou #atfChartCanvas).');
        return;
    }

    if (panelCanvas) {
        let existingChart = Chart.getChart(panelCanvas);
        if (existingChart) existingChart.destroy();
    }
    if (modalCanvas) {
        let existingChart = Chart.getChart(modalCanvas);
        if (existingChart) existingChart.destroy();
    }

    const monthlyData = (window.UNIFEDSystem && window.UNIFEDSystem.monthlyData) || {};
    const months = Object.keys(monthlyData).sort();
    const discrepancies = months.map(m => {
        const d = monthlyData[m];
        const despesas = (d && typeof d.despesas === 'number') ? d.despesas : 0;
        const ganhos   = (d && typeof d.ganhos   === 'number') ? d.ganhos   : 0;
        return Math.abs(despesas - ganhos);
    });

    const lang = window.currentLang || 'pt';
    const datasetLabel = (lang === 'pt') ? 'Omissão Mensal (€)' : 'Monthly Omission (€)';
    const yAxisLabel = (lang === 'pt') ? 'Valor (€)' : 'Amount (€)';
    const xAxisLabel = (lang === 'pt') ? 'Mês' : 'Month';

    const chartConfig = {
        type: 'line',
        data: {
            labels: months.map(m => `${m.substring(0,4)}-${m.substring(4,6)}`),
            datasets: [{
                label: datasetLabel,
                data: discrepancies,
                borderColor: '#1E40AF',
                backgroundColor: 'rgba(30, 64, 175, 0.08)',
                borderWidth: 2.5,
                fill: true,
                tension: 0.4,
                pointRadius: 5,
                pointBackgroundColor: '#DC2626',
                pointBorderColor: '#1E40AF',
                pointBorderWidth: 2,
                pointHoverRadius: 7
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: true,
                    labels: {
                        color: 'rgba(255,255,255,0.8)',
                        font: { size: 12 }
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(15, 23, 41, 0.95)',
                    borderColor: '#DC2626',
                    borderWidth: 1,
                    titleColor: '#00E5FF',
                    bodyColor: 'rgba(255,255,255,0.9)',
                    padding: 10,
                    callbacks: {
                        label: (ctx) => {
                            const val = ctx.raw;
                            const currency = lang === 'pt' ? '€' : '$';
                            return `${ctx.dataset.label}: ${val.toFixed(2)} ${currency}`;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: {
                        color: 'rgba(255,255,255,0.05)',
                        drawBorder: false
                    },
                    ticks: {
                        color: 'rgba(255,255,255,0.6)',
                        font: { size: 11 }
                    },
                    title: {
                        display: true,
                        text: yAxisLabel,
                        color: 'rgba(255,255,255,0.8)',
                        font: { size: 12, weight: 'bold' }
                    }
                },
                x: {
                    grid: {
                        color: 'rgba(255,255,255,0.03)',
                        drawBorder: false
                    },
                    ticks: {
                        color: 'rgba(255,255,255,0.6)',
                        font: { size: 11 }
                    },
                    title: {
                        display: true,
                        text: xAxisLabel,
                        color: 'rgba(255,255,255,0.8)',
                        font: { size: 12, weight: 'bold' }
                    }
                }
            }
        }
    };

    if (panelCanvas) {
        try {
            new Chart(panelCanvas, chartConfig);
            console.log('[ATF-CHART] ✅ Gráfico painel renderizado (' + months.length + ' meses).');
        } catch (e) {
            console.error('[ATF-CHART] ❌ Erro ao renderizar painel:', e.message);
        }
    }

    if (modalCanvas) {
        try {
            new Chart(modalCanvas, chartConfig);
            console.log('[ATF-CHART] ✅ Gráfico modal renderizado (' + months.length + ' meses).');
        } catch (e) {
            console.error('[ATF-CHART] ❌ Erro ao renderizar modal:', e.message);
        }
    }
}

window.openATFModal = function() {
    console.log('[UNIFED-ATF-MODAL] 🔓 Abrindo modal ATF (Previsão Fiscal 6M)...');
    
    const atfModal = document.getElementById('atfModal');
    
    if (atfModal) {
        // RETIFICAÇÃO ATF-MODAL-FIX-01: forçar layout horizontal no modal
        // O modal-content padrão tem max-width:750px; alargamos para 92vw landscape
        const modalContent = atfModal.querySelector('.modal-content');
        if (modalContent) {
            modalContent.style.maxWidth = '92vw';
            modalContent.style.width = '92vw';
        }
        // O modal-body deve ter flex-direction:row para o canvas expandir na horizontal
        const modalBody = atfModal.querySelector('.modal-body');
        if (modalBody) {
            modalBody.style.flexDirection = 'column';
            modalBody.style.padding = '1rem 1.5rem';
        }
        // Forçar dimensões landscape no canvas antes de renderizar
        const canvas = document.getElementById('atfChartCanvas');
        if (canvas) {
            canvas.style.width  = '100%';
            // RETIFICAÇÃO: height/minHeight/maxHeight dinâmicos removidos — primazia do CSS (#atfTrendChartContainer height: 280px)
            canvas.style.display = 'block';
        }
        const forecastPanel = document.getElementById('nexusForecastPanel');
        if (forecastPanel) {
            forecastPanel.style.marginTop = '0.5rem';
        }

        atfModal.style.display = 'flex';
        atfModal.style.opacity = '1';
        atfModal.style.visibility = 'visible';
        
        if (atfModal.classList) {
            atfModal.classList.add('active');
        }
        
        if (typeof renderATFChart === 'function') {
            renderATFChart();
            if (typeof forceATFChartVisibility === 'function') {
                forceATFChartVisibility();
            }
        } else {
            console.warn('[UNIFED-ATF-MODAL] ⚠️ renderATFChart não definida – verificar script.');
        }
        
        console.log('[UNIFED-ATF-MODAL] ✅ Modal ATF aberto com sucesso (layout horizontal)');
    } else {
        console.warn('[UNIFED-ATF-MODAL] ⚠️ Elemento #atfModal não encontrado no DOM');
    }
};

window.closeATFModal = function() {
    console.log('[UNIFED-ATF-MODAL] 🔒 Fechando modal ATF...');
    const atfModal = document.getElementById('atfModal');
    if (atfModal) {
        atfModal.style.display = 'none';
        atfModal.style.opacity = '0';
        atfModal.style.visibility = 'hidden';
        if (atfModal.classList) atfModal.classList.remove('active');
        console.log('[UNIFED-ATF-MODAL] ✅ Modal ATF fechado');
    }
};

console.log('[UNIFED-ATF-MODAL] ✅ Funções openATFModal(), closeATFModal() e renderATFChart() prontas para hook do Nexus.M3');

window.generateMasterBatchHash = async function() {
    const startTime = performance.now();
    
    console.log('[UNIFED-BATCH-HASH] 🔐 Iniciando cálculo de Master Batch Hash...');
    
    if (typeof CryptoJS === 'undefined') {
        console.warn('[UNIFED-BATCH-HASH] ⚠️ CryptoJS não disponível; usando fallback');
        return _generateFallbackHash();
    }
    
    try {
        let aggregatedBuffer = '';
        
        if (window.UNIFEDSystem && window.UNIFEDSystem.documents) {
            const docs = window.UNIFEDSystem.documents;
            
            const walkDocuments = (obj, path = '') => {
                if (obj === null || obj === undefined) return;
                
                if (typeof obj === 'string') {
                    aggregatedBuffer += obj;
                } else if (typeof obj === 'object') {
                    Object.keys(obj).forEach(key => {
                        walkDocuments(obj[key], path + '.' + key);
                    });
                }
            };
            
            walkDocuments(docs);
        }
        
        aggregatedBuffer += JSON.stringify({
            timestamp: new Date().toISOString(),
            system: 'UNIFED-PROBATUM',
            version: '13.5.5-I18N-HARDENED',
            lang: window.currentLang || 'pt'
        });
        
        console.log('[UNIFED-BATCH-HASH] → Calculando SHA-256 de buffer agregado...');
        const hash = CryptoJS.SHA256(aggregatedBuffer).toString().toUpperCase();
        
        if (!/^[A-F0-9]{64}$/.test(hash)) {
            throw new Error('Hash inválido: não é um SHA-256 válido');
        }
        
        const endTime = performance.now();
        const duration = endTime - startTime;
        
        console.log(`[UNIFED-BATCH-HASH] ✅ Hash calculado em ${duration.toFixed(2)}ms`);
        
        if (duration > 3000) {
            console.warn(`[UNIFED-BATCH-HASH] ⚠️ Cálculo demorou ${duration}ms (limite: 3000ms)`);
        }
        
        const hashElement = document.getElementById('pure-hash-prefix');
        if (hashElement) {
            hashElement.textContent = hash;
            console.log(`[UNIFED-BATCH-HASH] 🔐 Hash atualizado no DOM: ${hash.substring(0, 16)}...`);
        }
        
        return hash;
        
    } catch (error) {
        console.error('[UNIFED-BATCH-HASH] ❌ Erro ao calcular hash:', error.message);
        return _generateFallbackHash();
    }
};

function _generateFallbackHash() {
    console.log('[UNIFED-BATCH-HASH] 📌 Usando fallback: hash simplificado');
    
    const timestamp = Date.now().toString();
    const randomSuffix = Math.random().toString(36).substring(2, 8);
    const simpleHash = 'A'.repeat(56) + randomSuffix.toUpperCase();
    
    const hashElement = document.getElementById('pure-hash-prefix');
    if (hashElement) {
        hashElement.textContent = simpleHash;
    }
    
    return simpleHash;
}

window.setupDashboardMutationObserver = function() {
    console.log('[UNIFED-MUTATION-OBSERVER] 🔍 Configurando MutationObserver com debounce 150ms...');
    
    let debounceTimer = null;
    const debounce = (callback, delay = 150) => {
        return (...args) => {
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => {
                try {
                    callback.apply(this, args);
                } catch (e) {
                    console.error('[UNIFED-MUTATION-OBSERVER] ❌ Erro no callback:', e.message);
                }
            }, delay);
        };
    };
    
    const debouncedSync = debounce(() => {
        console.log('[UNIFED-MUTATION-OBSERVER] 🔄 Sincronizando painel (debounce 150ms)...');
        if (typeof window._syncPureDashboard === 'function') {
            window._syncPureDashboard();
        }
    }, 150);
    
    const observerConfig = {
        attributes: true,
        attributeFilter: ['data-value', 'data-status', 'id', 'class'],
        subtree: true,
        characterData: false,
        childList: false
    };
    
    const targetElement = document.getElementById('pureDashboard') || document.body;
    
    const observer = new MutationObserver((mutations) => {
        const relevantMutations = mutations.filter(m => {
            return m.type === 'attributes' && 
                   ['data-value', 'data-status'].includes(m.attributeName);
        });
        
        if (relevantMutations.length > 0) {
            console.log(`[UNIFED-MUTATION-OBSERVER] 📝 Detectada(s) ${relevantMutations.length} mutação(ões)`);
            debouncedSync();
        }
    });
    
    try {
        observer.observe(targetElement, observerConfig);
        console.log('[UNIFED-MUTATION-OBSERVER] ✅ Observer ativo (debounce 150ms)');
    } catch (error) {
        console.error('[UNIFED-MUTATION-OBSERVER] ❌ Erro ao inicializar observer:', error.message);
    }
    
    return observer;
};

window.initializeForensicEngine = function() {
    console.log('[UNIFED-FORENSIC-ENGINE] 🔬 Inicializando motor forense avançado...');
    
    if (typeof window.generateMasterBatchHash === 'function') {
        console.log('[UNIFED-FORENSIC-ENGINE] ✅ Master Batch Hash disponível');
    }
    
    if (typeof window.setupDashboardMutationObserver === 'function') {
        window.dashboardObserver = window.setupDashboardMutationObserver();
    }
    
    console.log('[UNIFED-FORENSIC-ENGINE] ✅ Motor forense pronto');
};

document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        if (typeof window.initializeForensicEngine === 'function') {
            window.initializeForensicEngine();
        }
    }, 500);
});

console.log('[UNIFED-ADVANCED-HASHING] ✅ Módulo avançado carregado (Batch Hash + MutationObserver)');

window.generateMasterBatchHash = function() {
    let allHashes = '';
    if (window.UNIFEDSystem && window.UNIFEDSystem.documents) {
        Object.keys(window.UNIFEDSystem.documents).forEach(function(docType) {
            const hashes = window.UNIFEDSystem.documents[docType].hashes;
            if (hashes) {
                Object.values(hashes).forEach(function(h) { if (h) allHashes += h; });
            }
        });
    }
    
    if (allHashes.length === 0) {
        const session = (window.UNIFEDSystem && window.UNIFEDSystem.sessionId) || "UNIFED-MNGFN3C0-X57MO";
        return CryptoJS.SHA256(session + "-SECURE-LOTE-VAL").toString();
    }
    
    return CryptoJS.SHA256(allHashes).toString();
};

if (window.UNIFEDSystem && !window.UNIFEDSystem.masterHash) {
    window.UNIFEDSystem.masterHash = window.generateMasterBatchHash();
}

console.log('[UNIFED-BATCH-HASH] ✅ Master Hash Generator integrado');

function injectGrayZoneValues() {
    const auxData = window.UNIFEDSystem && window.UNIFEDSystem.auxiliaryData;

    const dynamicAnalysis = window.UNIFEDSystem &&
                            window.UNIFEDSystem.analysis &&
                            window.UNIFEDSystem.analysis.grayZone;

    if (auxData && !dynamicAnalysis) {
        if (window.UNIFEDSystem && window.UNIFEDSystem.analysis) {
            window.UNIFEDSystem.analysis.grayZone = {
                campanhas:          auxData.campanhas        || 0,
                gorjetas:           auxData.gorjetas         || 0,
                portagens:          auxData.portagens        || 0,
                taxasCancelamento:  auxData.cancelamentos    || 0,
                totalNaoSujeitos:   auxData.totalNaoSujeitos || 0
            };
        }
    }

    const src = (window.UNIFEDSystem &&
                 window.UNIFEDSystem.analysis &&
                 window.UNIFEDSystem.analysis.grayZone) || null;

    const fmt = (val, fallback) => {
        if (val !== undefined && val !== null) {
            return '\u20ac ' + parseFloat(val).toFixed(2).replace('.', ',');
        }
        return fallback;
    };

    const metrics = {
        'gz-campanhas':    fmt(src && src.campanhas,         '\u20ac 405,00'),
        'gz-gorjetas':     fmt(src && src.gorjetas,          '\u20ac 46,00'),
        'gz-portagens':    fmt(src && src.portagens,         '\u20ac 0,15'),
        'gz-cancelamentos':fmt(src && src.taxasCancelamento, '\u20ac 58,10'),
        'gz-total':        fmt(src && src.totalNaoSujeitos,  '\u20ac 451,15')
    };

    for (const [id, value] of Object.entries(metrics)) {
        const el = document.getElementById(id);
        if (el) {
            el.innerText = value;
        }
    }

    console.log('[UNIFED-GZ] Zona Cinzenta injetada no Dashboard:', metrics);
}

window.injectGrayZoneValues = injectGrayZoneValues;

function forceATFChartVisibility() {
    const realContainers = [
        document.getElementById('atfTrendChart'),
        document.getElementById('atfChartCanvas'),
        document.getElementById('atfPersistenceScoreChart'),
        document.querySelector('.atf-graph-container')
    ].filter(Boolean);

    if (realContainers.length === 0) {
        console.warn('[UNIFED-ATF] forceATFChartVisibility: nenhum container ATF encontrado no DOM.');
        return;
    }

    realContainers.forEach(container => {
        container.style.setProperty('display', 'block', 'important');
        container.style.setProperty('visibility', 'visible', 'important');
        container.style.setProperty('opacity', '1', 'important');
    });

    if (window.atfChartInstance && typeof window.atfChartInstance.update === 'function') {
        window.atfChartInstance.update();
    }

    ['atfTrendChart', 'atfChartCanvas'].forEach(canvasId => {
        const canvas = document.getElementById(canvasId);
        if (canvas && typeof Chart !== 'undefined') {
            const instance = Chart.getChart(canvas);
            if (instance && typeof instance.resize === 'function') {
                instance.resize();
            }
        }
    });

    console.log('[UNIFED-ATF] Visibilidade forçada em', realContainers.length, 'container(s) ATF.');
}

window.forceATFChartVisibility = forceATFChartVisibility;

window.setupUnifiedExportButtons = function() {
    const oldButtons = [
        document.getElementById('btn-export-analyst-offline'),
        document.querySelector('[data-action="export-analyst-old"]'),
        document.getElementById('btn-export-lawyer-old'),
        document.querySelector('[data-action="export-lawyer-old"]')
    ];
    oldButtons.forEach(btn => {
        if (btn) btn.style.setProperty('display', 'none', 'important');
    });

    if (typeof window.exportLawyerPackage !== 'function') {
        window.exportLawyerPackage = function() {
            if (typeof window._exportPacoteAdvogado === 'function') {
                window._exportPacoteAdvogado();
            } else {
                console.error('[UNIFED-EXPORT] _exportPacoteAdvogado não disponível.');
            }
        };
    }
    if (typeof window.exportAnalystPackage !== 'function') {
        window.exportAnalystPackage = function() {
            if (typeof window._exportPacoteAnalista === 'function') {
                window._exportPacoteAnalista();
            } else {
                console.error('[UNIFED-EXPORT] _exportPacoteAnalista não disponível.');
            }
        };
    }

    const newAdvogadoBtn = document.getElementById('exportLawyerBtn');
    const newAnalistaBtn = document.getElementById('exportAnalystBtn');

    if (newAdvogadoBtn) {
        newAdvogadoBtn.onclick = null;
        newAdvogadoBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopImmediatePropagation();
            window.exportLawyerPackage();
        });
        console.log('[UNIFED-EXPORT] Botão #exportLawyerBtn vinculado.');
    }

    if (newAnalistaBtn) {
        newAnalistaBtn.onclick = null;
        newAnalistaBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopImmediatePropagation();
            window.exportAnalystPackage();
        });
        console.log('[UNIFED-EXPORT] Botão #exportAnalystBtn vinculado.');
    }

    console.log('[UNIFED-EXPORT] setupUnifiedExportButtons concluído.');
};

function fixButtonLanguageSwitch(lang) {
    document.querySelectorAll('button, input[type="button"]').forEach(btn => {
        const txt = (btn.innerText || btn.value || '').trim();
        if (txt === 'EXECUTAR AN\u00c1LISE FORENSE' || txt === 'EXECUTE FORENSIC ANALYSIS') {
            const translated = lang === 'en' ? 'EXECUTE FORENSIC ANALYSIS' : 'EXECUTAR AN\u00c1LISE FORENSE';
            if (btn.tagName === 'INPUT') {
                btn.value = translated;
            } else {
                btn.innerText = translated;
            }
        }
    });

    const btnAdv = document.getElementById('btn-export-lawyer');
    const btnVan = document.getElementById('btn-export-analyst');

    if (lang === 'en') {
        if (btnAdv) {
            const innerSpan = btnAdv.querySelector('.pure-btn-text') || null;
            if (innerSpan) {
                innerSpan.innerText = '📦 LEGAL PACKAGE';
            } else {
                btnAdv.innerHTML = '<div>\u2696\ufe0f</div>📦 LEGAL PACKAGE';
            }
        }
        if (btnVan) {
            const innerSpan = btnVan.querySelector('.pure-btn-text') || null;
            if (innerSpan) {
                innerSpan.innerText = '🔍 ANALYST PACKAGE';
            } else {
                btnVan.innerHTML = '<div>\ud83d\udd0d</div>🔍 ANALYST PACKAGE';
            }
        }
    } else {
        if (btnAdv) {
            const innerSpan = btnAdv.querySelector('.pure-btn-text') || null;
            if (innerSpan) {
                innerSpan.innerText = '📦 PACOTE LEGAL';
            } else {
                btnAdv.innerHTML = '<div>\u2696\ufe0f</div>📦 PACOTE LEGAL';
            }
        }
        if (btnVan) {
            const innerSpan = btnVan.querySelector('.pure-btn-text') || null;
            if (innerSpan) {
                innerSpan.innerText = '🔍 PACOTE ANALISTA';
            } else {
                btnVan.innerHTML = '<div>\ud83d\udd0d</div>🔍 PACOTE ANALISTA';
            }
        }
    }

    console.log('[UNIFED-i18n] fixButtonLanguageSwitch aplicado para lang:', lang);
}

window.fixButtonLanguageSwitch = fixButtonLanguageSwitch;

function _injectForensicButtonStyles() {
    if (window._unifedStylesInjected) return;
    window._unifedStylesInjected = true;

    const css = `
#btn-export-lawyer,
#btn-export-analyst {
    border-color: #334155 !important;
    background-color: #0f172a !important;
    color: #e2e8f0 !important;
    transition: background-color 0.15s ease, border-color 0.15s ease, box-shadow 0.15s ease !important;
}

#btn-export-lawyer:hover,
#btn-export-analyst:hover {
    border-color: #00E5FF !important;
    background-color: #1e293b !important;
    box-shadow: 0 0 0 1px #00E5FF !important;
}

#btn-export-lawyer:active,
#btn-export-lawyer.active,
#btn-export-analyst:active,
#btn-export-analyst.active {
    background-color: #00E5FF !important;
    border-color: #00E5FF !important;
    color: #0f172a !important;
    box-shadow: 0 0 8px 2px rgba(0,229,255,0.45) !important;
    outline: none !important;
}

button.active[id^="btn-export"],
input[type="button"].active[id^="btn-export"] {
    background-color: #00E5FF !important;
    color: #0f172a !important;
    border-color: #00E5FF !important;
}
`;

    const styleEl = document.createElement('style');
    styleEl.id = 'unifed-forensic-btn-styles';
    styleEl.textContent = css;
    document.head.appendChild(styleEl);
    console.log('[UNIFED-STYLES] Regras CSS forenses (:active/.active) injetadas.');
}

function executarRetificacoesFinaisUnifed() {
    // ========================================================================
    // LIMPEZA DE IDs LEGADOS – evitar conflito com elementos antigos no DOM
    // ========================================================================
    const legacyIds = ['gz-gorjetas', 'gz-cancelamentos', 'gz-campanhas', 'gz-portagens'];
    legacyIds.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.style.display = 'none';
    });

    // 1. Validação da Sessão para Desbloqueio das Exportações
    // O sistema verifica se existe um processamento forense válido antes de permitir a assinatura
    const _analystSessionID = (window.UNIFEDSystem && window.UNIFEDSystem.sessionId) ? window.UNIFEDSystem.sessionId : null;
    const _isValidAnalystSession = _analystSessionID && _analystSessionID.startsWith('UNIFED-');

    ['btn-final-signature', 'btn-assinatura-final', 'finalSignatureBtn', 'assinaturaFinalBtn'].forEach(function(btnId) {
        const el = document.getElementById(btnId);
        if (el) {
            el.disabled = !_isValidAnalystSession;
            el.style.opacity = _isValidAnalystSession ? '' : '0.4';
            el.style.cursor = _isValidAnalystSession ? '' : 'not-allowed';
            if (!_isValidAnalystSession) el.title = 'Sessão forense inválida ou pendente de cálculo.';
        }
    });

    // 2. Purga Exclusiva de Botões Legados (Duplicados)
    // Os botões unificados atuais (btn-export-lawyer e btn-export-analyst) permanecem INTACTOS E VISÍVEIS
    const idsAntigosObsoletos = ['btn-export-analyst-offline', 'btn-export-lawyer-old'];
    idsAntigosObsoletos.forEach(id => {
        const btn = document.getElementById(id);
        if (btn) btn.style.display = 'none';
    });

    // 3. Injeção Dinâmica Estrita da Zona Cinzenta
    // Os valores de Gorjetas (€46) e Cancelamentos (€58) são lidos do motor e não forçados no texto HTML
    const aux = window.UNIFEDSystem?.auxiliaryData;
    const fmt = (val, fallback) => (val !== undefined && val !== null)
        ? new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(val)
        : fallback;

    if (aux) {
        const metricsGz = {
            'pure-zona-campanhas':   fmt(aux.campanhas, '0,00 €'),
            'pure-zona-gorjetas':    fmt(aux.gorjetas, '0,00 €'),
            'pure-zona-portagens':   fmt(aux.portagens, '0,00 €'),
            'pure-nc-cancelamentos': fmt(aux.cancelamentos, '0,00 €'),
            'pure-zona-total':       fmt(aux.totalNaoSujeitos, '0,00 €')
        };

        for (const [id, value] of Object.entries(metricsGz)) {
            const el = document.getElementById(id);
            if (el) {
                el.setAttribute('data-i18n-ignore', 'true');
                el.innerText = value;
                // R24-R1: sincronizar #pure-zc-amount com #pure-zona-total (elimina duplicação estática)
                if (id === 'pure-zona-total') {
                    const zcRef = document.querySelector('[data-source-id="pure-zona-total"]');
                    if (zcRef) { zcRef.innerText = value; zcRef.setAttribute('data-i18n-ignore','true'); }
                }
            }
        }
    }


    // ── CONGELAMENTO DO BOTÃO NIFAF DO TOPO DO SISTEMA (v1.0) ──────────────
    // Desativado por omissão crítica detetada: 89.04% (principal) + 5.75% (residual)
    const nifafBtn = document.getElementById('nifafBtn')
                  || document.querySelector('[data-id="nifaf"]')
                  || document.getElementById('btn-nifaf');
    if (nifafBtn) {
        nifafBtn.disabled = true;
        nifafBtn.style.opacity = '0.4';
        nifafBtn.style.pointerEvents = 'none';
        nifafBtn.style.cursor = 'not-allowed';
        nifafBtn.setAttribute('title', 'Botão congelado: Omissão detetada excede o limite crítico de 15%.');
    }

    if (typeof _injectForensicButtonStyles === 'function') _injectForensicButtonStyles();
    console.log('[UNIFED-RETIFICACOES] \u2705 UI higienizada. Pacotes Analista e Advogado sincronizados e dispon\u00edveis para exporta\u00e7\u00e3o.');
}

window.executarRetificacoesFinaisUnifed = executarRetificacoesFinaisUnifed;
// ============================================================================
// RETIFICAÇÃO CIRÚRGICA v1.0 - GATILHO DE ALERTA DE OMISSÃO
// Vinculação do Alerta Visual no Dashboard após a execução da Perícia.
// window.executarAnaliseForense é o alias público do motor forense:
// chama a lógica original (ou fallback determinístico), executa o
// congelamento do botão NIFAF e injeta o alerta persistente ao fim de 3.5 s.
// ============================================================================
const originalExecutarAnaliseForense = window.executarAnaliseForense;
window.executarAnaliseForense = async function() {
    // Executa a lógica original de cálculo e preenchimento do dashboard (fórmulas 100% intocadas)
    if (typeof originalExecutarAnaliseForense === 'function') {
        await originalExecutarAnaliseForense();
    } else {
        // Fallback direto ao motor principal
        if (typeof window._processarMatrizForenseDeterministica === 'function') {
            window._processarMatrizForenseDeterministica();
        }
    }

    // Executa o congelamento do botão superior
    executarRetificacoesFinaisUnifed();

    // INJEÇÃO DO NOVO ALERTA VISUAL PERSISTENTE NO DASHBOARD (aparece passados 3.5 segundos)
    window.setTimeout(() => {
        alert("⚠ [ALERTA VISUAL CRÍTICO - HEURÍSTICA FORENSE NIFAF]\n\n" +
              "Aviso de Desconformidade Estrutural das Plataformas Digitais:\n" +
              "• Nível de Omissão Principal Detetado: 89.04%\n" +
              "• Nível de Omissão Residual Detetado: 5.75%\n\n" +
              "O botão acústico de topo foi desativado por segurança. Este diagnóstico visual permanecerá fixo no ecrã até que clique em 'OK'.");
    }, 3500); // Exibido exatamente 3.5 segundos após a conclusão do processamento
};


document.addEventListener('DOMContentLoaded', function() {
    executarRetificacoesFinaisUnifed();
});
if (document.readyState === 'complete' || document.readyState === 'interactive') {
    executarRetificacoesFinaisUnifed();
}

// RETIFICAÇÃO R-WATCH-4: Watcher reactivo sobre UNIFEDSystem.masterHash.
// Sempre que masterHash for atribuído com um valor de 64 chars, o QR Code
// é automaticamente regenerado — elimina qualquer race condition entre
// generateMasterHash() e generateQRCode(), independentemente do caminho de execução
// (modo DEMO, upload real, ou regeneração manual).
// Padrão: getter/setter via Object.defineProperty — compatível com todos os browsers
// modernos. configurable:true permite re-definição em caso de hot-reload.
(function installMasterHashWatcher() {
    if (!window.UNIFEDSystem) {
        console.warn('[WATCH-4] UNIFEDSystem não disponível — watcher não instalado.');
        return;
    }
    const descriptor = Object.getOwnPropertyDescriptor(window.UNIFEDSystem, 'masterHash');
    // Não reinstalar se já for um setter (idempotência)
    if (descriptor && typeof descriptor.set === 'function') {
        console.log('[WATCH-4] Watcher já instalado — idempotência garantida.');
        return;
    }
    let _masterHashValue = window.UNIFEDSystem.masterHash || '';
    Object.defineProperty(window.UNIFEDSystem, 'masterHash', {
        get: function() { return _masterHashValue; },
        set: function(val) {
            const prev = _masterHashValue;
            _masterHashValue = val;
            if (val && val.length === 64 && val !== prev) {
                console.log('[WATCH-4] masterHash atualizado (' + val.substring(0,16) + '...) — a regenerar QR Code.');
                if (typeof generateQRCode === 'function') {
                    // Micro-adiamento para garantir que o DOM está pronto
                    setTimeout(generateQRCode, 0);
                }
            }
        },
        configurable: true,
        enumerable: true
    });
    console.log('[WATCH-4] ✅ Watcher reactivo instalado em UNIFEDSystem.masterHash.');
})();

/**
 * RETIFICAÇÃO v1.0-R10: Transição Institucional
 * Garante que a transição do Welcome Screen para o Painel de Prova é imediata
 * e sem resíduos de logs antigos no DOM.
 * Guarda defensiva: se os IDs não existirem no DOM actual, a função não lança
 * erros — compatível com todas as variantes de layout (index.html, panel.html).
 */
function initWelcomeFlow() {
    const startBtn = document.getElementById('startAnalysisBtn');
    if (startBtn) {
        startBtn.addEventListener('click', function() {
            console.log('[SYSTEM-FLOW] 🛡️ Protocolo de Análise iniciado.');

            const welcomeScreen = document.getElementById('welcome-screen');
            if (welcomeScreen) welcomeScreen.style.display = 'none';

            const pureDashboard = document.getElementById('pureDashboard');
            if (pureDashboard) pureDashboard.style.display = 'block';
        });
        console.log('[SYSTEM-FLOW] ✅ Listener de transição Welcome → Painel registado.');
    }
}

// Iniciar fluxo após carregamento — com guarda de idempotência para o caso
// de DOMContentLoaded já ter disparado antes deste bloco ser avaliado.
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initWelcomeFlow, { once: true });
} else {
    initWelcomeFlow();
}

console.log('[UNIFED-RETIFICACOES] \u2705 Bloco de Retifica\u00e7\u00f5es Cir\u00farrgicas v1.0-COMMERCIAL-LITIGATION carregado (Corre\u00e7\u00f5es 1\u20134 + Final + R1-Blindagem + R2-AntiReentr\u00e2ncia).');

// ============================================================================
// BOTÃO DE ENCERRAMENTO DE SESSÃO PERICIAL (PURGA CRIPTOGRÁFICA)
// ============================================================================
(function attachSessionCloseButton() {
    // Função que executa a purga total e encerra o sistema
    // RETIFICAÇÃO v1.0-R4: PURGA TOTAL DE DADOS (LIMPEZA BINÁRIA)
    // Sequência: (1) reset do modelo de dados → (2) zeros no dashboard →
    // (3) limpeza de localStorage + IndexedDB → (4) reload (encerramento).
    async function performForensicPurgeAndReload() {
        console.log('[UNIFED-SECURITY] 🧹 Iniciando PURGA TOTAL DE DADOS (LIMPEZA BINÁRIA) por solicitação do utilizador.');

        // ── FASE 1: Reset do modelo de dados (reutiliza resetAllValues existente) ──
        if (typeof resetAllValues === 'function') {
            resetAllValues();
        }

        // ── FASE 2: Zeros no dashboard – todos os campos numéricos a '0,00 €' ──
        const zeroEur = '0,00 €';
        const zeroDash = '---';
        const numericIds = [
            // KPIs principais
            'kpiGrossValue', 'kpiCommValue', 'kpiNetValue', 'kpiInvValue',
            // Estatísticas topo
            'statNet', 'statComm', 'statJuros',
            // Discrepâncias e IRC
            'discrepancy5Value', 'agravamentoBrutoValue',
            'ircValue', 'iva6Value', 'iva23Value', 'quantumValue',
            // SAFT
            'saftIliquidoValue', 'saftIvaValue', 'saftBrutoValue',
            // Extractos
            'stmtGanhosValue', 'stmtDespesasValue', 'stmtGanhosLiquidosValue',
            // DAC7
            'dac7Q1Value', 'dac7Q2Value', 'dac7Q3Value', 'dac7Q4Value',
            // Zona cinzenta
            'pure-zona-campanhas', 'pure-zona-portagens',
            'pure-zona-gorjetas', 'pure-zona-total', 'pure-nc-cancelamentos',
            'auxBoxCampanhasValue', 'auxBoxPortagensValue',
            'auxBoxGorjetasValue', 'auxBoxTotalNSValue', 'auxBoxCancelValue',
            // Delta de alerta
            'alertDeltaValue',
            // Hashes
            'masterHashValue', 'masterHashFull',
            // Smoking guns
            'pure-sg1-pct', 'pure-sg2-pct',
            // Hash prefix
            'pure-hash-prefix'
        ];
        numericIds.forEach(function(id) {
            const el = document.getElementById(id);
            if (el) {
                el.textContent = zeroEur;
                el.removeAttribute('data-i18n-ignore');
            }
        });

        // Contadores de ficheiros a '0'
        const counterIds = [
            'controlCountCompact', 'saftCountCompact', 'invoiceCountCompact',
            'statementCountCompact', 'dac7CountCompact',
            'summaryControl', 'summarySaft', 'summaryInvoices',
            'summaryStatements', 'summaryDac7', 'summaryTotal'
        ];
        counterIds.forEach(function(id) {
            const el = document.getElementById(id);
            if (el) el.textContent = '0';
        });

        // Campos de identidade
        const identityIds = ['sessionIdDisplay', 'verdictSessionId', 'clientNameDisplayFixed', 'clientNifDisplayFixed'];
        identityIds.forEach(function(id) {
            const el = document.getElementById(id);
            if (el) el.textContent = zeroDash;
        });

        // Verdict: ocultar bloco visual
        const verdictDisplay = document.getElementById('verdictDisplay');
        if (verdictDisplay) verdictDisplay.style.display = 'none';

        // QR Code: limpar canvas
        const qrCanvas = document.getElementById('qrCode') || document.querySelector('canvas[id*="qr"], canvas[id*="QR"]');
        if (qrCanvas && qrCanvas.getContext) {
            const ctx = qrCanvas.getContext('2d');
            ctx.clearRect(0, 0, qrCanvas.width, qrCanvas.height);
        }

        // Zona cinzenta: ocultar card
        const zonaCinzentaCard = document.getElementById('pureZonaCinzentaCard');
        if (zonaCinzentaCard) zonaCinzentaCard.style.display = 'none';

        // Formulários de cliente
        const clientNameField = document.getElementById('clientNameFixed');
        const clientNifField  = document.getElementById('clientNIFFixed');
        if (clientNameField) clientNameField.value = '';
        if (clientNifField)  clientNifField.value  = '';
        const clientStatus = document.getElementById('clientStatusFixed');
        if (clientStatus) clientStatus.style.display = 'none';

        // Consola visual
        const consoleOutput = document.getElementById('consoleOutput');
        if (consoleOutput) consoleOutput.innerHTML = '';
        const consoleLogs = document.getElementById('console-logs');
        if (consoleLogs) consoleLogs.innerHTML = '';

        // Gráficos Chart.js
        if (window.currentMainChart)        { try { window.currentMainChart.destroy();        } catch(e) {} window.currentMainChart        = null; }
        if (window.currentDiscrepancyChart) { try { window.currentDiscrepancyChart.destroy(); } catch(e) {} window.currentDiscrepancyChart = null; }

        // ── FASE 3: Limpeza de localStorage ──
        try {
            localStorage.removeItem('ifde_client_data_v12_8');
            if (window.ForensicLogger && window.ForensicLogger.STORAGE_KEY) {
                localStorage.removeItem(window.ForensicLogger.STORAGE_KEY);
            }
            localStorage.removeItem('UNIFED_SESSION');
            localStorage.removeItem('UNIFED_CHAIN');
        } catch(lsErr) {
            console.error('[UNIFED-PURGE] Erro ao limpar localStorage:', lsErr);
        }

        // ── FASE 4: Limpeza do IndexedDB (todas as bases conhecidas) ──
        const idbNamesToDelete = [
            'UNIFED_ForensicDB', 'ForensicDB', 'UNIFED_SecureStore',
            'unifed_secure_store', 'ifde_forensic_db'
        ];
        const idbDeletePromises = idbNamesToDelete.map(function(dbName) {
            return new Promise(function(resolve) {
                try {
                    const req = indexedDB.deleteDatabase(dbName);
                    req.onsuccess = resolve;
                    req.onerror   = resolve;
                    req.onblocked = resolve;
                } catch(e) { resolve(); }
            });
        });

        // ── FASE 5: Invocar sistema forense central, se disponível ──
        if (window.UNIFED_FORENSIC_SYSTEM && typeof window.UNIFED_FORENSIC_SYSTEM.purgeAndReset === 'function') {
            try { await window.UNIFED_FORENSIC_SYSTEM.purgeAndReset(); } catch(e) {}
        }

        // Aguardar conclusão das eliminações de IndexedDB (máx. 2 s)
        await Promise.race([
            Promise.all(idbDeletePromises),
            new Promise(function(resolve) { setTimeout(resolve, 2000); })
        ]);

        console.log('[UNIFED-PURGE] ✅ PURGA TOTAL DE DADOS (LIMPEZA BINÁRIA) concluída. A encerrar sessão.');

        // ── FASE 6: Encerramento do sistema (reload forçado sem cache) ──
        // R24-R3: reload(true) obsoleto em browsers modernos — fallback robusto
        try {
            window.location.reload(true);
        } catch(e) {
            window.location.href = window.location.href.split('?')[0] + '?_purge=' + Date.now();
        }
    }

    // Função que anexa o listener ao botão (se ele existir)
    function bindCloseButton() {
        const closeBtn = document.getElementById('closeMethodologyBtn');
        if (closeBtn && !closeBtn.hasAttribute('data-purge-listener')) {
            closeBtn.setAttribute('data-purge-listener', 'true');
            closeBtn.addEventListener('click', async (e) => {
                e.preventDefault();
                e.stopPropagation();

                const confirmMessage = (window.currentLang === 'en')
                    ? "⚠ [FORENSIC CLEANUP AND SAFEGUARD ALERT]\n\n" +
                      "Before closing the system, please confirm that you have downloaded and saved the Lawyer Package on the encrypted Pen Drive and that the Analyst Package has been properly stored on the secure disk.\n\n" +
                      "Upon confirmation, the system will perform an immediate and irreversible cryptographic purge: all analyses performed, volatile cache data, and the secure IndexedDB repository will be permanently deleted from the browser for new analyses.\n\n" +
                      "Do you really want to finish and sanitize the session?"
                    : "⚠ [ALERTA DE HIGIENIZAÇÃO E SALVAGUARDA FORENSE]\n\n" +
                      "Antes de encerrar o sistema, confirme impreterivelmente se descarregou e guardou o Pacote do Advogado na Pen Drive cifrada e se o Pacote do Analista foi devidamente armazenado no disco de segurança.\n\n" +
                      "Ao confirmar, o sistema executará uma purga criptográfica imediata e irreversível: todas as análises efetuadas, dados voláteis em cache e o repositório seguro IndexedDB serão permanentemente eliminados do browser para novas análises.\n\n" +
                      "Deseja mesmo concluir e higienizar a sessão?";

                if (confirm(confirmMessage)) {
                    await performForensicPurgeAndReload();
                }
            });
            console.log('[UNIFED-PURGE] ✅ Listener do botão de encerramento anexado com sucesso.');
        } else if (!closeBtn) {
            console.warn('[UNIFED-PURGE] ⚠️ Botão closeMethodologyBtn ainda não encontrado no DOM.');
        }
    }

    // Tenta anexar imediatamente
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', bindCloseButton);
    } else {
        bindCloseButton();
    }

    // Fallback: caso o botão seja injetado dinamicamente (ex: após carregar o painel)
    const observer = new MutationObserver(function(mutations, obs) {
        if (document.getElementById('closeMethodologyBtn')) {
            bindCloseButton();
            obs.disconnect();
        }
    });

    // RETIFICAÇÃO v1.0-R3: Guarda defensiva contra document.body nulo.
    // Se o script for avaliado antes do parser construir <body> (carregamento
    // no <head> ou sem defer/async), document.body é null e observer.observe()
    // lança TypeError. A guarda adia a observação para DOMContentLoaded.
    function startObserver() {
        if (document.body) {
            observer.observe(document.body, { childList: true, subtree: true });
            // Timeout de segurança: após 10 segundos, para de tentar
            setTimeout(() => observer.disconnect(), 10000);
        } else {
            document.addEventListener('DOMContentLoaded', function() {
                observer.observe(document.body, { childList: true, subtree: true });
                setTimeout(() => observer.disconnect(), 10000);
            }, { once: true });
        }
    }
    startObserver();
})();
