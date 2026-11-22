if (Api.user()) location.href = 'catalog.html';
document.getElementById('langBtn').onclick = Lang.toggle;

const nickWrap = document.getElementById('nickWrap');
const errBox = document.getElementById('authError');

//Регистрация
document.getElementById('loginBtn').onclick = () => nickWrap.classList.add('d-none');
document.getElementById('registerBtn').onclick = e => {
  if (nickWrap.classList.contains('d-none')) {
    e.preventDefault();
    nickWrap.classList.remove('d-none');
    document.getElementById('nickname').focus();
  }
};

document.getElementById('authForm').onsubmit = async e => {
  e.preventDefault();
  errBox.textContent = '';
  const email = document.getElementById('email').value;
  const nickname = document.getElementById('nickname').value.trim();
  const password = document.getElementById('password').value;
  try {
    if (e.submitter.valeu === 'register') {
      if (nickname.length < 2 || nickname.length > 20) throw new Error('short');
      await Api.register(email, nickname, password);
    } else {
      await Api.login(email, password);
    }
    location.href = 'catalog.html';
  } catch (err) {
    errBox.textContent = Lang.t('err_' + err.message);
  }
};
Lang.apply();