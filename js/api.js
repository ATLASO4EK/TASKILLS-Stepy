const API_URL = (() => {
  try {
    const xhr = new XMLHttpRequest();
    xhr.open('GET', '/hosts.env', false); // same-origin, static file
    xhr.send();
    if (xhr.status === 200) {
      const m = xhr.responseText.match(/^API_URL=(.+)$/m);
      if (m) return m[1].trim();
    }
  } catch (e) {}
  return 'http://127.0.0.1:8000'; // local dev fallback
})();

const Api = (() => {
  const KEY = { user: 'sg2_user', token: 'sg2_token' };
  const load = k => { try { return JSON.parse(localStorage.getItem(k)); } catch (e) {return null; } };
  const clearSession = () => { localStorage.removeItem(KEY.user); localStorage.removeItem(KEY.token); };

  const request = async (method, path, body, auth = true) => {
    const headers = {};
    if (body !== undefined) headers['Content-Type'] = 'application/json';
    const token = localStorage.getItem(KEY.token);
    if (token) headers['Authorization'] = 'Bearer ' + token;
    let res;
    try {
      res = await fetch(API_URL + path, { method, headers, body: body !== undefined ? JSON.stringify(body) : undefined});
    } catch (e) { throw Object.assign(new Error('network'), { status: 0 }); }
    if (res.status === 401 && auth) {
      clearSession(); location.href = 'index.html';
      throw Object.assign(new Error('auth'), { status: 401});
    }
    let data = null;
    try { data = await res.json(); } catch (e) {}
    if (!res.ok) throw Object.assign(new Error('https_' + res.status), { status: res.status});
    return data;
  };
  
  const saveSession = d => {
    localStorage.setItem(KEY.token, d.access_token);
    localStorage.setItem(KEY.user, JSON.stringify({ id: d.user.id, name: d.user.nickname, email: d.user.email, isadmin:d.user.isadmin}));
  };
  const authError = e => new Error(e.status === 422? 'short' : e.status === 400 ? 'taken' : e.status === 401 ? 'wrong' : 'network');

  //ник автора(свой ник либ айдишник)
  const toGuide = g => {
    const me = load(KEY.user);
    return {id: g.guide_id, title: g.guide_name, description: g.description, photo: g.photo || '',
      author: g.author, authorName: g.author_nickname || (me && me.id === g.author ? me.name : '#' + g.author)
    };
  };

  const toStep = s => ({ id: s.step, text: s.url || '', image: s.photo || ''});
  
  const allGuides = async (q = '') => {
    const out = [];
    for (let page = 1; ; page++) {
      let rows;
      try { rows = await request('GET', `/guides?limit=100&page=${page}` + (q ? '&q=' + encodeURIComponent(q) : ''));}
      catch (e) { if (e.status === 404) break; throw e; }
      out.push(...rows);
      if (rows.length < 100) break;
    }
    return out.map(toGuide);
  };

  return {
    user: () => (localStorage.getItem(KEY.token) ? load(KEY.user) : null),

    async register(email, nickname, password) {
      try { saveSession(await request('POST', '/register', { email: email.trim(), nickname:nickname.trim(), password, isadmin:false }, false)); }
      catch (e) { throw authError(e); }
    },
    async login(email, password) {
      try { saveSession(await request('POST', '/login', {email: email.trim(), password }, false)); }
      catch (e) {throw authError(e); }
    },
    logout: clearSession,

    list: q => allGuides(q),
    async get(id) {
      const g = (await allGuides()).find(x => String(x.id) === String(id));
      if (!g) return null;
      const steps = await request ('GET', `/guides/${g.id}/steps`);
      return { ...g, steps: steps.map(toStep) };
    },
    async save(guide) {
      const body = { guide_name: guide.title, description: guide.description, photo: guide.photo || '' };
      let id = guide.id, existing = [];
      try {
        if (id) {
          await request('PATCH', '/guides', { guide_id: Number(id), ...body});
          existing = (await request('GET', `/guides/${id}/steps`)).map(s => s.step);
        } else {
          id = (await request('POST', '/guides', body)).guide_id;
        }
        const have = new Set(existing);
        for (let i = 0; i < guide.steps.length; i++) {
          const n = i + 1, s = guide.steps[i], p = { url: s.text, photo: s.image || null};
          if (have.has(n)) await request('PATCH', `/guides/${id}/steps/${n}`, p);
          else await request('POST', `/guides/${id}/steps`, { step: n, ...p });
        }
        for (const n of existing) if (n > guide.steps.length) await request('DELETE', `/guides/${id}/steps/${n}`);
      } catch (e) { throw e.status === 403 ? new Error ('forbidden') : e; }
      return { id };
    },
    async fork(id) { return { id: (await request('POST', `/guides/${id}/fork`)).guide_id};},

    async progress(id) {
      const r = await request('GET', `/guides/${id}/progress`);
      return { done: r.completed_steps, total: r.total_steps };
    },
    async completeStep(id, step) {
      try { await request('POST', `/guides/${id}/steps/${step}/complete`); } catch (e) { if (e.status !== 400) throw e; }
    },
    async uncompleteStep(id, step) {
      try { await request('DELETE', `/guides/${id}/steps/${step}/complete`); } catch (e) { if (e.status !== 404) throw e; }
    }
  };
})();
