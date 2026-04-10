'use strict';

// ===== Onboarding =====
const Onboarding = {
  _overlay: null,

  start() {
    const loginEl = document.getElementById('login-screen');
    loginEl.style.display = 'flex';
    const nameInput = document.getElementById('login-name-input');
    const loginBtn = document.getElementById('login-btn');
    const langSelect = document.getElementById('login-lang-select');

    // Restore saved language
    const savedLang = getLang();
    langSelect.value = savedLang;
    this._applyLoginLang(savedLang);

    // Live language switch on the login screen itself
    langSelect.onchange = () => {
      setLang(langSelect.value);
      this._applyLoginLang(langSelect.value);
    };

    const doLogin = () => {
      const name = nameInput.value.trim();
      if (!name) {
        nameInput.placeholder = t('login.name_placeholder');
        nameInput.style.borderColor = 'rgba(255,100,100,0.5)';
        setTimeout(() => { nameInput.style.borderColor = ''; }, 800);
        return;
      }
      setLang(langSelect.value);
      GameState.set('playerName', name);
      loginEl.style.transition = 'opacity 0.6s ease';
      loginEl.style.opacity = '0';
      setTimeout(() => {
        loginEl.style.display = 'none';
        this._showAISetup();
      }, 600);
    };

    loginBtn.onclick = doLogin;
    nameInput.onkeydown = e => { if (e.key === 'Enter') doLogin(); };
    setTimeout(() => nameInput.focus(), 300);
  },

  _applyLoginLang(lang) {
    const map = {
      zh: { title: 'OPC 创始人', subtitle: '你的创业模拟器', placeholder: '输入你的名字开始', langLabel: '语言', btn: '开始 →', hint: '按回车或点击按钮继续' },
      en: { title: 'OPC Founder', subtitle: 'Your startup simulator', placeholder: 'Enter your name to start', langLabel: 'Language', btn: 'Start →', hint: 'Press Enter or click to continue' }
    };
    const s = map[lang] || map.zh;
    document.getElementById('login-title').textContent = s.title;
    document.getElementById('login-subtitle').textContent = s.subtitle;
    document.getElementById('login-name-input').placeholder = s.placeholder;
    document.getElementById('login-lang-label').textContent = s.langLabel;
    document.getElementById('login-btn').textContent = s.btn;
    document.getElementById('login-hint').textContent = s.hint;
  },

  // Step 2: AI configuration wizard overlay
  _showAISetup() {
    const overlay = document.createElement('div');
    overlay.id = 'onboarding-ai-overlay';
    overlay.style.cssText = `
      position:fixed;inset:0;z-index:9999;
      background:rgba(0,0,0,0.75);backdrop-filter:blur(12px);
      display:flex;align-items:center;justify-content:center;
      animation:fadeIn 0.4s ease;`;
    overlay.innerHTML = `
      <div style="
        background:rgba(255,255,255,0.98);border-radius:16px;
        width:520px;max-width:90vw;max-height:90vh;overflow-y:auto;
        box-shadow:0 32px 80px rgba(0,0,0,0.4);
        padding:36px 36px 28px;">
        <!-- Header -->
        <div style="text-align:center;margin-bottom:28px;">
          <div style="font-size:48px;margin-bottom:12px;">🤖</div>
          <div style="font-size:20px;font-weight:700;color:#1d1d1f;margin-bottom:8px;">${t('onboard.ai_title')}</div>
          <div style="font-size:14px;color:#666;line-height:1.6;">${t('onboard.ai_subtitle').replace('\n','<br>')}</div>
        </div>
        <!-- Provider grid -->
        <div style="margin-bottom:20px;">
          <div style="font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;color:#999;margin-bottom:10px;">${t('onboard.provider_label')}</div>
          <div id="ob-provider-grid" style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;"></div>
        </div>
        <!-- API Key + Model -->
        <div id="ob-form" style="margin-bottom:20px;">
          <div style="margin-bottom:12px;">
            <label style="font-size:12px;font-weight:600;color:#444;display:block;margin-bottom:6px;">${t('onboard.apikey_label')}</label>
            <div style="display:flex;gap:6px;align-items:center;">
              <input type="password" id="ob-apikey" placeholder="输入你的 API Key"
                     style="flex:1;padding:9px 12px;border:1.5px solid #ddd;border-radius:8px;font-size:14px;outline:none;font-family:inherit;transition:border 0.2s;"
                     onfocus="this.style.borderColor='#007aff'" onblur="this.style.borderColor='#ddd'">
              <button id="ob-key-toggle" style="padding:9px 10px;border:1.5px solid #ddd;border-radius:8px;background:#fff;cursor:pointer;font-size:14px;">👁</button>
            </div>
            <div id="ob-key-hint" style="font-size:11px;color:#999;margin-top:5px;"></div>
          </div>
          <div id="ob-model-row" style="display:none;">
            <label style="font-size:12px;font-weight:600;color:#444;display:block;margin-bottom:6px;">${t('onboard.model_label')}</label>
            <select id="ob-model" style="width:100%;padding:9px 12px;border:1.5px solid #ddd;border-radius:8px;font-size:14px;outline:none;font-family:inherit;background:#fff;cursor:pointer;"></select>
          </div>
          <!-- Custom base URL (only for custom provider) -->
          <div id="ob-custom-url-row" style="display:none;margin-top:12px;">
            <label style="font-size:12px;font-weight:600;color:#444;display:block;margin-bottom:6px;">${t('onboard.baseurl_label')}</label>
            <input type="text" id="ob-custom-url" placeholder="https://your-api.example.com/v1/chat/completions"
                   style="width:100%;padding:9px 12px;border:1.5px solid #ddd;border-radius:8px;font-size:13px;outline:none;font-family:inherit;box-sizing:border-box;transition:border 0.2s;"
                   onfocus="this.style.borderColor='#007aff'" onblur="this.style.borderColor='#ddd'">
            <input type="text" id="ob-custom-model" placeholder="${t('onboard.model_name_placeholder')}"
                   style="width:100%;padding:9px 12px;border:1.5px solid #ddd;border-radius:8px;font-size:13px;outline:none;font-family:inherit;box-sizing:border-box;margin-top:6px;transition:border 0.2s;"
                   onfocus="this.style.borderColor='#007aff'" onblur="this.style.borderColor='#ddd'">
          </div>
        </div>
        <!-- Status -->
        <div id="ob-status" style="min-height:28px;margin-bottom:16px;font-size:13px;"></div>
        <!-- Buttons -->
        <div style="display:flex;gap:10px;">
          <button id="ob-test-btn" style="
            flex:1;padding:11px;border:1.5px solid #007aff;border-radius:10px;
            background:#fff;color:#007aff;font-size:14px;font-weight:600;cursor:pointer;
            font-family:inherit;transition:all 0.15s;">
            ${t('onboard.test_btn')}
          </button>
          <button id="ob-skip-btn" style="
            padding:11px 16px;border:1.5px solid #ddd;border-radius:10px;
            background:#fff;color:#666;font-size:14px;cursor:pointer;
            font-family:inherit;transition:all 0.15s;">
            ${t('onboard.skip_btn')}
          </button>
        </div>
        <div id="ob-start-row" style="display:none;margin-top:10px;">
          <button id="ob-start-btn" style="
            width:100%;padding:13px;border:none;border-radius:10px;
            background:linear-gradient(135deg,#007aff,#5856d6);color:#fff;
            font-size:15px;font-weight:700;cursor:pointer;font-family:inherit;
            box-shadow:0 4px 16px rgba(0,122,255,0.35);transition:all 0.15s;">
            ${t('onboard.start_btn')}
          </button>
        </div>
      </div>`;
    document.body.appendChild(overlay);
    this._overlay = overlay;

    // Render provider grid
    const selectedProvider = AIConfig.get().provider || 'glm';
    this._renderProviderGrid(overlay, selectedProvider);
    this._updateFormForProvider(overlay, selectedProvider);

    // Toggle key visibility
    overlay.querySelector('#ob-key-toggle').onclick = () => {
      const inp = overlay.querySelector('#ob-apikey');
      inp.type = inp.type === 'password' ? 'text' : 'password';
      overlay.querySelector('#ob-key-toggle').textContent = inp.type === 'password' ? '👁' : '🙈';
    };

    // Test connection
    overlay.querySelector('#ob-test-btn').onclick = async () => {
      const provider = overlay.querySelector('.ob-provider-btn.selected')?.dataset.provider || 'glm';
      const apiKey = overlay.querySelector('#ob-apikey').value.trim();
      const model = overlay.querySelector('#ob-model')?.value;
      const customURL = overlay.querySelector('#ob-custom-url')?.value?.trim();
      const customModel = overlay.querySelector('#ob-custom-model')?.value?.trim();
      if (!apiKey) { this._setStatus(overlay, t('onboard.no_key'), 'error'); return; }
      AIConfig.set({ provider, apiKey, model, customBaseURL: customURL || '', customModel: customModel || '' });
      this._setStatus(overlay, t('onboard.testing'), 'loading');
      const result = await AIConfig.testConnection();
      if (result.ok) {
        this._setStatus(overlay, `${t('onboard.success')}${result.preview ? '「' + result.preview + '」' : ''}`, 'success');
        overlay.querySelector('#ob-start-row').style.display = 'block';
        overlay.querySelector('#ob-start-btn').onclick = () => this._startGame(overlay);
      } else {
        this._setStatus(overlay, `❌ ${result.error}`, 'error');
      }
    };

    // Skip setup
    overlay.querySelector('#ob-skip-btn').onclick = () => {
      const provider = overlay.querySelector('.ob-provider-btn.selected')?.dataset.provider || 'glm';
      const apiKey = overlay.querySelector('#ob-apikey').value.trim();
      AIConfig.set({ provider, apiKey, model: overlay.querySelector('#ob-model')?.value || '' });
      this._startGame(overlay);
    };
  },

  _renderProviderGrid(overlay, selectedProvider) {
    const grid = overlay.querySelector('#ob-provider-grid');
    const providers = Object.entries(AI_PROVIDERS);
    grid.innerHTML = providers.map(([key, p]) => `
      <button class="ob-provider-btn ${key === selectedProvider ? 'selected' : ''}" data-provider="${key}"
        style="
          padding:10px 8px;border-radius:10px;border:2px solid ${key === selectedProvider ? '#007aff' : '#e5e5e5'};
          background:${key === selectedProvider ? 'rgba(0,122,255,0.06)' : '#fff'};
          cursor:pointer;text-align:center;font-family:inherit;transition:all 0.15s;
          color:${key === selectedProvider ? '#007aff' : '#333'};">
        <div style="font-size:11px;font-weight:${key === selectedProvider ? '700' : '500'};line-height:1.3;">${p.name}</div>
      </button>`).join('');

    grid.querySelectorAll('.ob-provider-btn').forEach(btn => {
      btn.onclick = () => {
        const provider = btn.dataset.provider;
        grid.querySelectorAll('.ob-provider-btn').forEach(b => {
          const isThis = b.dataset.provider === provider;
          b.style.borderColor = isThis ? '#007aff' : '#e5e5e5';
          b.style.background = isThis ? 'rgba(0,122,255,0.06)' : '#fff';
          b.style.color = isThis ? '#007aff' : '#333';
          b.querySelector('div').style.fontWeight = isThis ? '700' : '500';
          b.classList.toggle('selected', isThis);
        });
        this._updateFormForProvider(overlay, provider);
        // Reset status
        overlay.querySelector('#ob-status').textContent = '';
        overlay.querySelector('#ob-start-row').style.display = 'none';
      };
    });
  },

  _updateFormForProvider(overlay, provider) {
    const p = AI_PROVIDERS[provider];
    if (!p) return;
    const keyInput = overlay.querySelector('#ob-apikey');
    const keyHint = overlay.querySelector('#ob-key-hint');
    const modelSel = overlay.querySelector('#ob-model');
    const modelRow = overlay.querySelector('#ob-model-row');
    const customURLRow = overlay.querySelector('#ob-custom-url-row');

    keyInput.placeholder = p.keyPlaceholder || 'API Key';
    keyHint.textContent = p.keyHint || '';

    if (provider === 'custom') {
      modelRow.style.display = 'none';
      customURLRow.style.display = 'block';
    } else {
      customURLRow.style.display = 'none';
      if (p.models && p.models.length > 0) {
        modelRow.style.display = 'block';
        modelSel.innerHTML = p.models.map(m => `<option value="${m}">${m}</option>`).join('');
        modelSel.value = p.defaultModel;
      } else {
        modelRow.style.display = 'none';
      }
    }
  },

  _setStatus(overlay, msg, type) {
    const el = overlay.querySelector('#ob-status');
    const colors = { error: '#ff3b30', success: '#34c759', loading: '#007aff' };
    el.style.color = colors[type] || '#666';
    el.textContent = msg;
  },

  _startGame(overlay) {
    overlay.style.transition = 'opacity 0.4s ease';
    overlay.style.opacity = '0';
    setTimeout(() => {
      overlay.remove();
      this._showTerminationFlow();
    }, 400);
  },

  _showTerminationFlow() {
    const term = EVENT_TEMPLATES.week1.find(e => e.id === 'evt_termination');
    GameState.set('pendingEmails', [{ ...term, receivedDay: 1, read: false, requiresAck: true }]);

    setTimeout(() => {
      NotificationSystem.show('📧 Mail', t('notif.mail_new'), 0);
      setTimeout(() => {
        DockManager.launchApp('mail');
        NotificationSystem.show('💼', '查看你的邮件收件箱', 4000);
      }, 1000);
    }, 500);
  }
};

