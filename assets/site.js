(function(){
  "use strict";
  var menuButton=document.querySelector(".menu-btn");
  var nav=document.querySelector(".nav");
  var currentPath=window.location.pathname||"/";
  if(currentPath.length>1&&currentPath.endsWith("/"))currentPath=currentPath.slice(0,-1);
  if(currentPath==="/index.html")currentPath="/";
  document.querySelectorAll(".nav a, .mobile-link").forEach(function(link){
    try{
      var targetPath=new URL(link.getAttribute("href"),window.location.origin).pathname||"/";
      if(targetPath.length>1&&targetPath.endsWith("/"))targetPath=targetPath.slice(0,-1);
      if(targetPath==="/index.html")targetPath="/";
      if(targetPath===currentPath)link.setAttribute("aria-current","page");
      else if(link.getAttribute("aria-current")==="page")link.removeAttribute("aria-current");
    }catch(error){}
  });
  if(menuButton&&nav){
    menuButton.addEventListener("click",function(){
      var open=nav.classList.toggle("is-open");
      menuButton.setAttribute("aria-expanded",open?"true":"false");
      menuButton.textContent=open?"Close":"Menu";
    });
    nav.querySelectorAll("a").forEach(function(link){
      link.addEventListener("click",function(){
        nav.classList.remove("is-open");
        menuButton.setAttribute("aria-expanded","false");
        menuButton.textContent="Menu";
      });
    });
  }
  var contactForm=document.querySelector('form[name="contact"][data-mailto]');
  if(contactForm){
    contactForm.addEventListener("submit",function(event){
      event.preventDefault();
      if(!contactForm.reportValidity())return;
      var data=new FormData(contactForm);
      var recipient=contactForm.getAttribute("data-mailto");
      var subject="Website enquiry: "+(data.get("topic")||"General enquiry");
      var body=[
        "Name: "+(data.get("name")||""),
        "Email: "+(data.get("email")||""),
        "Phone: "+(data.get("phone")||"Not provided"),
        "Topic: "+(data.get("topic")||"General enquiry"),
        "",
        "Message:",
        data.get("message")||""
      ].join("\n");
      window.location.href="mailto:"+encodeURIComponent(recipient)+"?subject="+encodeURIComponent(subject)+"&body="+encodeURIComponent(body);
    });
  }
  function escapeHtml(value) {
    return String(value == null ? "" : value).replace(/[&<>"']/g, function(character) {
      return ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character];
    });
  }

  function safeImageUrl(value) {
    if (!value) return "";
    try {
      var url = new URL(String(value), window.location.origin);
      if (url.protocol !== "https:" && url.origin !== window.location.origin) return "";
      return url.href;
    } catch (error) {
      return "";
    }
  }

  function formatDate(value) {
    if (!value) return "";
    var date = new Date(value);
    if (isNaN(date.getTime())) return String(value);
    return new Intl.DateTimeFormat("en-NG", { dateStyle: "long" }).format(date);
  }

  function formatPlainText(value) {
    return String(value || "").trim().split(/\\n\\s*\\n/).filter(Boolean).map(function(paragraph) {
      return "<p>" + escapeHtml(paragraph).replace(/\\n/g, "<br>") + "</p>";
    }).join("");
  }

  var newsContainer = document.querySelector("[data-news]");
  if (newsContainer) {
    fetch("/api/content/news", { headers: { Accept: "application/json" } })
      .then(function(response) {
        if (!response.ok) throw new Error("News feed unavailable");
        return response.json();
      })
      .then(function(payload) {
        var items = payload && Array.isArray(payload.items) ? payload.items : [];
        if (!items.length) {
          newsContainer.innerHTML = '<div class="empty">No approved public updates have been published yet.</div>';
          return;
        }
        newsContainer.innerHTML = '<div class="news-list">' + items.map(function(item) {
          var title = escapeHtml(item.title || "Public update");
          var date = formatDate(item.date);
          var description = escapeHtml(item.description || "");
          var body = formatPlainText(item.body || "");
          return '<article class="news-item"><div class="news-meta">' + (date ? '<time>' + escapeHtml(date) + '</time>' : '') + '</div><h3>' + title + '</h3>' + (description ? '<p class="news-summary">' + description + '</p>' : '') + (body ? '<details class="news-details"><summary>Read full update</summary><div class="news-body">' + body + '</div></details>' : '') + '</article>';
        }).join("") + '</div>';
      })
      .catch(function() {
        newsContainer.innerHTML = '<div class="empty" role="status">Public updates are temporarily unavailable. Please check again later.</div>';
      });
  }

  var galleryContainer = document.getElementById("gallery");
  if (galleryContainer) {
    fetch("/api/content/gallery", { headers: { Accept: "application/json" } })
      .then(function(response) {
        if (!response.ok) throw new Error("Gallery feed unavailable");
        return response.json();
      })
      .then(function(payload) {
        var items = payload && Array.isArray(payload.items) ? payload.items : [];
        var emptyState = document.querySelector(".gallery-empty");
        if (!items.length) {
          if (emptyState) emptyState.hidden = false;
          return;
        }
        if (emptyState) emptyState.hidden = true;
        galleryContainer.innerHTML = items.map(function(item) {
          var imageUrl = safeImageUrl(item.image);
          if (!imageUrl) return "";
          var title = escapeHtml(item.title || "Community photograph");
          var caption = escapeHtml(item.caption || item.description || "");
          return '<figure class="gallery-card"><img src="' + escapeHtml(imageUrl) + '" alt="' + title + '" loading="lazy" decoding="async"><figcaption><strong>' + title + '</strong>' + (caption ? '<span>' + caption + '</span>' : '') + '</figcaption></figure>';
        }).join("");
      })
      .catch(function() {
        var emptyState = document.querySelector(".gallery-empty");
        if (emptyState) {
          emptyState.textContent = "The photo gallery is temporarily unavailable. Please check again later.";
          emptyState.hidden = false;
        }
      });
  }

  document.querySelectorAll("[data-year]").forEach(function(node) {
    node.textContent = String(new Date().getFullYear());
  });
})();
