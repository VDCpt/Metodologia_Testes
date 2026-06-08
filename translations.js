/**
 * ============================================================================
 * UNIFED-PROBATUM · TRANSLATIONS MODULE v1.0-NACIONALIZADO
 * ============================================================================
 * Dicionário Bilíngue Completo: PT-PT ↔ EN-US
 * 190+ Chaves para Interface, Tríade Pericial, Cadeia de Custódia, Frota, I18N
 *
 * RETIFICAÇÕES APLICADAS (v1.0-NACIONALIZADO):
 * REQ-04a: Nacionalização Jurisprudencial – termos PT-PT alinhados com DL 28/2019,
 *          Normas de Conformidade Fiscal, Código de Processo Penal (arts. 125.º e 327.º).
 * REQ-04b: Encapsulamento do Inglês – idioma padrão = 'pt', tradução EN relegada
 *          a espelho passivo, activável apenas via flag manual na UI.
 * REQ-04c: deepTreeWalkSanitizePlatforms optimizada – parâmetro 'inPlace' evita
 *          deep clone desnecessário; sanitização ocorre apenas no momento da
 *          exportação do JSON, eliminando qualquer gargalo na UI.
 * UNIFED-TRANS-RET-10: Redução do throttle do MutationObserver de 300ms para 50ms.
 *                       Adição da função forceTranslateUI para tradução síncrona.
 * ============================================================================
 */

window.UNIFED_TRANSLATIONS = window.UNIFED_TRANSLATIONS || {};

