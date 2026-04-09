'use strict';

const TodoApp = {
  _container: null,
  _filter: 'all',

  render(container) {
    this._container = container;
    this._draw(container);
    EventBus.on('todo:add', () => { if (container.isConnected) this._draw(container); });
  },

  _draw(container) {
    const todos = this._getTodos();
    const pending = todos.filter(td => !td.completed);
    const completed = todos.filter(td => td.completed);
    const filtered = this._filter === 'pending' ? pending
      : this._filter === 'completed' ? completed
      : todos;

    container.innerHTML = `
      <div style="display:flex;flex-direction:column;height:100%;background:#f5f5f7;">
        <div style="padding:16px 20px 12px;background:rgba(255,255,255,0.95);border-bottom:1px solid var(--border);flex-shrink:0;">
          <div style="font-size:18px;font-weight:700;color:var(--text-primary);margin-bottom:10px;">${t('todo.title')}</div>
          <div style="display:flex;gap:6px;">
            ${[['all', t('todo.filter_all'), todos.length], ['pending', t('todo.filter_pending'), pending.length], ['completed', t('todo.filter_done'), completed.length]].map(([key, label, count]) => `
              <button data-filter="${key}" style="padding:4px 10px;border-radius:12px;border:none;cursor:pointer;font-size:12px;font-weight:600;font-family:var(--font-system);
                background:${this._filter === key ? 'var(--accent)' : 'rgba(0,0,0,0.06)'};
                color:${this._filter === key ? '#fff' : 'var(--text-secondary)'};">
                ${label}${count > 0 ? ` <span style="opacity:0.8;">${count}</span>` : ''}
              </button>`).join('')}
          </div>
        </div>
        <div style="flex:1;overflow-y:auto;padding:12px 16px;" id="todo-list">
          ${filtered.length === 0
            ? `<div style="text-align:center;padding:40px 0;color:var(--text-secondary);">
                <div style="font-size:32px;margin-bottom:8px;">✅</div>
                <div style="font-size:14px;">${this._filter === 'completed' ? t('todo.no_done') : this._filter === 'pending' ? t('todo.no_pending') : t('todo.no_tasks')}</div>
               </div>`
            : filtered.map(td => this._renderTodoItem(td)).join('')}
        </div>
        <div style="padding:10px 16px;border-top:1px solid var(--border);background:rgba(255,255,255,0.95);flex-shrink:0;">
          <div style="display:flex;gap:8px;align-items:center;">
            <input type="text" id="todo-input" placeholder="${t('todo.add_placeholder')}"
              style="flex:1;padding:8px 12px;border:1.5px solid var(--border);border-radius:8px;font-size:13px;outline:none;font-family:var(--font-system);transition:border 0.15s;"
              onfocus="this.style.borderColor='var(--accent)'" onblur="this.style.borderColor='var(--border)'">
            <button id="todo-add-btn" style="padding:8px 14px;background:var(--accent);color:#fff;border:none;border-radius:8px;font-size:13px;font-weight:600;cursor:pointer;font-family:var(--font-system);">
              ${t('todo.add_btn')}
            </button>
          </div>
        </div>
      </div>`;

    container.querySelectorAll('[data-filter]').forEach(btn => {
      btn.onclick = () => { this._filter = btn.dataset.filter; this._draw(container); };
    });
    container.querySelectorAll('[data-todo-complete]').forEach(btn => {
      btn.onclick = () => { this._toggleComplete(btn.dataset.todoComplete); this._draw(container); };
    });
    container.querySelectorAll('[data-todo-delete]').forEach(btn => {
      btn.onclick = () => { this._deleteTodo(btn.dataset.todoDelete); this._draw(container); };
    });
    container.querySelectorAll('[data-todo-schedule]').forEach(btn => {
      btn.onclick = () => { this._setSchedule(btn.dataset.todoSchedule); this._draw(container); };
    });

    const input = container.querySelector('#todo-input');
    const addBtn = container.querySelector('#todo-add-btn');
    const addNew = () => {
      const text = input.value.trim();
      if (!text) return;
      this.addTodo({ title: text, source: 'player', priority: 'normal' });
      input.value = '';
      this._draw(container);
    };
    if (addBtn) addBtn.onclick = addNew;
    if (input) input.onkeydown = e => { if (e.key === 'Enter') addNew(); };
  },

  _renderTodoItem(todo) {
    const currentWeek = GameState.get('week') || 1;
    const priorityColors = { high: '#ff3b30', normal: '#ff9500', low: '#34c759' };
    const priorityLabels = { high: t('todo.priority.high'), normal: t('todo.priority.normal'), low: t('todo.priority.low') };
    const sourceLabels = {
      mail: t('todo.source.mail'),
      telegram: t('todo.source.telegram'),
      imessage: t('todo.source.telegram'),
      system: t('todo.source.system'),
      ai_event: t('todo.source.ai_event'),
      player: t('todo.source.player')
    };
    const dueWeek = todo.dueWeek || todo.scheduledWeek;
    const isOverdue = dueWeek && dueWeek < currentWeek && !todo.completed;
    const weeksLeft = dueWeek ? dueWeek - currentWeek : null;

    // NPC name resolution
    let npcName = null;
    if (todo.npcId) {
      if (todo.npcId === 'wangzimo') npcName = '王子墨';
      else if (typeof EXPERTS !== 'undefined') {
        const ex = EXPERTS.find(e => e.id === todo.npcId);
        npcName = ex?.name || todo.npcId;
      }
    }

    return `
      <div style="background:#fff;border-radius:10px;padding:12px 14px;margin-bottom:8px;
                  border:1px solid ${isOverdue ? 'rgba(255,59,48,0.3)' : todo.completed ? 'rgba(0,0,0,0.04)' : 'var(--border)'};
                  border-left:3px solid ${isOverdue ? '#ff3b30' : priorityColors[todo.priority] || '#999'};
                  opacity:${todo.completed ? '0.6' : '1'};
                  background:${isOverdue ? 'rgba(255,59,48,0.02)' : '#fff'};
                  box-shadow:0 1px 3px rgba(0,0,0,0.04);">
        <div style="display:flex;align-items:flex-start;gap:10px;">
          <button data-todo-complete="${todo.id}"
            style="width:20px;height:20px;border-radius:50%;border:2px solid ${todo.completed ? '#34c759' : priorityColors[todo.priority] || '#999'};
                   background:${todo.completed ? '#34c759' : 'transparent'};flex-shrink:0;margin-top:1px;cursor:pointer;
                   display:flex;align-items:center;justify-content:center;font-size:10px;color:#fff;">
            ${todo.completed ? '✓' : ''}
          </button>
          <div style="flex:1;min-width:0;">
            <div style="font-size:14px;font-weight:600;color:var(--text-primary);
                        text-decoration:${todo.completed ? 'line-through' : 'none'};margin-bottom:4px;">
              ${todo.title}
            </div>
            <div style="display:flex;flex-wrap:wrap;gap:5px;align-items:center;">
              ${sourceLabels[todo.source] ? `<span style="font-size:11px;color:var(--text-secondary);">${sourceLabels[todo.source]}</span>` : ''}
              <span style="font-size:11px;color:${priorityColors[todo.priority] || '#999'};">${priorityLabels[todo.priority] || ''}</span>
              ${npcName ? `<span style="font-size:11px;color:#5856d6;">🤝 ${getLang() === 'en' ? 'Promised to' : '承诺给'} ${npcName}</span>` : ''}
              ${isOverdue ? `<span style="font-size:11px;color:#ff3b30;font-weight:600;">${t('todo.overdue')}</span>` : ''}
              ${weeksLeft !== null && !isOverdue && !todo.completed ? `<span style="font-size:11px;color:var(--text-secondary);">${t('todo.days_left', { n: weeksLeft })}${getLang() === 'zh' ? '周' : ' weeks'}</span>` : ''}
              ${dueWeek && !todo.scheduledWeek ? `<span style="font-size:11px;color:var(--text-secondary);">📅 ${t('week.label', { n: dueWeek })}</span>` : ''}
            </div>
          </div>
          <div style="display:flex;gap:4px;align-items:center;">
            <button data-todo-schedule="${todo.id}" title="${getLang() === 'en' ? 'Set due week' : '设置到期周'}"
              style="background:none;border:none;cursor:pointer;color:var(--text-secondary);font-size:13px;padding:0 3px;opacity:0.6;">
              📅
            </button>
            <button data-todo-delete="${todo.id}"
              style="background:none;border:none;cursor:pointer;color:var(--text-secondary);font-size:16px;padding:0 2px;opacity:0.5;">×</button>
          </div>
        </div>
      </div>`;
  },

  // ===== Public API =====
  addTodo(opts) {
    const todos = this._getTodos();
    const todo = {
      id: 'todo_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
      title: opts.title || '新待办',
      source: opts.source || 'system',
      sourceRef: opts.sourceRef || null,
      priority: opts.priority || 'normal',
      // npcId: if this is a promise to an NPC, track it here
      npcId: opts.npcId || null,
      // scheduledWeek: when this is planned to happen
      scheduledWeek: opts.scheduledWeek || null,
      // dueWeek: deadline week
      dueWeek: opts.dueWeek || null,
      completed: false,
      createdAt: GameState.get('week') || 1,
      completedAt: null
    };
    todos.unshift(todo);
    this._saveTodos(todos);
    EventBus.emit('todo:add', todo);
    this._updateDockBadge(todos);
    return todo;
  },

  // Called each game week — check for overdue NPC promises
  checkOverduePromises() {
    const currentWeek = GameState.get('week') || 1;
    const todos = this._getTodos();
    let penaltyApplied = false;

    todos.forEach(td => {
      if (td.completed || !td.npcId || !td.dueWeek) return;
      if (td.dueWeek < currentWeek && !td._penaltyApplied) {
        td._penaltyApplied = true;
        // Reduce NPC trust
        if (typeof MemoryManager !== 'undefined') {
          const mem = MemoryManager.getMemory(td.npcId);
          const penalty = td.priority === 'high' ? -15 : -8;
          const newTrust = Math.max(0, mem.trustScore + penalty);
          MemoryManager.saveMemory(td.npcId, { ...mem, trustScore: newTrust });
          const npcName = td.npcId === 'wangzimo' ? '王子墨'
            : EXPERTS?.find(e => e.id === td.npcId)?.name || td.npcId;
          const msg = getLang() === 'en'
            ? `You forgot your promise to ${npcName}. Their trust in you decreased.`
            : `你忘记了对 ${npcName} 的承诺，对方的信任度下降了。`;
          NotificationSystem.show('⚠️', msg, 5000);
          penaltyApplied = true;
        }
      }
    });

    if (penaltyApplied) this._saveTodos(todos);
    return penaltyApplied;
  },

  _setSchedule(todoId) {
    const currentWeek = GameState.get('week') || 1;
    const weekStr = prompt(
      getLang() === 'en'
        ? `Which week do you want to schedule this? (current: ${currentWeek})`
        : `你想在第几周完成这件事？（当前：第 ${currentWeek} 周）`,
      String(currentWeek + 1)
    );
    if (!weekStr) return;
    const w = parseInt(weekStr);
    if (isNaN(w) || w < 1) return;
    const todos = this._getTodos();
    const td = todos.find(t => t.id === todoId);
    if (td) {
      td.scheduledWeek = w;
      td.dueWeek = w;
      this._saveTodos(todos);
      EventBus.emit('todo:add', td);
    }
  },

  _toggleComplete(todoId) {
    const todos = this._getTodos();
    const td = todos.find(t => t.id === todoId);
    if (td) {
      td.completed = !td.completed;
      td.completedAt = td.completed ? Date.now() : null;
      // If completing a promise, notify
      if (td.completed && td.npcId && typeof MemoryManager !== 'undefined') {
        MemoryManager.increaseTrust(td.npcId, 5);
        const npcName = td.npcId === 'wangzimo' ? '王子墨'
          : EXPERTS?.find(e => e.id === td.npcId)?.name || td.npcId;
        const msg = getLang() === 'en'
          ? `You kept your promise to ${npcName}. +5 trust.`
          : `你兑现了对 ${npcName} 的承诺，好感度 +5`;
        NotificationSystem.show('✅', msg, 3000);
      }
    }
    this._saveTodos(todos);
    this._updateDockBadge(todos);
  },

  _deleteTodo(todoId) {
    const todos = this._getTodos().filter(t => t.id !== todoId);
    this._saveTodos(todos);
    this._updateDockBadge(todos);
  },

  _updateDockBadge(todos) {
    const dockItem = document.querySelector('.dock-item[data-app-id="todo"]');
    if (!dockItem) return;
    const pending = todos.filter(td => !td.completed).length;
    let badge = dockItem.querySelector('.todo-badge');
    if (!badge && pending > 0) {
      badge = document.createElement('div');
      badge.className = 'todo-badge';
      badge.style.cssText = 'position:absolute;top:-2px;right:-2px;min-width:16px;height:16px;background:#ff3b30;border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:9px;color:#fff;font-weight:700;padding:0 3px;z-index:10;pointer-events:none;';
      dockItem.style.position = 'relative';
      dockItem.appendChild(badge);
    }
    if (badge) {
      badge.textContent = pending > 0 ? pending : '';
      badge.style.display = pending > 0 ? 'flex' : 'none';
    }
  },

  _getTodos() { return SaveSystem.load('todos') || []; },
  _saveTodos(todos) { SaveSystem.save('todos', todos); }
};
