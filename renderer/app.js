/**
 * WinRead - Ultra-Optimized Virtualized DOM Scroller & Application Controller
 * Version 1.0.0 Update - Modern ReadEra Monochrome Aesthetic with In-Book Images & Fast Resume
 */

// ============================================================================
// Localization Dictionary (RU / EN)
// ============================================================================

const I18N = {
  ru: {
    app_title: 'WinRead',
    catalog_subtitle: 'Каталог',
    nav_library: 'Библиотека',
    nav_reading: 'Сейчас читаю',
    nav_favorites: 'Избранное',
    nav_authors: 'Авторы & Серии',
    nav_sync: 'Синхронизация ReadEra',
    nav_settings: 'Настройки',
    storage_label: 'Хранилище книг',
    search_placeholder: 'Поиск по книгам, авторам, цитатам...',
    btn_open_book: 'Открыть книгу',
    tab_all: 'Все книги',
    tab_reading: 'Читаю сейчас',
    tab_to_read: 'Хочу прочитать',
    tab_have_read: 'Прочитано',
    formats_label: 'ФОРМАТЫ:',
    hero_continue: 'Продолжить чтение',
    btn_prev_chapter: 'Предыдущая',
    btn_next_chapter: 'Следующая',
    back_to_library: 'Библиотека',
    empty_title: 'Ваша библиотека пуста',
    empty_desc: 'Перетащите сюда файлы .epub, .fb2, .mobi, .txt или нажмите «Открыть книгу»',
    empty_open: 'Выбрать файл книги',
    empty_import_backup: 'Импорт бэкапа ReadEra',
    drop_title: 'Перетащите книгу или бэкап ReadEra',
    drop_desc: 'EPUB, FB2, MOBI, TXT или файл .bak',
    btn_toc: 'Оглавление',
    btn_typography: 'Шрифт и оформление',
    btn_bookmarks_drawer: 'Закладки и цитаты',
    btn_quick_bookmark: 'Добавить закладку',
    btn_fullscreen: 'Полноэкранный режим (F)',
    footer_block_info: 'Блок {current} / {total}',
    popover_bookmark: 'В закладки',
    toc_title: 'Оглавление',
    typography_title: 'Шрифты и оформление',
    lang_header: 'ЯЗЫК ИНТЕРФЕЙСА',
    lang_desc: 'Выберите язык для отображения интерфейса программы.',
    theme_label: 'ЦВЕТОВАЯ ТЕМА',
    theme_graphite: 'Графит',
    theme_oled: 'OLED Чёрный',
    theme_sepia: 'Сепия',
    theme_paper: 'Бумага',
    font_label: 'ШРИФТ',
    font_sans: 'Без засечек',
    font_serif: 'С засечками',
    font_mono: 'Моноширинный',
    font_size_label: 'РАЗМЕР ШРИФТА',
    line_height_label: 'МЕЖСТРОЧНЫЙ ИНТЕРВАЛ',
    reading_width_label: 'ШИРИНА ТЕКСТА',
    drawer_tab_bookmarks: 'Закладки',
    drawer_tab_quotes: 'Цитаты',
    drawer_no_bookmarks: 'Нет сохраненных закладок.',
    drawer_no_quotes: 'Нет сохраненных цитат или маркеров.',
    sync_hub_title: 'Центр синхронизации ReadEra',
    sync_phone_searching: 'Поиск устройств...',
    sync_phone_scanning: 'Сканирование USB-подключений...',
    sync_phone_found: 'Обнаружено {count} бэкапов ReadEra (.bak)',
    sync_phone_not_found: 'Телефон не обнаружен',
    toast_bookmark_added: 'Закладка сохранена',
    toast_quote_saved: 'Цитата сохранена',
    toast_sync_complete: 'Синхронизация завершена! Обновлено: {count} записей'
  },
  en: {
    app_title: 'WinRead',
    catalog_subtitle: 'Catalog',
    nav_library: 'Library',
    nav_reading: 'Reading Now',
    nav_favorites: 'Favorites',
    nav_authors: 'Authors & Series',
    nav_sync: 'ReadEra Sync',
    nav_settings: 'Settings',
    storage_label: 'Book Storage',
    search_placeholder: 'Search title, author, quotes...',
    btn_open_book: 'Open Book',
    tab_all: 'All Books',
    tab_reading: 'Reading Now',
    tab_to_read: 'To Read',
    tab_have_read: 'Have Read',
    formats_label: 'FORMATS:',
    hero_continue: 'Continue Reading',
    btn_prev_chapter: 'Previous',
    btn_next_chapter: 'Next',
    back_to_library: 'Library',
    empty_title: 'Your Library is Empty',
    empty_desc: 'Drag and drop .epub, .fb2, .mobi, .txt files here or click "Open Book"',
    empty_open: 'Select Book File',
    empty_import_backup: 'Import ReadEra Backup',
    drop_title: 'Drop Book File or ReadEra Backup',
    drop_desc: 'EPUB, FB2, MOBI, TXT, or .bak file',
    btn_toc: 'Table of Contents',
    btn_typography: 'Typography & Appearance',
    btn_bookmarks_drawer: 'Bookmarks & Quotes',
    btn_quick_bookmark: 'Add Bookmark',
    btn_fullscreen: 'Toggle Fullscreen (F)',
    footer_block_info: 'Block {current} / {total}',
    popover_bookmark: 'Bookmark',
    toc_title: 'Table of Contents',
    typography_title: 'Typography & Appearance',
    lang_header: 'INTERFACE LANGUAGE',
    lang_desc: 'Select the language for the program interface.',
    theme_label: 'COLOR THEME',
    theme_graphite: 'Graphite',
    theme_oled: 'OLED Black',
    theme_sepia: 'Sepia',
    theme_paper: 'Paper',
    font_label: 'FONT FAMILY',
    font_sans: 'Sans-Serif',
    font_serif: 'Serif',
    font_mono: 'Monospace',
    font_size_label: 'FONT SIZE',
    line_height_label: 'LINE HEIGHT',
    reading_width_label: 'READING WIDTH',
    drawer_tab_bookmarks: 'Bookmarks',
    drawer_tab_quotes: 'Quotes',
    drawer_no_bookmarks: 'No bookmarks saved.',
    drawer_no_quotes: 'No quotes saved.',
    sync_hub_title: 'ReadEra Sync Hub',
    sync_phone_searching: 'Searching for devices...',
    sync_phone_scanning: 'Scanning USB connections...',
    sync_phone_found: 'Found {count} ReadEra backups (.bak)',
    sync_phone_not_found: 'No phone detected',
    toast_bookmark_added: 'Bookmark saved',
    toast_quote_saved: 'Quote saved',
    toast_sync_complete: 'Sync complete! Updated: {count} items'
  }
};

// ============================================================================
// 1. Virtualized DOM Scroller with Pool Recycling & Precise Progress
// ============================================================================

class VirtualScroller {
  constructor(viewport, sizer, content, onPositionChange) {
    this.viewport = viewport;
    this.sizer = sizer;
    this.content = content;
    this.onPositionChange = onPositionChange;

    this.blocks = [];
    this.prefixSums = [0];
    this.pool = [];
    this.poolSize = 32;
    this.activeRange = { start: -1, end: -1 };
    this.totalHeight = 0;
    this.isScrolling = false;

    this.initPool();

    this.boundScroll = () => {
      if (!this.isScrolling) {
        this.isScrolling = true;
        requestAnimationFrame(() => {
          if (window.appInstance?.isSpreadMode) {
            window.appInstance.updateSpreadProgress();
          } else {
            this.onScroll();
          }
          this.isScrolling = false;
        });
      }
    };
    this.viewport.addEventListener('scroll', this.boundScroll, { passive: true });
    window.addEventListener('resize', () => this.handleResize());
  }

  initPool() {
    this.content.innerHTML = '';
    this.pool = [];
    for (let i = 0; i < this.poolSize; i++) {
      const el = document.createElement('div');
      el.className = 'reader-block-container';
      el.style.position = 'absolute';
      el.style.left = '0';
      el.style.right = '0';
      el.style.display = 'none';
      el.style.willChange = 'transform';
      this.content.appendChild(el);
      this.pool.push({
        element: el,
        assignedBlockIndex: -1,
        inUse: false
      });
    }
  }

  setBlocks(blocks, initialPosition = null) {
    this.blocks = blocks;
    this.recalculateHeights();

    for (const item of this.pool) {
      item.element.style.display = 'none';
      item.assignedBlockIndex = -1;
      item.inUse = false;
    }
    this.activeRange = { start: -1, end: -1 };

    if (initialPosition) {
      this.scrollToStructuralPosition(initialPosition);
    } else {
      this.viewport.scrollTop = 0;
      this.render();
    }
  }

