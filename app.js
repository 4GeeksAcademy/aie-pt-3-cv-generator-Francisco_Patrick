const portraitContainer = document.getElementById('ascii-portrait');
const buildCvButton = document.getElementById('build-cv-btn');
const cvContainer = document.getElementById('cv-content');
const landingSection = document.getElementById('landing');
const schemaScript = document.getElementById('schema-person');
const startupLoader = document.getElementById('startup-loader');
const mainHeader = document.getElementById('main-header');
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const TIMING = {
  moveMs: 980,
  opacityMs: 760,
  styleMs: 820,
  staggerMax: 110,
  staggerStep: 3,
  revealDelayMs: 560,
  finishMs: 1900,
  tailFadeMs: 680,
  tailMoveMs: 860
};

let cvData = null;
let portraitParticles = [];
let transitionRunning = false;
let transitionLayer = null;
let resizeDebounceId = null;

function waitForFrame() {
  return new Promise((resolve) => {
    window.requestAnimationFrame(() => resolve());
  });
}

function ensureTransitionLayer() {
  if (transitionLayer) {
    return transitionLayer;
  }

  transitionLayer = document.createElement('div');
  transitionLayer.className = 'ascii-transition-layer';
  document.body.appendChild(transitionLayer);
  return transitionLayer;
}

function hideStartupLoader() {
  document.body.classList.remove('app-loading');

  if (!startupLoader) {
    return;
  }

  startupLoader.classList.add('is-hidden');
  window.setTimeout(() => {
    startupLoader.remove();
  }, 340);
}

function normalizeText(value) {
  return String(value ?? '').replace(/\s+/g, ' ').trim();
}

function collectCvCharacters(data) {
  const chunks = [];
  chunks.push(normalizeText(data.personalInformation?.name));
  chunks.push(normalizeText(data.personalInformation?.summary));
  chunks.push(...(data.softSkills || []).map(normalizeText));
  chunks.push(...(data.experience || []).map((exp) => normalizeText(`${exp.position} ${exp.company}`)));
  chunks.push(...(data.courses || []).map((course) => normalizeText(`${course.name} ${course.provider}`)));
  chunks.push(...Object.values(data.technicalSkills || {}).flat().map(normalizeText));
  chunks.push(...(data.languages || []).map((lang) => normalizeText(`${lang.language} ${lang.level}`)));

  const sourceText = chunks.join(' ').replace(/\s+/g, ' ');
  const charPool = sourceText.replace(/\s/g, '') || 'CVPATRICK';
  return charPool;
}