window.UNIFED_TRANSLATIONS.DICTIONARY = {
    // ════════════════════════════════════════════════════════════════════════
    // BOTÕES PRINCIPAIS
    // ════════════════════════════════════════════════════════════════════════
    'btn_start_analysis': { 'pt': 'INICIAR PERÍCIA v1.0', 'en': 'START FORENSIC ANALYSIS v1.0' },
    'ui_btn_execute_forensics': { 'pt': 'EXECUTAR ANÁLISE FORENSE', 'en': 'EXECUTE FORENSIC ANALYSIS' },

    // ════════════════════════════════════════════════════════════════════════
    // BOTÕES PRINCIPAIS (PACOTES PERICIAIS)
    // ════════════════════════════════════════════════════════════════════════
    'btn_export_lawyer_pack': {
        'pt': 'Exportar Pacote Advogado (Parecer, Petição, Anexo de Custódia + JSON)',
        'en': 'Export Lawyer Package (Opinion, Petition, Custody Annex + JSON)'
    },
    'btn_export_analyst_pack': {
        'pt': 'Exportar Pacote Analista (Parecer Técnico Forense + JSON)',
        'en': 'Export Analyst Package (Forensic Technical Opinion + JSON)'
    },
    'btn_export_architecture': { 'pt': 'Exportar Relatório de Arquitectura (HTML)', 'en': 'Export Architecture Report (HTML)' },
    'btn_clear_console': { 'pt': 'Limpar Consola', 'en': 'Clear Console' },
    // ── RECTIFICAÇÃO [R3-I18N]: Terminologia PT-PT estrita (Acordo Ortográfico vigente) ──
    'ui_console':          { 'pt': 'Consola de Sistema',           'en': 'System Console' },
    'ui_invoice_cancel':   { 'pt': 'Cancelamento de Faturas',      'en': 'Invoice Cancellation' },
    'ui_tax_calc':         { 'pt': 'Cálculo Tributário Forense',   'en': 'Forensic Tax Calculation' },
    'ui_export_lawyer':    { 'pt': 'Exportar Pacote Advogado',     'en': 'Export Lawyer Package' },
    'ui_export_analyst':   { 'pt': 'Exportar Pacote Analista',     'en': 'Export Analyst Package' },
    'btn_regenerate_top3': { 'pt': '🔄 Regenerar TOP 3 (Automático)', 'en': '🔄 Regenerate TOP 3 (Automatic)' },
    'btn_accept_top3': { 'pt': '✓ Aceitar & Prosseguir', 'en': '✓ Accept & Proceed' },

    // ════════════════════════════════════════════════════════════════════════
    // PAINEL DO ADVOGADO (TOP 3)
    // ════════════════════════════════════════════════════════════════════════
    'panel_lawyer_title': { 'pt': '⚖️ PAINEL DO ADVOGADO: CONTRADITÓRIO DINÂMICO', 'en': '⚖️ LAWYER PANEL: DYNAMIC ADVERSARIAL EXAMINATION' },
    'panel_lawyer_subtitle': { 'pt': 'Motor Recomenda TOP 3 Questões Automáticas (Heurística Forense)', 'en': 'Engine Recommends TOP 3 Automatic Questions (Forensic Heuristics)' },
    'panel_lawyer_instructions': { 'pt': '✓ Instruções do Advogado: Cada questão abaixo pode ser editada, revista ou rectificada antes de gerar o pacote final. O sistema recalcula a assinatura digital (Merkle Root) em tempo real após edições.', 'en': '✓ Lawyer Instructions: Each question below can be edited, reviewed, or corrected before generating the final package. The system recalculates the digital signature (Merkle Root) in real-time after edits.' },

    // ════════════════════════════════════════════════════════════════════════
    // CARDS TOP 3 - RÓTULOS
    // ════════════════════════════════════════════════════════════════════════
    'top3_question_label': { 'pt': '📋 Pergunta', 'en': '📋 Question' },
    'top3_norma_label': { 'pt': '📋 Norma Jurídica', 'en': '📋 Legal Norm' },
    'top3_implicacao_label': { 'pt': '⚡ Implicação Técnico‑Jurídica', 'en': '⚡ Technical/Legal Implication' },
    'top3_defesa_label': { 'pt': '🛡️ Estratégia de Defesa', 'en': '🛡️ Defense Strategy' },
    'top3_score_label': { 'pt': 'Pontuação', 'en': 'Score' },
    'top3_axis_label': { 'pt': 'Eixo', 'en': 'Axis' },

    // ════════════════════════════════════════════════════════════════════════
    // EIXOS DO QUESTIONÁRIO (alinhados com Normas de Conformidade Fiscal e CPP)
    // ════════════════════════════════════════════════════════════════════════
    'questionnaire_axis_a': { 'pt': 'Eixo A: Cadeia de Custódia (art. 327.º CPP e ISO 27037)', 'en': 'Axis A: Chain of Custody (CPP art. 327 & ISO 27037)' },
    'questionnaire_axis_b': { 'pt': 'Eixo B: Triangulação DAC7 vs SAF-T (DL 28/2019)', 'en': 'Axis B: DAC7 vs SAF-T Triangulation (DL 28/2019)' },
    'questionnaire_axis_c': { 'pt': 'Eixo C: Nexus‑Zero / Apropriação Indevida (art. 125.º CPP)', 'en': 'Axis C: Nexus‑Zero / Undue Appropriation (CPP art. 125)' },
    'questionnaire_axis_d': { 'pt': 'Eixo D: Algoritmo & Falibilidade (Normas de Conformidade Fiscal)', 'en': 'Axis D: Algorithm & Fallibility (Normas de Conformidade Fiscal)' },
    'questionnaire_axis_e': { 'pt': 'Eixo E: Responsabilidade Tributária (Normas de Conformidade Fiscal/LGT)', 'en': 'Axis E: Tax Liability (Normas de Conformidade Fiscal/LGT)' },

    // ════════════════════════════════════════════════════════════════════════
    // MERKLE TREE & eIDAS
    // ════════════════════════════════════════════════════════════════════════
    'merkle_root_label': { 'pt': 'Raiz Merkle (eIDAS 2.0)', 'en': 'Merkle Root (eIDAS 2.0)' },
    'merkle_selective_disclosure': { 'pt': 'Divulgação Selectiva: Prova sem Revelar Base Completa', 'en': 'Selective Disclosure: Proof Without Revealing Full Database' },
    'merkle_proof_validation': { 'pt': 'Validação da Prova de Inclusão', 'en': 'Proof of Inclusion Validation' },
    'merkle_hash_prefix': { 'pt': 'Hash de Sessão:', 'en': 'Session Hash:' },

    // ════════════════════════════════════════════════════════════════════════
    // MOTOR COGNITIVO & HEURÍSTICA
    // ════════════════════════════════════════════════════════════════════════
    'cognitive_engine_title': { 'pt': 'Motor Analítico Cognitivo', 'en': 'Cognitive Analytics Engine' },
    'cognitive_heuristic_mode': { 'pt': 'Modo: Heurística Forense Automática (TOP 3 Dinâmico)', 'en': 'Mode: Automatic Forensic Heuristics (Dynamic TOP 3)' },
    'cognitive_top3_computing': { 'pt': '🧠 A calcular TOP 3 (Pontuação de Relevância Causal)...', 'en': '🧠 Computing TOP 3 (Causal Relevance Score)...' },
    'cognitive_top3_ready': { 'pt': '✅ TOP 3 Pronto — Reveja no Painel do Advogado', 'en': '✅ TOP 3 Ready — Review in Lawyer Panel' },

    // ════════════════════════════════════════════════════════════════════════
    // MOTOR BTOR & FROTAS
    // ════════════════════════════════════════════════════════════════════════
    'btor_engine_status': { 'pt': 'Motor BTOR: Reconciliação Bancária Activa', 'en': 'BTOR Engine: Bank Reconciliation Active' },
    'btor_cumulative_base': { 'pt': 'Base Tributável Cumulativa (|BTOR-BTF|)', 'en': 'Cumulative Tax Base (|BTOR-BTF|)' },
    'btor_iva_omitted': { 'pt': 'IVA Omitido (23% × Base)', 'en': 'Omitted VAT (23% × Base)' },
    'fleet_active_drivers': { 'pt': 'Condutores Activos', 'en': 'Active Drivers' },
    'fleet_active_vehicles': { 'pt': 'Viaturas Activas', 'en': 'Active Vehicles' },
    'fleet_unique_operators': { 'pt': 'Operadores Únicos', 'en': 'Unique Operators' },
    'fleet_registry_title': { 'pt': 'Registo de Frota', 'en': 'Fleet Registry' },

    // ════════════════════════════════════════════════════════════════════════
    // HISTÓRICO PLURIANUAL
    // ════════════════════════════════════════════════════════════════════════
    'historical_earliest_period': { 'pt': 'Período Mais Antigo', 'en': 'Earliest Period' },
    'historical_latest_period': { 'pt': 'Período Mais Recente', 'en': 'Latest Period' },
    'historical_periods_covered': { 'pt': 'Períodos Abrangidos', 'en': 'Periods Covered' },
    'historical_total_records': { 'pt': 'Total de Registos Cumulativos', 'en': 'Total Cumulative Records' },
    'historical_years_spanned': { 'pt': 'Anos Abrangidos', 'en': 'Years Spanned' },

    // ════════════════════════════════════════════════════════════════════════
    // CADUCIDADE (LGT Art. 45º)
    // ════════════════════════════════════════════════════════════════════════
    'lgt_cadducity_title': { 'pt': 'Conformidade com o art. 45.º da LGT (Caducidade)', 'en': 'LGT Art. 45 Compliance (Statute of Limitations)' },
    'onus_inversion': { 'pt': 'Inversão do Ónus da Prova', 'en': 'Burden of Proof Reversal' },
    'lgt_years_elapsed': { 'pt': 'Anos Decorridos', 'en': 'Years Elapsed' },
    'lgt_cadducity_valid': { 'pt': 'Válido para Auditoria', 'en': 'Valid for Audit' },
    'lgt_cadducity_expiring': { 'pt': 'Caducidade Iminente', 'en': 'Imminent Expiry' },
    'lgt_cadducity_expired': { 'pt': 'Caducado (4 Anos)', 'en': 'Expired (4 Years)' },
    'lgt_note_manifest': { 'pt': 'Nota: Manifesta Ocultação ou Crime = Imprescritível (art. 327.º CPP)', 'en': 'Note: Manifest Concealment or Crime = Imprescriptible (CPP art. 327)' },

    // ════════════════════════════════════════════════════════════════════════
    // ARQUITECTURA & RELATÓRIO
    // ════════════════════════════════════════════════════════════════════════
    'architecture_report_title': { 'pt': 'Relatório de Arquitectura do Sistema', 'en': 'System Architecture Report' },
    'architecture_offline_mode': { 'pt': 'Modo Offline: Motor Forense Executa Localmente', 'en': 'Offline Mode: Forensic Engine Runs Locally' },
    'architecture_readonly_access': { 'pt': 'Acesso Apenas de Leitura: Sem Mutação de Dados', 'en': 'Read-Only Access: No Data Mutation' },
    'architecture_eidas_ready': { 'pt': 'Pronto para eIDAS 2.0 (Merkle + Divulgação Selectiva)', 'en': 'eIDAS 2.0 Ready (Merkle + Selective Disclosure)' },

    // ════════════════════════════════════════════════════════════════════════
    // TRÍADE PERICIAL — PACOTES DE EXPORTAÇÃO
    // ════════════════════════════════════════════════════════════════════════
    'triada_analyst_pack_title': { 'pt': 'Pacote do Analista Forense — Tríade Pericial', 'en': 'Forensic Analyst Package — Triadic Opinion' },
    'triada_lawyer_pack_title': { 'pt': 'Pacote do Advogado — Tríade Pericial + Custódia', 'en': 'Lawyer Package — Triadic Opinion + Custody' },
    'triada_custody_annex_title': { 'pt': 'Anexo de Cadeia de Custódia (ISO/IEC 27037)', 'en': 'Evidence Custody Annex (ISO/IEC 27037)' },
    'triada_export_analyst_label': { 'pt': 'Exportar Pacote Analista (Parecer Técnico + JSON)', 'en': 'Export Analyst Package (Technical Opinion + JSON)' },
    'triada_export_lawyer_label': { 'pt': 'Exportar Pacote Advogado (Parecer, Petição, Custódia + JSON)', 'en': 'Export Lawyer Package (Opinion, Petition, Custody + JSON)' },
    'triada_doc_count_analyst': { 'pt': '{{count}} documentos periciais + JSON', 'en': '{{count}} forensic documents + JSON' },
    'triada_doc_count_lawyer': { 'pt': '{{count}} peças processuais + Anexo de Custódia + JSON', 'en': '{{count}} procedural documents + Custody Annex + JSON' },
    'triada_merkle_root_label': { 'pt': 'Raiz Merkle (eIDAS 2.0 – Divulgação Selectiva)', 'en': 'Merkle Root (eIDAS 2.0 Selective Disclosure)' },
    'triada_merkle_salt_label': { 'pt': 'Salt de Sessão (referência parcial)', 'en': 'Session Salt (partial reference)' },
    'triada_session_id_label': { 'pt': 'ID de Sessão Pericial', 'en': 'Forensic Session ID' },
    'triada_period_label': { 'pt': 'Período Fiscal em Análise', 'en': 'Fiscal Period Under Analysis' },
    'triada_verdict_label': { 'pt': 'Veredito de Risco Pericial', 'en': 'Forensic Risk Verdict' },
    'triada_master_hash_label': { 'pt': 'Master Hash SHA-256 do Lote', 'en': 'Batch SHA-256 Master Hash' },
    'triada_tsa_mock_warning': { 'pt': '⚠️ Timestamp: Simulação RFC 3161 em ambiente isolado. Volte a selar com TSA acreditada para submissão judicial.', 'en': '⚠️ Timestamp: Air-Gapped RFC 3161 Mock. Re-seal with accredited TSA for judicial submission.' },
    'triada_seal_type_label': { 'pt': 'Tipo de Selagem', 'en': 'Seal Type' },
    'triada_omission_pct_label': { 'pt': 'Taxa de Omissão (%)', 'en': 'Omission Rate (%)' },
    'triada_gap_btor_btf_label': { 'pt': 'Desvio BTOR-BTF (Base Tributável |BTOR-BTF|)', 'en': 'BTOR-BTF Gap (Tax Base |BTOR-BTF|)' },
    'triada_iva_23_label': { 'pt': 'IVA em Falta (taxa de 23%)', 'en': 'Missing VAT (23% rate)' },
    'triada_iva_6_label': { 'pt': 'IVA em Falta (taxa de 6%)', 'en': 'Missing VAT (6% rate)' },
    'triada_disclosure_selective': { 'pt': 'Divulgação Selectiva: prova de integridade sem exposição da base completa', 'en': 'Selective Disclosure: integrity proof without exposing the full question database' },

    // ════════════════════════════════════════════════════════════════════════
    // CADEIA DE CUSTÓDIA — LABELS DINÂMICOS (art. 327.º CPP)
    // ════════════════════════════════════════════════════════════════════════
    'custody_chain_title': { 'pt': 'Cadeia de Custódia da Prova Digital (art. 327.º CPP)', 'en': 'Digital Evidence Chain of Custody (CPP art. 327)' },
    'custody_entry_timestamp': { 'pt': 'Data/Hora de Registo', 'en': 'Registration Timestamp' },
    'custody_entry_action':    { 'pt': 'Acção Forense',        'en': 'Forensic Action'         },
    'custody_entry_hash':      { 'pt': 'Hash SHA-256',         'en': 'SHA-256 Hash'             },
    'custody_entry_source':    { 'pt': 'Fonte de Evidência',   'en': 'Evidence Source'          },
    'custody_entry_operator':  { 'pt': 'Operador/Sistema',     'en': 'Operator/System'          },
    'custody_status_sealed':   { 'pt': 'SELADO',               'en': 'SEALED'                   },
    'custody_status_open':     { 'pt': 'EM ABERTO',            'en': 'OPEN'                     },
    'custody_iso_ref': { 'pt': 'Conformidade: ISO/IEC 27037:2012 § 8.3 — Preservação de Evidências', 'en': 'Compliance: ISO/IEC 27037:2012 § 8.3 — Evidence Preservation' },

    // ════════════════════════════════════════════════════════════════════════
    // VEREDICTOS & ESTADOS
    // ════════════════════════════════════════════════════════════════════════
    'verdict_critical': { 'pt': 'RISCO CRÍTICO',  'en': 'CRITICAL RISK'  },
    'verdict_high':     { 'pt': 'RISCO ELEVADO',  'en': 'HIGH RISK'      },
    'verdict_medium':   { 'pt': 'RISCO MÉDIO',    'en': 'MEDIUM RISK'    },
    'verdict_low':      { 'pt': 'RISCO BAIXO',    'en': 'LOW RISK'       },
    'verdict_unknown':  { 'pt': 'INDETERMINADO',  'en': 'UNDETERMINED'   },

    // ════════════════════════════════════════════════════════════════════════
    // MENSAGENS DE SUCESSO
    // ════════════════════════════════════════════════════════════════════════
    'success_analysis_complete': { 'pt': '✅ Análise Completa', 'en': '✅ Analysis Complete' },
    'success_top3_computed': { 'pt': '✅ TOP 3 Calculado com Sucesso', 'en': '✅ TOP 3 Computed Successfully' },
    'success_merkle_generated': { 'pt': '✅ Raiz Merkle Gerada', 'en': '✅ Merkle Root Generated' },
    'success_export_ready': { 'pt': '✅ Pronto para Exportar', 'en': '✅ Ready to Export' },

    // ════════════════════════════════════════════════════════════════════════
    // MENSAGENS DE ERRO
    // ════════════════════════════════════════════════════════════════════════
    'error_data_missing': { 'pt': '❌ Dados Insuficientes', 'en': '❌ Insufficient Data' },
    'error_merkle_failed': { 'pt': '❌ Erro ao Gerar Árvore de Merkle', 'en': '❌ Error Generating Merkle Tree' },
    'error_export_failed': { 'pt': '❌ Erro na Exportação', 'en': '❌ Export Error' },
    'error_validation_failed': { 'pt': '❌ Validação Falhou', 'en': '❌ Validation Failed' },

    // ── RETIFICAÇÃO 2: Terminologia jurídica EN-US (reunião Moraes Leitão) ──
    'EIXO_A':             { 'pt': 'Cadeia de Custódia (ISO 27037)',   'en': 'Chain of Custody (ISO 27037)'        },
    'OMISSAO_FATURACAO':  { 'pt': 'Omissão de Faturação',             'en': 'Invoicing Omission / Underreporting' },
    'RELATORIO_TECNICO':  { 'pt': 'Parecer Técnico Forense',          'en': 'Expert Forensic Report'              },
    'SUJEITO_PASSIVO':    { 'pt': 'Sujeito Passivo',                  'en': 'Respondent / Taxpayer'               },

    // ── RETIFICAÇÃO: Terminologia TVDE e Monopólio Documental ──
    // RET-TRANS-01: estrutura {pt/en} aplicada a 5 chaves que eram strings simples (orphaned)
    'OPERADOR_TVDE_DEF': {
        'pt': 'Operador TVDE: Entidade (singular ou coletiva) registada no IMT, titular da licença, frota e contratos ativos. Responsável legal, fiscal e laboral (IVA/IRS/IRC).',
        'en': 'TVDE Operator: Entity (individual or corporate) registered with IMT, holder of the license, fleet, and active contracts. Legally, fiscally, and labor-liable (VAT/IRS/IRC).'
    },
    'PLATFORM_MONOPOLY_NOTE': {
        'pt': 'Nos termos do Art. 36.º n.º 11 do CIVA, a centralização da emissão documental pela plataforma cria um monopólio de facto, resultando em penalização indevida do sujeito passivo por omissões de terceiros.',
        'en': 'Under Art. 36(11) CIVA, the centralization of document issuance by the platform creates a de facto monopoly, resulting in undue penalization of the taxpayer for third-party omissions.'
    },
    'COMPLIANCE_BADGE': {
        'pt': 'CERTIFICAÇÕES & CONFORMIDADE',
        'en': 'CERTIFICATIONS & COMPLIANCE'
    },
    'COMPLIANCE_ITEMS': {
        'pt': ['ISO 27001', 'ISO 27035', 'ISO 27037', 'Privacy by Design', 'Processamento 100% local (browser)'],
        'en': ['ISO 27001', 'ISO 27035', 'ISO 27037', 'Privacy by Design', '100% local processing (browser)']
    },
    'SANDBOX_LABEL': {
        'pt': 'STATUS: AMBIENTE DE DEMONSTRAÇÃO (SANDBOX) | TIMESTAMP: RELATÓRIO DE VALIDAÇÃO DE INTEGRIDADE PENDENTE (RFC 3161) | INTEGRIDADE: DETERMINÍSTICA',
        'en': 'STATUS: DEMONSTRATION ENVIRONMENT (SANDBOX) | TIMESTAMP: INTEGRITY VALIDATION REPORT PENDING (RFC 3161) | INTEGRITY: DETERMINISTIC'
    },
    // RETIFICAÇÃO R24-3: novas chaves jurídicas
    'smoking_gun_1':    { 'pt': '🔫 PROVA RAINHA I: Retenção Ilícita de Comissões', 'en': '🔫 SMOKING GUN I: Illegal Commission Withholding' },
    'smoking_gun_2':    { 'pt': '🔫 PROVA RAINHA II: Omissão de Faturação (Subdeclaração)', 'en': '🔫 SMOKING GUN II: Invoicing Omission (Underreporting)' },
    'white_collar_crime': { 'pt': 'CRIMINALIDADE DE COLARINHO BRANCO', 'en': 'WHITE‑COLLAR CRIME' },
    'expense_gap_label':  { 'pt': 'OMISSÃO DE CUSTOS/IVA', 'en': 'COST/VAT OMISSION' },
    // ════════════════════════════════════════════════════════════════════════
    // [v1.0-COMMERCIAL-LITIGATION] CORREÇÃO 9: Traduções das 50 Questões Periciais
    // Formato: question_XNNN_text / question_XNNN_norma
    // ════════════════════════════════════════════════════════════════════════
    'question_A001_text': { 'pt': 'A origem dos dados (Extrato Bancário, SAF-T PT, DAC7) foi documentada com identificação temporal precisa (timestamp RFC 3161)?', 'en': 'Was the origin of the data (Bank Statement, SAF-T PT, DAC7) documented with precise temporal identification (RFC 3161 timestamp)?' },
    'question_A001_norma': { 'pt': 'ISO/IEC 27037:2012 § 5.3 (Identificação e Documentação de Evidência Digital)', 'en': 'ISO/IEC 27037:2012 § 5.3 (Identification and Documentation of Digital Evidence)' },
    'question_A002_text': { 'pt': 'Os ficheiros originais foram preservados em ambiente de apenas leitura (read-only) durante toda a análise?', 'en': 'Were the original files preserved in a read-only environment throughout the entire analysis?' },
    'question_A002_norma': { 'pt': 'ISO/IEC 27037:2012 § 5.1 (Preservação de Integridade)', 'en': 'ISO/IEC 27037:2012 § 5.1 (Preservation of Integrity)' },
    'question_A003_text': { 'pt': 'O hash SHA-256 original de cada ficheiro foi calculado e armazenado antes de qualquer processamento?', 'en': 'Was the SHA-256 hash of each file calculated and stored prior to any processing?' },
    'question_A003_norma': { 'pt': 'ISO/IEC 27037:2012 § 5.2 (Integridade Criptográfica)', 'en': 'ISO/IEC 27037:2012 § 5.2 (Cryptographic Integrity)' },
    'question_A004_text': { 'pt': 'Existe registro de quem acedeu aos dados, em que altura e com que privilégios de leitura/escrita?', 'en': 'Is there a record of who accessed the data, at what time, and with what read/write privileges?' },
    'question_A004_norma': { 'pt': 'ISO/IEC 27037:2012 § 5.4 (Auditoria de Acesso)', 'en': 'ISO/IEC 27037:2012 § 5.4 (Access Audit)' },
    'question_A005_text': { 'pt': 'Os dados foram processados num ambiente isolado (offline ou rede separada) sem contacto com internet pública?', 'en': 'Was the data processed in an isolated environment (offline or separate network) with no public internet contact?' },
    'question_A005_norma': { 'pt': 'ISO/IEC 27037:2012 § 4.1 (Isolamento de Ambiente)', 'en': 'ISO/IEC 27037:2012 § 4.1 (Environment Isolation)' },
    'question_A006_text': { 'pt': 'O perito tem competência certificada em ferramentas forenses digitais (ex: ISO/IEC 27037, NIST)?', 'en': 'Does the expert hold certified competence in digital forensic tools (e.g. ISO/IEC 27037, NIST)?' },
    'question_A006_norma': { 'pt': 'NIST SP 800-86 § 2 (Qualificação do Investigador)', 'en': 'NIST SP 800-86 § 2 (Investigator Qualification)' },
    'question_A007_text': { 'pt': 'Existe cadeia de custódia documentada entre a obtenção dos dados e a análise (ex: quem recebeu, assinou, quando)?', 'en': 'Were the digital evidence collection procedures documented step-by-step?' },
    'question_A007_norma': { 'pt': 'Art. 125º CPP (Obrigações do Perito)', 'en': 'ISO/IEC 27037:2012 § 5.5 (Collection Procedures)' },
    'question_A008_text': { 'pt': 'Foram utilizadas ferramentas de análise validadas e com rastreabilidade forense (não modificadas, com checksums)?', 'en': 'Is the methodology used for analysis reproducible by an independent third party?' },
    'question_A008_norma': { 'pt': 'ISO/IEC 27037:2012 § 6 (Ferramentas Forenses Validadas)', 'en': 'ISO/IEC 27037:2012 § 6 (Reproducibility)' },
    'question_A009_text': { 'pt': 'O motor de análise (UNIFED) está documentado com fluxogramas, pseudocódigo e argumentos técnicos que justifiquem cada cálculo?', 'en': 'Were all data transformations (conversions, filters, aggregations) logged with timestamps?' },
    'question_A009_norma': { 'pt': 'Art. 125º, al. a) CPP (Fundamentação Técnica Obrigatória)', 'en': 'ISO/IEC 27037:2012 § 5.6 (Transformation Log)' },
    'question_A010_text': { 'pt': 'Todos os dados intermediários (buffers, caches, ficheiros temporários) foram eliminados após processamento ou arquivados em custódia?', 'en': 'Is there a complete audit trail from the original source to the final expert report?' },
    'question_A010_norma': { 'pt': 'ISO/IEC 27037:2012 § 7 (Limpeza e Retenção)', 'en': 'ISO/IEC 27037:2012 § 7 (Audit Trail)' },
    'question_B001_text': { 'pt': 'Os dados DAC7 (relato de operador) estão desagregados a nível de transação unitária, permitindo mapeamento 1:1 com linhas SAF-T?', 'en': 'Are the DAC7 data reported by digital platforms consistent with the SAF-T PT invoicing records?' },
    'question_B001_norma': { 'pt': 'Diretiva UE 2021/514 (DAC7) § 8 (Granularidade de Dados)', 'en': 'Directive DAC7 2021/514/EU Art. 8ac — AT Circular 20243' },
    'question_B002_text': { 'pt': 'Foram identificadas omissões de faturação (faturas em extrato bancário mas não em SAF-T)?', 'en': 'Were discrepancies between DAC7 and SAF-T PT values quantified and documented?' },
    'question_B002_norma': { 'pt': 'Art. 78º CIVA (Obrigação de Faturação)', 'en': 'AT Circular 20243 — RGIT Art. 103 (Tax Fraud)' },
    'question_B003_text': { 'pt': 'Foram identificadas subfaturações (fatura em SAF-T com valor menor do que em extrato bancário)?', 'en': 'Is the total revenue declared in SAF-T PT consistent with the bank account entries?' },
    'question_B003_norma': { 'pt': 'Art. 108º CIVA (Subdeclaração)', 'en': 'DL 28/2019 of 15 February — CIVA Art. 29' },
    'question_B004_text': { 'pt': 'Os períodos de reporte DAC7 (geralmente trimestral) foram desagregados em períodos SAF-T diários ou mensais para máxima precisão?', 'en': 'Were all invoices in SAF-T PT classified according to the correct tax scheme (normal, exempt, reduced)?' },
    'question_B004_norma': { 'pt': 'D.L. n.º 28/2019 de 15 de fevereiro § 3.1.2 (Granularidade Temporal)', 'en': 'CIVA Art. 18 — SAF-T PT Schema v1.04' },
    'question_B005_text': { 'pt': 'Foi realizada reconciliação de IVA entre SAF-T (IVA faturado) e DAC7 (IVA declarado)?', 'en': 'Do the cancelled invoices in SAF-T PT have the corresponding credit note within the legally required period?' },
    'question_B005_norma': { 'pt': 'Art. 2º, n.º 1, al. i) CIVA (Autoliquidação Reversa)', 'en': 'CIVA Art. 36 — DL 28/2019 Art. 23' },
    'question_B006_text': { 'pt': 'Foram comparados os períodos de liquidação (datas de pagamento) entre SAF-T e extrato bancário para detectar atrasos anormais?', 'en': 'Are there transactions in the bank statement without a corresponding invoice in SAF-T PT?' },
    'question_B006_norma': { 'pt': 'NIST SP 800-86 § 3.5 (Análise Temporal)', 'en': 'RGIT Art. 103 (Tax Fraud) — CIVA Art. 29' },
    'question_B007_text': { 'pt': 'Os números de série de fatura foram validados para continuidade e ausência de lacunas (ex: fatura 001, 002, 004 — falta 003)?', 'en': 'Was the VAT applied in SAF-T PT consistent with the rates in force in the fiscal year under analysis?' },
    'question_B007_norma': { 'pt': 'Art. 103º, n.º 2 Normas de Conformidade Fiscal (Sequência de Faturação)', 'en': 'CIVA Art. 18 — AT Dispatch 2023' },
    'question_B008_text': { 'pt': 'Foram analisados os operadores/clientes (NIFs) em SAF-T vs DAC7 para identificar contas fantasma ou remoções?', 'en': 'Are the withholding values declared in the IRS/IRC return consistent with the SAF-T PT records?' },
    'question_B008_norma': { 'pt': 'Art. 78º CIVA § 3 (Contrapartes Válidas)', 'en': 'CIRS Art. 71 — CIRC Art. 94 — SAF-T PT Schema' },
    'question_B009_text': { 'pt': 'Foi realizada análise de moedas (EUR vs estrangeiras) para validar conversão e potencial manipulação cambial?', 'en': 'Were the revenues declared on digital platforms (DAC7) also included in the periodic VAT return?' },
    'question_B009_norma': { 'pt': 'Art. 78º CIVA § 1, al. b) (Moeda e Conversão)', 'en': 'DAC7 Art. 8ac — CIVA Art. 41 (Periodic Declaration)' },
    'question_B010_text': { 'pt': 'Foram identificadas reversões (créditos) anormais que poderiam servir para cancelamento de faturas declaradas?', 'en': 'Is the period covered by the SAF-T PT exactly the same as the period in the DAC7 reports?' },
    'question_B010_norma': { 'pt': 'Art. 80º CIVA (Notas de Crédito)', 'en': 'DAC7 Art. 8ac — DL 28/2019 Art. 3' },
    'question_C001_text': { 'pt': 'A plataforma digital (ex: BOLT, Uber) declara ter remuneração zero sobre as comissões retidas (Nexus-Zero)?', 'en': 'Is the forensic correlation score (Nexus-Zero) above the 85% threshold required for evidential robustness?' },
    'question_C001_norma': { 'pt': 'Art. 2º, n.º 1, al. i) CIVA (Operações Zero-Rated)', 'en': 'UNIFED-PROBATUM Forensic Standard — NIST SP 800-86 § 4' },
    'question_C002_text': { 'pt': 'A diferença entre comissão declarada (SAF-T) e comissão real (Extrato Bancário) é material (>5%)?', 'en': 'Were statistical outliers in the dataset identified and flagged before calculating the damage estimate?' },
    'question_C002_norma': { 'pt': 'Art. 36º, n.º 11 CIVA (Zona Cinzenta — Valores Retidos)', 'en': 'NIST SP 800-86 § 3.2 (Data Validation)' },
    'question_C003_text': { 'pt': 'Existe evidência de que a plataforma retém valores mas não os declara ao operador em extracto detalhado (discriminação)?', 'en': 'Was the damage estimation model validated using at least two independent reference datasets?' },
    'question_C003_norma': { 'pt': 'Art. 78º CIVA (Faturação com Discriminação)', 'en': 'ISRS 4400 § 12 (Model Validation)' },
    'question_C004_text': { 'pt': 'As comissões retidas foram remuneração legítima da plataforma (2-25%) ou representam roubo de valores (>50% em casos extremos)?', 'en': 'Is the confidence interval of the damage estimate below ±5% for court admissibility?' },
    'question_C004_norma': { 'pt': 'Art. 36º CIVA (Limites de Comissão Permitida)', 'en': 'UNIFED-PROBATUM v1.0 § 7.3 (Confidence Interval)' },
    'question_C005_text': { 'pt': 'Foram rastreadas transferências internas da plataforma (ex: de conta de retenção para conta operacional) sem justificativa contabilística?', 'en': 'Were the algorithms used for anomaly detection documented and made available for counter-expertise?' },
    'question_C005_norma': { 'pt': 'NIST SP 800-86 § 3.3 (Rastreamento de Fundos)', 'en': 'ISO/IEC 27037:2012 § 6 — CPP Art. 327' },
    'question_C006_text': { 'pt': 'Existe evidência de que a plataforma utiliza valores retidos para fins próprios (cash flow interno) sem remuneração ao operador?', 'en': 'Is the risk score (percentage) decomposed by evidence axis (A, B, C, D, E)?' },
    'question_C006_norma': { 'pt': 'Art. 108º CIVA (Apropriação Indevida de Meios)', 'en': 'UNIFED-PROBATUM v1.0 § 5 (Risk Decomposition)' },
    'question_C007_text': { 'pt': 'A plataforma ofereceu incentivos monetários temporários (ex: bónus) que depois foram deduzidos tacitamente das futuras comissões?', 'en': 'Were the results of the Merkle Root validated against the original source hashes?' },
    'question_C007_norma': { 'pt': 'Art. 36º CIVA § 5 (Descontos e Incentivos)', 'en': 'UNIFED Merkle Engine v1.0 § 3' },
    'question_C008_text': { 'pt': 'Houve alteração unilateral do contrato (ex: aumento de comissão retenção de 10% para 30%) sem consentimento do operador?', 'en': 'Is there a graphical representation of the temporal transaction flow available for judicial use?' },
    'question_C008_norma': { 'pt': 'Art. 36º, n.º 7 CIVA (Modificação de Termos Contratuais)', 'en': 'CPP Art. 125 — NIST SP 800-86 § 5' },
    'question_C009_text': { 'pt': 'A retenção ocorre em moeda estrangeira com conversão adversa (ex: USD→EUR a taxa acima do mercado) beneficiando a plataforma?', 'en': 'Were the statistical methods used (regression, clustering, anomaly detection) described in technical terms in the report?' },
    'question_C009_norma': { 'pt': 'Art. 80º CIVA (Conversão Cambial Legítima)', 'en': 'ISRS 4400 § 10 (Methodology Description)' },
    'question_C010_text': { 'pt': 'O sistema de retenção é automático (algoritmo) ou manual (revisão humana), e há possibilidade de erro ou manipulação?', 'en': 'Is there a version control log for the analytical scripts used?' },
    'question_C010_norma': { 'pt': 'Art. 125º CPP § 1 (Metodologia Transparente)', 'en': 'ISO/IEC 27037:2012 § 6.1 (Tool Version Control)' },
    'question_D001_text': { 'pt': 'O motor de análise (UNIFED) passou em validação independente (ex: auditoria de terceiros) comprovando ausência de viés?', 'en': 'Is the expert qualified under Art. 153 of the CPP and registered with the INMLCF or equivalent body?' },
    'question_D001_norma': { 'pt': 'NIST SP 800-86 § 2.3 (Validação de Ferramentas)', 'en': 'CPP Art. 153 (Expert Qualification) — DL 45/2011' },
    'question_D002_text': { 'pt': 'O algoritmo foi testado com dados conhecidos (ex: testes de regressão) para validar outputs?', 'en': 'Was a conflict of interest declaration signed by the expert prior to the analysis?' },
    'question_D002_norma': { 'pt': 'ISO/IEC 27037:2012 § 6.1 (Validação de Outputs)', 'en': 'CPP Art. 44 (Conflict of Interest) — Deontological Code' },
    'question_D003_text': { 'pt': 'O algoritmo foi testado com dados adversariais (ex: tentativas de bypassing) para provar robustez?', 'en': 'Does the expert report contain an explicit declaration of independence and impartiality?' },
    'question_D003_norma': { 'pt': 'NIST SP 800-86 § 3.7 (Testes de Resiliência)', 'en': 'CPP Art. 155 (Expert Declaration) — ISRS 4400 § 6' },
    'question_D004_text': { 'pt': 'A precisão do algoritmo foi quantificada (ex: taxa de falsos positivos/negativos < 1%)?', 'en': 'Was the methodology applied consistent with the forensic standards recognised by Portuguese courts?' },
    'question_D004_norma': { 'pt': 'Art. 125º CPP (Precisão Técnica Obrigatória)', 'en': 'CPP Art. 163 (Expert Evidence) — STJ Ac. 2019' },
    'question_D005_text': { 'pt': 'O algoritmo foi comparado com métodos alternativos (ex: análise manual vs. automatizada) e demonstra superioridade ou equivalência?', 'en': 'Were all sources and reference documents cited in the report verifiable and accessible?' },
    'question_D005_norma': { 'pt': 'NIST SP 800-86 § 2.2 (Comparação de Métodos)', 'en': 'CPP Art. 125 (Free Proof) — ISRS 4400 § 14' },
    'question_D006_text': { 'pt': 'O algoritmo é determinístico (mesmos inputs sempre geram mesmos outputs) ou estocástico (com elemento aleatório)?', 'en': 'Is the report written in clear, objective language free from speculation?' },
    'question_D006_norma': { 'pt': 'ISO/IEC 27037:2012 § 5.5 (Reprodutibilidade)', 'en': 'CPP Art. 157 (Report Content) — ISRS 4400 § 8' },
    'question_D007_text': { 'pt': 'O código-fonte do algoritmo foi disponibilizado para revisão técnica da defesa (open-source ou under NDA)?', 'en': 'Does the report distinguish between factual findings and technical opinion?' },
    'question_D007_norma': { 'pt': 'Art. 327º CPP (Direito ao Contraditório)', 'en': 'CPP Art. 163 (Interpretation of Expert Evidence)' },
    'question_D008_text': { 'pt': 'Foram documentados todos os pressupostos do algoritmo (ex: assume que SAF-T é fidedigno) e validados antes de usar?', 'en': 'Were all limitations of the analysis explicitly acknowledged in the report?' },
    'question_D008_norma': { 'pt': 'Art. 125º, al. a) CPP (Pressupostos Técnicos)', 'en': 'ISRS 4400 § 16 (Limitations and Caveats)' },
    'question_D009_text': { 'pt': 'O algoritmo produz outputs explicáveis (ex: "omissão detectada porque fatura X não aparece em SAF-T") ou é caixa-preta?', 'en': 'Is the report digitally signed with a qualified electronic signature (eIDAS)?' },
    'question_D009_norma': { 'pt': 'NIST SP 800-86 § 4.1 (Explicabilidade)', 'en': 'Regulation (EU) 910/2014 (eIDAS) — CPP Art. 369' },
    'question_D010_text': { 'pt': 'Existe documentação de limites conhecidos do algoritmo (ex: "não detecta omissões <€100") e recomendações de uso?', 'en': 'Does the report include a summary accessible to non-technical judicial parties?' },
    'question_D010_norma': { 'pt': 'ISO/IEC 27037:2012 § 6.2 (Limitações Documentadas)', 'en': 'CPP Art. 157 — UNIFED Executive Summary Standard' },
    'question_E001_text': { 'pt': 'O operador cumpriu a obrigação de declaração ao Normas de Conformidade Fiscal (Registo Geral de Imposto sobre o Rendimento) dentro do prazo legal?', 'en': 'Does the system comply with DORA (Regulation (EU) 2022/2554) regarding digital operational resilience?' },
    'question_E001_norma': { 'pt': 'Art. 114º Normas de Conformidade Fiscal (Prazos de Entrega)', 'en': 'DORA Art. 5 (ICT Risk Management) — Regulation (EU) 2022/2554' },
    'question_E002_text': { 'pt': 'A omissão de rendimentos detectada é intencional (dolosa) ou resultado de erro administrativo (culpa)?', 'en': 'Was personal data processed in compliance with the GDPR (Regulation (EU) 2016/679)?' },
    'question_E002_norma': { 'pt': 'Art. 108º CIVA (Graus de Culpabilidade)', 'en': 'GDPR Art. 5 (Principles) — CNPD Guidelines 2023' },
    'question_E003_text': { 'pt': 'O operador realizou diligência devida para validar as retenções da plataforma (ex: solicitando esclarecimentos)?', 'en': 'Was a Privacy Impact Assessment (DPIA) conducted prior to processing sensitive data?' },
    'question_E003_norma': { 'pt': 'Art. 78º CIVA § 2 (Dever de Validação)', 'en': 'GDPR Art. 35 (DPIA) — CNPD Decision 2022' },
    'question_E004_text': { 'pt': 'A plataforma agiu de boa fé ao reter valores (ex: cumprindo legislação local) ou com intenção deliberada de sonegar?', 'en': 'Does the system implement Privacy by Design principles (data minimisation, encryption at rest)?' },
    'question_E004_norma': { 'pt': 'Art. 36º CIVA (Princípio da Boa Fé)', 'en': 'GDPR Art. 25 (Privacy by Design) — ISO/IEC 29101' },
    'question_E005_text': { 'pt': 'O imposto evadido durante a omissão foi posteriormente regularizado (ex: após descoberta) ou mantém-se em aberto?', 'en': 'Are the audit logs stored in a tamper-evident format outside the reach of the data processor?' },
    'question_E005_norma': { 'pt': 'Art. 108º, n.º 5 CIVA (Regularização Espontânea)', 'en': 'DORA Art. 9 — ISO/IEC 27037:2012 § 7' },
    'question_E006_text': { 'pt': 'A plataforma era obrigada a emitir fatura (ex: pelo montante da retenção) ou estava isenta por legislação local?', 'en': 'Was the data retention period defined and compliant with the applicable legal obligations?' },
    'question_E006_norma': { 'pt': 'Art. 78º CIVA (Obrigação de Faturação)', 'en': 'GDPR Art. 5(1)(e) — RGIT Art. 52 (Tax Records Retention)' },
    'question_E007_text': { 'pt': 'A retenção de valores pela plataforma ocorreu em território português (sujeita a Normas de Conformidade Fiscal) ou em país estrangeiro?', 'en': 'Is there a documented incident response procedure for forensic data breaches?' },
    'question_E007_norma': { 'pt': 'Art. 2º, n.º 1, al. i) CIVA (Territorialidade)', 'en': 'DORA Art. 17 — GDPR Art. 33 (Breach Notification)' },
    'question_E008_text': { 'pt': 'O operador tinha direito de dedução de IVA sobre as comissões realmente remuneradas ou sobre as comissões declaradas em SAF-T?', 'en': 'Were third-party tools used in the analysis subject to supply chain security assessment?' },
    'question_E008_norma': { 'pt': 'Art. 98º CIVA (Direito de Dedução)', 'en': 'DORA Art. 28 (Third-Party Risk) — ISO/IEC 27036' },
    'question_E009_text': { 'pt': 'A plataforma beneficiou-se de regime fiscal especial (ex: isenção startup) que poderia justificar a retenção sem declaração?', 'en': 'Does the system produce output in a format admissible under Portuguese procedural law?' },
    'question_E009_norma': { 'pt': 'Art. 36º CIVA § 6 (Regimes Especiais)', 'en': 'CPP Art. 125 — DL 28/2019 — eIDAS' },
    'question_E010_text': { 'pt': 'Qual é a quota de responsabilidade entre operador (submissão de SAF-T) e plataforma (retenção e não-declaração)?', 'en': 'Has the system undergone independent security and forensic integrity testing prior to judicial use?' },
    'question_E010_norma': { 'pt': 'Art. 125º CPP (Análise de Causalidade)', 'en': 'DORA Art. 24 (Testing) — NIST SP 800-86 § 2.4' },
};

