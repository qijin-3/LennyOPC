'use strict';

// ===== EventBus =====
const EventBus = {
  _listeners: {},
  on(event, fn) { (this._listeners[event] ||= []).push(fn); },
  off(event, fn) {
    if (!this._listeners[event]) return;
    this._listeners[event] = this._listeners[event].filter(f => f !== fn);
  },
  emit(event, data) { (this._listeners[event] || []).forEach(fn => fn(data)); }
};

// ===== SaveSystem =====
const SaveSystem = {
  PREFIX: 'opc_',
  save(key, data) {
    try { localStorage.setItem(this.PREFIX + key, JSON.stringify(data)); }
    catch (e) { console.warn('Save failed:', e); }
  },
  load(key) {
    try {
      const d = localStorage.getItem(this.PREFIX + key);
      return d ? JSON.parse(d) : null;
    } catch (e) { return null; }
  },
  remove(key) { localStorage.removeItem(this.PREFIX + key); },
  clear() {
    Object.keys(localStorage).filter(k => k.startsWith(this.PREFIX)).forEach(k => localStorage.removeItem(k));
  }
};

// ===== GameState =====
const DEFAULT_STATE = {
  cash: 47200,
  reputation: 10,
  network: 5,
  communityContribution: 0,
  day: 1,                // game day counter (replaces week/phase)
  playerName: null,
  playerProfile: { direction: null, actions: [], milestones: [] },
  opc_goals: null,       // set during onboarding: { direction, targetAudience, goal, milestones[] }
  npcMemory: {},
  discoveredExperts: {},
  addedContacts: [],
  insightFragments: 0,
  publishedContent: [],
  pendingEmails: [],
  milestones: {
    terminationAcknowledged: false,
    onboardingComplete: false,
    firstIncome: false,
    firstPaidClient: false,
  },
  vcOffersDeclined: 0,
  achievements: [],
  unlockedApps: ['mail', 'imessage', 'todo', 'settings'],
  pendingIMessages: [],
  gameStartedAt: null,
  listenedEpisodes: [],
  recentActivity: []
};

const GameState = {
  _state: null,
  init() {
    const saved = SaveSystem.load('gamestate');
    if (saved) { this._state = { ...DEFAULT_STATE, ...saved }; }
    else { this._state = { ...DEFAULT_STATE, gameStartedAt: Date.now() }; this.persist(); }
    return !saved;
  },
  get(key) { return this._state[key]; },
  set(key, val) {
    this._state[key] = val;
    this.persist();
    EventBus.emit('state:changed', { key, value: val });
  },
  getAll() { return { ...this._state }; },
  persist() { SaveSystem.save('gamestate', this._state); },
  reset() {
    this._state = { ...DEFAULT_STATE, gameStartedAt: Date.now() };
    SaveSystem.save('gamestate', this._state);
    EventBus.emit('state:reset');
  }
};

// ===== AI Config =====
// protocol: 'claude' uses Anthropic Messages API; 'openai_compat' uses OpenAI-compatible chat/completions; 'gemini' uses Google REST API
const AI_PROVIDERS = {
  claude: {
    name: 'Claude (Anthropic)',
    protocol: 'claude',
    baseURL: 'https://api.anthropic.com/v1/messages',
    models: ['claude-sonnet-4-20250514', 'claude-3-5-haiku-20241022', 'claude-3-haiku-20240307'],
    defaultModel: 'claude-3-5-haiku-20241022',
    keyPlaceholder: 'sk-ant-...',
    keyHint: '从 console.anthropic.com 获取'
  },
  openai: {
    name: 'OpenAI',
    protocol: 'openai_compat',
    baseURL: 'https://api.openai.com/v1/chat/completions',
    models: ['gpt-4o-mini', 'gpt-4o', 'gpt-4-turbo', 'gpt-3.5-turbo'],
    defaultModel: 'gpt-4o-mini',
    keyPlaceholder: 'sk-...',
    keyHint: '从 platform.openai.com 获取'
  },
  gemini: {
    name: 'Google Gemini',
    protocol: 'gemini',
    baseURL: 'https://generativelanguage.googleapis.com/v1beta/models',
    models: ['gemini-2.0-flash', 'gemini-1.5-flash', 'gemini-1.5-pro'],
    defaultModel: 'gemini-2.0-flash',
    keyPlaceholder: 'AIza...',
    keyHint: '从 aistudio.google.com 获取'
  },
  glm: {
    name: '智谱 GLM (ChatGLM)',
    protocol: 'openai_compat',
    baseURL: 'https://open.bigmodel.cn/api/paas/v4/chat/completions',
    models: ['glm-4-flash', 'glm-4', 'glm-4-air', 'glm-3-turbo'],
    defaultModel: 'glm-4-flash',
    keyPlaceholder: '智谱 API Key',
    keyHint: '从 open.bigmodel.cn 获取，glm-4-flash 免费'
  },
  kimi: {
    name: 'Kimi (月之暗面)',
    protocol: 'openai_compat',
    baseURL: 'https://api.moonshot.cn/v1/chat/completions',
    models: ['moonshot-v1-8k', 'moonshot-v1-32k', 'moonshot-v1-128k'],
    defaultModel: 'moonshot-v1-8k',
    keyPlaceholder: 'sk-...',
    keyHint: '从 platform.moonshot.cn 获取'
  },
  minimax: {
    name: 'MiniMax (海螺)',
    protocol: 'openai_compat',
    baseURL: 'https://api.minimax.chat/v1/text/chatcompletion_v2',
    models: ['abab6.5s-chat', 'abab6.5-chat', 'abab5.5-chat'],
    defaultModel: 'abab6.5s-chat',
    keyPlaceholder: 'MiniMax API Key',
    keyHint: '从 api.minimax.chat 获取'
  },
  deepseek: {
    name: 'DeepSeek',
    protocol: 'openai_compat',
    baseURL: 'https://api.deepseek.com/v1/chat/completions',
    models: ['deepseek-chat', 'deepseek-reasoner'],
    defaultModel: 'deepseek-chat',
    keyPlaceholder: 'sk-...',
    keyHint: '从 platform.deepseek.com 获取'
  },
  qwen: {
    name: '通义千问 (Qwen)',
    protocol: 'openai_compat',
    baseURL: 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions',
    models: ['qwen-turbo', 'qwen-plus', 'qwen-max', 'qwen-long'],
    defaultModel: 'qwen-turbo',
    keyPlaceholder: 'sk-...',
    keyHint: '从 dashscope.aliyuncs.com 获取'
  },
  custom: {
    name: '自定义兼容接口',
    protocol: 'openai_compat',
    baseURL: '',
    models: [],
    defaultModel: '',
    keyPlaceholder: 'API Key',
    keyHint: '支持所有 OpenAI 兼容接口（如 One API、LiteLLM 等）'
  }
};