function escapeHtml(text) {
  return String(text)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function renderSkillsGrid(technicalSkills) {
  const entries = Object.entries(technicalSkills || {});
  if (!entries.length) {
    return '<p class="text-slate-300">No hay skills registradas.</p>';
  }

  return entries
    .map(([group, skills]) => `
      <article class="rounded-xl border border-slate-700/80 bg-slate-900/60 p-4">
        <h3 class="mb-3 text-sm font-semibold uppercase tracking-wide text-cyan-200">${escapeHtml(group)}</h3>
        <ul class="flex flex-wrap gap-2">
          ${(skills || [])
            .map(
              (skill) =>
                `<li class="rounded-full border border-cyan-300/30 bg-cyan-300/10 px-3 py-1 text-xs text-cyan-100">${escapeHtml(skill)}</li>`
            )
            .join('')}
        </ul>
      </article>
    `)
    .join('');
}

function renderCv(data) {
  const personal = data.personalInformation || {};
  const experience = data.experience || [];
  const courses = data.courses || [];
  const softSkills = data.softSkills || [];
  const languages = data.languages || [];

  cvContainer.innerHTML = `
    <h2 class="visually-hidden">Curriculum</h2>
    <section id="personal" class="mb-7 rounded-2xl border border-slate-700/80 bg-slate-900/60 p-5 sm:p-7">
      <div class="grid gap-4 md:grid-cols-[2fr,1fr]">
        <div>
          <h2 class="text-2xl font-bold text-white sm:text-3xl">${escapeHtml(personal.name || 'Nombre no disponible')}</h2>
          <p class="mt-3 max-w-3xl text-sm leading-relaxed text-slate-300 sm:text-base">${escapeHtml(personal.summary || '')}</p>
        </div>
        <address class="not-italic text-sm text-slate-200">
          <ul class="space-y-2">
            <li><span class="text-cyan-300">Email:</span> <a class="underline decoration-cyan-600/60 underline-offset-2" href="mailto:${escapeHtml(personal.email || '')}">${escapeHtml(personal.email || '')}</a></li>
            <li><span class="text-cyan-300">Teléfono:</span> ${escapeHtml(personal.phone || '')}</li>
            <li><span class="text-cyan-300">Website:</span> <a class="underline decoration-cyan-600/60 underline-offset-2" href="${escapeHtml(personal.website || '#')}" target="_blank" rel="noreferrer">${escapeHtml(personal.website || '')}</a></li>
            <li><span class="text-cyan-300">LinkedIn:</span> <a class="underline decoration-cyan-600/60 underline-offset-2" href="${escapeHtml(personal.linkedin || '#')}" target="_blank" rel="noreferrer">Perfil</a></li>
          </ul>
        </address>
      </div>
    </section>

    <section id="experience" class="mb-7 rounded-2xl border border-slate-700/80 bg-slate-900/60 p-5 sm:p-7">
      <h2 class="mb-4 text-xl font-semibold text-white">Experiencia</h2>
      <div class="space-y-4">
        ${experience
          .map(
            (exp) => `
              <article class="rounded-xl border border-slate-700/70 bg-slate-950/45 p-4">
                <header class="mb-2 flex flex-wrap items-center justify-between gap-2">
                  <h3 class="font-semibold text-slate-100">${escapeHtml(exp.position || '')} · ${escapeHtml(exp.company || '')}</h3>
                  <p class="text-xs text-cyan-200">Desde ${escapeHtml(exp.startYear || '')}${exp.duration ? ` · ${escapeHtml(exp.duration)}` : ''}</p>
                </header>
                <ul class="list-disc space-y-1 pl-5 text-sm text-slate-300">
                  ${(exp.highlights || []).map((highlight) => `<li>${escapeHtml(highlight)}</li>`).join('')}
                </ul>
              </article>
            `
          )
          .join('')}
      </div>
    </section>

    <section id="courses" class="mb-7 rounded-2xl border border-slate-700/80 bg-slate-900/60 p-5 sm:p-7">
      <h2 class="mb-4 text-xl font-semibold text-white">Cursos</h2>
      <div class="overflow-x-auto">
        <table class="w-full min-w-[520px] border-collapse text-sm">
          <thead>
            <tr class="border-b border-slate-700 text-left text-cyan-200">
              <th class="px-2 py-2">Curso</th>
              <th class="px-2 py-2">Proveedor</th>
              <th class="px-2 py-2">Horas / Estado</th>
            </tr>
          </thead>
          <tbody>
            ${courses
              .map(
                (course) => `
                  <tr class="border-b border-slate-800/80 text-slate-200">
                    <td class="px-2 py-2">${escapeHtml(course.name || '')}</td>
                    <td class="px-2 py-2">${escapeHtml(course.provider || '')}</td>
                    <td class="px-2 py-2">${escapeHtml(course.hours ? `${course.hours}h` : course.status || '')}</td>
                  </tr>
                `
              )
              .join('')}
          </tbody>
        </table>
      </div>
    </section>

    <section id="skills" class="mb-7 rounded-2xl border border-slate-700/80 bg-slate-900/60 p-5 sm:p-7">
      <h2 class="mb-4 text-xl font-semibold text-white">Skills Técnicas</h2>
      <div class="grid gap-4 md:grid-cols-2">${renderSkillsGrid(data.technicalSkills)}</div>
    </section>

    <section id="soft-skills" class="mb-7 rounded-2xl border border-slate-700/80 bg-slate-900/60 p-5 sm:p-7">
      <h2 class="mb-4 text-xl font-semibold text-white">Soft Skills</h2>
      <ul class="grid gap-3 sm:grid-cols-2">
        ${softSkills
          .map(
            (skill) =>
              `<li class="rounded-xl border border-slate-700/70 bg-slate-950/45 px-4 py-3 text-sm text-slate-200">${escapeHtml(skill)}</li>`
          )
          .join('')}
      </ul>
    </section>

    <section id="languages" class="rounded-2xl border border-slate-700/80 bg-slate-900/60 p-5 sm:p-7">
      <h2 class="mb-4 text-xl font-semibold text-white">Idiomas</h2>
      <ul class="grid gap-3 sm:grid-cols-2">
        ${languages
          .map(
            (item) =>
              `<li class="rounded-xl border border-slate-700/70 bg-slate-950/45 px-4 py-3 text-sm text-slate-200"><span class="font-semibold text-cyan-100">${escapeHtml(item.language || '')}</span> · ${escapeHtml(item.level || '')}</li>`
          )
          .join('')}
      </ul>
    </section>
  `;
}

function setSchemaOrg(data) {
  const personal = data.personalInformation || {};
  const skills = Object.values(data.technicalSkills || {}).flat();
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: personal.name || '',
    email: personal.email || '',
    telephone: personal.phone || '',
    url: personal.website || '',
    sameAs: [personal.linkedin || ''].filter(Boolean),
    description: personal.summary || '',
    knowsAbout: skills,
    knowsLanguage: (data.languages || []).map((item) => item.language),
    alumniOf: (data.courses || []).map((course) => course.provider)
  };
  schemaScript.textContent = JSON.stringify(schema, null, 2);
}

