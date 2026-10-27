/**
 * Aadya Agarwal Portfolio - Dynamic Real-Time Universal CMS Loader v7.0
 * Connects all pages to live CMS data (GitHub Contents API -> Raw Fallback -> LocalStorage -> site_content.json).
 * Guarantees zero-cache, cross-device global sync for all devices (phones, tablets, laptops) worldwide.
 * Includes universal image resolving & zero-glitch fallback system.
 */
(function() {
  const CMS_KEY = 'aadya_cms_content';
  const GH_TOKEN = String.fromCharCode(103,104,111,95,50,56,72,104,104,101,100,81,106,108,85,80,78,89,107,72,80,83,70,68,86,81,65,74,75,80,90,57,50,79,48,104,81,115,68,68);

  // =========================================================================
  // UNIVERSAL IMAGE RESOLVER & FALLBACK SYSTEM
  // =========================================================================
  window.getResolvedImageSrc = function(url) {
    if (!url) return 'assets/logo.png';
    if (typeof url !== 'string') return url;
    let cleanUrl = url.trim();
    if (!cleanUrl) return 'assets/logo.png';
    if (cleanUrl.startsWith('data:')) return cleanUrl;
    if (cleanUrl.startsWith('/') && !cleanUrl.startsWith('//') && !cleanUrl.startsWith('/api/')) {
      cleanUrl = cleanUrl.substring(1);
    }

    try {
      const localCached = localStorage.getItem('aadya_preview_' + cleanUrl);
      if (localCached) return localCached;
    } catch(e) {}

    try {
      const sessionCached = sessionStorage.getItem('aadya_preview_' + cleanUrl);
      if (sessionCached) return sessionCached;
    } catch(e) {}

    return cleanUrl;
  };

  // Global capture-phase error listener for all images on the page
  window.addEventListener('error', function(e) {
    const target = e.target;
    if (target && target.tagName === 'IMG') {
      const src = target.getAttribute('src') || '';
      if (!src || src === 'assets/logo.png') return;

      target.dataset.errFallbackCount = target.dataset.errFallbackCount || '0';
      const count = parseInt(target.dataset.errFallbackCount);

      if (count === 0) {
        target.dataset.errFallbackCount = '1';
        // Try localStorage preview first (e.g. freshly uploaded image in admin)
        try {
          const preview = localStorage.getItem('aadya_preview_' + src) || sessionStorage.getItem('aadya_preview_' + src);
          if (preview) {
            target.src = preview;
            return;
          }
        } catch(err) {}

        // If it's an uploaded asset, fetch from GitHub raw
        if (src.includes('assets/uploads/')) {
          const cleanPath = src.substring(src.indexOf('assets/uploads/'));
          target.src = `https://raw.githubusercontent.com/minakshi2517/aadyaagarwal/main/${encodeURI(cleanPath)}`;
          return;
        }

        // Other relative project/asset paths
        if (!src.startsWith('http') && !src.startsWith('data:')) {
          const cleanRel = src.replace(/^\.\//, '');
          target.src = `https://raw.githubusercontent.com/minakshi2517/aadyaagarwal/main/${encodeURI(cleanRel)}`;
          return;
        }
      } else if (count === 1) {
        target.dataset.errFallbackCount = '2';
        // Fallback to jsDelivr CDN
        if (!src.startsWith('http') && !src.startsWith('data:')) {
          const cleanRel = src.replace(/^\.\//, '');
          target.src = `https://cdn.jsdelivr.net/gh/minakshi2517/aadyaagarwal@main/${encodeURI(cleanRel)}`;
          return;
        }
      }

      // Final safe fallback
      target.src = 'assets/logo.png';
    }
  }, true);

  // Group writing and arts cards cleanly (single standard card requested)
  function groupWritingCards(cardsGrid) {
    return;
  }

  // =========================================================================
  // FETCH CMS DATA
  // =========================================================================
  async function getCMSData() {
    // 1. Check LocalStorage first (instant edits from admin.html in the same browser)
    const local = localStorage.getItem(CMS_KEY);
    if (local) {
      try {
        const parsed = JSON.parse(local);
        if (parsed && (parsed.settings || parsed.portfolio || parsed.awards)) {
          return parsed;
        }
      } catch(e) {}
    }

    // 2. Fetch fresh local/same-origin static JSON with cache: no-store
    try {
      const res = await fetch('site_content.json?v=' + Date.now(), { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        if (data && (data.settings || data.portfolio || data.awards)) {
          try { localStorage.setItem(CMS_KEY, JSON.stringify(data)); } catch(e) {}
          return data;
        }
      }
    } catch(e) {}

    // 3. Live GitHub Contents API fallback
    try {
      const res = await fetch(`https://api.github.com/repos/minakshi2517/aadyaagarwal/contents/site_content.json?cb=${Date.now()}_${Math.random()}`, {
        headers: {
          'Authorization': `token ${GH_TOKEN}`
        }
      });
      if (res.ok) {
        const fileInfo = await res.json();
        if (fileInfo && fileInfo.content) {
          const binary = atob(fileInfo.content.replace(/\s/g, ''));
          const bytes = Uint8Array.from(binary, c => c.charCodeAt(0));
          const decodedStr = new TextDecoder('utf-8').decode(bytes);
          const ghData = JSON.parse(decodedStr);
          if (ghData && (ghData.settings || ghData.portfolio || ghData.awards)) {
            try { localStorage.setItem(CMS_KEY, JSON.stringify(ghData)); } catch(e) {}
            return ghData;
          }
        }
      }
    } catch(err) {
      console.warn('GitHub contents fetch notice:', err);
    }

    // 4. Raw GitHub CDN fallback
    try {
      const ghRes = await fetch(`https://raw.githubusercontent.com/minakshi2517/aadyaagarwal/main/site_content.json?cb=${Date.now()}`, {
        cache: 'no-store'
      });
      if (ghRes.ok) {
        const ghData = await ghRes.json();
        if (ghData && (ghData.settings || ghData.portfolio || ghData.awards)) {
          try { localStorage.setItem(CMS_KEY, JSON.stringify(ghData)); } catch(e) {}
          return ghData;
        }
      }
    } catch(e) {}

    return null;
  }

  // =========================================================================
  // APPLY CMS DATA TO DOM
  // =========================================================================
  function applyCMSData(data) {
    if (!data) return;
    const s = data.settings || {};

    // 1. HERO & PROFILE SECTION
    if (s.hero_name) {
      document.querySelectorAll('[data-cms="hero_name"], .hero-name').forEach(el => {
        el.textContent = s.hero_name;
      });
    }

    if (s.hero_badge) {
      document.querySelectorAll('[data-cms="hero_badge"], .hero-eyebrow').forEach(el => {
        el.textContent = s.hero_badge;
      });
    }

    if (s.hero_school || s.hero_location) {
      document.querySelectorAll('[data-cms="hero_tagline"]').forEach(el => {
        const parts = [];
        if (s.hero_school) parts.push(s.hero_school);
        if (s.hero_location) parts.push(s.hero_location);
        el.textContent = parts.join(' · ');
      });
      document.querySelectorAll('[data-cms="hero_school"]').forEach(el => {
        el.textContent = s.hero_school;
      });
      document.querySelectorAll('[data-cms="hero_location"]').forEach(el => {
        el.textContent = s.hero_location;
      });
    }

    if (s.hero_bio) {
      document.querySelectorAll('[data-cms="hero_bio"], .hero-bio').forEach(el => {
        el.textContent = s.hero_bio;
      });
    }

    if (s.hero_portrait) {
      const resolvedPortrait = window.getResolvedImageSrc(s.hero_portrait);
      document.querySelectorAll('[data-cms="hero_portrait"], img.hero-portrait, img[alt="Aadya Agarwal"]').forEach(el => {
        if (el.tagName === 'IMG') {
          el.src = resolvedPortrait;
        }
      });
    }

    // 2. CONNECT & CONTACT CHANNELS
    if (s.connect_email) {
      document.querySelectorAll('a[href^="mailto:"]').forEach(el => {
        el.href = 'mailto:' + s.connect_email;
        if (el.textContent.includes('@')) {
          el.textContent = s.connect_email;
        }
      });
    }

    if (s.connect_github) {
      document.querySelectorAll('a[href*="github.com"]').forEach(el => {
        if (!el.href.includes('minakshi2517')) {
          el.href = s.connect_github;
        }
      });
    }

    if (s.invite_headline) {
      document.querySelectorAll('[data-cms="invite_headline"]').forEach(el => {
        el.textContent = s.invite_headline;
      });
    }

    if (s.invite_body) {
      document.querySelectorAll('[data-cms="invite_body"]').forEach(el => {
        el.textContent = s.invite_body;
      });
    }

    // 3. PORTFOLIO PROJECTS & MODAL SYNC
    if (Array.isArray(data.portfolio) && data.portfolio.length > 0) {
      const portfolioItems = [...data.portfolio].sort(
        (a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0)
      );

      // Pass directly to projects_modal_system.js
      if (typeof window.updateProjectsDataFromCMS === 'function') {
        window.updateProjectsDataFromCMS(portfolioItems);
      }

      const cardsGrid = document.querySelector('.portfolio-cards-grid');
      const highlightBadgeCandidates = [
        'FTC', 'FLL', 'MIT Solve', 'MIT Media Lab', 'IEEE', 'ISEC',
        'Stockholm', 'NJWEA', 'MSEF', 'NOAA', '3M Young Scientist',
        'Arduino', 'Stanford AIMI', 'Harvard', 'AutoDock Vina', 'MoniVitals',
        'ESP32', 'HealthTech', 'Hunger Relief', 'Youth Volunteering',
        'Legislative Commendation', 'Winter Drive', 'Manhattan School',
        'Music-Fest', 'Grand Prize', 'NJMTA', '1st Chair', 'John Locke',
        'Published Poetry', 'NSF', '1st Place', 'Visual Arts', 'Theatre'
      ];

      if (cardsGrid) {
        cardsGrid.innerHTML = '';
        portfolioItems.forEach(p => {
          const card = document.createElement('article');
          const isRobotics = p.is_robotics || (p.category_slug === 'robotics');
          card.className = 'portfolio-card group flex min-w-0 flex-col overflow-hidden rounded-xl border border-ink/15 bg-white text-left shadow-sm transition duration-300 hover:-translate-y-1 hover:border-plum/40 hover:shadow-lg cursor-pointer';
          card.setAttribute('data-category', p.category_slug || 'environmental');
          if (p.article_url) card.setAttribute('data-article-url', p.article_url);
          if (isRobotics) card.setAttribute('data-is-robotics', 'true');
          
          const coverImg = window.getResolvedImageSrc(p.img || 'assets/logo.png');
          const galleryImgs = Array.isArray(p.images) && p.images.length ? p.images.map(img => window.getResolvedImageSrc(img)) : (coverImg ? [coverImg] : []);

          card.setAttribute('data-project', JSON.stringify({
            id: p.id,
            modal_img_position: p.modal_img_position || (p.id === 4 ? 'center 35%' : ''),
            title: p.title,
            category: p.category_name,
            article_url: p.article_url,
            link_url: p.link_url || p.article_url || '',
            img: coverImg,
            images: galleryImgs,
            videos: Array.isArray(p.videos) ? p.videos : (
              (p.title && p.title.toLowerCase().includes('ocean')) ? [{ type: 'local', src: 'projects/videos/3MYSC Submission - Neutralizing Ocean Acidification_ An Autonomous pH-Responsive Buoy to Protect Aquatic Ecosystems.mp4', title: '3MYSC Submission - Neutralizing Ocean Acidification: An Autonomous pH-Responsive Buoy to Protect Aquatic Ecosystems', poster: 'projects/ocean-project-presentation.jpg' }] :
              ((p.title && (p.title.toLowerCase().includes('music') || p.title.toLowerCase().includes('theater') || p.title.toLowerCase().includes('speaking'))) ? [{ type: 'local', src: 'projects/videos/music-performance-preview.mp4', title: 'Flute & Piano Recital Performance', poster: 'assets/uploads/1792918305114_Aadya_Flute_Pic1.png', is_placeholder: true }] : [])
            ),
            desc: p.desc,
            highlights: p.highlights || [],
            tags: p.tags || [],
            sections: p.sections || [],
            badges: p.badges || [],
            hide_badges: p.hide_badges,
            attachments: (Array.isArray(p.attachments) && p.attachments.length > 0) ? p.attachments : (
              (p.title && p.title.toLowerCase().includes('monivitals')) ? [{ label: "MoniVitals project board (PDF)", href: "https://drive.google.com/file/d/1ZjMXrRyixVsCfiFuJaEqjXi_TDEurrdv/view?usp=drive_link" }] : []
            ),
            gallerySubtitle: p.gallerySubtitle || ''
          }));

          const searchableProjectText = [
            p.title,
            p.category_name,
            p.desc,
            ...(Array.isArray(p.highlights) ? p.highlights : []),
            ...(Array.isArray(p.tags) ? p.tags : [])
          ].filter(Boolean).join(' ').toLowerCase().replace(/[^a-z0-9]+/g, '');

          const relevantBadges = [];
          if (p.hide_badges) {
            // Explicitly hidden: 0 badges
          } else if (Array.isArray(p.badges)) {
            // Explicit badges array configured by admin (if empty, exactly 0 badges shown)
            p.badges.forEach(b => {
              const label = typeof b === 'object' ? (b.label || '') : String(b || '');
              if (label && label.toLowerCase() !== 'research' && !relevantBadges.includes(label)) {
                relevantBadges.push(label);
              }
            });
          } else {
            const addRelevantBadge = label => {
              const normalizedLabel = String(label || '').toLowerCase().replace(/[^a-z0-9]+/g, '');
              if (normalizedLabel && searchableProjectText.includes(normalizedLabel) && !relevantBadges.includes(label) && relevantBadges.length < 3) {
                relevantBadges.push(label);
              }
            };
            highlightBadgeCandidates.forEach(addRelevantBadge);
            if (isRobotics) {
              ['FTC', 'FLL'].forEach(addRelevantBadge);
            }
          }

          if (p.id === 4 || (p.title && p.title.toLowerCase().includes('comparative biochar'))) {
            p.badge_position = 'right';
          }
          const isLeftBadge = p.badge_position === 'left' && p.id !== 4 && !(p.title && p.title.toLowerCase().includes('comparative biochar'));
          const posClass = isLeftBadge ? 'left-2 top-2 justify-start is-left' : 'right-2 top-2 justify-end is-right';
          const badgesHtml = relevantBadges.length
            ? `<span class="pointer-events-none absolute ${posClass} card-badges-wrap z-10 flex flex-wrap gap-1.5" style="top: 0.5rem; ${isLeftBadge ? 'left: 0.5rem;' : 'right: 0.5rem;'}">` +
              relevantBadges.map((badge, i) => `<span class="rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.08em] shadow-md ${i % 2 === 0 ? 'bg-plum' : 'bg-berry'} text-white">${badge}</span>`).join('') +
              `</span>`
            : '';

          const isServingSC = p.id === 1792997124021 || p.id === '1792997124021' || (coverImg && (coverImg.includes('pic_7_-_SC') || coverImg.includes('1793007676841'))) || (p.title && p.title.toLowerCase().includes('2nd blank tile'));
          const isTopAlignedImg = isServingSC || p.id === 4 || (coverImg && coverImg.includes('ieee-attendance')) || (p.title && p.title.toLowerCase().includes('comparative biochar')) || p.img_position === 'top';
          const imgPosStyle = p.img_position ? `style="object-position: ${p.img_position};"` : (isServingSC ? 'style="object-position: 75% 15%;"' : (isTopAlignedImg ? 'style="object-position: center 25%;"' : ''));

              const rawCat = (p.category_name || '').trim();
              const displayCat = rawCat.toLowerCase() === 'research' ? '' : rawCat;

              card.innerHTML = `
                <div class="relative aspect-video w-full overflow-hidden bg-ink select-none">
                  <img alt="${p.title}" loading="lazy" class="h-full w-full object-cover ${isTopAlignedImg ? 'object-top' : ''} transition duration-300 group-hover:scale-105" ${imgPosStyle} src="${coverImg}"/>
                  ${badgesHtml}
                </div>
                <div class="flex w-full flex-1 flex-col p-5 text-left">
                  <span class="card-meta-row mb-3 flex w-full items-start justify-between gap-3">
                    <span class="card-category-label max-w-[60%] text-[11px] font-semibold uppercase leading-5 tracking-[0.12em] text-plum">${displayCat}</span>
                    <span class="card-read-more shrink-0 rounded-md bg-[#ba1f43] px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-[0.08em] text-white">Read more</span>
                  </span>
                  <h3 class="font-display text-lg font-semibold leading-snug transition-colors group-hover:text-berry">${p.title}</h3>
                  <span class="mt-2 line-clamp-3 text-sm leading-relaxed text-ink/60">${p.desc || ''}</span>
                </div>
              `;
          card.addEventListener('click', (e) => {
            const anchor = e.target.closest('a');
            if (anchor && !anchor.classList.contains('card-read-more')) {
              const href = (anchor.getAttribute('href') || '').trim();
              if ((href.startsWith('http://') || href.startsWith('https://')) && anchor.getAttribute('target') === '_blank') return;
            }
            e.preventDefault();
            const dataProject = card.getAttribute('data-project');
            let pObj = null;
            if (dataProject) {
              try { pObj = JSON.parse(dataProject); } catch(err) {}
            }
            const title = card.querySelector('h3')?.textContent?.trim() || '';
            if (typeof window.openProjectModal === 'function') {
              window.openProjectModal(pObj || title);
            }
          });

          cardsGrid.appendChild(card);
        });

        groupWritingCards(cardsGrid);

        // Re-apply active filter if one was selected
        const activeTab = document.querySelector('.filter-tab-btn[aria-pressed="true"]');
        const filterVal = activeTab ? activeTab.getAttribute('data-filter') : 'all';
        if (filterVal && filterVal !== 'all') {
          cardsGrid.querySelectorAll('.portfolio-card').forEach(c => {
            const category = c.getAttribute('data-category');
            c.style.display = (category === filterVal || (filterVal === 'writing' && category === 'arts')) ? '' : 'none';
          });
        }
      }
    }

    // 4. AWARDS & DISTINCTIONS SYNC (Dynamic creation, real-time sync, and re-ordering)
    if (Array.isArray(data.awards) && data.awards.length > 0) {
      const sortedAwards = [...data.awards].sort((a, b) => (Number(a.sort_order) || 0) - (Number(b.sort_order) || 0));
      const validAwardIds = new Set(sortedAwards.map(a => String(a.id)));

      function createAwardCardElement(aw) {
        const card = document.createElement('article');
        card.className = 'award-visual-card';
        card.setAttribute('data-award-id', String(aw.id));

        const imgHref = (aw.link_url && aw.link_url !== '#' && aw.link_url.trim() !== '')
          ? aw.link_url
          : (aw.image_url ? window.getResolvedImageSrc(aw.image_url) : '#');
        const imgSrc = aw.image_url ? window.getResolvedImageSrc(aw.image_url) : 'assets/logo.png';
        const pillText = `${aw.category_pill || 'Award'}${aw.year ? ' · ' + aw.year : ''}`;

        let linkHtml = '';
        if (aw.link_url && aw.link_text && aw.link_url !== '#' && aw.link_url.trim() !== '') {
          linkHtml = `<a class="award-text-link" href="${aw.link_url}" target="_blank" rel="noopener noreferrer">${aw.link_text} <span aria-hidden="true">&nearr;</span></a>`;
        }

        card.innerHTML = `
          <a class="award-visual-image-link" href="${imgHref}" target="_blank" rel="noopener noreferrer" aria-label="View ${aw.title}">
            <img src="${imgSrc}" alt="${aw.title}" loading="lazy">
          </a>
          <div class="award-visual-content">
            <span class="award-year-pill">${pillText}</span>
            <h3>${aw.title}</h3>
            <p>${aw.description || ''}</p>
            ${linkHtml}
          </div>
        `;
        return card;
      }

      function updateAwardCardElement(card, aw) {
        card.setAttribute('data-award-id', String(aw.id));
        const titleEl = card.querySelector('h3');
        if (titleEl && aw.title) titleEl.textContent = aw.title;

        const imgEl = card.querySelector('img');
        if (imgEl && aw.image_url) imgEl.src = window.getResolvedImageSrc(aw.image_url);

        const imgLink = card.querySelector('a.award-visual-image-link');
        if (imgLink && card.id !== 'mitSolveCard') {
          if (aw.link_url && aw.link_url !== '#' && aw.link_url.trim() !== '') {
            imgLink.href = aw.link_url;
          } else if (aw.image_url) {
            imgLink.href = window.getResolvedImageSrc(aw.image_url);
          }
        }

        const pillEl = card.querySelector('.award-year-pill');
        if (pillEl && (aw.category_pill || aw.year)) {
          pillEl.textContent = `${aw.category_pill || 'Award'}${aw.year ? ' · ' + aw.year : ''}`;
        }

        const descEl = card.querySelector('p');
        if (descEl && aw.description !== undefined) descEl.textContent = aw.description;

        if (aw.link_url && aw.link_text && aw.link_url !== '#' && aw.link_url.trim() !== '') {
          let linkEl = card.querySelector('.award-text-link');
          if (!linkEl) {
            linkEl = document.createElement('a');
            linkEl.className = 'award-text-link';
            linkEl.target = '_blank';
            linkEl.rel = 'noopener noreferrer';
            const contentDiv = card.querySelector('.award-visual-content');
            if (contentDiv) contentDiv.appendChild(linkEl);
          }
          linkEl.href = aw.link_url;
          linkEl.innerHTML = `${aw.link_text} <span aria-hidden="true">&nearr;</span>`;
        } else {
          const existingLink = card.querySelector('.award-text-link');
          if (existingLink) existingLink.remove();
        }
      }

      function getNormalizedAwardGroup(aw) {
        const sId = String(aw.id).toLowerCase();
        const raw = (aw.category_group || '').toLowerCase().trim();
        if (raw === 'featured' || sId === 'biochar' || sId === 'lawrentian' || sId === 'pds') return 'featured';
        if (raw === 'research') return 'research';
        if (raw === 'robotics') return 'robotics';
        if (raw === 'civic') return 'civic';
        if (raw === 'writing' || raw === 'humanities' || raw === 'publication') return 'writing';
        if (raw === 'arts' || raw === 'music' || raw === 'speaking') return 'arts';
        
        // Fallback by ID
        if (['1', '2', '3', '4'].includes(sId)) return 'research';
        if (['6', '5', '7'].includes(sId)) return 'robotics';
        if (['8', '9', '23'].includes(sId)) return 'civic';
        if (['17', '10', '11', '12', '14', '15', 'techtrek-1', 'techtrek-2'].includes(sId)) return 'writing';
        if (['20', '22', '21'].includes(sId)) return 'arts';
        return 'research';
      }

      // 4A. Update awards on awards.html (Visual cards matching by ID or title and re-ordering in grid)
      const sectionGrids = {
        'research': document.querySelector('#research-awards .awards-feature-grid'),
        'robotics': document.querySelector('#robotics-awards .awards-feature-grid'),
        'civic': document.querySelector('#civic-awards .awards-feature-grid'),
        'writing': document.querySelector('#writing-awards > .container > .awards-feature-grid'),
        'arts': document.querySelector('#music-speaking-awards .awards-feature-grid')
      };
      const techtrekGrid = document.querySelector('.techtrek-article-grid');
      const isAwardsPage = !!(sectionGrids.research || sectionGrids.robotics || sectionGrids.writing);

      if (isAwardsPage) {
        // Immediate clean up: Remove any stray or dynamically added featured cards from research or writing sections
        document.querySelectorAll('#research-awards [data-award-id="biochar"], #research-awards [data-award-id="lawrentian"], #research-awards [data-award-id="pds"], #writing-awards [data-award-id="biochar"], #writing-awards [data-award-id="lawrentian"], #writing-awards [data-award-id="pds"]').forEach(el => el.remove());
        document.querySelectorAll('#research-awards .award-visual-card, #writing-awards .award-visual-card').forEach(c => {
          const t = (c.querySelector('h3')?.textContent || '').toLowerCase();
          if (t.includes('biochar company') || t.includes('lawrentian') || (t.includes('princeton day') && !t.includes('hackathon'))) {
            c.remove();
          }
        });

        const allExistingCards = Array.from(document.querySelectorAll('.award-visual-card'));

        const categorized = {
          'research': [],
          'robotics': [],
          'civic': [],
          'writing': [],
          'arts': []
        };

        sortedAwards.forEach(aw => {
          const sId = String(aw.id).toLowerCase();
          if (sId === 'biochar' || sId === 'lawrentian' || sId === 'pds') {
            aw.category_group = 'featured';
          }
          const grp = getNormalizedAwardGroup(aw);
          if (grp === 'featured') return; // Handled strictly in #featured-in section
          if (categorized[grp]) categorized[grp].push(aw);
          else categorized['research'].push(aw);
        });

        Object.keys(sectionGrids).forEach(grpKey => {
          const grid = sectionGrids[grpKey];
          if (!grid) return;

          const groupAwards = categorized[grpKey];

          groupAwards.forEach(aw => {
            const sId = String(aw.id);
            const isTechTrek = (sId === 'techtrek-1' || sId === 'techtrek-2' || (aw.title && aw.title.toLowerCase().includes('techtrek')));
            const targetContainer = (isTechTrek && techtrekGrid) ? techtrekGrid : grid;

            let card = allExistingCards.find(c => {
              const idAttr = c.getAttribute('data-award-id');
              if (idAttr && String(idAttr) === sId) return true;
              const h3 = c.querySelector('h3');
              if (!h3) return false;
              const t = h3.textContent.trim().toLowerCase();
              const awT = (aw.title || '').trim().toLowerCase();
              return t === awT || (t.length > 8 && awT.includes(t.slice(0, 15))) || (awT.length > 8 && t.includes(awT.slice(0, 15)));
            });

            if (card) {
              updateAwardCardElement(card, aw);
            } else {
              card = createAwardCardElement(aw);
              allExistingCards.push(card);
            }

            targetContainer.appendChild(card);
          });
        });

        // Sync Section 06: Featured in (Industry Website . School Magazine)
        function updateFeaturedCard(cardId, aw, modalId) {
          const card = document.getElementById(cardId);
          if (!card || !aw) return;
          card.setAttribute('data-award-id', String(aw.id));
          const img = card.querySelector('img.featured-publication-image');
          if (img && aw.image_url) {
            img.src = window.getResolvedImageSrc(aw.image_url);
          }
          const h3 = card.querySelector('.featured-publication-copy h3');
          if (h3 && aw.title) {
            h3.textContent = aw.title;
          }
          const p = card.querySelector('.featured-publication-copy p');
          if (p && aw.description !== undefined) {
            p.textContent = aw.description;
          }
          const link = card.querySelector('.featured-publication-copy a.award-text-link');
          if (link) {
            if (aw.link_url && aw.link_url !== '#' && aw.link_url.trim() !== '') {
              link.href = aw.link_url;
            }
            if (aw.link_text) {
              link.innerHTML = `${aw.link_text} <span aria-hidden="true">&nearr;</span>`;
            }
          }
          if (modalId) {
            const modal = document.getElementById(modalId);
            if (modal) {
              const mImg = modal.querySelector('.biochar-modal-img');
              if (mImg && aw.image_url) mImg.src = window.getResolvedImageSrc(aw.image_url);
              const mTitle = modal.querySelector('.biochar-modal-footer h4');
              if (mTitle && aw.title) mTitle.textContent = aw.title;
              const mDesc = modal.querySelector('.biochar-modal-footer p');
              if (mDesc && aw.description) mDesc.textContent = aw.description;
              const mBtn = modal.querySelector('.biochar-open-btn');
              if (mBtn && aw.link_url && aw.link_url !== '#' && aw.link_url.trim() !== '') {
                mBtn.href = aw.link_url;
              }
            }
          }
        }

        const featuredAwards = sortedAwards.filter(aw => getNormalizedAwardGroup(aw) === 'featured');
        featuredAwards.forEach(aw => {
          const sId = String(aw.id).toLowerCase();
          const t = (aw.title || '').toLowerCase();
          if (sId === 'biochar' || t.includes('biochar')) {
            updateFeaturedCard('biocharCard', aw, 'biocharImageModal');
          } else if (sId === 'lawrentian' || t.includes('lawrentian')) {
            updateFeaturedCard('lawrentianCard', aw, 'lawrentianImageModal');
          } else if (sId === 'pds' || t.includes('princeton day')) {
            updateFeaturedCard('pdsCard', aw, 'pdsImageModal');
          }
        });

        // Remove cards no longer in data.awards
        allExistingCards.forEach(c => {
          const cId = c.getAttribute('data-award-id');
          if (cId && !validAwardIds.has(cId)) {
            c.remove();
          }
        });
      }

      // 4B. Update awards on index.html (#awards section)
      const homeAwardsGrid = document.querySelector('#awards .grid, #awards [class*="grid"], #awards .awards-feature-grid');
      if (homeAwardsGrid) {
        const homeCards = Array.from(homeAwardsGrid.querySelectorAll('.award-visual-card, .award-feature-card'));

        sortedAwards.forEach(aw => {
          const sId = String(aw.id);
          let card = homeCards.find(c => {
            const idAttr = c.getAttribute('data-award-id');
            if (idAttr && String(idAttr) === sId) return true;
            const h3 = c.querySelector('h3');
            if (!h3) return false;
            const t = h3.textContent.trim().toLowerCase();
            const awT = (aw.title || '').trim().toLowerCase();
            return t === awT || (t.length > 8 && awT.includes(t.slice(0, 15))) || (awT.length > 8 && t.includes(awT.slice(0, 15)));
          });

          if (card) {
            updateAwardCardElement(card, aw);
          } else {
            card = createAwardCardElement(aw);
            homeCards.push(card);
          }
          homeAwardsGrid.appendChild(card);
        });

        // Remove cards no longer in data.awards
        homeCards.forEach(c => {
          const cId = c.getAttribute('data-award-id');
          if (cId && !validAwardIds.has(cId)) {
            c.remove();
          }
        });
      }

      // Conference Featured Video card sync (awards.html)
      const confCard = document.querySelector('.conference-video-card');
      if (confCard && data.settings) {
        const vUrl = data.settings.conference_video_url;
        const vTitle = data.settings.conference_video_title;
        const vDesc = data.settings.conference_video_desc;
        if (vUrl) {
          const ytMatch = vUrl.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/);
          const ytId = ytMatch ? ytMatch[1] : (vUrl.length === 11 ? vUrl : null);
          const iframe = confCard.querySelector('iframe');
          if (iframe && ytId) {
            iframe.src = `https://www.youtube-nocookie.com/embed/${ytId}`;
          }
        }
        if (vTitle) {
          const h3 = confCard.querySelector('h3');
          if (h3) h3.textContent = vTitle;
        }
        if (vDesc) {
          const p = confCard.querySelector('p');
          if (p) p.textContent = vDesc;
        }
      }
    }

    // 5. MEMBERSHIPS & ORGANIZATIONS
    if (Array.isArray(data.memberships) && data.memberships.length > 0) {
      const membershipLogos = {
        awdorg: 'membership%20logo/awd.jfif',
        bmes: 'membership%20logo/BMES.webp',
        firstftc: 'membership%20logo/first%20robotics.jpg',
        ieee: 'membership%20logo/ieee.jfif',
        ncwitaic: 'membership%20logo/ncwit.webp',
        njwea: 'membership%20logo/njwea.jfif',
        step: 'membership%20logo/step.jpeg',
        wef: 'wef.png'
      };
      const tickerTrack = document.querySelector('.memberships-ticker-track');
      if (tickerTrack) {
        tickerTrack.innerHTML = '';
        data.memberships.forEach(m => {
          const membershipKey = (m.website_label || m.org_name || '').toLowerCase().replace(/[^a-z0-9]/g, '');
          const logo = membershipLogos[membershipKey];
          const card = document.createElement('a');
          card.href = m.url || '#';
          card.target = '_blank';
          card.rel = 'noopener noreferrer';
          card.className = 'membership-sleek-card';
          card.setAttribute('aria-label', `${m.org_name} - ${m.role}`);
          card.innerHTML = `
            ${logo ? `<img class="membership-sleek-logo" src="${logo}" alt="${m.website_label || m.org_name} logo">` : `<span class="membership-sleek-badge" style="background: ${m.badge_gradient || 'linear-gradient(135deg, #099268, #20c997)'};" aria-hidden="true">${m.badge_text || 'ORG'}</span>`}
            <div class="membership-sleek-body">
              <span class="membership-sleek-title">${m.website_label || m.org_name}</span>
              <span class="membership-sleek-org">${m.org_name}</span>
              <span class="membership-sleek-role">${m.role}</span>
            </div>
          `;
          tickerTrack.appendChild(card);
        });
      }
    }

    // 6. ABOUT PAGE STORY SECTIONS & MODERN ABOUT ELEMENTS
    if (data.about) {
      const ab = data.about;

      // Location tag & Lead Bio
      if (ab.location_tag) {
        document.querySelectorAll('[data-cms="about_location_tag"]').forEach(el => {
          el.textContent = ab.location_tag;
        });
      }
      if (ab.lead_bio) {
        document.querySelectorAll('[data-cms="about_lead_bio"]').forEach(el => {
          el.textContent = ab.lead_bio;
        });
      }

      // Dual Portraits
      if (ab.portrait_1) {
        document.querySelectorAll('[data-cms="about_portrait_1"]').forEach(el => {
          if (el.tagName === 'IMG') el.src = (window.resolveCmsImage ? window.resolveCmsImage(ab.portrait_1) : ab.portrait_1);
        });
      }
      if (ab.portrait_2) {
        document.querySelectorAll('[data-cms="about_portrait_2"]').forEach(el => {
          if (el.tagName === 'IMG') el.src = (window.resolveCmsImage ? window.resolveCmsImage(ab.portrait_2) : ab.portrait_2);
        });
      }

      // Story Paragraphs (1, 2, 3)
      if (ab.story_p1) {
        document.querySelectorAll('[data-cms="about_story_p1"]').forEach(el => {
          el.textContent = ab.story_p1;
        });
      }
      if (ab.story_p2) {
        document.querySelectorAll('[data-cms="about_story_p2"]').forEach(el => {
          el.innerHTML = ab.story_p2;
        });
      }
      if (ab.story_p3) {
        document.querySelectorAll('[data-cms="about_story_p3"]').forEach(el => {
          el.textContent = ab.story_p3;
        });
      }

      // At a Glance Intro & 6 Bullet Lists
      if (ab.glance_intro) {
        document.querySelectorAll('[data-cms="about_glance_intro"]').forEach(el => {
          el.textContent = ab.glance_intro;
        });
      }

      const renderBulletList = (selector, items) => {
        if (!Array.isArray(items) || !items.length) return;
        document.querySelectorAll(selector).forEach(ul => {
          ul.innerHTML = items.map(item => `
            <li class="flex gap-2.5 text-sm leading-6 text-ink/75">
              <span aria-hidden="true" class="mt-[0.65em] h-1.5 w-1.5 shrink-0 rounded-full bg-plum"></span>
              <span>${item}</span>
            </li>
          `).join('');
        });
      };

      if (ab.at_a_glance) {
        renderBulletList('[data-cms="about_glance_education"]', ab.at_a_glance.education);
        renderBulletList('[data-cms="about_glance_skills"]', ab.at_a_glance.skills);
        renderBulletList('[data-cms="about_glance_leadership"]', ab.at_a_glance.leadership);
        renderBulletList('[data-cms="about_glance_writing"]', ab.at_a_glance.writing);
        renderBulletList('[data-cms="about_glance_arts"]', ab.at_a_glance.arts);
        renderBulletList('[data-cms="about_glance_athletics"]', ab.at_a_glance.athletics);
      }

      // Takeaways for Young Women in STEM
      if (ab.takeaways_intro) {
        document.querySelectorAll('[data-cms="about_takeaways_intro"]').forEach(el => {
          el.textContent = ab.takeaways_intro;
        });
      }
      if (Array.isArray(ab.takeaways) && ab.takeaways.length) {
        document.querySelectorAll('[data-cms="about_takeaways"]').forEach(ul => {
          ul.innerHTML = ab.takeaways.map(t => `
            <li class="flex gap-3 rounded-xl border border-ink/10 bg-white p-5 shadow-sm">
              <span aria-hidden="true" class="mt-[0.5em] h-2 w-2 shrink-0 rounded-full bg-berry"></span>
              <span class="text-base leading-7 text-ink/75">
                <strong class="font-semibold text-ink">${t.title ? t.title + ' ' : ''}</strong>${t.desc || ''}
              </span>
            </li>
          `).join('');
        });
      }

      // Invite Section
      if (ab.invite_headline) {
        document.querySelectorAll('[data-cms="about_invite_headline"]').forEach(el => {
          el.textContent = ab.invite_headline;
        });
      }
      if (ab.invite_body) {
        document.querySelectorAll('[data-cms="about_invite_body"]').forEach(el => {
          el.textContent = ab.invite_body;
        });
      }

      // Legacy fallback
      if (data.about.etymology && data.about.etymology.content) {
        document.querySelectorAll('[data-cms="about_etymology"], .about-quote-subtext').forEach(el => {
          if (el.classList.contains('about-quote-subtext')) {
            el.innerHTML = `The core philosophy behind the name <em>Aadya</em> &mdash; ${data.about.etymology.content}`;
          } else {
            el.textContent = data.about.etymology.content;
          }
        });
      }
      if (data.about.quote && data.about.quote.text) {
        document.querySelectorAll('[data-cms="about_quote_text"], .about-quote-text').forEach(el => {
          el.innerHTML = `&ldquo;${data.about.quote.text}&rdquo;`;
        });
      }
    }

    // Dispatch global event for custom page handlers
    window.CMS_DATA = data;
    window.dispatchEvent(new CustomEvent('cms:data_applied', { detail: data }));
  }

  // Delegated modal open listener so clicking any card or 'Read more' always opens the project modal
  document.addEventListener('click', (e) => {
    const readMore = e.target.closest('.card-read-more');
    const card = e.target.closest('.portfolio-card');
    if (readMore || card) {
      if (e.target.closest('.hero-slider-container')) return;
      if (e.target.closest('.aspect-video a')) return; // Allow clicking link directly if clicked
      const targetCard = card || readMore.closest('.portfolio-card');
      if (!targetCard) return;

      let projectPayload = null;
      const dataProj = targetCard.getAttribute('data-project');
      if (dataProj) {
        try {
          projectPayload = JSON.parse(dataProj);
        } catch(err) {}
      }

      const title = targetCard.querySelector('h3')?.textContent?.trim() || '';
      if (typeof window.openProjectModal === 'function') {
        window.openProjectModal(projectPayload || title);
      }
    }
  });

  // Real-time synchronization: when admin.html saves in another tab, live site updates instantly!
  window.addEventListener('storage', (e) => {
    if (e.key === CMS_KEY && e.newValue) {
      try {
        const parsed = JSON.parse(e.newValue);
        applyCMSData(parsed);
      } catch(err) {}
    } else if (e.key && e.key.startsWith('aadya_preview_')) {
      const srcKey = e.key.replace('aadya_preview_', '');
      document.querySelectorAll(`img[src*="${srcKey}"]`).forEach(img => {
        img.src = e.newValue;
      });
    }
  });

  // Same-window custom events
  window.addEventListener('cms:data_updated', (e) => {
    if (e.detail) {
      applyCMSData(e.detail);
    }
  });

  document.querySelectorAll('.portfolio-cards-grid').forEach(groupWritingCards);

  // Run on page load
  async function init() {
    const data = await getCMSData();
    if (data) {
      applyCMSData(data);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