  recalculateHeights() {
    this.prefixSums = [0];
    let currentTop = 0;

    for (let i = 0; i < this.blocks.length; i++) {
      const b = this.blocks[i];
      const h = b.measuredHeight || b.estimatedHeight || 48;
      b.top = currentTop;
      currentTop += h;
      this.prefixSums.push(currentTop);
    }

    this.totalHeight = currentTop;
    this.sizer.style.height = `${Math.max(this.totalHeight, this.viewport.clientHeight)}px`;
  }

  findBlockIndexForOffset(offset) {
    let low = 0;
    let high = this.prefixSums.length - 2;

    while (low <= high) {
      const mid = (low + high) >> 1;
      const top = this.prefixSums[mid];
      const bottom = this.prefixSums[mid + 1];

      if (offset >= top && offset < bottom) {
        return mid;
      } else if (offset < top) {
        high = mid - 1;
      } else {
        low = mid + 1;
      }
    }
    return Math.max(0, Math.min(this.blocks.length - 1, low));
  }

  onScroll() {
    if (this.blocks.length === 0) return;
    this.render();

    const scrollTop = this.viewport.scrollTop;
    const clientHeight = this.viewport.clientHeight;
    const maxScroll = Math.max(0, this.sizer.offsetHeight - clientHeight);

    // Exact progress logic: snap to 100% when at the end of the chapter
    const isAtBottom = maxScroll <= 5 || (scrollTop >= maxScroll - 25);
    const activeIdx = this.findBlockIndexForOffset(scrollTop + 30);
    const activeBlock = this.blocks[activeIdx];

    let percentage = 0;
    if (isAtBottom) {
      percentage = 100;
    } else if (maxScroll > 0) {
      percentage = Math.min(99.9, Math.max(0, (scrollTop / maxScroll) * 100));
    }

    if (activeBlock && this.onPositionChange) {
      this.onPositionChange({
        chapterIndex: activeBlock.chapterIndex,
        paragraphIndex: activeBlock.blockIndex,
        charOffset: 0,
        percentage: Math.min(100, Math.max(0, percentage)),
        currentBlock: activeIdx,
        totalBlocks: this.blocks.length,
        isAtBottom
      });
    }
  }

  render() {
    if (this.blocks.length === 0) return;

    const scrollTop = this.viewport.scrollTop;
    const viewportHeight = this.viewport.clientHeight;

    const startVisibleIdx = this.findBlockIndexForOffset(scrollTop);
    const endVisibleIdx = this.findBlockIndexForOffset(scrollTop + viewportHeight);

    const renderStart = Math.max(0, startVisibleIdx - 2);
    const renderEnd = Math.min(this.blocks.length - 1, endVisibleIdx + 2);

    this.activeRange = { start: renderStart, end: renderEnd };

    const neededIndices = new Set();
    for (let i = renderStart; i <= renderEnd; i++) {
      neededIndices.add(i);
    }

    // Retain nodes already showing needed blocks
    for (const item of this.pool) {
      if (item.assignedBlockIndex !== -1 && neededIndices.has(item.assignedBlockIndex)) {
        item.inUse = true;
        neededIndices.delete(item.assignedBlockIndex);
      } else {
        item.inUse = false;
      }
    }

    // Assign available pool nodes
    let heightUpdated = false;

    for (const blockIdx of neededIndices) {
      let poolItem = this.pool.find(p => !p.inUse);
      if (!poolItem) {
        const el = document.createElement('div');
        el.className = 'reader-block-container';
        el.style.position = 'absolute';
        el.style.left = '0';
        el.style.right = '0';
        el.style.willChange = 'transform';
        this.content.appendChild(el);
        poolItem = { element: el, assignedBlockIndex: -1, inUse: true };
        this.pool.push(poolItem);
      }

      poolItem.inUse = true;
      poolItem.assignedBlockIndex = blockIdx;
      const block = this.blocks[blockIdx];

      poolItem.element.innerHTML = block.html;
      poolItem.element.style.transform = `translateY(${block.top}px)`;
      poolItem.element.style.display = 'block';
      poolItem.element.dataset.blockId = block.id;
      poolItem.element.dataset.chapter = block.chapterIndex;
      poolItem.element.dataset.paragraph = block.blockIndex;

      // Handle next chapter action clicks inside scroller
      const nextJumpBtn = poolItem.element.querySelector('.next-chapter-jump-btn');
      if (nextJumpBtn) {
        nextJumpBtn.onclick = () => {
          if (window.appInstance) window.appInstance.goToNextChapter();
        };
      }
      const finishJumpBtn = poolItem.element.querySelector('.finish-book-jump-btn');
      if (finishJumpBtn) {
        finishJumpBtn.onclick = () => {
          if (window.appInstance) window.appInstance.closeReaderAndShowLibrary();
        };
      }

      const measured = poolItem.element.offsetHeight;
      if (measured > 0 && Math.abs(measured - (block.measuredHeight || block.estimatedHeight)) > 4) {
        block.measuredHeight = measured;
        heightUpdated = true;
      }
    }

    // Hide unused pool items
    for (const item of this.pool) {
      if (!item.inUse) {
        item.element.style.display = 'none';
        item.assignedBlockIndex = -1;
      }
    }

    // Re-sum prefix offsets if height changed
    if (heightUpdated) {
      this.recalculateHeights();
      for (const item of this.pool) {
        if (item.assignedBlockIndex !== -1) {
          const b = this.blocks[item.assignedBlockIndex];
          if (b) {
            item.element.style.transform = `translateY(${b.top}px)`;
          }
        }
      }
    }
  }

  scrollToStructuralPosition(position) {
    if (!position || this.blocks.length === 0) return;

    let targetIdx = -1;
    for (let i = 0; i < this.blocks.length; i++) {
      const b = this.blocks[i];
      if (b.chapterIndex === position.chapterIndex && b.blockIndex === position.paragraphIndex) {
        targetIdx = i;
        break;
      }
    }

    if (targetIdx === -1 && position.chapterIndex !== undefined) {
      for (let i = 0; i < this.blocks.length; i++) {
        if (this.blocks[i].chapterIndex === position.chapterIndex) {
          targetIdx = i;
          break;
        }
      }
    }

    if (targetIdx === -1 && position.percentage !== undefined && position.percentage > 0) {
      const maxScroll = Math.max(0, this.sizer.offsetHeight - this.viewport.clientHeight);
      this.viewport.scrollTop = (position.percentage / 100) * maxScroll;
      this.render();
      return;
    }

    if (targetIdx >= 0 && targetIdx < this.blocks.length) {
      const targetTop = this.prefixSums[targetIdx] || 0;
      this.viewport.scrollTop = targetTop;
      this.render();
    }
  }

  handleResize() {
    if (this.blocks.length === 0) return;
    const activeIdx = this.findBlockIndexForOffset(this.viewport.scrollTop);
    const activeBlock = this.blocks[activeIdx];

    for (const b of this.blocks) {
      b.measuredHeight = null;
    }
    this.recalculateHeights();

    if (activeBlock) {
      this.scrollToStructuralPosition({
        chapterIndex: activeBlock.chapterIndex,
        paragraphIndex: activeBlock.blockIndex
      });
    } else {
      this.render();
    }
  }

  destroy() {
    this.blocks = [];
    this.content.innerHTML = '';
    this.pool = [];
  }
}

// ============================================================================
// 2. WinRead Application Controller
// ============================================================================

class WinReadApp {
  constructor() {
    window.appInstance = this;
    this.currentBook = null;
    this.currentChapters = [];
    this.activeChapterIndex = 0;
    this.libraryBooks = [];
    this.activeTab = 'all';
    this.searchQuery = '';
    this.currentLang = localStorage.getItem('winread_lang') || 'ru';
    this.isSpreadMode = localStorage.getItem('winread_spread_mode') === 'true';
    this.detectedMtpDevice = null;

    try { this.initElements(); } catch (e) { console.error('initElements error:', e); }
    try { this.initTitlebar(); } catch (e) { console.error('initTitlebar error:', e); }
    try { this.initVirtualizer(); } catch (e) { console.error('initVirtualizer error:', e); }
    try { this.initSettings(); } catch (e) { console.error('initSettings error:', e); }
    try { this.applyLanguage(this.currentLang); } catch (e) { console.error('applyLanguage error:', e); }
    try { this.attachEventListeners(); } catch (e) { console.error('attachEventListeners error:', e); }
    try { this.listenToSyncEvents(); } catch (e) { console.error('listenToSyncEvents error:', e); }
    try { this.switchMainView('library'); } catch (e) { console.error('switchMainView error:', e); }

    try { this.refreshLibrary(); } catch (e) { console.error('refreshLibrary error:', e); }
  }