function getCharTargets(rootElement, maxChars = 1800) {
  const targets = [];
  const walker = document.createTreeWalker(rootElement, NodeFilter.SHOW_TEXT);

  while (walker.nextNode() && targets.length < maxChars) {
    const node = walker.currentNode;
    const text = node.textContent || '';

    for (let index = 0; index < text.length && targets.length < maxChars; index += 1) {
      const char = text[index];
      if (!char.trim()) {
        continue;
      }

      const range = document.createRange();
      range.setStart(node, index);
      range.setEnd(node, index + 1);
      const rect = range.getBoundingClientRect();
      range.detach();

      if (rect.width > 0 && rect.height > 0) {
        targets.push({
          x: rect.left + rect.width / 2,
          y: rect.top + rect.height / 2,
          char,
          weight: /[A-Z0-9]/.test(char) ? '700' : '500',
          size: /[A-Z]/.test(char) ? 15 : 13
        });
      }
    }
  }

  return targets;
}

function updateParticlePosition(node, x, y) {
  node.style.setProperty('--x', `${x}px`);
  node.style.setProperty('--y', `${y}px`);
  node.style.transform = `translate3d(${x}px, ${y}px, 0)`;
}

async function buildAsciiPortrait(imageSrc, charPool) {
  const image = new Image();
  image.decoding = 'async';
  image.src = imageSrc;

  await new Promise((resolve, reject) => {
    image.onload = resolve;
    image.onerror = reject;
  });

  const stageRect = portraitContainer.getBoundingClientRect();
  const targetWidth = Math.max(240, Math.floor(stageRect.width));
  const targetHeight = Math.max(280, Math.floor(stageRect.height));

  const canvas = document.createElement('canvas');
  canvas.width = targetWidth;
  canvas.height = targetHeight;
  const context = canvas.getContext('2d', { willReadFrequently: true });

  const coverScale = Math.max(targetWidth / image.width, targetHeight / image.height);
  const drawWidth = image.width * coverScale;
  const drawHeight = image.height * coverScale;
  const offsetX = (targetWidth - drawWidth) / 2;
  const offsetY = (targetHeight - drawHeight) / 2;

  context.clearRect(0, 0, targetWidth, targetHeight);
  context.drawImage(image, offsetX, offsetY, drawWidth, drawHeight);

  const sampleStep = window.innerWidth < 640 ? 7 : 6;
  const maxParticles = Number.POSITIVE_INFINITY;
  const pixels = context.getImageData(0, 0, targetWidth, targetHeight).data;
  portraitContainer.innerHTML = '';

  const particles = [];
  const fragment = document.createDocumentFragment();
  let charIndex = 0;
  let seenSamples = 0;

  for (let y = 0; y < targetHeight; y += sampleStep) {
    for (let x = 0; x < targetWidth; x += sampleStep) {
      if (particles.length >= maxParticles) {
        break;
      }

      const pixelIndex = (y * targetWidth + x) * 4;
      const r = pixels[pixelIndex];
      const g = pixels[pixelIndex + 1];
      const b = pixels[pixelIndex + 2];
      const alpha = pixels[pixelIndex + 3] / 255;

      if (alpha < 0.05) {
        continue;
      }

      const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;
      const contrast = (255 - luminance) / 255;

      if (contrast < 0.08) {
        continue;
      }

      const char = charPool[charIndex % charPool.length];
      charIndex += 1;

      const node = document.createElement('span');
      node.className = 'ascii-particle';
      if (!prefersReducedMotion && particles.length % 8 === 0) {
        node.classList.add('is-floating');
      }
      node.textContent = char;

      const fontSize = 9 + contrast * 7;
      const fontWeight = 350 + Math.round(contrast * 450);
      const originX = x;
      const originY = y;

      node.style.fontSize = `${fontSize.toFixed(2)}px`;
      node.style.fontWeight = String(Math.min(800, fontWeight));
      node.style.opacity = `${Math.max(0.22, Math.min(0.95, alpha * 0.95))}`;
      updateParticlePosition(node, originX, originY);

      fragment.appendChild(node);
      particles.push({ node, originX, originY });
      seenSamples += 1;

      if (seenSamples % 240 === 0) {
        await waitForFrame();
      }
    }

    if (particles.length >= maxParticles) {
      break;
    }
  }

  portraitContainer.appendChild(fragment);
  portraitParticles = particles;
}

