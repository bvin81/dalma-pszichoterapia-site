/* ---------------------------------------------------
   MOBIL MENÜ
--------------------------------------------------- */
const menuBtn = document.getElementById("menuBtn");
const mobileMenu = document.getElementById("mobileMenu");

if (menuBtn) {
  menuBtn.addEventListener("click", () => {
    mobileMenu.style.display =
      mobileMenu.style.display === "flex" ? "none" : "flex";
  });
}


/* ---------------------------------------------------
   NYELVVÁLTÓ - sessionStorage helyett cookie
--------------------------------------------------- */
function getCurrentLang() {
  const urlParams = new URLSearchParams(window.location.search);
  const urlLang = urlParams.get('lang');
  
  if (urlLang && ['hu', 'ro', 'en'].includes(urlLang)) {
    return urlLang;
  }
  
  const cookies = document.cookie.split(';');
  for (let cookie of cookies) {
    const [name, value] = cookie.trim().split('=');
    if (name === 'lang') {
      return value;
    }
  }
  
  return 'hu';
}

let currentLang = getCurrentLang();

function setLangCookie(lang) {
  const expires = new Date();
  expires.setFullYear(expires.getFullYear() + 1);
  document.cookie = `lang=${lang};expires=${expires.toUTCString()};path=/`;
}

document.querySelectorAll(".lang-switcher button").forEach(btn => {
  if (btn.dataset.lang === currentLang) {
    btn.style.fontWeight = 'bold';
    btn.style.color = '#819A88';
  }
  
  btn.addEventListener("click", () => {
    currentLang = btn.dataset.lang;
    setLangCookie(currentLang);
    
    document.querySelectorAll(".lang-switcher button").forEach(b => {
      b.style.fontWeight = 'normal';
      b.style.color = '';
    });
    btn.style.fontWeight = 'bold';
    btn.style.color = '#819A88';

    loadStaticText();
    
    if (document.getElementById("blogContainer")) {
      loadBlogList();
    }
    if (document.getElementById("postTitle")) {
      loadBlogPost();
    }
  });
});


/* ---------------------------------------------------
   GITHUB PAGES FIX - Automatikus base path detektálás
--------------------------------------------------- */
function getBasePath() {
  const path = window.location.pathname;
  
  // GitHub Pages detektálás
  // Példa: /dalma-pszichoterapia-site/index.html
  // Eredmény: /dalma-pszichoterapia-site/
  
  // Ha service/ almappában vagyunk
  if (path.includes("/service/")) {
    // Keressük meg a repo nevet
    const parts = path.split('/');
    const repoIndex = parts.findIndex(p => p !== '');
    
    if (repoIndex >= 0 && parts[repoIndex] !== 'service') {
      // Van repo név az URL-ben (GitHub Pages)
      return `/${parts[repoIndex]}/`;
    }
    return "../"; // localhost
  }
  
  // Ha a főoldalon vagy blog oldalon vagyunk
  const parts = path.split('/').filter(p => p !== '');
  
  // GitHub Pages: /repo-name/index.html
  // localhost: /index.html
  if (parts.length > 1 && parts[0] !== 'index.html' && parts[0] !== 'blog.html') {
    // Első elem a repo név
    return `/${parts[0]}/`;
  }
  
  // localhost vagy root
  return "./";
}


/* ---------------------------------------------------
   STATIKUS SZÖVEGEK BETÖLTÉSE (lang.json) - CACHE-ELVE
   🔧 JAVÍTVA: lang.json a gyökérben van
--------------------------------------------------- */
let cachedTranslations = null;

function loadStaticText() {
  if (cachedTranslations) {
    updateDOM(cachedTranslations);
    return;
  }
  
  const basePath = getBasePath();
  const langPath = basePath + "lang.json";  // ← JAVÍTVA: lang.json a gyökérben
  
  console.log("🔍 Betöltés:", langPath); // DEBUG

  fetch(langPath)
    .then(res => {
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      return res.json();
    })
    .then(data => {
      console.log("✅ lang.json betöltve", data); // DEBUG
      cachedTranslations = data;
      updateDOM(data);
    })
    .catch(error => {
      console.error("❌ Hiba a lang.json betöltésekor:", error);
      console.error("Próbált útvonal:", langPath);
    });
}

function updateDOM(data) {
  document.querySelectorAll("[data-key]").forEach(el => {
    const key = el.dataset.key;
    if (data[key] && data[key][currentLang]) {
      el.innerHTML = data[key][currentLang];
    }
  });

  document.querySelectorAll("[data-key-placeholder]").forEach(el => {
    const key = el.dataset.keyPlaceholder;
    if (data[key] && data[key][currentLang]) {
      el.placeholder = data[key][currentLang];
    }
  });
}