  initElements() {
    // Views
    this.libraryView = document.getElementById('libraryView');
    this.syncView = document.getElementById('syncView');
    this.readerView = document.getElementById('readerView');
    this.booksGrid = document.getElementById('booksGrid');
    this.emptyLibrary = document.getElementById('emptyLibrary');
    this.dropOverlay = document.getElementById('dropOverlay');
    this.appSidebar = document.getElementById('appSidebar');

    // Hero Continue Reading Card
    this.heroReadingCard = document.getElementById('heroReadingCard');
    this.heroCoverWrap = document.getElementById('heroCoverWrap');
    this.heroCoverFormat = document.getElementById('heroCoverFormat');
    this.heroCoverVol = document.getElementById('heroCoverVol');
    this.heroChapterTitle = document.getElementById('heroChapterTitle');
    this.heroBookTitle = document.getElementById('heroBookTitle');
    this.heroBookAuthor = document.getElementById('heroBookAuthor');
    this.heroProgressFill = document.getElementById('heroProgressFill');
    this.heroPctVal = document.getElementById('heroPctVal');
    this.heroEstTime = document.getElementById('heroEstTime');
    this.heroRelativeTime = document.getElementById('heroRelativeTime');
    this.heroContinueBtn = document.getElementById('heroContinueBtn');

    // Scroller
    this.viewportContainer = document.getElementById('viewportContainer');
    this.virtualScrollerSizer = document.getElementById('virtualScrollerSizer');
    this.virtualScrollerContent = document.getElementById('virtualScrollerContent');

    // Reader UI
    this.readerBookTitle = document.getElementById('readerBookTitle');
    this.readerChapterTitle = document.getElementById('readerChapterTitle');
    this.readerProgressBadge = document.getElementById('readerProgressBadge');
    this.footerChapterText = document.getElementById('footerChapterText');
    this.footerPercent = document.getElementById('footerPercent');
    this.footerBlockInfo = document.getElementById('footerBlockInfo');
    this.progressSlider = document.getElementById('progressSlider');
    this.prevChapterBtn = document.getElementById('prevChapterBtn');
    this.nextChapterBtn = document.getElementById('nextChapterBtn');
    this.viewSpreadBtn = document.getElementById('viewSpreadBtn');

    // Modals & Drawers
    this.tocModal = document.getElementById('tocModal');
    this.tocList = document.getElementById('tocList');
    this.tocBookSubtitle = document.getElementById('tocBookSubtitle');
    this.tocSearchInput = document.getElementById('tocSearchInput');
    this.typographyModal = document.getElementById('typographyModal');
    this.drawerOverlay = document.getElementById('drawerOverlay');
    this.drawerBookmarksList = document.getElementById('drawerBookmarksList');
    this.drawerQuotesList = document.getElementById('drawerQuotesList');

    // Sync Hub UI
    this.hubQrContainer = document.getElementById('hubQrContainer');
    this.hubPrimaryUrl = document.getElementById('hubPrimaryUrl');
    this.hubPortStatus = document.getElementById('hubPortStatus');
    this.hubAdapterSelect = document.getElementById('hubAdapterSelect');
    this.hubBluetoothReceiveBtn = document.getElementById('hubBluetoothReceiveBtn');
    this.hubAdbWirelessInput = document.getElementById('hubAdbWirelessInput');
    this.hubAdbWirelessBtn = document.getElementById('hubAdbWirelessBtn');
    this.hubPhoneName = document.getElementById('hubPhoneName');
    this.hubPhoneOs = document.getElementById('hubPhoneOs');
    this.hubPhoneBaks = document.getElementById('hubPhoneBaks');
    this.syncTerminalLog = document.getElementById('syncTerminalLog');
    this.metricBackupsCount = document.getElementById('metricBackupsCount');
    this.metricBooksCount = document.getElementById('metricBooksCount');
    this.metricQuotesCount = document.getElementById('metricQuotesCount');
  }

