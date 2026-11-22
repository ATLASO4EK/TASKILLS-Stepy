const Api = (() => {
  const KEY = { guides: 'sg2_guides', users: 'sg2_users', session: 'sg2_user', progress: 'sg2_progress' };
  const RESERVED = ['admin']; // автор стартовых гайдиков

  const load = (key, fallback) => {
    try {
      const v = JSON.parse(localStorage.getItem(key));
      return v === null ? fallback : v;
    } catch (e) {
      return fallback;
    }
  };
  const store = (key, value) => localStorage.setItem(key, JSON.stringify(value));

  const seed = [
    { id: 'g1', title: 'как играть в доту', author: 'admin',
      description: 'гайд игры в дотку для чайников.',
      steps: [
        { text: 'скачать доту в стиме' }, { text: 'зайти в игру' },
        { text: 'сгонять одну каточку', image: 'img/dota.png' },
        { text: 'обматерить союзников' }, { text: 'выйти с доты' },
        { text: 'удалить доту. все готово, ты krasava marat!' }] },
    { id: 'g2', title: 'что такое газява', author: 'admin',
      description: 'газява - эта кока-кола, но не ток(',
      steps: [
        { text: 'дойти до магазина' }, { text: 'найти газяву' },
        { text: 'взять бутылку газявы', image: 'img/gazyava.png' },
        { text: 'купить' }, { text: 'выпить' }] },
    { id: 'g3', title: 'геншин фу', author: 'admin',
      description: 'Genshin Impact дай гемов',
      steps: [
        { text: 'скачать Геншин и пройти сюжет монда хотяб' }, { text: 'нафармить 160 примогемов' },
        { text: 'покрутить и ниче не выпадет', image: 'img/genshin.png' },
        { text: 'сказать "ну и фу эти гачи"' }, { text: 'выйти' },
        { text: 'удалить' }] }
  ];
  if (load(KEY.guides, null) === null) store(KEY.guides, seed);

  const hash = async (password, salt) => {
    const bytes = new TextEncoder().encode(salt + password);
    const digest = await crypto.subtle.digest('SHA-256', bytes);
    return Array.from(new Uint8Array(digest)).map(b => b.toString(16).padStart(2, '0')).join('');
  };
  const newSalt = () => Array.from(crypto.getRandomValues(new Uint8Array(8)))
    .map(b => b.toString(16).padStart(2, '0')).join('');

  const cleanName = name => String(name).trim();
  const currentName = () => {
    const u = load(KEY.session, null);
    return u && u.name;
  };
  const progressKey = id => currentName() + ':' + id;

  // Existing numeric marks identify steps in the order stored before the upgrade.
  const legacyStepId = index => 'legacy-' + index;
  const readGuides = () => load(KEY.guides, []).map(guide => ({
    ...guide,
    steps: guide.steps.map((step, index) => ({ ...step, id: step.id || legacyStepId(index) }))
  }));
  const newStepId = () => 'step-' + Array.from(crypto.getRandomValues(new Uint32Array(4))).join('-');

  return {
    user: () => load(KEY.session, null),
    async register(name, password) {
      name = cleanName(name);
      const users = load(KEY.users, {});
      if (name.length < 2 || name.length > 20 || password.length < 4) throw new Error('short');
      if (users[name] || RESERVED.includes(name.toLowerCase())) throw new Error('taken');
      const salt = newSalt();
      users[name] = { salt, hash: await hash(password, salt) };
      store(KEY.users, users);
      store(KEY.session, { name });
    },
    async login(name, password) {
      name = cleanName(name);
      const record = load(KEY.users, {})[name];
      if (!record || record.hash !== await hash(password, record.salt)) throw new Error('wrong');
      store(KEY.session, { name });
    },
    logout() { localStorage.removeItem(KEY.session); },

    list: readGuides,
    get: id => readGuides().find(g => g.id === id),
    save(guide) {
      const author = currentName();
      if (!author) throw new Error('auth');
      const all = readGuides();
      guide.steps = guide.steps.map(step => ({ ...step, id: step.id || newStepId() }));
      const i = all.findIndex(x => x.id === guide.id);
      if (i < 0) {
        guide.id = 'g' + Date.now();
        guide.author = author;
        all.push(guide);
      } else if (all[i].author !== author) {
        throw new Error('forbidden');
      } else {
        all[i] = guide;
      }
      store(KEY.guides, all);
      return guide;
    },
    fork(id) {
      const source = this.get(id);
      return this.save({ ...source, id: null, title: source.title + ' (fork)' });
    },
    progress(id, steps = this.get(id)?.steps || []) {
      const saved = load(KEY.progress, {})[progressKey(id)] || [];
      const marked = new Set(saved.map(value => Number.isInteger(value) ? legacyStepId(value) : value));
      return steps.filter(step => marked.has(step.id)).map(step => step.id);
    },
    setProgress(id, done) {
      const all = load(KEY.progress, {});
      all[progressKey(id)] = done;
      store(KEY.progress, all);
    }
  };
})();
