const Lang = (() => {
  const D = {
    ru: {
      title: 'Пошаговые инструкции', login: 'Вход', register: 'Регистрация', name: 'Логин (2-20 символов)', pass: 'Пароль (от 4 символов)', err_short: 'Проверьте поля: корректный email, ник 2-20 символов, пароль от 4', err_taken: 'Такой email уже зарегистрирован', err_wrong: 'Неверный email или пароль', err_network: 'Нет связи с сервером',
      email: 'Email', nick: 'Ник (2-20 символов)', saveError: 'Не удалось сохранять, попробуйте еще раз', loadError: 'Не удалось загрузить данные',
      enter: 'Войти', search: 'Поиск', create: '+ Создать', logout: 'Выйти', all: 'Все', mine: 'Мои',
      steps: 'шагов', empty: 'Ничего не найдено', fork: 'Форк', edit: 'Редактировать',
      done: 'Готово! Все шаги выполнены.', fGuideTitle: 'Название', fDesc: 'Описание', fSteps: 'Шаги',
      addStep: 'Добавить шаг', save: 'Сохранить', cancel: 'Отмена', stepPh: 'Что нужно сделать',
      imgPh: 'Картинка: img/file.png или https://...', newGuide: 'Новая инструкция', editGuide: 'Редактирование',
      needTitle: 'Введите название и хотя бы один шаг', tooBig: 'Файл больше 300 КБ', noRights: 'Нельзя изменить чужую инструкцию'
    },
    en: {
      title: 'Step-by-step guides', login: 'Log in', register: 'Sign up', name: 'Username (2-20 chars)', pass: 'Password (min 4 chars)', err_short: 'Please check the fields: valid email, nickname (2–20 characters), password (at least 4 characters)',
      err_taken: 'This email is already registered',
      err_wrong: 'Incorrect email or password',
      err_network: 'Unable to connect to the server',
      email: 'Email',
      nick: 'Nickname (2–20 characters)',
      saveError: 'Failed to save, please try again',
      loadError: 'Failed to load data',
      enter: 'Log in', search: 'Search', create: '+ Create', logout: 'Log out', all: 'All', mine: 'Mine',
      steps: 'steps', empty: 'Nothing found', fork: 'Fork', edit: 'Edit',
      done: 'Done! All steps completed.', fGuideTitle: 'Title', fDesc: 'Description', fSteps: 'Steps',
      addStep: 'Add step', save: 'Save', cancel: 'Cancel', stepPh: 'What to do',
      imgPh: 'Image: img/file.png or https://...', newGuide: 'New guide', editGuide: 'Editing',
      needTitle: 'Enter a title and at least one step', tooBig: 'File is larger than 300 KB', noRights: "You can't edit someone else's guide"
    }
  };
  let lang = 'ru';
  lang = localStorage.getItem('sg2_lang') || 'ru';
  const t = k => D[lang][k] || k;
  const apply = () => {
    document.documentElement.lang = lang;
    document.querySelectorAll('[data-i18n]').forEach(e => { e.textContent = t(e.dataset.i18n); });
    document.querySelectorAll('[data-i18n-ph]').forEach(e => { e.placeholder = t(e.dataset.i18nPh); });
  };
  const toggle = () => {
    lang = lang === 'ru' ? 'en' : 'ru';
    localStorage.setItem('sg2_lang', lang);
    location.reload();
  };
  return { t, apply, toggle, get lang() { return lang; } };
})();
