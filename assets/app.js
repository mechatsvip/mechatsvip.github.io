(() => {
  'use strict';

  const OWNER = 'mechatsvip';
  const REPO = 'mechatsvip.github.io';
  const API = `https://api.github.com/repos/${OWNER}/${REPO}/issues?state=all&per_page=100&sort=created&direction=desc`;
  const ISSUE_URL = `https://github.com/${OWNER}/${REPO}/issues/`;
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const pageSize = 8;
  let posts = [];
  let searchTerm = '';
  let selectedTag = new URLSearchParams(location.search).get('tag') || '';
  let page = Math.max(1, Number(new URLSearchParams(location.search).get('page')) || 1);
  let language = 'zh';

  const words = {
    zh: {
      pageTitle: 'Mecha 的博客', articlesPageTitle: '文章列表 · Mecha 的博客', tagsPageTitle: '标签 · Mecha 的博客', timelinePageTitle: '时间线 · Mecha 的博客', aboutPageTitle: '关于我 · Mecha 的博客',
      navHome: '首页', navArticles: '文章', navTags: '标签', navTimeline: '时间线', navAbout: '关于我', navLabel: '主导航',
      heroTitle: '既见君子，<br>云胡不喜。', heroText: '在这里记录正在思考的事、正在经历的生活，以及那些值得分享的瞬间。愿文字让日常变得清晰，也让相遇发生。', browseArticles: '去文章里逛逛 <span aria-hidden="true">→</span>',
      articleCount: '篇文章', tagCount: '个标签', startYear: '开始记录', recentTitle: '最近的文章', allArticles: '全部文章 →', topicTitle: '发现主题', allTags: '所有标签 →',
      publishedBy: '文章通过', publishSuffix: '发布', articlesTitle: '文章列表', articlesIntro: '慢慢读，每一篇都是一段当时的想法。', clear: '清除', searchPlaceholder: '搜索标题或正文…', searchLabel: '搜索文章',
      tagsTitle: '标签', tagsIntro: '从一个关键词出发，找到相关的文字。', timelineTitle: '时间线', timelineIntro: '按年份和日期，回看一路写下的片段。', aboutTitle: '关于我', aboutIntro: '认识这个博客背后的写作者。', helloMecha: '你好，我是 Mecha。',
      aboutText1: '这是一个记录思考与日常的小小角落。我相信慢慢写、认真生活，也相信文字能让普通的瞬间留下痕迹。', aboutText2: '这里的文章发布在 GitHub Issues。欢迎来读，也欢迎交流。', githubLink: '访问我的 GitHub ↗', issuesLink: '浏览文章 Issues ↗', backHome: '返回首页',
      loading: '正在载入文章…', loadingTags: '正在整理标签…', loadingTimeline: '正在整理时间线…', noPosts: '还没有文章，第一篇故事正在等待你。', noTags: '暂时还没有文章标签。', noMatches: '没有找到匹配的文章，试试其他关键词。',
      searchResult: '共 {total} 篇文章，第 {page} / {pages} 页', tagResult: '标签：{tag} · 共 {total} 篇文章，第 {page} / {pages} 页',
      previous: '← 上一页', next: '下一页 →', previousLabel: '上一页', nextLabel: '下一页', pageLabel: '第 {page} 页', tagUnit: '篇',
      readMore: '打开文章，继续阅读…', loadError: '文章暂时无法加载，请稍后刷新重试。', latest: '最近更新', published: '发布于',
      articlesAria: '博客文章列表', paginationAria: '文章分页', statsAria: '博客统计', languageLabel: 'Switch to English',
      aboutKicker: 'A LITTLE INTRODUCTION', topicsKicker: 'TOPICS & IDEAS', timelineKicker: 'WRITING HISTORY',
      aboutButton: '文章 Issues ↗'
    },
    en: {
      pageTitle: 'Mecha’s Blog', articlesPageTitle: 'Articles · Mecha’s Blog', tagsPageTitle: 'Tags · Mecha’s Blog', timelinePageTitle: 'Timeline · Mecha’s Blog', aboutPageTitle: 'About · Mecha’s Blog',
      navHome: 'Home', navArticles: 'Articles', navTags: 'Tags', navTimeline: 'Timeline', navAbout: 'About', navLabel: 'Main navigation',
      heroTitle: 'Having met you,<br>how could I not be glad?', heroText: 'A place to record thoughts, everyday life, and moments worth sharing. May these words bring clarity and make room for meaningful encounters.', browseArticles: 'Browse articles <span aria-hidden="true">→</span>',
      articleCount: 'articles', tagCount: 'tags', startYear: 'Since', recentTitle: 'Recent stories', allArticles: 'All articles →', topicTitle: 'Explore topics', allTags: 'All tags →',
      publishedBy: 'Posts published via', publishSuffix: '', articlesTitle: 'Articles', articlesIntro: 'Read slowly; every post holds a moment of thought.', clear: 'Clear', searchPlaceholder: 'Search titles or article text…', searchLabel: 'Search articles',
      tagsTitle: 'Tags', tagsIntro: 'Start with a keyword and find related stories.', timelineTitle: 'Timeline', timelineIntro: 'Revisit the stories by year and date.', aboutTitle: 'About', aboutIntro: 'Meet the person behind this blog.', helloMecha: 'Hello, I’m Mecha.',
      aboutText1: 'This is a small corner for thoughts and everyday life. I believe in writing slowly, living attentively, and keeping a record of ordinary moments.', aboutText2: 'Posts are published through GitHub Issues. Welcome to read and share.', githubLink: 'Visit my GitHub ↗', issuesLink: 'Browse article issues ↗', backHome: 'Back to home',
      loading: 'Loading articles…', loadingTags: 'Loading tags…', loadingTimeline: 'Building the timeline…', noPosts: 'No articles yet. The first story is waiting to be written.', noTags: 'There are no article tags yet.', noMatches: 'No matching articles. Try another search.',
      searchResult: '{total} articles · Page {page} of {pages}', tagResult: 'Tag: {tag} · {total} articles · Page {page} of {pages}',
      previous: '← Previous', next: 'Next →', previousLabel: 'Previous page', nextLabel: 'Next page', pageLabel: 'Page {page}', tagUnit: 'posts',
      readMore: 'Open the article to read more…', loadError: 'Articles could not be loaded. Please refresh and try again.', latest: 'Latest stories', published: 'Published',
      articlesAria: 'Blog articles', paginationAria: 'Article pagination', statsAria: 'Blog statistics', languageLabel: '切换为中文',
      aboutKicker: 'A LITTLE INTRODUCTION', topicsKicker: 'TOPICS & IDEAS', timelineKicker: 'WRITING HISTORY',
      aboutButton: 'Article issues ↗'
    }
  };

  function t(key, vars = {}) {
    return (words[language][key] || words.zh[key] || key).replace(/\{(\w+)\}/g, (_, name) => String(vars[name] ?? ''));
  }
  function escapeHTML(value) {
    return String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  }
  function getTags(post) {
    return (post.labels || []).map(label => typeof label === 'string' ? label : label.name).filter(Boolean);
  }
  function dateText(value, options = {year:'numeric', month:'short', day:'numeric'}) {
    return new Intl.DateTimeFormat(language === 'zh' ? 'zh-CN' : 'en-US', options).format(new Date(value));
  }
  function excerpt(text, max = 180) {
    const plain = String(text || '').replace(/```[\s\S]*?```/g, ' ').replace(/[#>*_`~\[\]()]/g, ' ').replace(/https?:\/\/\S+/g, '').replace(/\s+/g, ' ').trim();
    return plain.length > max ? `${plain.slice(0, max).trim()}…` : plain;
  }
  function articleMarkup(post) {
    const labels = getTags(post).map(tag => `<a class="tag" href="articles.html?tag=${encodeURIComponent(tag)}">${escapeHTML(tag)}</a>`).join('');
    return `<article class="article"><time datetime="${escapeHTML(post.created_at)}">${dateText(post.created_at)}</time><div><h3><a href="${ISSUE_URL}${post.number}" target="_blank" rel="noopener noreferrer">${escapeHTML(post.title)}</a></h3><p class="excerpt">${escapeHTML(excerpt(post.body) || t('readMore'))}</p>${labels ? `<div class="tag-row">${labels}</div>` : ''}</div></article>`;
  }
  function applyLanguage() {
    const dictionary = words[language];
    document.documentElement.lang = language === 'zh' ? 'zh-CN' : 'en';
    $$('[data-i18n]').forEach(node => {
      const value = dictionary[node.dataset.i18n];
      if (value !== undefined) node.innerHTML = value;
    });
    const pageName = document.body.dataset.page || 'home';
    const titleKey = ({home:'pageTitle', articles:'articlesPageTitle', tags:'tagsPageTitle', timeline:'timelinePageTitle', about:'aboutPageTitle'})[pageName];
    if (titleKey) document.title = t(titleKey);
    $$('.language-toggle').forEach(button => {
      button.textContent = language === 'zh' ? 'EN' : '中';
      button.title = t('languageLabel');
      button.setAttribute('aria-label', t('languageLabel'));
    });
    $$('.nav').forEach(nav => nav.setAttribute('aria-label', t('navLabel')));
    const search = $('#article-search');
    if (search) { search.placeholder = t('searchPlaceholder'); search.setAttribute('aria-label', t('searchLabel')); }
    const aboutLinks = $$('.about-links a');
    if (aboutLinks.length > 1) { aboutLinks[0].textContent = t('githubLink'); aboutLinks[1].textContent = t('issuesLink'); }
    if ($('#recent-articles') && !posts.length) $('#recent-articles').innerHTML = `<p class="empty">${t('noPosts')}</p>`;
    if ($('#all-articles')) renderArticles();
    if ($('#home-tags') && posts.length) renderHome();
    if ($('#tag-directory') && posts.length) renderTags();
    if ($('#timeline-list') && posts.length) renderTimeline();
    try { localStorage.setItem('mecha-language', language); } catch (_) {}
  }
  function setupLanguage() {
    try { language = localStorage.getItem('mecha-language') === 'en' ? 'en' : 'zh'; } catch (_) { language = 'zh'; }
    $$('.language-toggle').forEach(button => button.addEventListener('click', () => {
      language = language === 'zh' ? 'en' : 'zh';
      applyLanguage();
    }));
  }
  function setupTheme() {
    const buttons = $$('.theme-toggle');
    function update(theme) {
      document.documentElement.dataset.theme = theme;
      try { localStorage.setItem('mecha-theme', theme); } catch (_) {}
      buttons.forEach(button => {
        button.textContent = theme === 'dark' ? '☀' : '☾';
        button.setAttribute('aria-label', theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme');
      });
      const meta = $('meta[name="theme-color"]');
      if (meta) meta.content = theme === 'dark' ? '#151a17' : '#f6f7f2';
    }
    buttons.forEach(button => button.addEventListener('click', () => update(document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark')));
    update(document.documentElement.dataset.theme || 'light');
  }
  function setupNavigation() {
    const currentPage = document.body.dataset.page || 'home';
    $$('.nav a').forEach(link => {
      const target = link.getAttribute('href').replace('.html', '').replace('index', 'home');
      if (target === currentPage) { link.classList.add('active'); link.setAttribute('aria-current', 'page'); }
    });
    $$('.current-year').forEach(node => { node.textContent = new Date().getFullYear(); });
  }
  function renderHome() {
    const recent = $('#recent-articles');
    if (recent) recent.innerHTML = posts.length ? posts.slice(0, 5).map(articleMarkup).join('') : `<p class="empty">${t('noPosts')}</p>`;
    const counts = new Map();
    posts.forEach(post => getTags(post).forEach(tag => counts.set(tag, (counts.get(tag) || 0) + 1)));
    if ($('#article-count')) $('#article-count').textContent = posts.length;
    if ($('#tag-count')) $('#tag-count').textContent = counts.size;
    const cloud = $('#home-tags');
    if (cloud) {
      const popular = [...counts.entries()].sort((a,b) => b[1] - a[1] || a[0].localeCompare(b[0])).slice(0, 8);
      cloud.innerHTML = popular.length ? popular.map(([tag, count]) => `<a class="tag" href="articles.html?tag=${encodeURIComponent(tag)}">${escapeHTML(tag)}<span class="tag-count">${count}</span></a>`).join('') : `<p class="empty">${t('noTags')}</p>`;
    }
  }
  function renderArticles() {
    const list = $('#all-articles');
    if (!list) return;
    const query = searchTerm.toLocaleLowerCase();
    const filtered = posts.filter(post => (!selectedTag || getTags(post).includes(selectedTag)) && (!query || `${post.title} ${post.body || ''}`.toLocaleLowerCase().includes(query)));
    const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
    page = Math.min(page, pageCount);
    const visible = filtered.slice((page - 1) * pageSize, page * pageSize);
    list.innerHTML = visible.length ? visible.map(articleMarkup).join('') : `<p class="empty">${filtered.length ? t('noPosts') : t('noMatches')}</p>`;
    const context = $('#article-context');
    if (context) context.textContent = selectedTag ? t('tagResult', {tag:selectedTag,total:filtered.length,page,pages:pageCount}) : t('searchResult', {total:filtered.length,page,pages:pageCount});
    const pager = $('#pagination');
    if (!pager) return;
    if (pageCount <= 1) { pager.innerHTML = ''; return; }
    let buttons = `<button class="page-button" data-page="${page - 1}" ${page === 1 ? 'disabled' : ''} aria-label="${t('previousLabel')}">${t('previous')}</button>`;
    for (let number = 1; number <= pageCount; number++) buttons += `<button class="page-button${number === page ? ' current' : ''}" data-page="${number}" ${number === page ? 'aria-current="page"' : ''} aria-label="${t('pageLabel', {page:number})}">${number}</button>`;
    buttons += `<button class="page-button" data-page="${page + 1}" ${page === pageCount ? 'disabled' : ''} aria-label="${t('nextLabel')}">${t('next')}</button>`;
    pager.innerHTML = buttons;
    pager.setAttribute('aria-label', t('paginationAria'));
  }
  function renderTags() {
    const target = $('#tag-directory');
    if (!target) return;
    const counts = new Map();
    posts.forEach(post => getTags(post).forEach(tag => counts.set(tag, (counts.get(tag) || 0) + 1)));
    const tags = [...counts.entries()].sort((a,b) => b[1] - a[1] || a[0].localeCompare(b[0]));
    target.innerHTML = tags.length ? tags.map(([tag, count]) => `<a class="tag" href="articles.html?tag=${encodeURIComponent(tag)}">${escapeHTML(tag)}<span class="tag-count">${count} ${t('tagUnit')}</span></a>`).join('') : `<p class="empty">${t('noTags')}</p>`;
  }
  function renderTimeline() {
    const target = $('#timeline-list');
    if (!target) return;
    if (!posts.length) { target.innerHTML = `<p class="empty">${t('noPosts')}</p>`; return; }
    const years = new Map();
    posts.forEach(post => {
      const year = new Date(post.created_at).getFullYear();
      if (!years.has(year)) years.set(year, []);
      years.get(year).push(post);
    });
    target.innerHTML = [...years.entries()].map(([year, items]) => `<section class="timeline-group"><h2 class="timeline-year">${year}</h2>${items.map(post => `<div class="timeline-item"><time datetime="${escapeHTML(post.created_at)}">${dateText(post.created_at, {month:'long', day:'numeric'})}</time><a href="${ISSUE_URL}${post.number}" target="_blank" rel="noopener noreferrer">${escapeHTML(post.title)}</a></div>`).join('')}</section>`).join('');
  }
  function setupArticleControls() {
    const input = $('#article-search');
    if (input) input.addEventListener('input', () => { searchTerm = input.value.trim(); page = 1; renderArticles(); });
    $('#clear-search')?.addEventListener('click', () => {
      if (input) input.value = '';
      searchTerm = ''; selectedTag = ''; page = 1; renderArticles();
      history.replaceState(null, '', location.pathname);
    });
    $('#pagination')?.addEventListener('click', event => {
      const button = event.target.closest('[data-page]');
      if (!button || button.disabled) return;
      page = Number(button.dataset.page);
      renderArticles();
      const params = new URLSearchParams();
      if (selectedTag) params.set('tag', selectedTag);
      if (page > 1) params.set('page', page);
      history.replaceState(null, '', `${location.pathname}${params.size ? `?${params}` : ''}`);
      $('#all-articles')?.scrollIntoView({behavior:'smooth', block:'start'});
    });
  }
  async function loadPosts() {
    try {
      const response = await fetch(API, {headers:{Accept:'application/vnd.github+json'}});
      if (!response.ok) throw new Error(`GitHub API ${response.status}`);
      const issues = await response.json();
      posts = issues.filter(item => !item.pull_request).sort((a,b) => new Date(b.created_at) - new Date(a.created_at));
      renderHome(); renderArticles(); renderTags(); renderTimeline();
    } catch (error) {
      console.error('Unable to load blog posts:', error);
      document.querySelectorAll('#recent-articles,#all-articles,#tag-directory,#timeline-list').forEach(node => { node.innerHTML = `<p class="error">${t('loadError')}</p>`; });
    }
  }

  setupLanguage();
  setupTheme();
  setupNavigation();
  setupArticleControls();
  applyLanguage();
  loadPosts();
})();