  initTitlebar() {
    document.querySelectorAll('.win-min').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        window.winread.minimizeWindow();
      });
    });

    document.querySelectorAll('.win-max').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        window.winread.maximizeWindow();
      });
    });

    document.querySelectorAll('.win-close').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        window.winread.closeWindow();
      });
    });

    document.querySelectorAll('.titlebar-drag-region, .reader-drag-region').forEach(area => {
      area.addEventListener('dblclick', () => {
        window.winread.maximizeWindow();
      });
    });

    const updateMaximizedUI = (isMaximized) => {
      document.body.classList.toggle('window-maximized', isMaximized);
      document.querySelectorAll('.max-icon').forEach(icon => {
        if (isMaximized) {
          icon.innerHTML = `
            <rect x="2.5" y="0.5" width="7" height="7" rx="0.5" fill="none" stroke="currentColor" stroke-width="1.1"/>
            <path d="M0.5 3.5V9.5H6.5" fill="none" stroke="currentColor" stroke-width="1.1"/>
          `;
        } else {
          icon.innerHTML = `
            <rect x="0.6" y="0.6" width="8.8" height="8.8" rx="1" fill="none" stroke="currentColor" stroke-width="1.2"/>
          `;
        }
      });
    };

    window.winread.onWindowStateChange((isMaximized) => updateMaximizedUI(isMaximized));
    const checkMax = window.winread.isMaximized || window.winread.isWindowMaximized;
    if (typeof checkMax === 'function') {
      checkMax().then(isMax => {
        if (typeof isMax === 'boolean') updateMaximizedUI(isMax);
      }).catch(() => {});
    }
  }

  initVirtualizer() {
    this.scroller = new VirtualScroller(
      this.viewportContainer,
      this.virtualScrollerSizer,
      this.virtualScrollerContent,
      (pos) => this.handleReadingPositionChange(pos)
    );
  }

  initSettings() {
    const savedTheme = localStorage.getItem('winread_theme') || 'theme-graphite';
    const savedFont = localStorage.getItem('winread_font') || 'font-sans';
    const savedFontSize = localStorage.getItem('winread_font_size') || '18';
    const savedLineHeight = localStorage.getItem('winread_line_height') || '1.6';
    const savedWidth = localStorage.getItem('winread_width') || '700';
    const savedMargins = localStorage.getItem('winread_margin') || '48';

    this.applyTheme(savedTheme);
    this.applyFont(savedFont);
    this.applyFontSize(savedFontSize);
    this.applyLineHeight(savedLineHeight);
    this.applyReadingWidth(savedWidth);
    this.applyPageMargins(savedMargins);

    // Sync input sliders
    const fsSlider = document.getElementById('fontSizeSlider');
    if (fsSlider) fsSlider.value = savedFontSize;
    const lhSlider = document.getElementById('lineHeightSlider');
    if (lhSlider) lhSlider.value = savedLineHeight;
    const rwSlider = document.getElementById('readingWidthSlider');
    if (rwSlider) rwSlider.value = savedWidth;
    const pmSlider = document.getElementById('pageMarginsSlider');
    if (pmSlider) pmSlider.value = savedMargins;

    const fsVal = document.getElementById('fontSizeVal');
    if (fsVal) fsVal.textContent = `${savedFontSize}px`;
    const lhVal = document.getElementById('lineHeightVal');
    if (lhVal) lhVal.textContent = savedLineHeight;
    const rwVal = document.getElementById('readingWidthVal');
    if (rwVal) rwVal.textContent = `${savedWidth}px`;
    const pmVal = document.getElementById('pageMarginsVal');
    if (pmVal) pmVal.textContent = `${savedMargins}px`;
  }

  applyLanguage(lang) {
    this.currentLang = lang;
    localStorage.setItem('winread_lang', lang);
    document.documentElement.lang = lang;

    const dict = I18N[lang] || I18N.ru;
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      if (dict[key]) el.textContent = dict[key];
    });

    document.querySelectorAll('[data-i18n-ph]').forEach(el => {
      const key = el.getAttribute('data-i18n-ph');
      if (dict[key]) el.placeholder = dict[key];
    });

    document.querySelectorAll('.lang-pill-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.lang === lang);
    });
  }

  applyTheme(theme) {
    document.body.classList.remove('theme-graphite', 'theme-oled', 'theme-sepia', 'theme-paper');
    document.body.classList.add(theme);
    localStorage.setItem('winread_theme', theme);

    document.querySelectorAll('.theme-card').forEach(card => {
      card.classList.toggle('active', card.dataset.theme === theme);
    });

    const themeNames = {
      'theme-graphite': 'Графит (активна)',
      'theme-oled': 'OLED Чёрный (активна)',
      'theme-sepia': 'Сепия (активна)',
      'theme-paper': 'Бумага (активна)'
    };
    const activeLabel = document.getElementById('activeThemeName');
    if (activeLabel) activeLabel.textContent = themeNames[theme] || theme;
  }

  applyFont(fontClass) {
    document.body.classList.remove('font-sans', 'font-serif', 'font-mono');
    document.body.classList.add(fontClass);
    localStorage.setItem('winread_font', fontClass);

    document.querySelectorAll('.font-choice-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.font === fontClass);
    });
    if (this.scroller) this.scroller.handleResize();
  }

  applyFontSize(size) {
    document.documentElement.style.setProperty('--reader-font-size', `${size}px`);
    localStorage.setItem('winread_font_size', size);
    if (this.scroller) this.scroller.handleResize();
  }

  applyLineHeight(lh) {
    document.documentElement.style.setProperty('--reader-line-height', lh);
    localStorage.setItem('winread_line_height', lh);
    if (this.scroller) this.scroller.handleResize();
  }

  applyReadingWidth(w) {
    document.documentElement.style.setProperty('--reader-content-width', `${w}px`);
    localStorage.setItem('winread_width', w);
    if (this.scroller) this.scroller.handleResize();
  }

  applyPageMargins(m) {
    document.documentElement.style.setProperty('--reader-page-margin', `${m}px`);
    localStorage.setItem('winread_margin', m);
    if (this.scroller) this.scroller.handleResize();
  }

  // ==========================================================================
  // Event Listeners & Navigation
  // ==========================================================================

  attachEventListeners() {
    // Sidebar Navigation with Categories
    document.getElementById('navAll')?.addEventListener('click', () => {
      this.switchMainView('library');
      this.setActiveNav('navAll');
      this.setLibraryTab('all');
    });

    document.getElementById('navReading')?.addEventListener('click', () => {
      this.switchMainView('library');
      this.setActiveNav('navReading');
      this.setLibraryTab('reading');
    });

    document.getElementById('navToRead')?.addEventListener('click', () => {
      this.switchMainView('library');
      this.setActiveNav('navToRead');
      this.setLibraryTab('to_read');
    });

    document.getElementById('navHaveRead')?.addEventListener('click', () => {
      this.switchMainView('library');
      this.setActiveNav('navHaveRead');
      this.setLibraryTab('have_read');
    });

    document.getElementById('navFavorites')?.addEventListener('click', () => {
      this.switchMainView('library');
      this.setActiveNav('navFavorites');
      this.setLibraryTab('favorites');
    });

    document.getElementById('navAuthors')?.addEventListener('click', () => {
      this.switchMainView('library');
      this.setActiveNav('navAuthors');
      this.sortByAuthor();
    });

    document.getElementById('navSync')?.addEventListener('click', () => {
      this.switchMainView('sync');
      this.setActiveNav('navSync');
      this.loadSyncHubData();
    });

    document.getElementById('syncStatusPill')?.addEventListener('click', () => {
      this.switchMainView('sync');
      this.setActiveNav('navSync');
      this.loadSyncHubData();
    });

    document.getElementById('navSettings')?.addEventListener('click', () => {
      this.openTypographyModal();
    });

    // Sidebar Toggle
    document.getElementById('sidebarToggleBtn')?.addEventListener('click', () => {
      this.appSidebar?.classList.toggle('collapsed');
    });

    // Search Input
    const searchInput = document.getElementById('librarySearchInput');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.searchQuery = e.target.value.trim().toLowerCase();
        this.renderLibrary();
      });
    }

    // Ctrl+K Shortcut for Search
    window.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && (e.key === 'k' || e.key === 'K')) {
        e.preventDefault();
        searchInput?.focus();
        searchInput?.select();
      }
    });

    // Open Book Buttons
    document.getElementById('openBookBtn')?.addEventListener('click', () => this.handleOpenFileDialog());
    document.getElementById('emptyOpenBtn')?.addEventListener('click', () => this.handleOpenFileDialog());
    document.getElementById('emptyImportBackupBtn')?.addEventListener('click', () => this.handleImportBackupDialog());

    // Reader Toolbar & Chapter Navigation
    document.getElementById('backToLibraryBtn')?.addEventListener('click', () => this.closeReaderAndShowLibrary());
    document.getElementById('tocBtn')?.addEventListener('click', () => this.openTocModal());
    document.getElementById('viewSpreadBtn')?.addEventListener('click', () => this.toggleSpreadMode());
    document.getElementById('typographyBtn')?.addEventListener('click', () => this.openTypographyModal());
    document.getElementById('bookmarksDrawerBtn')?.addEventListener('click', () => this.openDrawer());
    document.getElementById('addQuickBookmarkBtn')?.addEventListener('click', () => this.addQuickBookmark());
    document.getElementById('fullscreenBtn')?.addEventListener('click', () => this.toggleFullscreen());

    // Next / Previous Chapter Buttons in Reader Footer
    this.prevChapterBtn?.addEventListener('click', () => this.goToPrevChapter());
    this.nextChapterBtn?.addEventListener('click', () => this.goToNextChapter());

    // Progress Range Slider
    this.progressSlider?.addEventListener('input', (e) => {
      const pct = parseFloat(e.target.value);
      if (this.isSpreadMode) {
        const maxScroll = Math.max(0, this.viewportContainer.scrollWidth - this.viewportContainer.clientWidth);
        this.viewportContainer.scrollLeft = (pct / 100) * maxScroll;
      } else {
        const maxScroll = Math.max(0, this.virtualScrollerSizer.offsetHeight - this.viewportContainer.clientHeight);
        this.viewportContainer.scrollTop = (pct / 100) * maxScroll;
      }
    });

    // Modal Close Buttons
    document.querySelectorAll('.close-modal-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const modalId = e.currentTarget.dataset.close;
        if (modalId) document.getElementById(modalId)?.classList.add('hidden');
      });
    });

    // Drawer Close
    document.getElementById('closeDrawerBtn')?.addEventListener('click', () => {
      this.drawerOverlay?.classList.add('hidden');
    });
    this.drawerOverlay?.addEventListener('click', (e) => {
      if (e.target === this.drawerOverlay) this.drawerOverlay.classList.add('hidden');
    });

    // Language Toggle inside Modal
    document.querySelectorAll('.lang-pill-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        this.applyLanguage(e.currentTarget.dataset.lang);
      });
    });

    // Theme Picker inside Modal
    document.querySelectorAll('.theme-card').forEach(card => {
      card.addEventListener('click', (e) => {
        this.applyTheme(e.currentTarget.dataset.theme);
      });
    });

    // Font Picker inside Modal
    document.querySelectorAll('.font-choice-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        this.applyFont(e.currentTarget.dataset.font);
      });
    });

    // Settings Sliders
    document.getElementById('fontSizeSlider')?.addEventListener('input', (e) => {
      this.applyFontSize(e.target.value);
      const l = document.getElementById('fontSizeVal');
      if (l) l.textContent = `${e.target.value}px`;
    });
    document.getElementById('lineHeightSlider')?.addEventListener('input', (e) => {
      this.applyLineHeight(e.target.value);
      const l = document.getElementById('lineHeightVal');
      if (l) l.textContent = e.target.value;
    });
    document.getElementById('readingWidthSlider')?.addEventListener('input', (e) => {
      this.applyReadingWidth(e.target.value);
      const l = document.getElementById('readingWidthVal');
      if (l) l.textContent = `${e.target.value}px`;
    });
    document.getElementById('pageMarginsSlider')?.addEventListener('input', (e) => {
      this.applyPageMargins(e.target.value);
      const l = document.getElementById('pageMarginsVal');
      if (l) l.textContent = `${e.target.value}px`;
    });

    // Reset Defaults
    document.getElementById('resetDefaultsBtn')?.addEventListener('click', () => {
      this.applyFontSize(18);
      this.applyLineHeight(1.6);
      this.applyReadingWidth(700);
      this.applyPageMargins(48);
      this.applyTheme('theme-graphite');
      this.applyFont('font-sans');
      this.initSettings();
    });
    document.getElementById('applySettingsBtn')?.addEventListener('click', () => {
      this.typographyModal?.classList.add('hidden');
      this.showToast('Настройки оформления применены');
    });

    // TOC Search Input
    this.tocSearchInput?.addEventListener('input', (e) => this.populateToc(e.target.value));

    // Two-Page Spread Viewport Navigation
    this.viewportContainer?.addEventListener('click', (e) => {
      if (!this.isSpreadMode) return;
      if (e.target.closest('button, a, input, select')) return;
      const rect = this.viewportContainer.getBoundingClientRect();
      const x = e.clientX - rect.left;
      if (x < rect.width * 0.25) {
        this.prevSpread();
      } else if (x > rect.width * 0.75) {
        this.nextSpread();
      }
    });

    this.viewportContainer?.addEventListener('wheel', (e) => {
      if (!this.isSpreadMode) return;
      e.preventDefault();
      if (e.deltaY > 0 || e.deltaX > 0) this.nextSpread();
      else if (e.deltaY < 0 || e.deltaX < 0) this.prevSpread();
    }, { passive: false });

    // Sync Hub Actions
    document.getElementById('hubCheckChannelBtn')?.addEventListener('click', () => this.loadSyncHubData());
    document.getElementById('hubForceSyncBtn')?.addEventListener('click', () => this.handleForceSync());
    document.getElementById('hubSyncUsbBtn')?.addEventListener('click', () => this.handleMtpSync());
    document.getElementById('hubCopyUrlBtn')?.addEventListener('click', () => this.copyCompanionUrl());
    document.getElementById('hubSelectBackupBtn')?.addEventListener('click', () => this.handleImportBackupDialog());
    document.getElementById('hubBackupDropArea')?.addEventListener('click', () => this.handleImportBackupDialog());
    this.hubAdapterSelect?.addEventListener('change', (e) => this.loadSyncHubData(e.target.value));
    this.hubBluetoothReceiveBtn?.addEventListener('click', () => this.handleBluetoothReceive());
    this.hubAdbWirelessBtn?.addEventListener('click', () => this.handleAdbWirelessConnect());

    // Drag and Drop
    window.addEventListener('dragover', (e) => {
      e.preventDefault();
      this.dropOverlay?.classList.remove('hidden');
    });
    window.addEventListener('dragleave', (e) => {
      if (e.relatedTarget === null) this.dropOverlay?.classList.add('hidden');
    });
    window.addEventListener('drop', (e) => {
      e.preventDefault();
      this.dropOverlay?.classList.add('hidden');
      if (e.dataTransfer.files.length > 0) {
        this.handleDroppedFile(e.dataTransfer.files[0].path);
      }
    });

    // Keyboard Shortcuts
    window.addEventListener('keydown', (e) => {
      const isReaderActive = this.readerView && !this.readerView.classList.contains('hidden');
      if (e.key === 'Escape') {
        if (isReaderActive) {
          this.closeReaderAndShowLibrary();
        }
        document.querySelectorAll('.modal').forEach(m => m.classList.add('hidden'));
        this.drawerOverlay?.classList.add('hidden');
      } else if (e.key === 'b' || e.key === 'B') {
        if (isReaderActive && !e.target.matches('input, textarea')) {
          this.toggleSpreadMode();
        }
      } else if (e.key === '[' || (e.shiftKey && e.key === 'ArrowLeft')) {
        if (isReaderActive && !e.target.matches('input')) {
          if (this.isSpreadMode) this.prevSpread();
          else this.goToPrevChapter();
        }
      } else if (e.key === ']' || (e.shiftKey && e.key === 'ArrowRight')) {
        if (isReaderActive && !e.target.matches('input')) {
          if (this.isSpreadMode) this.nextSpread();
          else this.goToNextChapter();
        }
      } else if (e.key === 'f' || e.key === 'F') {
        if (!e.target.matches('input, textarea')) this.toggleFullscreen();
      } else if (e.key === 'PageDown' || e.key === 'ArrowDown') {
        if (isReaderActive && !e.target.matches('input')) {
          this.viewportContainer?.scrollBy({ top: 320, behavior: 'smooth' });
        }
      } else if (e.key === 'PageUp' || e.key === 'ArrowUp') {
        if (isReaderActive && !e.target.matches('input')) {
          this.viewportContainer?.scrollBy({ top: -320, behavior: 'smooth' });
        }
      } else if (e.key === ' ' && !e.target.matches('input')) {
        if (isReaderActive) {
          e.preventDefault();
          const delta = e.shiftKey ? -this.viewportContainer.clientHeight * 0.8 : this.viewportContainer.clientHeight * 0.8;
          this.viewportContainer?.scrollBy({ top: delta, behavior: 'smooth' });
        }
      }
    });
  }

  switchMainView(viewName) {
    if (this.libraryView) this.libraryView.classList.toggle('hidden', viewName !== 'library');
    if (this.syncView) this.syncView.classList.toggle('hidden', viewName !== 'sync');
    if (this.readerView) this.readerView.classList.toggle('hidden', viewName !== 'reader');

    if (viewName === 'reader' && this.scroller) {
      requestAnimationFrame(() => {
        this.scroller.handleResize();
      });
    }
  }

  setActiveNav(id) {
    document.querySelectorAll('.sidebar-item').forEach(item => item.classList.remove('active'));
    document.getElementById(id)?.classList.add('active');
  }

  setLibraryTab(tab) {
    this.activeTab = tab;
    document.querySelectorAll('.status-tab-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.tab === tab);
    });
    this.renderLibrary();
  }

  // ==========================================================================
  // Library Rendering & Book Loading
  // ==========================================================================

  async refreshLibrary() {
    try {
      const res = await window.winread.getLibrary('all');
      this.libraryBooks = res?.books || [];
      this.updateStorageStats();
      this.updateHeroReadingCard();
      this.renderLibrary();
    } catch (err) {
      console.error('Failed to get library:', err);
    }
  }

  updateStorageStats() {
    const count = this.libraryBooks.length;
    const countLabel = document.getElementById('storageBooksCount');
    if (countLabel) countLabel.textContent = `${count} томов`;

    // Counts by category in sidebar
    const all = this.libraryBooks.length;
    const reading = this.libraryBooks.filter(b => b.reading_status === 'reading').length;
    const toRead = this.libraryBooks.filter(b => b.reading_status === 'to_read').length;
    const haveRead = this.libraryBooks.filter(b => b.reading_status === 'have_read').length;
    const favorites = this.libraryBooks.filter(b => b.is_favorite).length;

    const elAll = document.getElementById('countAll'); if (elAll) elAll.textContent = all;
    const elReading = document.getElementById('countReading'); if (elReading) elReading.textContent = reading;
    const elToRead = document.getElementById('countToRead'); if (elToRead) elToRead.textContent = toRead;
    const elHaveRead = document.getElementById('countHaveRead'); if (elHaveRead) elHaveRead.textContent = haveRead;
    const elFavorites = document.getElementById('countFavorites'); if (elFavorites) elFavorites.textContent = favorites;
  }

  updateHeroReadingCard() {
    if (!this.heroReadingCard) return;

    // Pick the most recently read active book
    const recentBook = this.libraryBooks
      .slice()
      .sort((a, b) => (b.last_read_at || 0) - (a.last_read_at || 0))[0];

    if (!recentBook) {
      this.heroReadingCard.classList.add('hidden');
      return;
    }

    this.heroReadingCard.classList.remove('hidden');
    this.heroBookTitle.textContent = recentBook.title || 'Untitled';
    this.heroBookAuthor.textContent = recentBook.author || 'Неизвестный автор';
    this.heroCoverFormat.textContent = (recentBook.format || 'FB2').toUpperCase();

    const progress = Math.round(recentBook.progress_percent || 0);
    this.heroProgressFill.style.width = `${progress}%`;
    this.heroPctVal.textContent = `${progress}%`;
    this.heroRelativeTime.textContent = formatTimeAgo(recentBook.last_read_at, this.currentLang);

    if (recentBook.cover_data) {
      this.heroCoverWrap.innerHTML = `
        <div class="hero-cover-format-badge">${(recentBook.format || 'FB2').toUpperCase()}</div>
        <img src="${recentBook.cover_data}" alt="Cover" />
      `;
    }

    this.heroContinueBtn.onclick = () => {
      this.handleBookCardClick(recentBook);
    };
  }

  renderLibrary() {
    if (!this.booksGrid) return;
    this.booksGrid.innerHTML = '';

    let filtered = this.libraryBooks;
    if (this.activeTab === 'favorites') {
      filtered = filtered.filter(b => b.is_favorite);
    } else if (this.activeTab !== 'all') {
      filtered = filtered.filter(b => b.reading_status === this.activeTab);
    }

    if (this.searchQuery) {
      filtered = filtered.filter(b =>
        (b.title && b.title.toLowerCase().includes(this.searchQuery)) ||
        (b.author && b.author.toLowerCase().includes(this.searchQuery))
      );
    }

    // Default sort by last read date descending
    filtered = filtered.slice().sort((a, b) => (b.last_read_at || 0) - (a.last_read_at || 0));

    if (filtered.length === 0) {
      this.emptyLibrary?.classList.remove('hidden');
      this.booksGrid?.classList.add('hidden');
      return;
    }

    this.emptyLibrary?.classList.add('hidden');
    this.booksGrid?.classList.remove('hidden');

    for (const book of filtered) {
      const card = document.createElement('div');
      card.className = 'book-card';
      card.dataset.id = book.id;

      const progress = Math.round(book.progress_percent || 0);

      card.innerHTML = `
        <div class="book-ribbon"></div>
        <div class="book-cover">
          ${book.cover_data
            ? `<img src="${book.cover_data}" alt="${escapeHtml(book.title)}" loading="lazy" />`
            : `<div class="cover-placeholder">
                 <svg width="42" height="42" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>
               </div>`
          }
          <div class="cover-format-badge">${(book.format || 'fb2').toUpperCase()}</div>
        </div>
        <div class="book-card-info">
          <div class="card-title" title="${escapeHtml(book.title)}">${escapeHtml(book.title)}</div>
          <div class="card-author">${escapeHtml(book.author || 'Неизвестный автор')}</div>
          <div class="card-progress-bar">
            <div class="card-progress-fill" style="width: ${progress}%"></div>
          </div>
          <div class="card-meta-row">
            <span>${progress}%</span>
            <span>${formatTimeAgo(book.last_read_at, this.currentLang)}</span>
          </div>
        </div>
      `;

      card.addEventListener('click', async () => {
        await this.handleBookCardClick(book);
      });

      this.booksGrid.appendChild(card);
    }
  }

  // ==========================================================================
  // Book Opening & Direct Fast Resume (NO Chapter Chooser Screen!)
  // ==========================================================================

  async handleBookCardClick(book) {
    if (book.path) {
      try {
        await this.openBookFile(book.path);
        return;
      } catch (err) {
        console.warn(`Local file at "${book.path}" failed to open:`, err.message);
      }
    }

    this.showToast(`Загрузка книги «${book.title}» по USB...`, 3500);

    try {
      const res = await window.winread.fetchBookFromPhone({
        bookId: book.id,
        title: book.title,
        format: book.format
      });

      if (res && res.filePath) {
        book.path = res.filePath;
        this.showToast('Книга загружена!', 2000);
        await this.openBookFile(res.filePath);
        return;
      }
    } catch (err) {
      console.warn('Error fetching book from phone:', err);
    }

    // Manual select fallback
    const selectedPath = await window.winread.openFileDialog();
    if (selectedPath) {
      await window.winread.associateBookFile(book.id, selectedPath);
      book.path = selectedPath;
      await this.openBookFile(selectedPath);
    }
  }

  async openBookFile(filePath) {
    try {
      const res = await window.winread.openBook(filePath);
      const bookInfo = res.bookInfo;
      this.currentBook = bookInfo;
      this.currentChapters = bookInfo.chapters || [];

      this.readerBookTitle.textContent = bookInfo.title;

      // FAST RESUME: Calculate exact chapter without opening TOC modal
      const savedState = bookInfo.readingState;
      let initialChapter = savedState?.current_chapter || 0;

      // If chapter index is out of bounds or zero with progress, extrapolate from percentage
      if (initialChapter >= this.currentChapters.length && this.currentChapters.length > 0) {
        const ratio = (savedState?.progress_percent || 0) / 100;
        initialChapter = Math.max(0, Math.min(this.currentChapters.length - 1, Math.floor(ratio * this.currentChapters.length)));
      } else if (initialChapter === 0 && savedState?.progress_percent > 2 && this.currentChapters.length > 1) {
        initialChapter = Math.min(this.currentChapters.length - 1, Math.floor((savedState.progress_percent / 100) * this.currentChapters.length));
      }

      // Switch directly to reader view without chapter modal
      this.tocModal?.classList.add('hidden');
      this.switchMainView('reader');
      this.applySpreadMode();

      await this.loadChapter(initialChapter, {
        chapterIndex: initialChapter,
        paragraphIndex: savedState?.current_paragraph || 0,
        percentage: savedState?.progress_percent || 0
      });

      this.updateChapterNavButtons();
    } catch (err) {
      alert(`Не удалось открыть книгу: ${err.message}`);
    }
  }

  async loadChapter(chapterIndex, targetPosition = null) {
    try {
      this.activeChapterIndex = chapterIndex;
      const chapterMeta = this.currentChapters[chapterIndex];
      const chTitle = chapterMeta ? chapterMeta.title : `Глава ${chapterIndex + 1}`;

      this.readerChapterTitle.textContent = chTitle;
      this.footerChapterText.textContent = chTitle;

      const res = await window.winread.loadChapter(chapterIndex);
      let blocks = res.blocks || [];

      // Append Terminal Next Chapter Action Block at the end of the chapter
      const hasNextChapter = chapterIndex < this.currentChapters.length - 1;
      const nextTitle = hasNextChapter ? (this.currentChapters[chapterIndex + 1]?.title || `Глава ${chapterIndex + 2}`) : '';

      blocks.push({
        id: `ch${chapterIndex}_terminal_next`,
        chapterIndex,
        blockIndex: blocks.length,
        type: 'terminal-action',
        text: hasNextChapter ? `[Следующая глава: ${nextTitle}]` : '[Конец книги]',
        html: hasNextChapter ? `
          <div class="chapter-end-card">
            <div class="chapter-end-badge">Глава прочитана</div>
            <div class="chapter-end-title">Следующая: ${escapeHtml(nextTitle)}</div>
            <button class="chapter-next-btn">
              <span>Читать следующую главу</span>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><polyline points="9 18 15 12 9 6"></polyline></svg>
            </button>
          </div>
        ` : `
          <div class="chapter-end-card">
            <div class="chapter-end-badge" style="color: var(--accent-green)">Книга завершена!</div>
            <div class="chapter-end-title">Поздравляем с завершением книги!</div>
            <button class="chapter-finish-btn">
              <span>Вернуться в библиотеку</span>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path></svg>
            </button>
          </div>
        `,
        estimatedHeight: 180
      });

      this.scroller.setBlocks(blocks, targetPosition);
      if (this.isSpreadMode) {
        this.renderSpreadBlocks();
      }
      this.updateChapterNavButtons();
    } catch (err) {
      console.error(`Failed to load chapter ${chapterIndex}:`, err);
    }
  }

  updateChapterNavButtons() {
    if (this.prevChapterBtn) {
      this.prevChapterBtn.disabled = this.activeChapterIndex <= 0;
      this.prevChapterBtn.style.opacity = this.activeChapterIndex <= 0 ? '0.4' : '1';
    }
    if (this.nextChapterBtn) {
      const isLast = this.activeChapterIndex >= this.currentChapters.length - 1;
      this.nextChapterBtn.disabled = isLast;
      this.nextChapterBtn.style.opacity = isLast ? '0.4' : '1';
    }
  }

  goToNextChapter() {
    if (this.activeChapterIndex < this.currentChapters.length - 1) {
      this.loadChapter(this.activeChapterIndex + 1);
    } else {
      this.showToast('Вы дочитали книгу до конца!');
    }
  }

  goToPrevChapter() {
    if (this.activeChapterIndex > 0) {
      this.loadChapter(this.activeChapterIndex - 1);
    }
  }

  handleReadingPositionChange(pos) {
    const pct = Math.round(pos.percentage);
    this.readerProgressBadge.textContent = `${pct}%`;
    this.footerPercent.textContent = `${pct}%`;

    const blockText = I18N[this.currentLang].footer_block_info
      .replace('{current}', Math.min(pos.totalBlocks, pos.currentBlock + 1))
      .replace('{total}', pos.totalBlocks);
    this.footerBlockInfo.textContent = blockText;
    this.progressSlider.value = pos.percentage;

    // Calculate overall book percentage across chapters
    const totalChapters = this.currentChapters.length;
    let overallPercent = pos.percentage;
    if (totalChapters > 0) {
      overallPercent = Math.min(100, Math.max(0, ((this.activeChapterIndex + (pos.percentage / 100)) / totalChapters) * 100));
    }

    if (this.currentBook) {
      clearTimeout(this.saveProgressTimer);
      this.saveProgressTimer = setTimeout(() => {
        window.winread.updateProgress(this.currentBook.id, {
          chapterIndex: pos.chapterIndex,
          paragraphIndex: pos.paragraphIndex,
          charOffset: 0,
          percentage: overallPercent
        });
      }, 500);
    }
  }

  closeReaderAndShowLibrary() {
    this.switchMainView('library');
    this.refreshLibrary();
  }

  // ==========================================================================
  // Two-Page Spread Mode Methods («Разворот книги»)
  // ==========================================================================

  toggleSpreadMode() {
    this.isSpreadMode = !this.isSpreadMode;
    localStorage.setItem('winread_spread_mode', String(this.isSpreadMode));
    this.applySpreadMode();
    this.showToast(this.isSpreadMode ? 'Режим чтения: Разворот книги' : 'Режим чтения: Обычный свиток');
  }

  applySpreadMode() {
    if (!this.readerView) return;
    this.readerView.classList.toggle('spread-mode', this.isSpreadMode);
    this.viewSpreadBtn?.classList.toggle('mode-active', this.isSpreadMode);

    if (this.isSpreadMode) {
      this.renderSpreadBlocks();
    } else {
      if (this.virtualScrollerContent) {
        this.virtualScrollerContent.innerHTML = '';
      }
      this.scroller.pool = [];
      this.scroller.recalculateHeights();
      this.scroller.render();
    }
  }

  renderSpreadBlocks() {
    if (!this.virtualScrollerContent) return;
    this.virtualScrollerContent.innerHTML = '';

    const blocks = this.scroller.blocks || [];
    blocks.forEach((block) => {
      const blockEl = document.createElement('div');
      blockEl.className = 'reader-block';
      blockEl.innerHTML = block.html;
      blockEl.dataset.blockId = block.id;
      blockEl.dataset.chapter = block.chapterIndex;
      blockEl.dataset.paragraph = block.blockIndex;

      const nextBtn = blockEl.querySelector('.chapter-next-btn, .next-chapter-jump-btn');
      if (nextBtn) {
        nextBtn.onclick = (e) => {
          e.stopPropagation();
          this.goToNextChapter();
        };
      }
      const finishBtn = blockEl.querySelector('.chapter-finish-btn, .finish-book-jump-btn');
      if (finishBtn) {
        finishBtn.onclick = (e) => {
          e.stopPropagation();
          this.closeReaderAndShowLibrary();
        };
      }
      this.virtualScrollerContent.appendChild(blockEl);
    });

    this.viewportContainer.scrollLeft = 0;
    this.updateSpreadProgress();
  }

  nextSpread() {
    if (!this.viewportContainer) return;
    const step = (this.viewportContainer.clientWidth || 800) * 0.9;
    this.viewportContainer.scrollBy({ left: step, behavior: 'smooth' });
    this.updateSpreadProgress();
  }

  prevSpread() {
    if (!this.viewportContainer) return;
    const step = (this.viewportContainer.clientWidth || 800) * 0.9;
    this.viewportContainer.scrollBy({ left: -step, behavior: 'smooth' });
    this.updateSpreadProgress();
  }

  updateSpreadProgress() {
    if (!this.viewportContainer) return;
    setTimeout(() => {
      const max = Math.max(1, this.viewportContainer.scrollWidth - this.viewportContainer.clientWidth);
      const cur = this.viewportContainer.scrollLeft;
      const isAtEnd = cur >= max - 25;
      const pct = isAtEnd ? 100 : Math.min(99.9, Math.max(0, (cur / max) * 100));
      const roundPct = Math.round(pct);

      if (this.readerProgressBadge) this.readerProgressBadge.textContent = `${roundPct}%`;
      if (this.footerPercent) this.footerPercent.textContent = `${roundPct}%`;
      if (this.progressSlider) this.progressSlider.value = pct;

      const totalChapters = this.currentChapters.length;
      let overallPercent = pct;
      if (totalChapters > 0) {
        overallPercent = Math.min(100, Math.max(0, ((this.activeChapterIndex + (pct / 100)) / totalChapters) * 100));
      }

      if (this.currentBook) {
        clearTimeout(this.saveProgressTimer);
        this.saveProgressTimer = setTimeout(() => {
          window.winread.updateProgress(this.currentBook.id, {
            chapterIndex: this.activeChapterIndex,
            paragraphIndex: 0,
            charOffset: 0,
            percentage: overallPercent
          });
        }, 500);
      }
    }, 120);
  }

  // ==========================================================================
  // ReadEra Sync Hub Logic (Photo 2 Reference)
  // ==========================================================================

  async loadSyncHubData(preferredIp = null) {
    try {
      const info = await window.winread.getSyncInfo(preferredIp);

      if (info?.server) {
        if (this.hubPrimaryUrl) this.hubPrimaryUrl.textContent = info.server.primaryUrl;
        if (this.hubPortStatus) this.hubPortStatus.textContent = `Порт ${info.server.port} активен`;
        if (this.hubQrContainer) this.hubQrContainer.innerHTML = info.server.qrSvg || '';

        if (this.hubAdapterSelect && info.server.adapters) {
          this.hubAdapterSelect.innerHTML = info.server.adapters.map(ad =>
            `<option value="${ad.ip}" ${ad.ip === info.server.ip ? 'selected' : ''}>${ad.name} (${ad.ip})</option>`
          ).join('');
          if (info.server.ip) {
            this.hubAdapterSelect.value = info.server.ip;
          }
        }
      }

      if (info?.mtp && info.mtp.available && info.mtp.devices.length > 0) {
        const dev = info.mtp.devices[0];
        this.detectedMtpDevice = dev;
        if (this.hubPhoneName) this.hubPhoneName.textContent = `${dev.deviceName} (${dev.storageName})`;
        if (this.hubPhoneBaks) this.hubPhoneBaks.innerHTML = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg><span>Обнаружено ${dev.bakCount} бэкапов ReadEra (.bak)</span>`;
        if (this.metricBackupsCount) this.metricBackupsCount.textContent = `${dev.bakCount} бэкапов`;
        this.logTerminal(`Обнаружен телефон: ${dev.deviceName} (доступно бэкапов: ${dev.bakCount})`, 'success');
      } else {
        if (this.hubPhoneName) this.hubPhoneName.textContent = 'Телефон не подключен';
        this.logTerminal('Телефон не подключен или не выбрана передача файлов MTP', 'info');
      }

      if (this.metricBooksCount) this.metricBooksCount.textContent = `${this.libraryBooks.length} книг`;
    } catch (err) {
      this.logTerminal(`Ошибка проверки канала: ${err.message}`, 'highlight');
    }
  }

  async handleBluetoothReceive() {
    this.showToast('Запуск службы приема Bluetooth...');
    this.logTerminal('Запуск мастера приема файлов Bluetooth (fsquirt)...', 'info');
    try {
      const res = await window.winread.openBluetoothReceive();
      if (res.success) {
        this.logTerminal('Служба Bluetooth готова к приему файлов .bak с телефона.', 'success');
        this.showToast('Мастер приема Bluetooth открыт', 3000);
      } else {
        this.logTerminal(`Ошибка Bluetooth: ${res.error}`, 'highlight');
        this.showToast(`Ошибка: ${res.error}`, 3500);
      }
    } catch (err) {
      this.logTerminal(`Исключение Bluetooth: ${err.message}`, 'highlight');
    }
  }

  async handleAdbWirelessConnect() {
    const ip = this.hubAdbWirelessInput?.value.trim();
    if (!ip) {
      this.showToast('Укажите IP:порт (например, 192.168.1.50:5555)');
      return;
    }
    this.showToast(`Подключение к ${ip}...`);
    this.logTerminal(`Попытка ADB подключения к ${ip}...`, 'info');
    try {
      const res = await window.winread.connectAdbWireless(ip);
      if (res.success) {
        this.logTerminal(`ADB подключен: ${res.output || ip}`, 'success');
        this.showToast('Телефон подключен по ADB Wi-Fi!', 3000);
        await this.loadSyncHubData();
      } else {
        this.logTerminal(`Ошибка ADB: ${res.error}`, 'highlight');
        this.showToast(`Не удалось подключить ADB: ${res.error}`, 4000);
      }
    } catch (err) {
      this.logTerminal(`Ошибка ADB: ${err.message}`, 'highlight');
    }
  }

  async handleMtpSync() {
    if (!this.detectedMtpDevice) {
      this.showToast('Телефон не обнаружен. Подключите USB кабель.');
      return;
    }
    this.showToast('Копирование и синхронизация с телефоном...');
    this.logTerminal(`Копирование бэкапа с ${this.detectedMtpDevice.deviceName}...`, 'info');

    try {
      const res = await window.winread.syncFromMtp(this.detectedMtpDevice.deviceName);
      const msg = `Синхронизировано: ${res.appliedCount} записей (${res.counts.books} книг, ${res.counts.quotes} цитат)`;
      this.logTerminal(msg, 'success');
      this.showToast(msg, 3000);
      await this.refreshLibrary();
    } catch (err) {
      this.logTerminal(`Ошибка синхронизации: ${err.message}`, 'highlight');
    }
  }

  async handleForceSync() {
    this.showToast('Принудительное обновление синхронизации...');
    await this.loadSyncHubData();
    if (this.detectedMtpDevice) {
      await this.handleMtpSync();
    }
  }

  copyCompanionUrl() {
    const url = this.hubPrimaryUrl?.textContent;
    if (url) {
      navigator.clipboard.writeText(url);
      this.showToast('Адрес скопирован в буфер обмена');
    }
  }

  logTerminal(message, type = 'info') {
    if (!this.syncTerminalLog) return;
    const now = new Date();
    const timeStr = `[${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}]`;
    const line = document.createElement('div');
    line.className = 'log-line';
    line.innerHTML = `<span class="log-time">${timeStr}</span> <span class="log-${type}">${escapeHtml(message)}</span>`;
    this.syncTerminalLog.appendChild(line);
    this.syncTerminalLog.scrollTop = this.syncTerminalLog.scrollHeight;
  }

  listenToSyncEvents() {
    window.winread.onSyncEvent((eventName, payload) => {
      this.logTerminal(`Событие ${eventName}: ${JSON.stringify(payload)}`, 'info');
      if (eventName === 'sync:updated') {
        this.refreshLibrary();
      }
    });
  }

  // ==========================================================================
  // Modals & Helpers
  // ==========================================================================

  populateToc(filterQuery = '') {
    if (!this.tocList) return;
    this.tocList.innerHTML = '';
    const query = (filterQuery || '').trim().toLowerCase();

    let matches = 0;
    this.currentChapters.forEach((ch, idx) => {
      const title = ch.title || `Глава ${idx + 1}`;
      if (query && !title.toLowerCase().includes(query)) return;

      matches++;
      const isActive = idx === this.activeChapterIndex;
      const item = document.createElement('div');
      item.className = `toc-item ${isActive ? 'active' : ''}`;
      item.innerHTML = `
        <span class="toc-chapter-num">${String(idx + 1).padStart(2, '0')}</span>
        <span class="toc-chapter-title">${escapeHtml(title)}</span>
        ${isActive ? '<span class="toc-active-pill">Читаю</span>' : ''}
      `;
      item.addEventListener('click', () => {
        this.tocModal?.classList.add('hidden');
        this.loadChapter(idx);
      });
      this.tocList.appendChild(item);
    });

    if (matches === 0) {
      this.tocList.innerHTML = `<div class="empty-drawer-text" style="padding: 32px 16px; text-align: center; color: var(--text-muted)">Главы не найдены</div>`;
    }
  }

  openTocModal() {
    if (this.tocBookSubtitle) {
      this.tocBookSubtitle.textContent = this.currentBook?.title || 'Книга';
    }
    if (this.tocSearchInput) {
      this.tocSearchInput.value = '';
    }
    this.populateToc();
    this.tocModal?.classList.remove('hidden');

    setTimeout(() => {
      const activeEl = this.tocList?.querySelector('.toc-item.active');
      if (activeEl) {
        activeEl.scrollIntoView({ block: 'center', behavior: 'smooth' });
      }
    }, 60);
  }

  openTypographyModal() {
    this.typographyModal?.classList.remove('hidden');
  }

  async openDrawer() {
    this.drawerOverlay?.classList.remove('hidden');
    await this.refreshBookmarks();
    await this.refreshQuotes();
  }

  async refreshBookmarks() {
    if (!this.currentBook || !this.drawerBookmarksList) return;
    try {
      const res = await window.winread.getBookmarks(this.currentBook.id);
      const bms = res?.bookmarks || [];
      this.drawerBookmarksList.innerHTML = bms.length === 0
        ? `<div class="empty-drawer-text">${I18N[this.currentLang].drawer_no_bookmarks}</div>`
        : bms.map(bm => `
            <div class="drawer-item" data-id="${bm.id}" data-ch="${bm.chapter_index}" data-p="${bm.paragraph_index}">
              <div class="drawer-item-title">${escapeHtml(bm.title || 'Закладка')}</div>
              <div class="drawer-item-snippet">${escapeHtml(bm.snippet || '')}</div>
            </div>
          `).join('');

      this.drawerBookmarksList.querySelectorAll('.drawer-item').forEach(el => {
        el.addEventListener('click', () => {
          const ch = parseInt(el.dataset.ch, 10);
          const p = parseInt(el.dataset.p, 10);
          this.loadChapter(ch, { chapterIndex: ch, paragraphIndex: p });
          this.drawerOverlay?.classList.add('hidden');
        });
      });
    } catch (_) {}
  }

  async refreshQuotes() {
    if (!this.currentBook || !this.drawerQuotesList) return;
    try {
      const res = await window.winread.getQuotes(this.currentBook.id);
      const qts = res?.quotes || [];
      this.drawerQuotesList.innerHTML = qts.length === 0
        ? `<div class="empty-drawer-text">${I18N[this.currentLang].drawer_no_quotes}</div>`
        : qts.map(q => `
            <div class="drawer-item quote-item ${q.color}" data-id="${q.id}" data-ch="${q.chapter_index}">
              <div class="quote-text">«${escapeHtml(q.selected_text)}»</div>
            </div>
          `).join('');
    } catch (_) {}
  }

  async addQuickBookmark() {
    if (!this.currentBook) return;
    const scrollTop = this.viewportContainer.scrollTop;
    const activeIdx = this.scroller.findBlockIndexForOffset(scrollTop);
    const block = this.scroller.blocks[activeIdx];

    const title = this.readerChapterTitle?.textContent || 'Закладка';
    const snippet = block ? block.text.slice(0, 100) : '';

    await window.winread.addBookmark({
      bookId: this.currentBook.id,
      chapterIndex: this.activeChapterIndex,
      paragraphIndex: activeIdx,
      charOffset: 0,
      title,
      snippet
    });
    this.showToast(I18N[this.currentLang].toast_bookmark_added);
  }

  async handleOpenFileDialog() {
    const filePath = await window.winread.openFileDialog();
    if (filePath) await this.openBookFile(filePath);
  }

  async handleDroppedFile(filePath) {
    if (!filePath) return;
    const lower = filePath.toLowerCase();
    if (lower.endsWith('.bak') || lower.endsWith('.backup') || (lower.endsWith('.zip') && lower.includes('readera'))) {
      await this.importReadEraBackup(filePath);
    } else {
      await this.openBookFile(filePath);
    }
  }

  async handleImportBackupDialog() {
    const filePath = await window.winread.openReadEraBackupDialog();
    if (filePath) await this.importReadEraBackup(filePath);
  }

  async importReadEraBackup(filePath) {
    try {
      this.showToast('Импорт бэкапа ReadEra...');
      const res = await window.winread.importReadEraBackup(filePath);
      const msg = `Импорт завершен! Добавлено/обновлено: ${res.appliedCount}`;
      this.showToast(msg, 3500);
      await this.refreshLibrary();
    } catch (err) {
      this.showToast(`Ошибка импорта: ${err.message}`, 4000);
    }
  }

  toggleFullscreen() {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  }

  showToast(msg, duration = 2800) {
    const old = document.querySelector('.winread-toast');
    if (old) old.remove();

    const toast = document.createElement('div');
    toast.className = 'winread-toast';
    toast.textContent = msg;
    document.body.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transition = 'opacity 0.25s ease';
      setTimeout(() => toast.remove(), 250);
    }, duration);
  }
}

// Helpers
function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function formatTimeAgo(timestamp, lang = 'ru') {
  if (!timestamp) return lang === 'ru' ? 'Недавно' : 'Recently';
  const diffSec = Math.floor((Date.now() - timestamp) / 1000);
  if (diffSec < 60) return lang === 'ru' ? 'Только что' : 'Just now';
  const mins = Math.floor(diffSec / 60);
  if (mins < 60) return `${mins} ${lang === 'ru' ? 'мин назад' : 'min ago'}`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} ${lang === 'ru' ? 'ч назад' : 'h ago'}`;
  const days = Math.floor(hours / 24);
  return `${days} ${lang === 'ru' ? 'дн назад' : 'd ago'}`;
}

// Initialize on DOM Ready
window.addEventListener('DOMContentLoaded', () => {
  new WinReadApp();
});
