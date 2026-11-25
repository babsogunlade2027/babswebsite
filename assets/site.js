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
function renderGallery(entries){if(!gallery)return;gallery.textContent="";(entries||[]).forEach(function(p){var src=String(p.image||"");if(!src.startsWith("/"))return;var figure=document.createElement("figure");figure.className="card";var img=document.createElement("img");img.src=src;img.alt=String(p.alt||p.caption||"Gallery photograph");img.loading="lazy";var caption=document.createElement("figcaption");caption.textContent=String(p.caption||p.alt||"");figure.appendChild(img);figure.appendChild(caption);gallery.appendChild(figure);});}
if(gallery){fetch("/gallery.json",{headers:{"Accept":"application/json"}}).then(function(r){if(!r.ok)throw Error("Gallery unavailable");return r.json();}).then(function(data){renderGallery(data.photos||[]);}).catch(function(){renderGallery(photos.map(function(p){return {image:"/"+p[0],alt:p[1],caption:p[1]};}));});}
var newsList=document.getElementById("news-list");
if(newsList){
 var search=document.getElementById("news-search"),filter=document.getElementById("news-filter"),count=document.getElementById("news-count"),results=document.getElementById("news-results"),allArticles=[];
 function el(tag,className,text){var node=document.createElement(tag);if(className)node.className=className;if(text!==undefined)node.textContent=text;return node;}
 function renderNews(){
  var term=(search.value||"").trim().toLowerCase(),kind=filter.value;
  var visible=allArticles.filter(function(item){var hay=[item.title,item.summary,item.type,item.source].concat(item.body||[]).join(" ").toLowerCase();return item.published!==false&&(kind==="all"||item.type===kind)&&(!term||hay.indexOf(term)!==-1);});
  visible.sort(function(a,b){return (b.iso||"").localeCompare(a.iso||"");});
  newsList.textContent="";
  if(count)count.textContent=String(visible.length);
  if(results)results.textContent=visible.length+" "+(visible.length===1?"story":"stories")+" found";
  if(!visible.length){newsList.appendChild(el("p","empty","No stories match your search. Try another keyword or select All updates."));return;}
  visible.forEach(function(item){
   var article=el("article","news-card");article.id="story-"+item.slug;
   var top=el("div","news-card-top");
   top.appendChild(el("span","news-type "+(item.type==="News Report"?"news-type-report":"news-type-release"),item.type==="News Report"?"News report":"Press release"));
   top.appendChild(el("time","news-date",item.date));article.appendChild(top);
   article.appendChild(el("h3","news-title",item.title));
   article.appendChild(el("p","news-summary",item.summary));
   var details=el("details","news-details");
   details.appendChild(el("summary","news-read-more","Read full "+(item.type==="News Report"?"report":"release")));
   (item.body||[]).forEach(function(paragraph){details.appendChild(el("p","news-body",paragraph));});
   if(item.source)details.appendChild(el("p","news-source","Source: "+item.source));
   article.appendChild(details);
   newsList.appendChild(article);
  });
  if(location.hash){var target=document.getElementById(decodeURIComponent(location.hash.slice(1)));if(target&&target.classList.contains("news-card")){var d=target.querySelector("details");if(d)d.open=true;}}
 }
 fetch("/news/cms-articles.json",{headers:{"Accept":"application/json"}}).then(function(response){if(!response.ok)throw new Error("News archive unavailable");return response.json();}).then(function(data){var items=Array.isArray(data)?data:data.articles;if(!Array.isArray(items))throw new Error("Invalid newsroom data");allArticles=items;renderNews();if(search)search.addEventListener("input",renderNews);if(filter)filter.addEventListener("change",renderNews);}).catch(function(){newsList.textContent="";newsList.appendChild(el("p","empty","The newsroom is temporarily unavailable. Please try again later."));if(results)results.textContent="News archive unavailable";});
}
var hero=document.querySelector(".page-hero .wrap");
if(hero&&!document.querySelector(".page-hero img")){var path=location.pathname;var chosen=path.indexOf("press")>=0?photos[2][0]:path.indexOf("priorities")>=0?photos[5][0]:path.indexOf("about")>=0?photos[0][0]:null;if(chosen){var img=document.createElement("img");img.src="/"+chosen;img.alt="BABS community engagement";img.loading="lazy";img.style.cssText="display:block;width:100%;max-height:330px;object-fit:cover;border-radius:14px;margin-top:24px";hero.appendChild(img);}}
})();
