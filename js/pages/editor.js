(() => {
  UI.navbar();
  const $ = id => document.getElementById(id);
  const id = UI.param('id');
  const g = (id && Api.get(id)) || { title: '', description: '', steps: [{ text: '', image: '' }] };
  if (id && g.author !== Api.user().name) { location.href = 'guide.html?id=' + encodeURIComponent(id); return; }

  const steps = g.steps.map(s => ({ id: s.id, text: s.text, image: s.image || '' }));
  $('fTitle').value = g.title; $('fDesc').value = g.description;
  $('pageTitle').dataset.i18n = id ? 'editGuide' : 'newGuide';

  const render = () => {
    $('stepList').innerHTML = steps.map((s, i) => `
      <div class="card mb-2"><div class="card-body p-2">
        <div class="input-group mb-2">
          <span class="input-group-text">${i + 1}</span>
          <input class="form-control" data-f="text" data-i="${i}" value="${UI.esc(s.text)}" data-i18n-ph="stepPh">
          <button type="button" class="btn btn-outline-secondary" data-act="up" data-i="${i}">↑</button>
          <button type="button" class="btn btn-outline-secondary" data-act="down" data-i="${i}">↓</button>
          <button type="button" class="btn btn-outline-danger" data-act="del" data-i="${i}">✕</button>
        </div>
        <input class="form-control form-control-sm mb-1" data-f="image" data-i="${i}" value="${s.image.startsWith('data:') ? '' : UI.esc(s.image)}" data-i18n-ph="imgPh">
        <input type="file" accept="image/png,image/jpeg,image/gif,image/webp" class="form-control form-control-sm" data-f="file" data-i="${i}">
        ${UI.safeUrl(s.image) ? `<img src="${UI.esc(UI.safeUrl(s.image))}" class="img-thumbnail mt-2" style="max-height:80px" alt="">` : ''}
      </div></div>`).join('');
    Lang.apply();
  };

  const swap = (i, j) => { if (j >= 0 && j < steps.length) { const t = steps[i]; steps[i] = steps[j]; steps[j] = t; } };

  // ввод текста и ссылки на картинку
  $('stepList').oninput = e => {
    const f = e.target.dataset.f;
    if (f === 'text' || f === 'image') steps[Number(e.target.dataset.i)][f] = e.target.value;
  };
  // кнопки вверх/вниз/удалить
  $('stepList').onclick = e => {
    const act = e.target.dataset.act, i = Number(e.target.dataset.i);
    if (!act) return;
    if (act === 'del') steps.splice(i, 1);
    if (act === 'up') swap(i, i - 1);
    if (act === 'down') swap(i, i + 1);
    render();
  };
  // загрузка файла лимит 300кб
  $('stepList').onchange = e => {
    if (e.target.dataset.f !== 'file' || !e.target.files[0]) return;
    const file = e.target.files[0], i = Number(e.target.dataset.i);
    if (file.size > 300 * 1024) { alert(Lang.t('tooBig')); e.target.value = ''; return; }
    const r = new FileReader();
    r.onload = () => { steps[i].image = r.result; render(); };
    r.readAsDataURL(file);
  };
  $('addStep').onclick = () => { steps.push({ text: '', image: '' }); render(); };

  $('editorForm').onsubmit = e => {
    e.preventDefault();
    const clean = steps.map(s => ({ id: s.id, text: s.text.trim(), image: UI.safeUrl(s.image.trim()) })).filter(s => s.text);
    if (!$('fTitle').value.trim() || !clean.length) { alert(Lang.t('needTitle')); return; }
    try {
      const saved = Api.save(Object.assign({}, g, {
        id: id || null, title: $('fTitle').value.trim(), description: $('fDesc').value.trim(),
        steps: clean
      }));
      location.href = 'guide.html?id=' + encodeURIComponent(saved.id);
    } catch (err) { alert(Lang.t('noRights')); }
  };
  render();
})();
