# Документация к Тестовому Лендингу

## Приветствие

Привет, дорогой разработчик! Эта краткая документация поможет тебе чуть лучше разобраться в этом лендинге. Я быстро объясню за стек, запуск и структуру папок.

## Стек

Для разметки используется **HTML**, для стилей - обычный **CSS**, для логики - **JavaScript**. Для свайпера используется библиотека **Swiper**. Она лежит в проекте и подключается локально. Остальная логика написана без библиотек.

Для работы с контентом подготовлено подключение к **MODX Revolution** на PHP и MariaDB.

Проект будет опубликован в GitHub Pages. Ссылка на реализацию: https://aliteslit.github.io/novikov-alexander-landing-victoru/

## Запуск

Чтобы посмотреть лендинг локально, открой папку проекта и запусти сервер. Для этого нужен Python 3:

```bash
python3 -m http.server 3000 --bind 127.0.0.1
```

Теперь открой http://127.0.0.1:3000/ в браузере. Для остановки сервера нажми **Ctrl+C**.

Подключение к MODX находится в папке `modx`. Для него нужны Linux, PHP 8.1+ с расширениями MODX, MariaDB, `curl`, `unzip` и `flock`. При первом запуске выполни `bash modx/setup.sh`, затем - `bash modx/start.sh`. Страница будет доступна на http://127.0.0.1:8080/.

## Структура папок

```text
└── 📁test-donnu
    └── 📁js - логика страницы
        ├── slider.js - переключение слайдов, стрелки и точки
        ├── scroll.js - подсветка разделов статьи при скролле
        ├── swiper-bundle.min.js - библиотека Swiper
    └── 📁css - стили страницы
        ├── global.css - цвета, шрифты и глобальные стили
        ├── main.css - первая секция и её мобильная версия
        ├── article.css - статья и липкая навигация
        ├── gallery.css - галереи и кадрирование картинок
        ├── swiper-bundle.min.css - стили Swiper
    └── 📁static - ресурсы проекта
        └── 📁svg - иконки
            ├── arrow.svg
        └── 📁images - картинки из макета
            ├── family-memorial.jpg
            ├── memorial-portrait-1.jpg
            ├── memorial-portrait-2.jpg
            ├── memorial-portrait-3.jpg
            ├── memorial-project-1.jpg
            ├── memorial-project-2.jpg
            ├── memorial-project-3.jpg
            ├── memorial-project-4.jpg
            ├── memorial-project-5.jpg
            ├── memorial-site.jpg
            ├── proskurin.png
        └── 📁fonts - шрифты и их лицензии
            ├── Anticva-Regular.otf
            ├── Anticva-OFL.txt
            ├── Manrope.ttf
            ├── Manrope-OFL.txt
    └── 📁modx - подключение к CMS
        ├── template.html - шаблон страницы
        ├── import.php - импорт содержимого и подключение шаблона
        ├── install.php - подготовка установки
        ├── setup.sh - первая установка MODX
        ├── start.sh - запуск локального окружения
        ├── environment.sh - общие настройки PHP и MariaDB
        ├── router.php - локальный PHP-роутер
    ├── .gitignore
    ├── index.html - вся разметка страницы
    ├── LICENSE - лицензия MIT
    └── README.md - ВЫ НАХОДИТЕСЬ ЗДЕСЬ
```

Цвета заданы CSS-переменными в `css/global.css`. Мобильная версия включается при ширине 480px и меньше.

## Вывод

Надеюсь эта документация помогла тебе немного лучше разобраться в проекте. Если у тебя остались вопросы, можешь написать их в [Telegram](https://t.me/alitesno).
