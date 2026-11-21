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
  document.querySelectorAll("[data-year]").forEach(function(node){
    node.textContent=String(new Date().getFullYear());
  });
})();


(function(){
"use strict";
var nav=document.querySelector(".nav");
if(nav&&!nav.querySelector('a[href="manifesto.html"]')){var a=document.createElement("a");a.href="manifesto.html";a.textContent="Manifesto";var press=nav.querySelector('a[href="press.html"]');nav.insertBefore(a,press||null);}
var photos=[
["babatunde-ogunlade-portrait-white-attire-seated.jpg","Hon. Babatunde Ogunlade"],
["babatunde-ogunlade-addressing-supporters-microphone.jpg","Addressing supporters"],
["babatunde-ogunlade-addressing-supporters-with-delegation.jpg","Community engagement"],
["babatunde-ogunlade-campaign-rally-with-supporters.jpg","Campaign gathering"],
["babatunde-ogunlade-community-group-photo.jpg","Community group"],
["babatunde-ogunlade-seated-with-community-members.jpg","Meeting with community members"],
["babatunde-ogunlade-ibarapa-east-apc-secretariat-event.jpg","Ibarapa East event"],
["babatunde-ogunlade-seated-with-party-members.jpg","Engagement with party members"],
["babatunde-ogunlade-campaign-walk-with-broom.jpg","Campaign walk"],
["babatunde-ogunlade-portrait-traditional-red-attire.jpg","Traditional portrait"]
];
var gallery=document.getElementById("gallery");
if(gallery){gallery.innerHTML=photos.map(function(p){return '<figure class="card"><img src="/'+p[0]+'" alt="'+p[1]+'" loading="lazy"><figcaption>'+p[1]+'</figcaption></figure>';}).join("");}
var news=document.querySelector("[data-news]");
if(news){fetch("/news/index.json").then(function(r){if(!r.ok)throw Error("News feed unavailable");return r.json();}).then(function(items){news.innerHTML='<div class="grid">'+items.map(function(n){return '<article class="card"><p class="kicker">'+n.type+' · '+n.date+'</p><h3>'+n.title+'</h3><p>'+n.summary+'</p></article>';}).join("")+'</div>';}).catch(function(){news.innerHTML='<p class="empty">News updates are temporarily unavailable. Please check again shortly.</p>';});}
var hero=document.querySelector(".page-hero .wrap");
if(hero&&!document.querySelector(".page-hero img")){var path=location.pathname;var chosen=path.indexOf("press")>=0?photos[2][0]:path.indexOf("priorities")>=0?photos[5][0]:path.indexOf("about")>=0?photos[0][0]:null;if(chosen){var img=document.createElement("img");img.src="/"+chosen;img.alt="BABS community engagement";img.loading="lazy";img.style.cssText="display:block;width:100%;max-height:330px;object-fit:cover;border-radius:14px;margin-top:24px";hero.appendChild(img);}}
})();