function createMovingParticles() {
  const layer = ensureTransitionLayer();
  layer.innerHTML = '';

  const portraitRect = portraitContainer.getBoundingClientRect();
  const movingParticles = [];
  const fragment = document.createDocumentFragment();

  for (const particle of portraitParticles) {
    const clone = particle.node.cloneNode(true);
    clone.classList.remove('is-floating');
    clone.classList.add('is-moving');

    const startX = portraitRect.left + particle.originX;
    const startY = portraitRect.top + particle.originY;
    updateParticlePosition(clone, startX, startY);

    fragment.appendChild(clone);
    movingParticles.push({ node: clone, startX, startY });
  }

  layer.appendChild(fragment);
  return movingParticles;
}

async function animateToCurriculum() {
  if (transitionRunning) {
    return;
  }
  transitionRunning = true;

  buildCvButton.disabled = true;
  buildCvButton.classList.add('opacity-60', 'cursor-not-allowed');

  const movingParticles = createMovingParticles();
  landingSection.classList.add('hidden');

  cvContainer.classList.remove('pointer-events-none', 'opacity-0');
  cvContainer.style.opacity = '0';

  const targets = getCharTargets(cvContainer, 1900);
  const usableCount = Math.min(targets.length, movingParticles.length);

  for (let i = 0; i < usableCount; i += 1) {
    const particle = movingParticles[i];
    const target = targets[i];

    const delay = (i % TIMING.staggerMax) * TIMING.staggerStep + Math.random() * 90;
    particle.node.style.transition = `transform ${TIMING.moveMs}ms cubic-bezier(0.2, 0.8, 0.2, 1) ${delay}ms, opacity ${TIMING.opacityMs}ms ease ${delay}ms, color ${TIMING.styleMs}ms ease ${delay}ms, font-size ${TIMING.styleMs}ms ease ${delay}ms, font-weight ${TIMING.styleMs}ms ease ${delay}ms`;
    particle.node.textContent = target.char;
    particle.node.style.color = 'rgb(226 232 240 / 0.95)';
    particle.node.style.fontSize = `${target.size}px`;
    particle.node.style.fontWeight = target.weight;
    updateParticlePosition(particle.node, target.x, target.y);
  }

  for (let i = usableCount; i < movingParticles.length; i += 1) {
    const particle = movingParticles[i];
    const delay = (i % 80) * 2;
    particle.node.style.transition = `opacity ${TIMING.tailFadeMs}ms ease ${delay}ms, transform ${TIMING.tailMoveMs}ms ease ${delay}ms`;
    particle.node.style.opacity = '0';
    updateParticlePosition(particle.node, particle.startX, particle.startY + 20);
  }

  window.setTimeout(() => {
    cvContainer.style.opacity = '1';
  }, TIMING.revealDelayMs);

  window.setTimeout(() => {
    if (transitionLayer) {
      transitionLayer.innerHTML = '';
    }

    portraitContainer.innerHTML = '';
    cvContainer.classList.remove('pointer-events-none');
    if (mainHeader) {
      mainHeader.classList.remove('header-hidden');
    }

    const firstHeading = cvContainer.querySelector('h2, h3');
    if (firstHeading instanceof HTMLElement) {
      firstHeading.setAttribute('tabindex', '-1');
      firstHeading.focus();
    }
  }, TIMING.finishMs);
}

