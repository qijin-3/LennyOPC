'use strict';

const SettingsApp = {
  _activeTab: 'ai',

  render(container) {
    container.innerHTML = `
      <div class="settings-container">
        <div class="settings-sidebar">
          <div class="settings-nav-item active" data-tab="ai">${t('settings.ai_tab')}</div>
          <div class="settings-nav-item" data-tab="profile">👤 ${getLang() === 'en' ? 'Player Profile' : '玩家档案'}</div>
          <div class="settings-nav-item" data-tab="game">${t('settings.game_tab')}</div>
          <div class="settings-nav-item" data-tab="save">${t('settings.save_tab')}</div>
          <div class="settings-nav-item" data-tab="lang">${t('settings.lang_tab')}</div>
        </div>
        <div class="settings-content" id="settings-panel"></div>
      </div>`;
    container.querySelectorAll('.settings-nav-item').forEach(item => {
      item.onclick = () => {
        container.querySelectorAll('.settings-nav-item').forEach(i => i.classList.remove('active'));
        item.classList.add('active');
        this._activeTab = item.dataset.tab;
        this._renderPanel(container.querySelector('#settings-panel'));
      };
    });
    this._renderPanel(container.querySelector('#settings-panel'));
  },

  _renderPanel(panel) {
    if (this._activeTab === 'ai') this._renderAI(panel);
    else if (this._activeTab === 'profile') this._renderProfile(panel);
    else if (this._activeTab === 'game') this._renderGame(panel);
    else if (this._activeTab === 'save') this._renderSave(panel);
    else if (this._activeTab === 'lang') this._renderLang(panel);
  },

  // ── AI Config ──────────────────────────────────────────────────────────────
  _renderAI(panel) {
    const cfg = AIConfig.get();
    const p = AI_PROVIDERS[cfg.provider] || AI_PROVIDERS.glm;

    const modelOptions = cfg.provider === 'custom'
      ? `<input type="text" id="ai-model" value="${cfg.customModel || ''}" placeholder="${t('onboard.model_name_placeholder')}" style="flex:1;padding:6px 10px;border:1px solid var(--border);border-radius:6px;font-size:13px;font-family:inherit;outline:none;">`
      : `<select id="ai-model">${p.models.map(m => `<option value="${m}" ${m===cfg.model?'selected':''}>${m}</option>`).join('')}</select>`;

    panel.innerHTML = `
      <div class="settings-section-title">${t('settings.ai_title')}</div>
      <div class="settings-group">
        <div class="settings-group-title">${t('settings.provider')}</div>
        <div class="settings-row">
          <label>${t('settings.provider')}</label>
          <select id="ai-provider">${Object.entries(AI_PROVIDERS).map(([k,v]) => `<option value="${k}" ${k===cfg.provider?'selected':''}>${v.name}</option>`).join('')}</select>
        </div>
        <div class="settings-row" id="ai-hint-row">
          <label>${t('settings.hint')}</label>
          <span style="font-size:12px;color:var(--text-secondary);">${p.keyHint || ''}</span>
        </div>
        <div id="ai-custom-url-row" class="settings-row" style="display:${cfg.provider==='custom'?'flex':'none'};">
          <label>${t('settings.base_url')}</label>
          <input type="text" id="ai-custom-url" value="${cfg.customBaseURL || ''}" placeholder="https://your-api.example.com/v1/chat/completions"
                 style="flex:1;padding:6px 10px;border:1px solid var(--border);border-radius:6px;font-size:12px;font-family:inherit;outline:none;">
        </div>
        <div class="settings-row">
          <label>API Key</label>
          <div class="api-key-wrapper">
            <input type="password" id="ai-apikey" value="${cfg.apiKey}" placeholder="${p.keyPlaceholder || 'API Key'}">
            <span class="api-key-toggle" id="key-toggle">👁</span>
          </div>
        </div>
        <div class="settings-row">
          <label>${t('onboard.model_label')}</label>
          ${modelOptions}
        </div>
      </div>
      <div style="display:flex;gap:8px;flex-wrap:wrap;">
        <button class="settings-btn settings-btn-primary" id="btn-test-ai">${t('settings.test_btn')}</button>
        <button class="settings-btn settings-btn-primary" id="btn-save-ai">${t('settings.save_btn')}</button>
      </div>
      <div id="ai-status" style="margin-top:8px;"></div>
      <div class="settings-group" style="margin-top:16px;">
        <p style="font-size:12px;color:var(--text-secondary);line-height:1.7;margin:0;">${t('settings.ai_note').replace(/\n/g,'<br>')}</p>
      </div>`;

    const providerSel = panel.querySelector('#ai-provider');
    const keyInput = panel.querySelector('#ai-apikey');
    const customURLRow = panel.querySelector('#ai-custom-url-row');

    const refreshForm = () => {
      const prov = AI_PROVIDERS[providerSel.value];
      if (!prov) return;
      panel.querySelector('#ai-hint-row').querySelector('span').textContent = prov.keyHint || '';
      keyInput.placeholder = prov.keyPlaceholder || 'API Key';
      customURLRow.style.display = providerSel.value === 'custom' ? 'flex' : 'none';
      const modelEl = panel.querySelector('#ai-model');
      if (modelEl?.tagName === 'SELECT') {
        modelEl.innerHTML = prov.models.map(m => `<option value="${m}" ${m===prov.defaultModel?'selected':''}>${m}</option>`).join('');
      }
    };
    providerSel.onchange = refreshForm;

    panel.querySelector('#key-toggle').onclick = () => {
      keyInput.type = keyInput.type === 'password' ? 'text' : 'password';
      panel.querySelector('#key-toggle').textContent = keyInput.type === 'password' ? '👁' : '🙈';
    };

    const getFormValues = () => ({
      provider: providerSel.value,
      apiKey: keyInput.value.trim(),
      model: panel.querySelector('#ai-model')?.value || '',
      customBaseURL: panel.querySelector('#ai-custom-url')?.value?.trim() || '',
      customModel: panel.querySelector('#ai-model')?.tagName === 'INPUT' ? panel.querySelector('#ai-model').value.trim() : ''
    });

    panel.querySelector('#btn-save-ai').onclick = () => {
      AIConfig.set(getFormValues());
      NotificationSystem.show('Settings', t('settings.saved_ok'));
    };

    panel.querySelector('#btn-test-ai').onclick = async () => {
      const status = panel.querySelector('#ai-status');
      AIConfig.set(getFormValues());
      status.innerHTML = `<div class="settings-status" style="background:rgba(0,122,255,0.1);color:var(--accent);">${t('settings.testing')}</div>`;
      const result = await AIConfig.testConnection();
      if (result.ok) {
        status.innerHTML = `<div class="settings-status success">${t('settings.test_success')}${result.preview ? '「' + result.preview + '」' : ''}</div>`;
        NotificationSystem.show('Settings', t('settings.test_ok'));
      } else {
        status.innerHTML = `<div class="settings-status error">${t('settings.test_fail', { error: result.error })}</div>`;
      }
    };
  },

  // ── Player Profile ─────────────────────────────────────────────────────────
  _renderProfile(panel) {
    const lang = getLang();
    const s = GameState.getAll();
    const playerName = s.playerName || (lang === 'en' ? 'Founder' : '创业者');
    const addedContacts = s.addedContacts || [];
    const npcMemory = s.npcMemory || {};
    const recentActivity = s.recentActivity || [];

    // Build relationship snapshot
    const relationships = addedContacts.map(id => {
      const mem = npcMemory[id] || { trustScore: 20, relationship: t('rel.stranger'), beliefs: [] };
      const expert = (typeof EXPERTS !== 'undefined') ? EXPERTS.find(e => e.id === id) : null;
      return { id, name: expert?.name || id, emoji: expert?.avatarEmoji || '👤', trustScore: mem.trustScore, relationship: mem.relationship, beliefs: mem.beliefs || [] };
    });

    // Milestone flags
    const ms = s.milestones || {};
    const milestoneList = [
      { key: 'terminationAcknowledged', label: lang === 'en' ? 'Accepted severance' : '接受了遣散费', done: ms.terminationAcknowledged },
      { key: 'firstPaidClient', label: lang === 'en' ? 'Got first paid client' : '获得第一个付费客户', done: ms.firstPaidClient },
      { key: 'monthlyRevenue3k', label: lang === 'en' ? 'Revenue ¥3k/month' : '月收入 ¥3,000', done: ms.monthlyRevenue3k },
      { key: 'monthlyRevenue10k', label: lang === 'en' ? 'Revenue ¥10k/month' : '月收入 ¥10,000', done: ms.monthlyRevenue10k },
    ];

    panel.innerHTML = `
      <div style="padding:4px 0 16px;">
        <!-- Player header -->
        <div style="display:flex;align-items:center;gap:14px;margin-bottom:20px;padding:14px 16px;
                    background:linear-gradient(135deg,rgba(0,122,255,0.06),rgba(88,86,214,0.06));
                    border:1px solid rgba(0,122,255,0.12);border-radius:12px;">
          <div style="width:52px;height:52px;border-radius:50%;background:linear-gradient(135deg,#007aff,#5856d6);
                      display:flex;align-items:center;justify-content:center;font-size:26px;flex-shrink:0;">👤</div>
          <div>
            <div style="font-size:18px;font-weight:700;color:var(--text-primary);">${playerName}</div>
            <div style="font-size:12px;color:var(--text-secondary);margin-top:2px;">
              ${t('week.label', { n: s.week })} · ${t('phase.' + s.phase)} · ¥${(s.cash||0).toLocaleString()}
            </div>
          </div>
          <button id="btn-gen-summary" style="margin-left:auto;padding:6px 14px;background:var(--accent);color:#fff;border:none;
                  border-radius:8px;font-size:12px;font-weight:600;cursor:pointer;font-family:var(--font-system);">
            🤖 ${lang === 'en' ? 'AI Summary' : 'AI 总结'}
          </button>
        </div>

        <!-- AI Summary area -->
        <div id="profile-ai-summary" style="margin-bottom:20px;"></div>

        <!-- Key stats -->
        <div class="settings-section-title" style="margin-bottom:10px;">
          ${lang === 'en' ? '📊 Key Stats' : '📊 关键数值'}
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:20px;">
          ${[
            ['💰', lang === 'en' ? 'Cash' : '现金', `¥${(s.cash||0).toLocaleString()}`, s.cash > 30000 ? '#34c759' : s.cash > 10000 ? '#ff9500' : '#ff3b30'],
            ['🔥', lang === 'en' ? 'Reputation' : '声誉', s.reputation || 0, 'var(--accent)'],
            ['🤝', lang === 'en' ? 'Network' : '人脉', s.network || 0, '#5856d6'],
            ['💡', lang === 'en' ? 'Insights' : '洞察碎片', s.insightFragments || 0, '#af52de'],
            ['🎙️', lang === 'en' ? 'Podcasts listened' : '播客收听', (s.listenedEpisodes||[]).length, 'var(--accent)'],
            ['👥', lang === 'en' ? 'Expert contacts' : '专家联系人', addedContacts.length, '#5856d6'],
          ].map(([icon, label, val, color]) => `
            <div style="padding:10px 12px;background:#fff;border:1px solid var(--border);border-radius:8px;">
              <div style="font-size:11px;color:var(--text-secondary);margin-bottom:3px;">${icon} ${label}</div>
              <div style="font-size:18px;font-weight:700;color:${color};">${val}</div>
            </div>`).join('')}
        </div>

        <!-- Milestones -->
        <div class="settings-section-title" style="margin-bottom:10px;">
          ${lang === 'en' ? '🏁 Milestones' : '🏁 里程碑'}
        </div>
        <div style="display:flex;flex-direction:column;gap:4px;margin-bottom:20px;">
          ${milestoneList.map(m => `
            <div style="display:flex;align-items:center;gap:8px;padding:7px 10px;border-radius:7px;
                        background:${m.done ? 'rgba(52,199,89,0.06)' : 'rgba(0,0,0,0.03)'};
                        border:1px solid ${m.done ? 'rgba(52,199,89,0.2)' : 'rgba(0,0,0,0.06)'};">
              <span style="font-size:14px;">${m.done ? '✅' : '⭕'}</span>
              <span style="font-size:13px;color:${m.done ? '#1a7a3f' : 'var(--text-secondary)'};">${m.label}</span>
            </div>`).join('')}
        </div>

        <!-- NPC Relationships -->
        ${relationships.length > 0 ? `
        <div class="settings-section-title" style="margin-bottom:10px;">
          ${lang === 'en' ? '🧑‍🤝‍🧑 Expert Relationships' : '🧑‍🤝‍🧑 专家关系'}
        </div>
        <div style="display:flex;flex-direction:column;gap:6px;margin-bottom:20px;">
          ${relationships.map(r => `
            <div style="padding:10px 12px;background:#fff;border:1px solid var(--border);border-radius:8px;">
              <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;">
                <span style="font-size:18px;">${r.emoji}</span>
                <span style="font-size:13px;font-weight:600;">${r.name}</span>
                <span style="margin-left:auto;font-size:11px;padding:2px 8px;border-radius:10px;
                             background:${r.trustScore >= 60 ? 'rgba(52,199,89,0.1)' : r.trustScore >= 40 ? 'rgba(255,149,0,0.1)' : 'rgba(0,0,0,0.06)'};
                             color:${r.trustScore >= 60 ? '#1a7a3f' : r.trustScore >= 40 ? '#c47000' : 'var(--text-secondary)'};">
                  ${r.relationship} · ${r.trustScore}
                </span>
              </div>
              ${r.beliefs.length > 0 ? `
              <div style="font-size:11px;color:var(--text-secondary);line-height:1.5;border-top:1px solid var(--border);padding-top:5px;">
                ${lang === 'en' ? 'What they know about you:' : '他对你的了解：'}<br>
                ${r.beliefs.slice(-2).map(b => `• ${b}`).join('<br>')}
              </div>` : ''}
            </div>`).join('')}
        </div>` : ''}

        <!-- Recent Activity -->
        ${recentActivity.length > 0 ? `
        <div class="settings-section-title" style="margin-bottom:10px;">
          ${lang === 'en' ? '📋 Recent Activity' : '📋 近期动态'}
        </div>
        <div style="display:flex;flex-direction:column;gap:3px;">
          ${recentActivity.slice(-8).reverse().map(a => `
            <div style="font-size:12px;color:var(--text-secondary);padding:4px 8px;border-left:2px solid var(--border);">
              ${a.desc || a.type}
            </div>`).join('')}
        </div>` : ''}
      </div>`;

    panel.querySelector('#btn-gen-summary').onclick = () => this._generateAISummary(panel, s, lang);

    // If we already have a cached summary, show it
    const cached = SaveSystem.load('player_summary');
    if (cached) this._showSummary(panel, cached, false);
  },

  async _generateAISummary(panel, s, lang) {
    if (!AIConfig.hasKey()) {
      const el = panel.querySelector('#profile-ai-summary');
      if (el) el.innerHTML = `<div style="padding:12px;background:rgba(255,149,0,0.08);border:1px solid rgba(255,149,0,0.2);border-radius:8px;font-size:13px;color:#c47000;">
        ${lang === 'en' ? '⚠️ Configure AI in the AI tab first.' : '⚠️ 请先在「AI 配置」标签页配置好 AI 模型。'}
      </div>`;
      return;
    }

    const btn = panel.querySelector('#btn-gen-summary');
    if (btn) { btn.disabled = true; btn.textContent = lang === 'en' ? '⏳ Generating...' : '⏳ 生成中...'; }

    // Build context for AI
    const addedContacts = s.addedContacts || [];
    const npcMemory = s.npcMemory || {};
    const expertNames = addedContacts.map(id => {
      const ex = (typeof EXPERTS !== 'undefined') ? EXPERTS.find(e => e.id === id) : null;
      const mem = npcMemory[id] || {};
      return ex ? `${ex.name}（信任度 ${mem.trustScore || 20}）` : id;
    });

    const systemPrompt = lang === 'en'
      ? `You are an analyst summarizing a startup founder's current situation. Be concise, insightful, and honest. Write in 3-4 sentences. Focus on: their current stage, key strengths, biggest risk, and one actionable next step.`
      : `你是一个创业分析师，正在总结一位独立创业者的当前状况。语言简洁、有洞察力、诚实。写 3-4 句话。聚焦：当前阶段、核心优势、最大风险点、一个可执行的下一步建议。`;

    const userMsg = lang === 'en'
      ? `Founder: ${s.playerName || 'Unknown'}
Week: ${s.week}, Phase: ${s.phase}
Cash: ¥${(s.cash||0).toLocaleString()}, Reputation: ${s.reputation}, Network: ${s.network}
Insight fragments collected: ${s.insightFragments || 0}
Expert contacts: ${expertNames.join(', ') || 'none yet'}
Milestones: ${Object.entries(s.milestones||{}).filter(([,v])=>v).map(([k])=>k).join(', ') || 'none'}
Recent actions: ${(s.recentActivity||[]).slice(-5).map(a=>a.desc||a.type).join('; ') || 'none'}`
      : `创始人：${s.playerName || '未知'}
当前第 ${s.week} 周，阶段：${t('phase.' + s.phase)}
现金：¥${(s.cash||0).toLocaleString()}，声誉：${s.reputation}，人脉：${s.network}
洞察碎片：${s.insightFragments || 0}
已建立联系的专家：${expertNames.join('、') || '暂无'}
已完成里程碑：${Object.entries(s.milestones||{}).filter(([,v])=>v).map(([k])=>k).join('、') || '暂无'}
近期行动：${(s.recentActivity||[]).slice(-5).map(a=>a.desc||a.type).join('；') || '暂无'}`;

    let summary = '';
    try {
      summary = await AIConfig.chat(systemPrompt, [{ role: 'user', content: userMsg }]);
    } catch (e) {
      summary = lang === 'en' ? '(AI failed. Check API Key in Settings.)' : '（AI 生成失败，请检查 API Key 是否配置正确。）';
    }

    SaveSystem.save('player_summary', { text: summary, generatedAt: Date.now(), week: s.week });
    this._showSummary(panel, { text: summary, generatedAt: Date.now(), week: s.week }, true);

    if (btn) { btn.disabled = false; btn.textContent = lang === 'en' ? '🤖 Regenerate' : '🤖 重新生成'; }
  },

  _showSummary(panel, { text, generatedAt, week }, highlight) {
    const lang = getLang();
    const el = panel.querySelector('#profile-ai-summary');
    if (!el) return;
    const timeStr = generatedAt ? new Date(generatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';
    el.innerHTML = `
      <div style="padding:14px 16px;background:${highlight ? 'rgba(0,122,255,0.05)' : 'rgba(0,0,0,0.02)'};
                  border:1px solid ${highlight ? 'rgba(0,122,255,0.15)' : 'var(--border)'};border-radius:10px;
                  transition:all 0.3s;">
        <div style="display:flex;align-items:center;gap:6px;margin-bottom:8px;">
          <span style="font-size:14px;">🤖</span>
          <span style="font-size:12px;font-weight:600;color:var(--accent);">${lang === 'en' ? 'AI Analysis' : 'AI 分析'}</span>
          <span style="margin-left:auto;font-size:11px;color:var(--text-secondary);">
            ${lang === 'en' ? `Week ${week} · ${timeStr}` : `第 ${week} 周 · ${timeStr}`}
          </span>
        </div>
        <div style="font-size:13px;color:var(--text-primary);line-height:1.7;white-space:pre-wrap;">${text}</div>
      </div>`;
  },

  // ── Game Info ──────────────────────────────────────────────────────────────
  _renderGame(panel) {
    const s = GameState.getAll();
    panel.innerHTML = `
      <div class="settings-section-title">${t('settings.game_title')}</div>
      <div class="settings-group">
        <div class="settings-group-title">${t('settings.game_info')}</div>
        <div class="settings-row"><label>${t('settings.current_week')}</label><span style="font-weight:600;">${t('week.label', { n: s.week })}</span></div>
        <div class="settings-row"><label>${t('settings.phase_label')}</label><span>${t('phase.' + s.phase)}</span></div>
        <div class="settings-row"><label>${t('settings.cash')}</label><span style="font-weight:600;color:var(--success);">¥${s.cash.toLocaleString()}</span></div>
        <div class="settings-row"><label>${t('settings.insight')}</label><span style="color:#af52de;font-weight:600;">${s.insightFragments || 0}</span></div>
      </div>
      <div class="settings-group">
        <div class="settings-group-title">${t('settings.achievements')}</div>
        <div style="display:flex;flex-wrap:wrap;gap:6px;padding:4px 0;">
          ${(s.achievements||[]).length === 0
            ? `<div style="font-size:12px;color:var(--text-secondary);">${t('settings.no_achievements')}</div>`
            : (s.achievements||[]).map(a => `<span style="background:rgba(255,149,0,0.1);color:#c47000;border-radius:4px;padding:2px 8px;font-size:12px;">🏆 ${a}</span>`).join('')
          }
        </div>
      </div>`;
  },

  // ── Language ───────────────────────────────────────────────────────────────
  _renderLang(panel) {
    const current = getLang();
    panel.innerHTML = `
      <div class="settings-section-title">${t('settings.lang_title')}</div>
      <div class="settings-group">
        <div class="settings-row">
          <label>${t('settings.lang_label')}</label>
          <select id="lang-select" style="min-width:120px;">
            <option value="zh" ${current === 'zh' ? 'selected' : ''}>中文</option>
            <option value="en" ${current === 'en' ? 'selected' : ''}>English</option>
          </select>
        </div>
        <p style="font-size:12px;color:var(--text-secondary);line-height:1.6;margin-top:8px;">${t('settings.lang_note')}</p>
      </div>
      <button class="settings-btn settings-btn-primary" id="btn-save-lang" style="margin-top:8px;">${t('settings.lang_save')}</button>`;

    panel.querySelector('#btn-save-lang').onclick = () => {
      setLang(panel.querySelector('#lang-select').value);
      location.reload();
    };
  },

  // ── Save / Reset ───────────────────────────────────────────────────────────
  _renderSave(panel) {
    const state = GameState.getAll();
    const lang = getLang();
    const localKB = (new Blob(Object.entries(localStorage).filter(([k]) => k.startsWith('opc_')).map(([,v]) => v)).size / 1024).toFixed(1);
    panel.innerHTML = `
      <div class="settings-section-title">${t('settings.save_title')}</div>
      <div class="settings-group">
        <div class="settings-row"><label>${t('settings.created_at')}</label><span style="font-size:13px;">${state.gameStartedAt ? new Date(state.gameStartedAt).toLocaleString() : '—'}</span></div>
        <div class="settings-row"><label>${t('settings.progress')}</label><span>${t('week.label', { n: state.week })} / ${t('phase.' + state.phase)}</span></div>
        <div class="settings-row"><label>${t('settings.local_size')}</label><span>${localKB} KB</span></div>
      </div>
      <div style="display:flex;gap:8px;margin-top:12px;flex-wrap:wrap;">
        <button class="settings-btn settings-btn-secondary" id="btn-export">${t('settings.export_btn')}</button>
        <button class="settings-btn settings-btn-danger" id="btn-reset">${t('settings.reset_btn')}</button>
      </div>
      <!-- Danger zone -->
      <div style="margin-top:24px;padding:16px;border:1.5px solid rgba(255,59,48,0.25);border-radius:10px;background:rgba(255,59,48,0.03);">
        <div style="font-size:13px;font-weight:700;color:#cc2200;margin-bottom:6px;">
          ⚠️ ${lang === 'en' ? 'Danger Zone' : '危险操作'}
        </div>
        <div style="font-size:12px;color:var(--text-secondary);margin-bottom:12px;line-height:1.5;">
          ${lang === 'en'
            ? 'This will erase ALL game data and return to the login screen. This cannot be undone.'
            : '此操作将清除所有游戏数据并返回登录界面，无法撤销。'}
        </div>
        <button class="settings-btn settings-btn-danger" id="btn-full-reset" style="width:100%;">
          🗑️ ${lang === 'en' ? 'Reset & Return to Login' : '重置游戏并返回登录界面'}
        </button>
      </div>`;

    panel.querySelector('#btn-export').onclick = () => {
      const data = {};
      Object.keys(localStorage).filter(k => k.startsWith('opc_')).forEach(k => { data[k] = localStorage.getItem(k); });
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `opc-save-${new Date().toISOString().slice(0,10)}.json`;
      a.click();
      URL.revokeObjectURL(a.href);
    };

    // Old reset (reload)
    panel.querySelector('#btn-reset').onclick = () => {
      if (confirm(t('settings.reset_confirm'))) {
        GameState.reset();
        SaveSystem.remove('ai_config');
        NotificationSystem.show(t('notif.system'), t('settings.reset_notif'));
        setTimeout(() => location.reload(), 1500);
      }
    };

    // Full reset → clear everything → show login screen
    panel.querySelector('#btn-full-reset').onclick = () => {
      const lang = getLang();
      const msg = lang === 'en'
        ? 'Reset ALL game data and return to login? This cannot be undone.'
        : '确定要清除所有游戏数据并返回登录界面吗？此操作无法撤销。';
      if (!confirm(msg)) return;
      // Clear all localStorage
      SaveSystem.clear();
      // Reload — Onboarding.start() will fire since isNew = true
      location.reload();
    };
  }
};
