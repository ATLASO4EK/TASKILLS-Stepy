if (Api.user()) location.href = 'catalog.html';
document.getElementById('langBtn').onclick = Lang.toggle;

document.getElementById('authForm').onsubmit = async e => {
  e.preventDefault();
  const name = document.getElementById('login').value;
  const password = document.getElementById('password').value;
  const action = e.submitter.value; 
  try {
    await Api[action](name, password);
    location.href = 'catalog.html';
  } catch (err) {
    document.getElementById('authError').textContent = Lang.t('err_' + err.message);
  }
};
Lang.apply();