const AIConfig = {
  _config: null,
  init() {
    this._config = SaveSystem.load('ai_config') || {
      provider: 'glm', apiKey: '', model: AI_PROVIDERS.glm.defaultModel, customBaseURL: '', customModel: ''
    };
    // migrate old configs that didn't have customBaseURL
    if (!('customBaseURL' in this._config)) this._config.customBaseURL = '';
    if (!('customModel' in this._config)) this._config.customModel = '';
  },
  get() { return { ...this._config }; },
  set(cfg) { this._config = { ...this._config, ...cfg }; SaveSystem.save('ai_config', this._config); },
  hasKey() { return !!(this._config && this._config.apiKey); },

  _getEndpoint() {
    const { provider, customBaseURL } = this._config;
    const p = AI_PROVIDERS[provider];
    if (!p) return null;
    if (provider === 'custom') return customBaseURL || null;
    return p.baseURL;
  },

  _getModel() {
    const { provider, model, customModel } = this._config;
    if (provider === 'custom') return customModel || model;
    return model;
  },

  async chat(systemPrompt, messages, opts = {}) {
    const { provider, apiKey } = this._config;
    if (!apiKey) return null;
    const p = AI_PROVIDERS[provider];
    if (!p) return null;
    const endpoint = this._getEndpoint();
    const model = this._getModel();
    if (!endpoint || !model) return null;

    try {
      if (p.protocol === 'claude') {
        const res = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': apiKey,
            'anthropic-version': '2023-06-01',
            'anthropic-dangerous-direct-browser-access': 'true'
          },
          body: JSON.stringify({ model, max_tokens: opts.maxTokens || 400, system: systemPrompt, messages })
        });
        if (!res.ok) { console.error('Claude error', res.status); return null; }
        const d = await res.json();
        return d.content?.[0]?.text || null;

      } else if (p.protocol === 'openai_compat') {
        const res = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
          body: JSON.stringify({
            model,
            max_tokens: opts.maxTokens || 400,
            messages: [{ role: 'system', content: systemPrompt }, ...messages]
          })
        });
        if (!res.ok) { console.error('OpenAI-compat error', res.status, await res.text()); return null; }
        const d = await res.json();
        return d.choices?.[0]?.message?.content || null;

      } else if (p.protocol === 'gemini') {
        const contents = messages.map(m => ({ role: m.role === 'assistant' ? 'model' : 'user', parts: [{ text: m.content }] }));
        contents.unshift({ role: 'user', parts: [{ text: systemPrompt }] });
        contents.splice(1, 0, { role: 'model', parts: [{ text: '好的，我明白了。' }] });
        const res = await fetch(`${endpoint}/${model}:generateContent?key=${apiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contents, generationConfig: { maxOutputTokens: opts.maxTokens || 400 } })
        });
        if (!res.ok) { console.error('Gemini error', res.status); return null; }
        const d = await res.json();
        return d.candidates?.[0]?.content?.parts?.[0]?.text || null;
      }
    } catch (e) { console.error('AI chat error:', e); return null; }
    return null;
  },

  async testConnection() {
    if (!this._config.apiKey) return { ok: false, error: '请输入 API Key' };
    const endpoint = this._getEndpoint();
    const model = this._getModel();
    if (!endpoint) return { ok: false, error: '请输入接口地址' };
    if (!model) return { ok: false, error: '请输入模型名称' };
    try {
      const result = await this.chat('你是一个助手', [{ role: 'user', content: '你好，请用一句话介绍自己。' }], { maxTokens: 64 });
      if (result) return { ok: true, preview: result.slice(0, 60) };
      return { ok: false, error: '收到空响应，请检查 Key 和模型名称' };
    } catch (e) { return { ok: false, error: e.message }; }
  }
};
