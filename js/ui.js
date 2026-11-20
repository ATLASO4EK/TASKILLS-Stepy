const UI = {
  esc: s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])),
  param: k => new URLSearchParams(location.search).get(k),
  // разрешены ток свои картинки, все остальное в мусорку
  safeUrl: u => /^(https?:\/\/|img\/|data:image\/(png|jpeg|gif|webp);base64,)/i.test(u || '') ? u : '',
  navbar() {
    const u = Api.user();
    if (!u) { location.href = 'index.html'; return; }
    const letter = UI.esc(Array.from(u.name)[0].toUpperCase());
    document.getElementById('navbar').innerHTML = `
    <nav class="navbar bg-white border-bottom mb-4"><div class="container gap-2">
      <a class="navbar-brand" href="catalog.html">Stepy</a>
      <form class="flex-grow-1" action="catalog.html">
        <input name="q" class="form-control" data-i18n-ph="search" value="${UI.esc(UI.param('q') || '')}"></form>
      <a class="btn btn-primary" href="editor.html" data-i18n="create"></a>
      <button class="btn btn-outline-secondary" id="langBtn">${Lang.lang === 'ru' ? 'EN' : 'RU'}</button>
      <div class="dropdown">
        <button class="btn btn-outline-secondary rounded-circle fw-bold p-0 avatar" data-bs-toggle="dropdown" aria-label="profile">${letter}</button>
        <ul class="dropdown-menu dropdown-menu-end">
          <li><span class="dropdown-item-text fw-bold">${UI.esc(u.name)}</span></li>
          <li><hr class="dropdown-divider"></li>
          <li><button class="dropdown-item" id="logoutBtn" data-i18n="logout"></button></li>
        </ul>
      </div>
    </div></nav>`;
    document.getElementById('langBtn').onclick = Lang.toggle;
    document.getElementById('logoutBtn').onclick = () => { Api.logout(); location.href = 'index.html'; };
  }
};
