'use strict';

const GAME_KEYWORDS = {
  'PMF': ['lenny_rachitsky', 'jason_fried'],
  'product market fit': ['lenny_rachitsky'],
  'SaaS': ['patrick_campbell', 'lenny_rachitsky'],
  '定价': ['patrick_campbell', 'april_dunford'],
  'pricing': ['patrick_campbell', 'april_dunford'],
  '增长': ['lenny_rachitsky', 'elena_verna'],
  'growth': ['lenny_rachitsky', 'elena_verna', 'brian_balfour'],
  'PLG': ['elena_verna'],
  '产品驱动': ['elena_verna'],
  '留存': ['patrick_campbell', 'brian_balfour'],
  'retention': ['patrick_campbell', 'brian_balfour'],
  '创业': ['jason_fried', 'patrick_campbell'],
  'startup': ['jason_fried', 'andrew_wilkinson'],
  'bootstrap': ['jason_fried', 'patrick_campbell', 'andrew_wilkinson'],
  '融资': ['jason_fried'],
  '定位': ['april_dunford'],
  'positioning': ['april_dunford'],
  '产品': ['shreyas_doshi', 'lenny_rachitsky'],
  'product': ['shreyas_doshi', 'lenny_rachitsky'],
  '策略': ['shreyas_doshi'],
  'strategy': ['shreyas_doshi'],
  '发布': ['ryan_hoover'],
  'launch': ['ryan_hoover'],
  '社区': ['ryan_hoover'],
  'community': ['ryan_hoover'],
  '设计': ['julie_zhuo'],
  'design': ['julie_zhuo'],
  '分发': ['brian_balfour'],
  'distribution': ['brian_balfour'],
  'OPC': ['lenny_rachitsky', 'jason_fried'],
  '一人公司': ['jason_fried', 'andrew_wilkinson'],
  '商业模式': ['andrew_wilkinson', 'jason_fried'],
  'business model': ['andrew_wilkinson'],
};

