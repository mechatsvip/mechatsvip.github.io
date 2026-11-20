(() => {
  'use strict';
  const OWNER = 'mechatsvip';
  const REPO = 'mechatsvip.github.io';
  const API = `https://api.github.com/repos/${OWNER}/${REPO}/issues?state=all&per_page=100&sort=created&direction=desc`;
  const ISSUE_URL = `https://github.com/${OWNER}/${REPO}/issues/`;
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  let posts = [];
  let searchTerm = '';
  let selectedTag = new URLSearchParams(location.search).get('tag') || '';
  let page = Math.max(1, Number(new URLSearchParams(location.search).get('page')) || 1);
  const pageSize = 8;

  function escapeHTML(value) {
    return String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  }
  function getTags(post) {
    return (post.labels || []).map(label => typeof label === 'string' ? label : label.name).filter(Boolean);
  }
  function dateText(value, options = {year:'numeric', month:'short', day:'numeric'}) {
    return new Intl.DateTimeFormat('zh-CN', options).format(new Date(value));
  }
  function excerpt(text, max = 180) {
    const plain = String(text || '').replace(/```[\s\S]*?```/g, ' ').replace(/[#>*_`~\[\]()]/g, ' ').replace(/https?:\/\/\S+/g, '').replace(/\s+/g, ' ').trim();
    return plain.length > max ? `${plain.slice(0, max).trim()}…` : plain;
  }
  function articleMarkup(post) {
    const labels = getTags(post).map(tag => `<a class="tag" href="tags.html?tag=${encodeURIComponent(tag)}">${escapeHTML(tag)}</a>`).join('');
    return `<article class="article"><time datetime="${escapeHTML(post.created_at)}">${dateText(post.created_at)}</time><div><h3><a href="${ISSUE_URL}${post.number}" target="_blank" rel="noopener noreferrer">${escapeHTML(post.title)}</a></h3><p class="excerpt">${escapeHTML(excerpt(post.body) || '打开文章，继续阅读…')}</p>${labels ? `<div class="tag-row">${labels}</div>` : ''}</div></article>`;
  }
  function themeSetup() {
    const buttons = $$('.theme-toggle');
    function update(theme) {
      document.documentElement.dataset.theme = theme;
      try { localStorage.setItem('mecha-theme', theme); } catch (_) {}
      buttons.forEach(button => {
        button.textContent = theme === 'dark' ? '☀' : '☾';
        button.setAttribute('aria-label', theme === 'dark' ? '切换浅色模式' : '切换深色模式');
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
      if (target === currentPage) {
        link.classList.add('active');
        link.setAttribute('aria-current', 'page');
      }
    });
    $$('.current-year').forEach(node => { node.textContent = new Date().getFullYear(); });
  }
  function renderHome() {
    const recent = $('#recent-articles');
    if (recent) recent.innerHTML = posts.length ? posts.slice(0, 5).map(articleMarkup).join('') : '<p class="empty">还没有文章，第一篇故事正在等待你。</p>';
    const counts = new Map();
    posts.forEach(post => getTags(post).forEach(tag => counts.set(tag, (counts.get(tag) || 0) + 1)));
    if ($('#article-count')) $('#article-count').textContent = posts.length;
    if ($('#tag-count')) $('#tag-count').textContent = counts.size;
    const cloud = $('#home-tags');
    if (cloud) {
      const popular = [...counts.entries()].sort((a,b) => b[1] - a[1] || a[0].localeCompare(b[0], 'zh-CN')).slice(0, 8);
      cloud.innerHTML = popular.length ? popular.map(([tag, count]) => `<a class="tag" href="tags.html?tag=${encodeURIComponent(tag)}">${escapeHTML(tag)}<span class="tag-count">${count}</span></a>`).join('') : '<p class="empty">暂时还没有文章标签。</p>';
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
    list.innerHTML = visible.length ? visible.map(articleMarkup).join('') : '<p class="empty">没有找到匹配的文章，试试其他关键词。</p>';
    const context = $('#article-context');
    if (context) context.textContent = `${selectedTag ? `标签：${selectedTag} · ` : ''}共 ${filtered.length} 篇文章，第 ${page} / ${pageCount} 页`;
    const pager = $('#pagination');
    if (pager) {
      if (pageCount <= 1) { pager.innerHTML = ''; return; }
      let buttons = `<button class="page-button" data-page="${page - 1}" ${page === 1 ? 'disabled' : ''} aria-label="上一页">← 上一页</button>`;
      for (let number = 1; number <= pageCount; number++) buttons += `<button class="page-button${number === page ? ' current' : ''}" data-page="${number}" ${number === page ? 'aria-current="page"' : ''}>${number}</button>`;
      buttons += `<button class="page-button" data-page="${page + 1}" ${page === pageCount ? 'disabled' : ''} aria-label="下一页">下一页 →</button>`;
      pager.innerHTML = buttons;
    }
  }
  function renderTags() {
    const target = $('#tag-directory');
    if (!target) return;
    const counts = new Map();
    posts.forEach(post => getTags(post).forEach(tag => counts.set(tag, (counts.get(tag) || 0) + 1)));
    const tags = [...counts.entries()].sort((a,b) => b[1] - a[1] || a[0].localeCompare(b[0], 'zh-CN'));
    target.innerHTML = tags.length ? tags.map(([tag, count]) => `<a class="tag" href="articles.html?tag=${encodeURIComponent(tag)}">${escapeHTML(tag)}<span class="tag-count">${count} 篇</span></a>`).join('') : '<p class="empty">暂时还没有文章标签。</p>';
  }
  function renderTimeline() {
    const target = $('#timeline-list');
    if (!target) return;
    if (!posts.length) { target.innerHTML = '<p class="empty">还没有文章，时间线暂时空空的。</p>'; return; }
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
    if (input) {
      input.addEventListener('input', () => { searchTerm = input.value.trim(); page = 1; renderArticles(); });
      const clear = $('#clear-search');
      clear?.addEventListener('click', () => { input.value = ''; searchTerm = ''; selectedTag = ''; page = 1; renderArticles(); });
    }
    $('#pagination')?.addEventListener('click', event => {
      const button = event.target.closest('[data-page]');
      if (!button || button.disabled) return;
      page = Number(button.dataset.page);
      renderArticles();
      history.replaceState(null, '', `${location.pathname}${page > 1 ? `?page=${page}` : selectedTag ? `?tag=${encodeURIComponent(selectedTag)}` : ''}`);
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
      document.querySelectorAll('#recent-articles,#all-articles,#tag-directory,#timeline-list').forEach(node => { node.innerHTML = '<p class="error">文章暂时无法加载，请稍后刷新重试。</p>'; });
    }
  }
  themeSetup(); setupNavigation(); setupArticleControls(); loadPosts();
})();
