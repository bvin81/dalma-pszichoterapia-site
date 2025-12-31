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
   NYELVVÁLTÓ – LOCALSTORAGE + GOMBOK
--------------------------------------------------- */
let currentLang = localStorage.getItem("lang") || "hu";

document.querySelectorAll(".lang-switcher button").forEach(btn => {
  btn.addEventListener("click", () => {
    currentLang = btn.dataset.lang;
    localStorage.setItem("lang", currentLang);

    loadStaticText();
    loadBlogList();
    loadBlogPost();
  });
});


/* ---------------------------------------------------
   STATIKUS SZÖVEGEK BETÖLTÉSE (lang.json)
--------------------------------------------------- */
function loadStaticText() {
  // Hol fut a main.js?
  const path = window.location.pathname;

  // Ha aloldal (service/...), akkor ../lang.json
  const langPath = path.includes("/service/")
    ? "../lang.json"
    : "lang.json";

  fetch(langPath)
    .then(res => res.json())
    .then(data => {
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
    });
}



/* ---------------------------------------------------
   BLOG LISTA BETÖLTÉSE (blog.html)
--------------------------------------------------- */
function loadBlogList() {
  const container = document.getElementById("blogContainer");
  if (!container) return;

  fetch("blog-posts.json")
    .then(res => res.json())
    .then(posts => {
      container.innerHTML = "";

      posts.forEach(post => {
        container.innerHTML += `
          <a href="blog-post.html?id=${post.id}" class="blog-card">
            <div class="blog-card-image">
              <img src="${post.image}" alt="">
            </div>
            <div class="blog-card-content">
              <h3>${post.title[currentLang]}</h3>
            </div>
          </a>
        `;
      });
    });
}


/* ---------------------------------------------------
   BLOG BEJEGYZÉS BETÖLTÉSE (blog-post.html)
--------------------------------------------------- */
function loadBlogPost() {
  const postTitle = document.getElementById("postTitle");
  const postContent = document.getElementById("postContent");
  const postImage = document.getElementById("postImage"); // ← ÚJ
  if (!postTitle || !postContent || !postImage) return;

  const params = new URLSearchParams(window.location.search);
  const id = params.get("id");

  fetch("blog-posts.json")
    .then(res => res.json())
    .then(posts => {
      const post = posts.find(p => p.id == id);

      // Cím
      postTitle.innerHTML = post.title[currentLang];

      // Kép betöltése
      postImage.src = post.image;
      postImage.alt = post.title[currentLang];

      // Tartalom
      postContent.innerHTML = "";
      post.content[currentLang].forEach(block => {
        postContent.innerHTML += block;
      });
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
      console.warn("Spam gyanú: honeypot mező kitöltve.");
      return;
    }

    const fullName = this.lastname.value + " " + this.firstname.value;

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
      alert("Hiba történt az üzenet küldésekor.");
      console.error(err);
    });
  });
}


/* ---------------------------------------------------
   OLDAL BETÖLTÉSEKOR FUTTATANDÓ
--------------------------------------------------- */
loadStaticText();

// Bloglista csak blog.html-en
if (document.querySelector("#blog-list")) {
  loadBlogList();
}

// Blogposzt csak blog-post.html-en
if (document.querySelector("#blog-post-content")) {
  loadBlogPost();
}