const SafariApp = {
  _history: [],
  _currentQuery: '',
  _loading: false,

  render(container) {
    container.innerHTML = `
      <div class="safari-layout">
        <div class="safari-toolbar">
          <button class="safari-nav-btn" id="safari-back" disabled>‹</button>
          <button class="safari-nav-btn" id="safari-forward" disabled>›</button>
          <input type="text" class="safari-url-bar" id="safari-url" placeholder="${t('safari.placeholder')}" value="">
          <button class="safari-nav-btn" id="safari-refresh">↻</button>
        </div>
        <div class="safari-content" id="safari-content"></div>
      </div>`;

    this._renderHomepage(container);

    const urlBar = container.querySelector('#safari-url');
    urlBar.onkeydown = e => { if (e.key === 'Enter') this._navigate(container, urlBar.value.trim()); };
    container.querySelector('#safari-back').onclick = () => {
      if (this._history.length > 1) { this._history.pop(); this._navigate(container, this._history[this._history.length - 1], true); }
    };
    container.querySelector('#safari-refresh').onclick = () => {
      if (this._currentQuery) this._navigate(container, this._currentQuery);
      else this._renderHomepage(container);
    };
  },

  _renderHomepage(container) {
    const content = container.querySelector('#safari-content');
    content.innerHTML = `
      <div class="safari-homepage">
        <div class="safari-homepage-logo">🌐</div>
        <div style="font-size:20px;font-weight:600;color:var(--text-primary);">Safari</div>
        <div class="safari-homepage-search">
          <input type="text" class="safari-homepage-input" id="safari-hp-input" placeholder="${t('safari.search_placeholder')}">
          <button class="safari-homepage-btn" id="safari-hp-btn">${t('safari.search_btn')}</button>
        </div>
        <div style="margin-top:14px;font-size:12px;color:var(--text-secondary);text-align:center;">${t('safari.search_hint')}</div>
        <div style="margin-top:20px;display:flex;flex-wrap:wrap;gap:8px;justify-content:center;">
          ${['PMF', 'bootstrap', 'PLG', '定价', '一人公司', 'distribution'].map(kw =>
            `<span onclick="document.getElementById('safari-hp-input').value='${kw}';document.getElementById('safari-hp-btn').click()"
              style="padding:5px 12px;background:rgba(0,122,255,0.08);color:var(--accent);border-radius:20px;font-size:12px;cursor:pointer;border:1px solid rgba(0,122,255,0.15);">${kw}</span>`
          ).join('')}
        </div>
      </div>`;
    const doSearch = () => {
      const q = content.querySelector('#safari-hp-input')?.value?.trim();
      if (!q) return;
      this._navigate(container, q);
    };
    content.querySelector('#safari-hp-btn').onclick = doSearch;
    content.querySelector('#safari-hp-input').onkeydown = e => { if (e.key === 'Enter') doSearch(); };
    setTimeout(() => content.querySelector('#safari-hp-input')?.focus(), 50);
  },

  _navigate(container, query, isBack = false) {
    if (!query) return;
    const qLower = query.toLowerCase();

    // All named routes bypass loading guard and reset it
    const isNamedRoute = qLower.includes('lenny') || qLower.includes('x.com') || qLower.includes('twitter.com');
    if (isNamedRoute) this._loading = false;
    if (this._loading) return;

    this._currentQuery = query;
    this._container = container; // keep reference for global callbacks
    container.querySelector('#safari-url').value = query;
    if (!isBack) this._history.push(query);
    container.querySelector('#safari-back').disabled = this._history.length <= 1;

    ActivityLogger.log('search', { query: query.slice(0, 40) });
    GameState.set('insightFragments', (GameState.get('insightFragments') || 0) + 1);

    // Lenny profile page
    if (qLower.includes('lenny')) {
      this._renderLennyProfile(container);
      return;
    }
    // Virtual X DM interface
    if (qLower.includes('x.com') || qLower.includes('twitter.com')) {
      this._renderXDMFlow(container);
      return;
    }

    this._renderSearchResults(container, query);
  },

  // Global callback — called from onclick in rendered HTML
  _goToXDM() {
    // Find the safari window body by locating #safari-content and walking up
    const safariContent = document.getElementById('safari-content');
    if (!safariContent) return;
    // container is the .window-body that holds .safari-layout
    const container = safariContent.closest('.window-body') || safariContent.parentElement?.parentElement;
    if (!container) return;
    this._renderXDMFlow(container);
    // Also update the URL bar
    const urlBar = container.querySelector('#safari-url');
    if (urlBar) urlBar.value = 'x.com/lennysrachitsky';
  },

  // ── Lenny Profile Page ──────────────────────────────────────────────────────
  _renderLennyProfile(container) {
    const content = container.querySelector('#safari-content');
    const already = (GameState.get('addedContacts') || []).includes('lenny_rachitsky');
    const discovered = (GameState.get('discoveredExperts') || {})['lenny_rachitsky'];
    const lang = getLang();

    content.innerHTML = `
      <div style="max-width:640px;margin:0 auto;padding:24px 20px;">
        <!-- Browser bar hint -->
        <div style="font-size:11px;color:var(--text-secondary);margin-bottom:16px;font-family:monospace;">
          lennysnewsletter.com/about
        </div>
        <!-- Profile card -->
        <div style="background:#fff;border-radius:16px;border:1px solid var(--border);overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.06);margin-bottom:20px;">
          <div style="height:80px;background:linear-gradient(135deg,#1a1a2e,#007aff);"></div>
          <div style="padding:0 20px 20px;position:relative;">
            <div style="width:72px;height:72px;border-radius:50%;background:rgba(255,255,255,0.1);border:4px solid #fff;
                        display:flex;align-items:center;justify-content:center;font-size:36px;
                        margin-top:-36px;margin-bottom:10px;box-shadow:0 2px 8px rgba(0,0,0,0.15);">🎙️</div>
            <div style="font-size:20px;font-weight:700;margin-bottom:2px;">Lenny Rachitsky</div>
            <div style="font-size:13px;color:var(--text-secondary);margin-bottom:10px;">
              ${lang === 'en' ? 'Former PM at Airbnb · Podcast & Newsletter creator' : '前 Airbnb 产品经理 · 播客和 Newsletter 创始人'}
            </div>
            <div style="font-size:13px;line-height:1.7;color:var(--text-primary);margin-bottom:14px;">
              ${lang === 'en'
                ? 'Lenny\'s Newsletter and Podcast reach 700,000+ subscribers weekly, covering product management, growth, and career advice for builders.'
                : 'Lenny 的 Newsletter 和播客每周覆盖 70 万+订阅者，专注于产品、增长和职业发展。'}
            </div>
            <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:16px;">
              ${['PMF','growth','product','career','B2B','B2C'].map(tag =>
                `<span style="font-size:11px;background:rgba(0,122,255,0.08);color:var(--accent);padding:3px 8px;border-radius:10px;">${tag}</span>`
              ).join('')}
            </div>
            <!-- Social links -->
            <div style="border-top:1px solid var(--border);padding-top:14px;">
              <div style="font-size:12px;font-weight:600;color:var(--text-secondary);margin-bottom:8px;">
                ${lang === 'en' ? 'Find Lenny online' : '在网上找到 Lenny'}
              </div>
              <div style="display:flex;gap:8px;flex-wrap:wrap;">
                <a href="https://www.lennysnewsletter.com" target="_blank" rel="noopener"
                   style="padding:6px 14px;background:rgba(0,0,0,0.06);border-radius:8px;font-size:13px;text-decoration:none;color:var(--text-primary);">
                  📰 Newsletter
                </a>
                <button onclick="SafariApp._goToXDM()"
                  style="padding:6px 14px;background:#000;color:#fff;border:none;border-radius:8px;font-size:13px;cursor:pointer;font-family:var(--font-system);">
                  𝕏 @lennysnewsletter
                </button>
                <a href="https://www.youtube.com/@LennysNewsletterPodcast" target="_blank" rel="noopener"
                   style="padding:6px 14px;background:#ff0000;color:#fff;border-radius:8px;font-size:13px;text-decoration:none;">
                  ▶ YouTube
                </a>
              </div>
            </div>
          </div>
        </div>

        <!-- Hint card -->
        ${!already ? `
        <div style="background:rgba(0,122,255,0.05);border:1px solid rgba(0,122,255,0.15);border-radius:12px;padding:14px 16px;">
          <div style="font-size:13px;font-weight:600;color:var(--accent);margin-bottom:6px;">
            💡 ${lang === 'en' ? 'How to reach Lenny' : '如何联系到 Lenny'}
          </div>
          <div style="font-size:13px;color:var(--text-primary);line-height:1.6;">
            ${lang === 'en'
              ? 'Lenny is pretty accessible on X. Many indie builders have connected with him by sending a thoughtful DM mentioning their OPC journey. Worth a shot!'
              : 'Lenny 在 X 上相当活跃，很多独立创业者都通过发一条有诚意的私信和他建立了联系。说说你的 OPC 旅程，值得一试！'}
          </div>
          <button onclick="SafariApp._goToXDM()" style="margin-top:10px;padding:8px 16px;background:var(--accent);color:#fff;border:none;border-radius:8px;font-size:13px;font-weight:600;cursor:pointer;font-family:var(--font-system);">
            ${lang === 'en' ? '→ Open X to DM Lenny' : '→ 打开 X，给 Lenny 发私信'}
          </button>
        </div>` : `
        <div style="background:rgba(52,199,89,0.05);border:1px solid rgba(52,199,89,0.2);border-radius:12px;padding:14px 16px;text-align:center;">
          <div style="font-size:20px;margin-bottom:6px;">✅</div>
          <div style="font-size:13px;color:#1a7a3f;font-weight:600;">
            ${lang === 'en' ? 'Lenny is already in your contacts' : 'Lenny 已在你的联系人中'}
          </div>
        </div>`}
      </div>`;

  },

  // ── X DM simulation ─────────────────────────────────────────────────────────
  _renderXDMFlow(container) {
    const content = container.querySelector('#safari-content');
    const lang = getLang();
    const already = (GameState.get('addedContacts') || []).includes('lenny_rachitsky');
    const playerName = GameState.get('playerName') || (lang === 'en' ? 'Founder' : '创业者');

    content.innerHTML = `
      <div style="max-width:540px;margin:0 auto;padding:24px 20px;">
        <div style="font-size:11px;color:var(--text-secondary);margin-bottom:16px;font-family:monospace;">x.com/lennysrachitsky</div>
        <!-- X header -->
        <div style="background:#000;border-radius:12px 12px 0 0;padding:14px 16px;display:flex;align-items:center;gap:12px;">
          <div style="width:44px;height:44px;border-radius:50%;background:#333;display:flex;align-items:center;justify-content:center;font-size:22px;">🎙️</div>
          <div>
            <div style="color:#fff;font-size:14px;font-weight:700;">Lenny Rachitsky</div>
            <div style="color:rgba(255,255,255,0.5);font-size:12px;">@lennysnewsletter</div>
          </div>
          <div style="margin-left:auto;font-size:20px;color:#fff;">𝕏</div>
        </div>
        <!-- DM thread -->
        <div style="background:#0f0f0f;border:1px solid #222;border-top:none;padding:16px;min-height:200px;" id="x-dm-thread">
          ${already
            ? `<div style="text-align:center;color:rgba(255,255,255,0.4);font-size:13px;padding:20px 0;">
                ${lang === 'en' ? 'You already have Lenny\'s Telegram contact.' : '你已经有 Lenny 的 Telegram 联系方式了。'}
               </div>`
            : `<div style="text-align:center;color:rgba(255,255,255,0.4);font-size:12px;margin-bottom:16px;">
                ${lang === 'en' ? 'DM with Lenny Rachitsky' : '与 Lenny Rachitsky 的私信'}
               </div>
               <div style="text-align:center;color:rgba(255,255,255,0.3);font-size:12px;padding:16px 0;">
                ${lang === 'en' ? 'Start the conversation...' : '开始对话...'}
               </div>`
          }
        </div>
        <!-- DM input -->
        ${!already ? `
        <div style="background:#0f0f0f;border:1px solid #222;border-top:1px solid #333;border-radius:0 0 12px 12px;padding:12px;">
          <div style="display:flex;gap:8px;align-items:flex-end;">
            <textarea id="x-dm-input" placeholder="${lang === 'en' ? 'Start a new message' : '发送私信...'}" rows="3"
              style="flex:1;background:#1a1a1a;border:1px solid #333;border-radius:8px;padding:8px 10px;color:#fff;font-size:13px;font-family:var(--font-system);outline:none;resize:none;line-height:1.5;">
${lang === 'en'
  ? `Hi Lenny, I'm ${playerName}. I was recently laid off and I'm building my own one-person company. I've been following your newsletter and podcast for a while. Would love to get some advice on PMF for my project. Any chance we could connect?`
  : `Hi Lenny，我是${playerName}，最近刚被裁员，在尝试建立一人公司。你的 Newsletter 和播客对我帮助很大，能加个联系方式互相认识一下吗？`}</textarea>
            <button id="x-send-dm-btn" onclick="SafariApp._sendXDM()"
              style="padding:10px 16px;background:#007aff;color:#fff;border:none;border-radius:8px;font-size:13px;font-weight:600;cursor:pointer;font-family:var(--font-system);flex-shrink:0;">
              ${lang === 'en' ? 'Send' : '发送'}
            </button>
          </div>
        </div>` : ''}
      </div>`;
  },

  // Global send callback
  _sendXDM() {
    const content = document.getElementById('safari-content');
    if (!content) return;
    const container = content.closest('.window-body') || content.parentElement?.parentElement;
    const lang = getLang();
    const playerName = GameState.get('playerName') || (lang === 'en' ? 'Founder' : '创业者');
    this._simulateXDMExchange(content, lang, playerName, container);
  },

  // Global add-lenny callback
  _addLennyContact(btn) {
    const lang = getLang();
    const added = GameState.get('addedContacts') || [];
    if (added.includes('lenny_rachitsky')) return;
    added.push('lenny_rachitsky');
    GameState.set('addedContacts', added);
    if (added.length === 1) DockManager.unlock('contacts');
    MemoryManager.increaseTrust('lenny_rachitsky', 20);
    ActivityLogger.log('discover_expert', { expertId: 'lenny_rachitsky', channel: 'x_dm' });
    NotificationSystem.show('✅ Telegram', lang === 'en' ? 'Lenny Rachitsky added to contacts!' : 'Lenny Rachitsky 已添加到联系人！', 4000);

    TodoApp.addTodo({
      title: lang === 'en' ? "Open Telegram and start talking with Lenny about your OPC direction" : '打开 Telegram，和 Lenny 聊聊你的 OPC 方向',
      source: 'system',
      priority: 'high',
      npcId: 'lenny_rachitsky',
      dueDay: (GameState.get('day') || 1) + 3
    });
    EventBus.emit('expert:added', { expertId: 'lenny_rachitsky' });
    if (btn) {
      btn.textContent = lang === 'en' ? '✓ Added to Telegram!' : '✓ 已添加到联系人！';
      btn.style.background = 'rgba(52,199,89,0.2)';
      btn.style.color = '#1a7a3f';
      btn.style.border = '1px solid rgba(52,199,89,0.4)';
      btn.disabled = true;
    }
  },

  _simulateXDMExchange(content, lang, playerName, container) {
    const sendBtn = content.querySelector('#x-send-dm-btn');
    const input = content.querySelector('#x-dm-input');
    const thread = content.querySelector('#x-dm-thread');
    if (!thread) return;

    const userMsg = input?.value?.trim() || '';
    if (sendBtn) { sendBtn.disabled = true; sendBtn.textContent = lang === 'en' ? 'Sending...' : '发送中...'; }

    // Show user message
    thread.innerHTML = `
      <div style="text-align:center;color:rgba(255,255,255,0.3);font-size:12px;margin-bottom:16px;">
        ${lang === 'en' ? 'DM with Lenny Rachitsky' : '与 Lenny Rachitsky 的私信'}
      </div>
      <div style="display:flex;justify-content:flex-end;margin-bottom:12px;">
        <div style="max-width:75%;background:#007aff;color:#fff;border-radius:16px 16px 4px 16px;padding:10px 14px;font-size:13px;line-height:1.5;">
          ${userMsg}
        </div>
      </div>
      <div style="text-align:center;color:rgba(255,255,255,0.3);font-size:11px;margin:8px 0;">
        <span id="x-typing-indicator">${lang === 'en' ? 'Lenny is typing...' : 'Lenny 正在输入...'}</span>
      </div>`;

    // Lenny's reply after delay
    setTimeout(() => {
      const tgHandle = '@lenny_r_podcast';
      const replyMsg = lang === 'en'
        ? `Hey ${playerName}! Love that you're on this journey. Building a one-person company is one of the most rewarding things you can do. I'd love to chat more — add me on Telegram: ${tgHandle}\n\nAlso check out my podcast if you haven't — lots of founder stories that might help.`
        : `嘿 ${playerName}！很高兴你在走这条路。一人公司是我最佩服的创业方式之一，保持自主权、专注做好一件事。\n\n我在 Telegram 上更活跃，加我吧：${tgHandle}\n\n也推荐你听听我的播客，里面有很多创始人的真实经历。`;

      thread.querySelector('#x-typing-indicator')?.remove();
      thread.insertAdjacentHTML('beforeend', `
        <div style="display:flex;justify-content:flex-start;gap:8px;margin-bottom:12px;">
          <div style="width:32px;height:32px;border-radius:50%;background:#333;display:flex;align-items:center;justify-content:center;font-size:16px;flex-shrink:0;">🎙️</div>
          <div style="max-width:75%;background:#1a1a1a;color:#fff;border-radius:4px 16px 16px 16px;padding:10px 14px;font-size:13px;line-height:1.6;white-space:pre-wrap;">${replyMsg}</div>
        </div>
        <div style="margin-top:16px;text-align:center;">
          <button id="x-add-lenny-btn"
            style="padding:10px 20px;background:linear-gradient(135deg,#007aff,#5856d6);color:#fff;border:none;border-radius:20px;font-size:14px;font-weight:700;cursor:pointer;font-family:var(--font-system);box-shadow:0 4px 16px rgba(0,122,255,0.35);">
            + ${lang === 'en' ? 'Add Lenny on Telegram' : '添加 Lenny 到 Telegram'}
          </button>
        </div>`);

      // Mark lenny as discovered via safari
      const discovered = GameState.get('discoveredExperts') || {};
      if (!discovered['lenny_rachitsky']) {
        discovered['lenny_rachitsky'] = { discoveredAt: GameState.get('week'), channel: 'safari', trustBonus: 5 };
        GameState.set('discoveredExperts', discovered);
      }

      thread.querySelector('#x-add-lenny-btn')?.addEventListener('click', (e) => {
        SafariApp._addLennyContact(e.currentTarget);
      });

      if (sendBtn) { sendBtn.textContent = lang === 'en' ? 'Sent ✓' : '已发送 ✓'; }
    }, 2000);
  },

  async _renderSearchResults(container, query) {
    const content = container.querySelector('#safari-content');
    this._loading = true;

    // Show loading state immediately
    content.innerHTML = `
      <div style="padding:20px 16px;">
        <div style="font-size:13px;color:var(--text-secondary);margin-bottom:16px;">${t('safari.loading')}</div>
        ${[1,2,3].map(() => `
          <div style="margin-bottom:20px;">
            <div style="height:12px;background:rgba(0,0,0,0.06);border-radius:4px;width:60%;margin-bottom:6px;"></div>
            <div style="height:16px;background:rgba(0,122,255,0.08);border-radius:4px;width:80%;margin-bottom:6px;"></div>
            <div style="height:10px;background:rgba(0,0,0,0.04);border-radius:4px;width:90%;"></div>
          </div>`).join('')}
      </div>`;

    // Detect game keywords
    const queryLower = query.toLowerCase();
    let matchedExpertIds = [];
    for (const [kw, ids] of Object.entries(GAME_KEYWORDS)) {
      if (queryLower.includes(kw.toLowerCase())) {
        matchedExpertIds = [...new Set([...matchedExpertIds, ...ids])];
      }
    }
    const matchedExperts = EXPERTS.filter(e => matchedExpertIds.includes(e.id));

    // Fetch real search results via DuckDuckGo
    let webResults = [];
    try {
      const res = await fetch(
        `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_redirect=1&no_html=1&skip_disambig=1`,
        { signal: AbortSignal.timeout(6000) }
      );
      if (res.ok) {
        const data = await res.json();
        const topics = (data.RelatedTopics || []).filter(item => item.Text && item.FirstURL).slice(0, 6);
        webResults = topics.map(item => ({
          title: item.Text.split(' - ')[0] || item.Text.slice(0, 60),
          url: item.FirstURL,
          snippet: item.Text,
          real: true
        }));
        if (data.AbstractText && data.AbstractURL) {
          webResults.unshift({
            title: data.Heading || query,
            url: data.AbstractURL,
            snippet: data.AbstractText.slice(0, 200),
            real: true,
            featured: true
          });
        }
      }
    } catch (e) {
      // Network error or timeout — use generated results only
    } finally {
      this._loading = false;
    }

    // If real results are sparse, supplement with plausible generated ones
    const totalNeeded = 5;
    if (webResults.length < totalNeeded) {
      const supplement = [
        { title: `${query} — Complete Guide 2026`, url: `https://www.ycombinator.com/library/${encodeURIComponent(query.replace(/\s/g, '-'))}`, snippet: `Y Combinator's perspective on ${query}. Practical frameworks and case studies for early-stage founders.`, real: false },
        { title: `How to think about ${query} — Lenny's Newsletter`, url: `https://www.lennysnewsletter.com/p/${encodeURIComponent(query.replace(/\s/g, '-'))}`, snippet: `Lenny Rachitsky breaks down ${query} with data from 200+ companies. Key frameworks and metrics to track.`, real: false },
        { title: `${query} for Solo Founders — IndieHackers`, url: `https://www.indiehackers.com/post/${encodeURIComponent(query.replace(/\s/g, '-'))}`, snippet: `Community discussion on ${query}. Real stories from bootstrapped founders who've navigated this challenge.`, real: false },
        { title: `The ${query} Playbook — First Round Review`, url: `https://review.firstround.com/the-${encodeURIComponent(query.replace(/\s/g, '-'))}-playbook/`, snippet: `First Round Capital's in-depth guide to ${query}. Interviews with founders who've done it successfully.`, real: false },
        { title: `${query} metrics benchmark 2026 — SaaStr`, url: `https://www.saastr.com/${encodeURIComponent(query.replace(/\s/g, '-'))}`, snippet: `Updated benchmarks and best practices for ${query} from SaaStr's annual survey of 1000+ SaaS companies.`, real: false },
      ];
      webResults = [...webResults, ...supplement.slice(0, totalNeeded - webResults.length)];
    }

    const discovered = GameState.get('discoveredExperts') || {};
    const resultCount = Math.floor(Math.random() * 8000) + 2000;
    const queryTime = (Math.random() * 0.4 + 0.1).toFixed(2);

    content.innerHTML = `
      <div class="safari-search-results">
        <div class="safari-result-count">${t('safari.results_count', { n: resultCount.toLocaleString(), t: queryTime })}</div>

        ${matchedExperts.length > 0 ? `
          <div style="margin-bottom:20px;padding:14px 16px;background:linear-gradient(135deg,rgba(0,122,255,0.04),rgba(88,86,214,0.04));border:1px solid rgba(0,122,255,0.12);border-radius:12px;">
            <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;color:var(--text-secondary);margin-bottom:12px;">✨ ${t('safari.related_experts')}</div>
            ${matchedExperts.map(e => this._renderExpertCard(e, discovered)).join('')}
          </div>` : ''}

        ${webResults.map(r => `
          <div class="safari-result-item" style="${r.featured ? 'border-left:3px solid var(--accent);padding-left:12px;' : ''}">
            <div style="display:flex;align-items:center;gap:6px;margin-bottom:3px;">
              <div class="safari-result-url">${this._cleanUrl(r.url)}</div>
              ${r.real ? '<span style="font-size:9px;background:rgba(52,199,89,0.15);color:#1a7a3f;border-radius:3px;padding:1px 5px;">真实</span>' : ''}
            </div>
            <a class="safari-result-title" href="${r.url}" target="_blank" rel="noopener noreferrer"
               onclick="ActivityLogger.log('open_link',{url:'${r.url.slice(0,60)}'});return true;"
               style="display:block;font-size:16px;color:#1a0dab;text-decoration:none;margin-bottom:3px;cursor:pointer;"
               onmouseover="this.style.textDecoration='underline'" onmouseout="this.style.textDecoration='none'">
              ${r.title}
            </a>
            <div class="safari-result-snippet">${r.snippet}</div>
          </div>`).join('')}
      </div>`;

    content.querySelectorAll('.safari-contact-btn').forEach(btn => {
      btn.onclick = () => {
        const expertId = btn.dataset.expertId;
        const expert = EXPERTS.find(e => e.id === expertId);
        if (!expert) return;
        if (!discovered[expertId]) {
          discovered[expertId] = { discoveredAt: GameState.get('week'), channel: 'safari', trustBonus: 0 };
          GameState.set('discoveredExperts', discovered);
          MemoryManager.increaseTrust(expertId, 5);
          ActivityLogger.log('discover_expert', { expertId, channel: 'safari' });
          NotificationSystem.show('🌐 Safari', `${t('notif.expert_discovered', { name: expert.name })}`, 4000);
        }
        btn.textContent = t('safari.contacted');
        btn.disabled = true;
        DockManager.launchApp('imessage');
      };
    });
  },

  _cleanUrl(url) {
    try { return new URL(url).hostname.replace('www.', ''); } catch { return url.slice(0, 40); }
  },

  _renderExpertCard(expert, discovered) {
    const alreadyDiscovered = !!discovered[expert.id];
    return `
      <div class="safari-expert-card">
        <div class="safari-expert-header">
          <div class="safari-expert-avatar">${expert.avatarEmoji || '👤'}</div>
          <div>
            <div class="safari-expert-name">${expert.name}</div>
            <div class="safari-expert-bio">${expert.title}</div>
          </div>
        </div>
        <div style="font-size:12px;color:var(--text-secondary);margin-bottom:8px;">${expert.expertise.slice(0, 3).join(' · ')}</div>
        <button class="safari-contact-btn" data-expert-id="${expert.id}" ${alreadyDiscovered ? 'disabled' : ''}>
          ${alreadyDiscovered ? t('safari.contacted') : t('safari.contact_btn')}
        </button>
      </div>`;
  }
};
