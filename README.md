# WinRead

<p align="center">
  <img src="assets/icon.svg" width="128" height="128" alt="WinRead Logo" />
</p>

<p align="center">
  <b>Ультра-оптимизированный десктопный ридер электронных книг в эстетике ReadEra с автоматической синхронизацией с Android-устройствами.</b>
</p>

<p align="center">
  <a href="https://github.com/whoami-28/WinRead/releases/tag/v1.0.0"><img src="https://img.shields.io/badge/Release-v1.0.0-f5a623?style=flat-square" alt="Release v1.0.0" /></a>
  <img src="https://img.shields.io/badge/Platform-Windows%2010%20%7C%2011-blue?style=flat-square" alt="Platform" />
  <img src="https://img.shields.io/badge/Runtime-Electron%20%2B%20Node.js-1b1c22?style=flat-square" alt="Runtime" />
  <img src="https://img.shields.io/badge/License-MIT-green?style=flat-square" alt="License" />
</p>

---

## ⚡ Особенности и возможности

- **Чистая архитектура без фреймворков:** Чистый Vanilla JavaScript (ESNext), семантический HTML5 и высокопроизводительный CSS без React/Vue/Electron-forge оверхеда.
- **Поддержка форматов:** EPUB, FB2 (включая `.fb2.zip`), MOBI, TXT.
- **Off-Main-Thread фоновая обработка:** Распаковка ZIP-архивов, XML-парсинг и операции с SQLite вынесены в изолированный `utilityProcess` — UI-поток никогда не блокируется.
- **Виртуализированный рециркулируемый DOM-скроллер:** Отрисовываются только видимые на экране абзацы плюс буфер из 2 элементов выше и ниже. Мгновенная прокрутка на 60/120 FPS даже для многомегабайтных книг.
- **Синхронизация с ReadEra (Android):**
  - Полная поддержка форматов бэкапа ReadEra (`.bak` и `docs_1.json`).
  - Разрешение конфликтов по алгоритму Last-Write-Wins (LWW) на основе временных меток UTC.
  - Двусторонняя синхронизация прогресса чтения, закладок, цитат с цветными метками и статусов («Читаю сейчас», «Хочу прочитать», «Прочитано»).
  - Прямое подключение по локальной сети через веб-компаньон / WebSocket и прямая работа с телефоном по USB (MTP / ADB).
- **Премиальная графитовая эстетика:** Тёмная линейная палитра, тёплые янтарные акценты, поддержка скруглений окна, отсутствие визуального мусора.
- **Полноэкранный режим чтения:** 100% покрытие окна при чтении без отвлекающих боковых панелей, с интегрированными системными кнопками управления окном.
- **Быстрый хэш идентификации:** Композитное хэширование (размер + sha256 первых 64КБ + sha256 последних 64КБ) для моментальной идентификации книг без полного чтения гигабайтов данных.

---

## 📥 Загрузка и установка

Готовые релизные сборки доступны на странице **[Releases](https://github.com/whoami-28/WinRead/releases)**:

1. **[WinRead Setup 1.0.0.exe](https://github.com/whoami-28/WinRead/releases/download/v1.0.0/WinRead.Setup.1.0.0.exe)** — стандартный установщик Windows (NSIS).
2. **[WinRead-Portable-1.0.0.exe](https://github.com/whoami-28/WinRead/releases/download/v1.0.0/WinRead-Portable-1.0.0.exe)** — портативная версия, готовая к запуску без установки (можно запускать с флешки).

---

## ⌨️ Горячие клавиши

| Клавиша | Действие |
| :--- | :--- |
| `Esc` | Закрыть ридер и вернуться в библиотеку / закрыть модальное окно |
| `]` или `Shift + →` | Перейти к следующей главе |
| `[` или `Shift + ←` | Перейти к предыдущей главе |
| `Space` | Плавная прокрутка страницы вниз |
| `Shift + Space` | Плавная прокрутка страницы вверх |
| `PageDown` / `↓` | Прокрутка вниз |
| `PageUp` / `↑` | Прокрутка вверх |
| `F` | Полноэкранный режим (Fullscreen) |
| `Ctrl + K` | Быстрый фокус на строке поиска по библиотеке |

---

## 🛠 Разработка и запуск из исходников

Требования: [Node.js](https://nodejs.org/) (версия 18+ или 20+ LTS).

```bash
# Клонирование репозитория
git clone https://github.com/whoami-28/WinRead.git
cd WinRead

# Установка зависимостей
npm install

# Запуск в режиме разработки
npm start
# или запуск через батник:
.\start.bat

# Запуск автоматических тестов
npm test

# Сборка инсталляторов и дистрибутивов
npm run dist:all
# или
.\build.bat
```

---

## 📂 Структура проекта

```
WinRead/
├── assets/           # Векторные и растровые иконки
├── db/               # SQLite репозиторий и схема базы данных
├── parsers/          # Парсеры форматов: epub.js, fb2.js, mobi.js, txt.js
├── renderer/         # UI фронтенд: index.html, styles.css, app.js
├── sync/             # Модули синхронизации: sync-server.js, mtp-bridge.js, adb-bridge.js
├── test/             # Автоматизированный тестовый набор (run-tests.js)
├── main.js           # Главный процесс Electron (управление окном, безопасный IPC)
├── preload.js        # Безопасный IPC-мост (contextIsolation: true)
├── worker.js         # Изолированный utilityProcess для парсинга и БД
└── package.json      # Зависимости и скрипты сборщика electron-builder
```

---

## 📄 Лицензия

Проект распространяется под лицензией [MIT](LICENSE).
