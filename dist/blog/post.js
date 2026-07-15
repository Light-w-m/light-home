const posts = {
  'kalman-filter': {
    title: '卡尔曼滤波',
    date: '2025-09-25',
    summary: '从递归估计、数据融合、协方差矩阵到扩展卡尔曼滤波的公式笔记。',
    source: '/blog/posts/kalman-filter.md'
  }
};

const params = new URLSearchParams(window.location.search);
const slug = params.get('slug') || 'kalman-filter';
const post = posts[slug] || posts['kalman-filter'];

const titleEl = document.querySelector('#post-title');
const dateEl = document.querySelector('#post-date');
const summaryEl = document.querySelector('#post-summary');
const contentEl = document.querySelector('#post-content');

titleEl.textContent = post.title;
dateEl.textContent = post.date;
summaryEl.textContent = post.summary;
document.title = `${post.title} | Light 的博客`;

loadPost(post);

async function loadPost(activePost) {
  try {
    const response = await fetch(activePost.source);
    if (!response.ok) {
      throw new Error(`文章加载失败：${response.status}`);
    }
    const markdown = await response.text();
    await waitForMarkdownRenderer();
    contentEl.innerHTML = renderMarkdown(stripDuplicateTitle(markdown, activePost.title));
    await typesetMath(contentEl);
  } catch (error) {
    contentEl.innerHTML = `<p class="post-error">${escapeHtml(error.message)}</p>`;
  }
}

async function waitForMarkdownRenderer() {
  const started = Date.now();
  while (!window.marked?.parse && Date.now() - started < 6000) {
    await new Promise(resolve => setTimeout(resolve, 100));
  }
}

async function typesetMath(container) {
  const started = Date.now();
  while (!window.MathJax?.typesetPromise && Date.now() - started < 6000) {
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  if (window.MathJax?.startup?.promise) {
    await window.MathJax.startup.promise;
  }

  await window.MathJax?.typesetPromise?.([container]);
}

function stripDuplicateTitle(markdown, title) {
  const lines = markdown.replace(/^\uFEFF/, '').split(/\r?\n/);
  const firstLine = lines[0]?.trim();
  if (firstLine && /^#{1,6}\s+/.test(firstLine) && firstLine.replace(/^#{1,6}\s+/, '') === title) {
    return lines.slice(1).join('\n');
  }
  return markdown;
}

function renderMarkdown(markdown) {
  const normalized = normalizeHeadings(cleanMarkdown(markdown));
  const mathBlocks = [];
  const protectedMarkdown = normalized.replace(/\$\$([\s\S]*?)\$\$/g, (_, math) => {
    const index = mathBlocks.length;
    mathBlocks.push(splitDisplayMathLines(math.trim()));
    return `\n\n<div class="math-block" data-math-index="${index}"></div>\n\n`;
  });

  const html = window.marked?.parse
    ? window.marked.parse(protectedMarkdown, {
        breaks: true,
        gfm: true,
        mangle: false,
        headerIds: false
      })
    : fallbackRender(protectedMarkdown);

  return html.replace(
    /<div class="math-block" data-math-index="(\d+)"><\/div>/g,
    (_, index) => renderMathBlock(mathBlocks[Number(index)] || [])
  );
}

function cleanMarkdown(markdown) {
  return markdown
    .replace(/\u200b/g, '')
    .replace(/\u00a0/g, ' ')
    .split(/\r?\n/)
    .map(line => {
      if (/^[\t ]+[*-]\s+/.test(line)) return line;
      return line.replace(/^[\t ]+(?=(#{1,6}\s|\*\*|\$\$|[^\s].*：$))/, '');
    })
    .join('\n');
}

function splitDisplayMathLines(math) {
  const sourceLines = math
    .replace(/[ \t]{2,}/g, ' ')
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(Boolean);

  const result = [];
  for (const line of sourceLines) {
    result.push(...splitTopLevelTexBreaks(line));
  }
  return result.filter(Boolean);
}

function splitTopLevelTexBreaks(value) {
  const parts = [];
  let buffer = '';
  let envDepth = 0;
  let braceDepth = 0;

  for (let index = 0; index < value.length; index += 1) {
    if (value.startsWith('\\begin{', index)) {
      envDepth += 1;
      const end = value.indexOf('}', index);
      buffer += value.slice(index, end >= 0 ? end + 1 : index + 1);
      index = end >= 0 ? end : index;
      continue;
    }

    if (value.startsWith('\\end{', index)) {
      envDepth = Math.max(envDepth - 1, 0);
      const end = value.indexOf('}', index);
      buffer += value.slice(index, end >= 0 ? end + 1 : index + 1);
      index = end >= 0 ? end : index;
      continue;
    }

    if (value[index] === '\\' && value[index + 1] === '\\' && envDepth === 0 && braceDepth === 0) {
      if (buffer.trim()) {
        parts.push(buffer.trim());
      }
      buffer = '';
      index += 1;
      continue;
    }

    if (value[index] === '{' && value[index - 1] !== '\\') {
      braceDepth += 1;
    } else if (value[index] === '}' && value[index - 1] !== '\\') {
      braceDepth = Math.max(braceDepth - 1, 0);
    }

    buffer += value[index];
  }

  if (buffer.trim()) {
    parts.push(buffer.trim());
  }

  return parts;
}

function renderMathBlock(lines) {
  return [
    '<div class="math-block">',
    ...lines.map(line => `<div class="math-line">$$\n${escapeHtml(line)}\n$$</div>`),
    '</div>'
  ].join('');
}

function normalizeHeadings(markdown) {
  const lines = markdown.split(/\r?\n/);
  const headingDepths = lines
    .map(line => line.trim().match(/^(#{1,6})\s+.+$/)?.[1].length)
    .filter(Boolean);
  const minHeadingDepth = headingDepths.length ? Math.min(...headingDepths) : 2;
  const offset = Math.max(minHeadingDepth - 2, 0);

  return lines.map(line => {
    const heading = line.trim().match(/^(#{1,6})\s+(.+)$/);
    if (!heading) return line;
    const level = Math.min(Math.max(heading[1].length - offset, 2), 6);
    return `${'#'.repeat(level)} ${heading[2].trim()}`;
  }).join('\n');
}

function fallbackRender(markdown) {
  return markdown
    .split(/\n{2,}/)
    .map(block => block.trim())
    .filter(Boolean)
    .map(block => {
      const heading = block.match(/^(#{2,6})\s+(.+)$/);
      if (heading) {
        const level = heading[1].length;
        return `<h${level}>${escapeHtml(heading[2])}</h${level}>`;
      }
      return `<p>${escapeHtml(block).replace(/\n/g, '<br>')}</p>`;
    })
    .join('\n');
}

function escapeHtml(value) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
