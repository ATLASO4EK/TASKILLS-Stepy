const Lang = (() => {
  const D = {
    ru: { title:'Пошаговые инструкции', login:'Вход', register:'Регистрация', name:'Логин (2-20 символов)', pass:'Пароль (от 4 символов)', err_short:'Логин 2-20 символов, пароль от 4', err_taken:'Это имя занято', err_wrong:'Неверный логин или пароль',
      enter:'Войти', search:'Поиск', create:'+ Создать', logout:'Выйти', all:'Все', mine:'Мои',
      steps:'шагов', empty:'Ничего не найдено', fork:'Форк', edit:'Редактировать',
      done:'Готово! Все шаги выполнены.', fGuideTitle:'Название', fDesc:'Описание', fSteps:'Шаги',
      addStep:'Добавить шаг', save:'Сохранить', cancel:'Отмена', stepPh:'Что нужно сделать',
      imgPh:'Картинка: img/file.png или https://...', newGuide:'Новая инструкция', editGuide:'Редактирование',
      needTitle:'Введите название и хотя бы один шаг', tooBig:'Файл больше 300 КБ', noRights:'Нельзя изменить чужую инструкцию' },
    en: { title:'Step-by-step guides', login:'Log in', register:'Sign up', name:'Username (2-20 chars)', pass:'Password (min 4 chars)', err_short:'Username 2-20 chars, password 4+', err_taken:'Name is taken', err_wrong:'Wrong username or password',
      enter:'Log in', search:'Search', create:'+ Create', logout:'Log out', all:'All', mine:'Mine',
      steps:'steps', empty:'Nothing found', fork:'Fork', edit:'Edit',
      done:'Done! All steps completed.', fGuideTitle:'Title', fDesc:'Description', fSteps:'Steps',
      addStep:'Add step', save:'Save', cancel:'Cancel', stepPh:'What to do',
      imgPh:'Image: img/file.png or https://...', newGuide:'New guide', editGuide:'Editing',
      needTitle:'Enter a title and at least one step', tooBig:'File is larger than 300 KB', noRights:"You can't edit someone else's guide" }
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