// ===== Init =====
function init() {
  const isNew = GameState.init();
  AIConfig.init();
  NPC_REGISTRY.init();
  WindowManager.init();
  DockManager.init();
  MenuBarManager.init();
  GameClock.init();
  WeekCycleEngine.init();
  AIEventEngine.init();
  Spotlight.init();

  // Check overdue promises each day
  EventBus.on('clock:day', () => {
    if (typeof TodoApp !== 'undefined') TodoApp.checkOverduePromises();
  });
  ContextMenu.init();
  Battery.init();

  // Keyboard shortcuts
  document.addEventListener('keydown', e => {
    if ((e.metaKey || e.ctrlKey) && e.key === 's') {
      e.preventDefault();
      GameState.persist();
      NotificationSystem.show(t('notif.system'), t('notif.saved'), 2000);
    }
    if ((e.metaKey || e.ctrlKey) && e.key === ',') {
      e.preventDefault();
      DockManager.launchApp('settings');
    }
  });

  if (isNew) {
    setTimeout(() => Onboarding.start(), 500);
  } else {
    const day = GameState.get('day') || 1;
    const dayEl = document.getElementById('game-week');
    if (dayEl) dayEl.textContent = getLang() === 'en' ? `Day ${day}` : `第 ${day} 天`;
    setTimeout(() => {
      const emails = GameState.get('pendingEmails') || [];
      const unread = emails.filter(e => !e.read).length;
      const msg = unread > 0
        ? (getLang() === 'en' ? `Welcome back! Day ${day} — you have ${unread} unread email(s).` : `欢迎回来！第 ${day} 天，有 ${unread} 封未读邮件。`)
        : (getLang() === 'en' ? `Welcome back! You're on Day ${day}.` : `欢迎回来！当前是第 ${day} 天。`);
      NotificationSystem.show('👋', msg, 3000);
    }, 500);
  }

  // Deep night achievement
  const hour = new Date().getHours();
  if (hour >= 0 && hour < 5) {
    setTimeout(() => {
      const achievements = GameState.get('achievements');
      if (!achievements.includes('late_night_coder')) {
        achievements.push('late_night_coder');
        GameState.set('achievements', achievements);
        NotificationSystem.show(t('notif.achievement'), t('ach.late_night_coder'), 5000);
      }
    }, 2000);
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