// ============================================================================
// FUNÇÃO HELPER: OBTER TRADUÇÃO (fallback seguro, padrão = 'pt')
// ============================================================================
window.getTranslation = function(key, lang) {
    lang = lang || window.currentLang || 'pt';
    if (window.UNIFED_TRANSLATIONS.DICTIONARY[key]) {
        return window.UNIFED_TRANSLATIONS.DICTIONARY[key][lang] || window.UNIFED_TRANSLATIONS.DICTIONARY[key]['pt'];
    }
    console.warn('[TRANSLATIONS] ⚠️ Chave não encontrada: ' + key + ' (' + lang + ')');
    return key;
};

// ============================================================================
// DEEP TREE WALK OTIMIZADA (para exportação final apenas)
// RETIFICAÇÃO REQ-04c: parâmetro 'inPlace' evita deep clone desnecessário
// ============================================================================
const PLATFORM_TERMS_REGEX = /\b(bolt|uber|freenow|free\s+now|cabify|indrive|in\s+drive|lyft|didi|taxify|yango|heetch|splyt|ola\b(?!\s+vez|\s+mais|\s+que|\s+como|\s+vez))/gi;

/**
 * Sanitiza nomes de plataformas digitais em valores string de um objecto,
 * opcionalmente in‑place (sem clonagem profunda) para máxima performance.
 * Deve ser chamada APENAS no momento da montagem do JSON final para os advogados.
 *
 * @param {Object} payload    - Objecto a sanitizar (será mutado se inPlace = true)
 * @param {string} targetPath - Caminho alvo (ex: 'metadata.client')
 * @param {boolean} inPlace   - Se true, modifica o objecto original; se false, retorna um clone (comportamento legado)
 * @returns {Object} O objecto (possivelmente modificado) para encadeamento
 */