/* ---------------------------------------------------
   BLOG LISTA BETÖLTÉSE (blog.html)
--------------------------------------------------- */
function loadBlogList() {
  const container = document.getElementById("blogContainer");
  if (!container) return;

  const basePath = getBasePath();
  const blogPath = basePath + "blog-posts.json";
  
  console.log("🔍 Blog lista betöltés:", blogPath); // DEBUG

  fetch(blogPath)
    .then(res => {
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      return res.json();
    })
    .then(posts => {
      console.log("✅ Blog posts betöltve:", posts.length, "poszt"); // DEBUG
      container.innerHTML = "";

      posts.forEach(post => {
        const title = post.title && post.title[currentLang] 
          ? post.title[currentLang] 
          : 'Untitled';
        
        // GitHub Pages fix: blog-post.html linkhez is base path kell
        const postLink = basePath + `blog-post.html?id=${post.id}&lang=${currentLang}`;
        
        // JAVÍTVA: képek útvonala - ha / jellel kezdődik, ne adjuk hozzá a basePath-t
        const imageSrc = post.image.startsWith('/') ? post.image : basePath + post.image;
        
        container.innerHTML += `
          <a href="${postLink}" class="blog-card">
            <div class="blog-card-image">
              <img src="${imageSrc}" alt="${title}" onerror="this.src='${basePath}images/placeholder.jpg'">
            </div>
            <div class="blog-card-content">
              <h3>${title}</h3>
            </div>
          </a>
        `;
      });
    })
    .catch(error => {
      console.error("❌ Hiba a blog-posts.json betöltésekor:", error);
      container.innerHTML = '<p style="text-align:center;color:#999;">Nem sikerült betölteni a blogposztokat.</p>';
    });
}


/* ---------------------------------------------------
   BLOG BEJEGYZÉS BETÖLTÉSE (blog-post.html)
--------------------------------------------------- */
function loadBlogPost() {
  const postTitle = document.getElementById("postTitle");
  const postContent = document.getElementById("postContent");
  const postImage = document.getElementById("postImage");
  
  if (!postTitle || !postContent || !postImage) return;

  const params = new URLSearchParams(window.location.search);
  const id = params.get("id");
  
  if (!id) {
    console.error("❌ Nincs ID paraméter az URL-ben!");
    postContent.innerHTML = '<p style="text-align:center;color:#999;">Nincs megadva blogposzt azonosító.</p>';
    return;
  }

  const basePath = getBasePath();
  const blogPath = basePath + "blog-posts.json";
  
  console.log("🔍 Blog poszt betöltés:", blogPath, "ID:", id); // DEBUG

  fetch(blogPath)
    .then(res => {
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      return res.json();
    })
    .then(posts => {
      const post = posts.find(p => p.id == id);
      
      if (!post) {
        console.error("❌ Nem található a bejegyzés:", id);
        postContent.innerHTML = '<p style="text-align:center;color:#999;">A keresett blogposzt nem található.</p>';
        return;
      }

      console.log("✅ Blog poszt megtalálva:", post.id); // DEBUG

      const title = post.title && post.title[currentLang] 
        ? post.title[currentLang] 
        : 'Untitled';
      postTitle.innerHTML = title;

      // JAVÍTVA: képek útvonala
      const imageSrc = post.image.startsWith('/') ? post.image : basePath + post.image;
      postImage.src = imageSrc;
      postImage.alt = title;
      postImage.onerror = function() {
        this.src = basePath + 'images/placeholder.jpg';
      };

      postContent.innerHTML = "";
      if (post.content && post.content[currentLang]) {
        post.content[currentLang].forEach(block => {
          postContent.innerHTML += block;
        });
      } else {
        postContent.innerHTML = '<p style="color:#999;">Nincs elérhető tartalom ezen a nyelven.</p>';
      }
    })
    .catch(error => {
      console.error("❌ Hiba a blogposzt betöltésekor:", error);
      postContent.innerHTML = '<p style="text-align:center;color:#999;">Nem sikerült betölteni a blogposztot.</p>';
    });
}


/* ---------------------------------------------------
   KAPCSOLAT ŰRLAP – HONEYPOT + EMAILJS
--------------------------------------------------- */
const contactForm = document.getElementById("contactForm");

if (contactForm) {
  contactForm.addEventListener("submit", function (e) {
    e.preventDefault();

    if (this.website.value !== "") {
      console.warn("⚠️ Spam gyanú: honeypot mező kitöltve.");
      return;
    }

    const fullName = this.lastname.value + " " + this.firstname.value;

    const submitBtn = this.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.textContent = 'Küldés...';
    submitBtn.disabled = true;

    emailjs.send("service_wlz0mh8", "template_htc2v29", {
      name: fullName,
      email: this.email.value,
      phone: this.phone.value || "Nincs megadva",
      message: this.message.value
    })
    .then(() => {
      alert("Köszönöm! Az üzenet sikeresen elküldve.");
      this.reset();
    })
    .catch((err) => {
      alert("Hiba történt az üzenet küldésekor. Kérlek próbáld újra!");
      console.error("❌ EmailJS hiba:", err);
    })
    .finally(() => {
      submitBtn.textContent = originalText;
      submitBtn.disabled = false;
    });
  });
}


/* ---------------------------------------------------
   OLDAL BETÖLTÉSEKOR FUTTATANDÓ
--------------------------------------------------- */
document.addEventListener('DOMContentLoaded', function() {
  console.log("🚀 Oldal betöltve, base path:", getBasePath()); // DEBUG
  
  loadStaticText();

  if (document.getElementById("blogContainer")) {
    loadBlogList();
  }

  if (document.getElementById("postTitle")) {
    loadBlogPost();
  }
});
