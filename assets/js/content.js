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
if(gallery){fetch("/gallery.json").then(function(r){return r.json();}).then(function(data){gallery.textContent="";(data.photos||[]).forEach(function(p){if(!String(p.image||"").startsWith("/"))return;var f=document.createElement("figure"),i=document.createElement("img"),c=document.createElement("figcaption");f.className="card";i.src=p.image;i.alt=p.alt||p.caption||"";i.loading="lazy";c.textContent=p.caption||p.alt||"";f.appendChild(i);f.appendChild(c);gallery.appendChild(f);});}).catch(function(){gallery.innerHTML=photos.map(function(p){return '<figure class="card"><img src="/'+p[0]+'" alt="'+p[1]+'" loading="lazy"><figcaption>'+p[1]+'</figcaption></figure>';}).join("");});}
var news=document.querySelector("[data-news]");
if(news){fetch("/news/cms-articles.json").then(function(r){if(!r.ok)throw Error("News feed unavailable");return r.json();}).then(function(data){var items=Array.isArray(data)?data:data.articles;items=(items||[]).filter(function(n){return n.published!==false;});news.innerHTML='<div class="grid">'+items.map(function(n){return '<article class="card"><p class="kicker">'+n.type+' · '+n.date+'</p><h3>'+n.title+'</h3><p>'+n.summary+'</p><a href="/press.html#story-'+encodeURIComponent(n.slug)+'">Read release</a></article>';}).join("")+'</div>';}).catch(function(){news.innerHTML='<p class="empty">News updates are temporarily unavailable. Please check again shortly.</p>';});}
})();