window.deepTreeWalkSanitizePlatforms = function(payload, targetPath, inPlace = false) {
    targetPath = targetPath || 'metadata.client';
    if (!payload || typeof payload !== 'object') return payload;

    const pathSegments = targetPath.split('.');

    function sanitizeString(str) {
        if (typeof str !== 'string') return str;
        const sanitized = str.replace(PLATFORM_TERMS_REGEX, function(match) {
            console.warn(`[SANITIZE·DTW] Termo de plataforma '${match}' encontrado e substituído por [REDACTED]`);
            return '[REDACTED]';
        });
        return sanitized;
    }

    function walkAndSanitize(obj, depth) {
        if (obj === null || typeof obj !== 'object') return obj;

        if (Array.isArray(obj)) {
            for (let i = 0; i < obj.length; i++) {
                obj[i] = walkAndSanitize(obj[i], depth);
            }
            return obj;
        }

        const currentSegment = pathSegments[depth];
        const reachedTarget  = (depth >= pathSegments.length);

        for (const key of Object.keys(obj)) {
            const value = obj[key];

            if (reachedTarget) {
                // dentro do caminho alvo – sanitizar strings
                if (typeof value === 'string') {
                    obj[key] = sanitizeString(value);
                } else if (typeof value === 'object' && value !== null) {
                    obj[key] = walkAndSanitize(value, depth);
                }
                // primitivos não string permanecem inalterados
            } else if (key === currentSegment) {
                obj[key] = walkAndSanitize(value, depth + 1);
            } else if (typeof value === 'object' && value !== null) {
                obj[key] = walkAndSanitize(value, depth);
            }
        }
        return obj;
    }

    if (inPlace) {
        // Modifica directamente o objecto original – ZERO CLONE, máxima performance
        walkAndSanitize(payload, 0);
        return payload;
    } else {
        // Comportamento legado: deep clone (mais pesado, mas mantém pureza)
        function deepCloneAndSanitize(obj, depth) {
            if (obj === null || typeof obj !== 'object') return obj;
            if (Array.isArray(obj)) {
                return obj.map(function(item) { return deepCloneAndSanitize(item, depth); });
            }
            const clone = {};
            const currentSegment = pathSegments[depth];
            const reachedTarget  = (depth >= pathSegments.length);

            for (const key of Object.keys(obj)) {
                const value = obj[key];
                if (reachedTarget) {
                    if (typeof value === 'string') {
                        clone[key] = sanitizeString(value);
                    } else if (typeof value === 'object' && value !== null) {
                        clone[key] = deepCloneAndSanitize(value, depth);
                    } else {
                        clone[key] = value;
                    }
                } else if (key === currentSegment) {
                    clone[key] = deepCloneAndSanitize(value, depth + 1);
                } else {
                    clone[key] = (typeof value === 'object' && value !== null)
                        ? deepCloneAndSanitize(value, depth)
                        : value;
                }
            }
            return clone;
        }
        return deepCloneAndSanitize(payload, 0);
    }
};

// Alias de compatibilidade retroactiva
window.deepTreeWalkSanitizeBolt = window.deepTreeWalkSanitizePlatforms;

// ============================================================================
// COMUTAÇÃO BIDIRECIONAL PT/EN — REMOVIDO (R5)
// toggleLanguage e initLanguageSwitcher centralizados em script.js
// switchLanguage, aplicarTraducaoDinamicaUI, translateAll geridos em script.js
// A inicialização ocorre via switchLanguage('pt') no DOMContentLoaded de script.js
// ============================================================================