function buildCvTextSummary(data) {
  const personal = data.personalInformation || {};
  const experience = (data.experience || [])
    .map((item) => `${item.position} ${item.company} ${(item.highlights || []).join(' ')}`)
    .join(' ');
  const courses = (data.courses || []).map((item) => `${item.name} ${item.provider}`).join(' ');
  const tech = Object.values(data.technicalSkills || {}).flat().join(' ');
  const soft = (data.softSkills || []).join(' ');
  const langs = (data.languages || []).map((item) => `${item.language} ${item.level}`).join(' ');

  return normalizeText(`${personal.name || ''} ${personal.summary || ''} ${experience} ${courses} ${tech} ${soft} ${langs}`);
}

async function init() {
  try {
    const response = await fetch('cv.json', { cache: 'no-store' });
    if (!response.ok) {
      throw new Error('No se pudo cargar cv.json');
    }

    cvData = await response.json();
    renderCv(cvData);
    setSchemaOrg(cvData);

    const baseCharacters = collectCvCharacters(cvData) + buildCvTextSummary(cvData);
    await waitForFrame();
    await buildAsciiPortrait('image/portrait_photo.png', baseCharacters);
    hideStartupLoader();

    buildCvButton.addEventListener('click', animateToCurriculum);
  } catch (error) {
    hideStartupLoader();
    portraitContainer.innerHTML = '<p class="p-4 text-center text-sm text-rose-300">No se pudo generar el retrato ni cargar el curriculum.</p>';
    buildCvButton.disabled = true;
    buildCvButton.classList.add('opacity-60', 'cursor-not-allowed');
    console.error(error);
  }
}

window.addEventListener('resize', () => {
  window.clearTimeout(resizeDebounceId);
  resizeDebounceId = window.setTimeout(() => {
    if (!transitionRunning && cvData) {
      const charPool = collectCvCharacters(cvData) + buildCvTextSummary(cvData);
      buildAsciiPortrait('image/portrait_photo.png', charPool).catch(() => undefined);
    }
  }, 220);
});

window.addEventListener('beforeunload', () => {
  if (transitionLayer) {
    transitionLayer.remove();
    transitionLayer = null;
  }
});

init();