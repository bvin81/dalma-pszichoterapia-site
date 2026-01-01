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
   NYELVVÁLTÓ - sessionStorage helyett cookie/URL param
--------------------------------------------------- */
// Nyelv meghatározása: URL param > cookie > default
function getCurrentLang() {
  const urlParams = new URLSearchParams(window.location.search);
  const urlLang = urlParams.get('lang');
  
  if (urlLang && ['hu', 'ro', 'en'].includes(urlLang)) {
    return urlLang;
  }
  
  // Cookie ellenőrzés
  const cookies = document.cookie.split(';');
  for (let cookie of cookies) {
    const [name, value] = cookie.trim().split('=');
    if (name === 'lang') {
      return value;
    }
  }
  
  return 'hu'; // default
}

let currentLang = getCurrentLang();

// Cookie beállítása (1 év lejárat)
function setLangCookie(lang) {
  const expires = new Date();
  expires.setFullYear(expires.getFullYear() + 1);
  document.cookie = `lang=${lang};expires=${expires.toUTCString()};path=/`;
}

// Nyelvváltó gombok
document.querySelectorAll(".lang-switcher button").forEach(btn => {
  // Aktív gomb jelölése
  if (btn.dataset.lang === currentLang) {
    btn.style.fontWeight = 'bold';
    btn.style.color = '#819A88';
  }
  
  btn.addEventListener("click", () => {
    currentLang = btn.dataset.lang;
    setLangCookie(currentLang);
    
    // Aktív gomb frissítése
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
   ÚTVONAL HELPER – GitHub Pages kompatibilis
--------------------------------------------------- */
function getBasePath() {
  const path = window.location.pathname;
  
  // Ha service/ mappában vagyunk
  if (path.includes("/service/")) {
    return "../";
  }
  
  // GitHub Pages repo név figyelembevétele
  // Ha az URL tartalmazza a repo nevet, azt is kezeljük
  return "./";
}


/* ---------------------------------------------------
   STATIKUS SZÖVEGEK BETÖLTÉSE (lang.json) - CACHE-ELVE
--------------------------------------------------- */
let cachedTranslations = null;

function loadStaticText() {
  // Ha már betöltöttük, használjuk a cache-t
  if (cachedTranslations) {
    updateDOM(cachedTranslations);
    return;
  }
  
  const basePath = getBasePath();
  const langPath = basePath + "lang.json";

  fetch(langPath)
    .then(res => {
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      return res.json();
    })
    .then(data => {
      cachedTranslations = data;
      updateDOM(data);
    })
    .catch(error => {
      console.error("Hiba a lang.json betöltésekor:", error);
      console.error("Próbált útvonal:", langPath);
    });
}

function updateDOM(data) {
  // data-key attribútumok kitöltése
  document.querySelectorAll("[data-key]").forEach(el => {
    const key = el.dataset.key;
    if (data[key] && data[key][currentLang]) {
      el.innerHTML = data[key][currentLang];
    }
  });

  // placeholder-ek kitöltése
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

  fetch(basePath + "blog-posts.json")
    .then(res => {
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      return res.json();
    })
    .then(posts => {
      container.innerHTML = "";

      posts.forEach(post => {
        // Biztonságos cím lekérés
        const title = post.title && post.title[currentLang] 
          ? post.title[currentLang] 
          : 'Untitled';
        
        container.innerHTML += `
          <a href="blog-post.html?id=${post.id}&lang=${currentLang}" class="blog-card">
            <div class="blog-card-image">
              <img src="${post.image}" alt="${title}" onerror="this.src='images/placeholder.jpg'">
            </div>
            <div class="blog-card-content">
              <h3>${title}</h3>
            </div>
          </a>
        `;
      });
    })
    .catch(error => {
      console.error("Hiba a blog-posts.json betöltésekor:", error);
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
    console.error("Nincs ID paraméter az URL-ben!");
    postContent.innerHTML = '<p style="text-align:center;color:#999;">Nincs megadva blogposzt azonosító.</p>';
    return;
  }

  const basePath = getBasePath();

  fetch(basePath + "blog-posts.json")
    .then(res => {
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      return res.json();
    })
    .then(posts => {
      const post = posts.find(p => p.id == id);
      
      if (!post) {
        console.error("Nem található a bejegyzés:", id);
        postContent.innerHTML = '<p style="text-align:center;color:#999;">A keresett blogposzt nem található.</p>';
        return;
      }

      // Cím
      const title = post.title && post.title[currentLang] 
        ? post.title[currentLang] 
        : 'Untitled';
      postTitle.innerHTML = title;

      // Kép
      postImage.src = post.image;
      postImage.alt = title;
      postImage.onerror = function() {
        this.src = 'images/placeholder.jpg';
      };

      // Tartalom
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
      console.error("Hiba a blogposzt betöltésekor:", error);
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

    // Honeypot védelem
    if (this.website.value !== "") {
      console.warn("Spam gyanú: honeypot mező kitöltve.");
      return;
    }

    const fullName = this.lastname.value + " " + this.firstname.value;

    // Betöltési állapot mutatása
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
      console.error(err);
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
// Várunk, amíg a DOM teljesen betöltődik
document.addEventListener('DOMContentLoaded', function() {
  // Statikus szövegek mindig
  loadStaticText();

  // Bloglista csak ha van blogContainer
  if (document.getElementById("blogContainer")) {
    loadBlogList();
  }

  // Blogposzt csak ha van postTitle
  if (document.getElementById("postTitle")) {
    loadBlogPost();
  }
});
