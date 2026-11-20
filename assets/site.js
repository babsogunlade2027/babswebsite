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

  function make(tag,className,text){
    var node=document.createElement(tag);
    if(className)node.className=className;
    if(text!==undefined&&text!==null)node.textContent=String(text);
    return node;
  }
  function formatDate(value){
    if(!value)return "";
    var date=new Date(value);
    if(Number.isNaN(date.getTime()))return String(value);
    return new Intl.DateTimeFormat("en-NG",{day:"numeric",month:"long",year:"numeric"}).format(date);
  }
  function sameOriginAsset(path){
    if(!path||typeof path!=="string")return "";
    try{
      var url=new URL(path,window.location.origin);
      if(url.origin!==window.location.origin||!url.pathname.startsWith("/assets/"))return "";
      return url.href;
    }catch(error){return "";}
  }
  function showEmpty(container,message){
    container.replaceChildren(make("div","empty",message));
  }
  function renderNews(container,posts){
    container.replaceChildren();
    if(!posts.length){
      showEmpty(container,"No approved news updates have been published yet. Please check back for official releases.");
      return;
    }
    var list=make("div","news-list");
    posts.forEach(function(post){
      var article=make("article","news-card");
      var imageUrl=sameOriginAsset(post.image);
      if(imageUrl){
        var figure=make("figure","news-figure");
        var img=make("img");
        img.src=imageUrl;
        img.alt=post.title||"Published news image";
        img.loading="lazy";
        img.decoding="async";
        figure.appendChild(img);
        article.appendChild(figure);
      }
      var content=make("div","news-content");
      var meta=make("p","news-meta");
      if(post.date){
        var time=make("time","",formatDate(post.date));
        time.dateTime=post.date;
        meta.appendChild(time);
      }
      content.appendChild(meta);
      content.appendChild(make("h3","news-title",post.title||"News update"));
      if(post.description)content.appendChild(make("p","news-description",post.description));
      if(post.content&&post.content!==post.description){
        var details=make("details","news-details");
        details.appendChild(make("summary","","Read full update"));
        details.appendChild(make("p","news-body",post.content));
        content.appendChild(details);
      }
      article.appendChild(content);
      list.appendChild(article);
    });
    container.appendChild(list);
  }
  function renderGallery(container,posts){
    container.replaceChildren();
    if(!posts.length)return false;
    posts.forEach(function(post){
      var figure=make("figure","gallery-item");
      var imageUrl=sameOriginAsset(post.image);
      if(!imageUrl)return;
      var img=make("img");
      img.src=imageUrl;
      img.alt=post.title||post.caption||"Approved gallery photograph";
      img.loading="lazy";
      img.decoding="async";
      figure.appendChild(img);
      var caption=make("figcaption","gallery-caption");
      if(post.title)caption.appendChild(make("strong","",post.title));
      if(post.caption)caption.appendChild(make("span","",post.caption));
      figure.appendChild(caption);
      container.appendChild(figure);
    });
    return container.childElementCount>0;
  }
  function loadFeed(endpoint,container,renderer,onError){
    if(!container)return;
    fetch(endpoint,{headers:{Accept:"application/json"}})
      .then(function(response){
        if(!response.ok)throw new Error("Feed request failed");
        return response.json();
      })
      .then(function(data){
        renderer(container,Array.isArray(data.posts)?data.posts:[]);
      })
      .catch(function(){
        if(onError)onError(container);
        else showEmpty(container,"Published updates are temporarily unavailable. Please try again later.");
      });
  }
  var newsContainer=document.querySelector("[data-news]");
  if(newsContainer){
    var newsLimit=parseInt(newsContainer.getAttribute("data-news")||"50",10);
    if(!Number.isFinite(newsLimit)||newsLimit<1)newsLimit=50;
    loadFeed("/api/news?limit="+Math.min(newsLimit,50),newsContainer,renderNews);
  }
  var galleryContainer=document.getElementById("gallery");
  if(galleryContainer){
    loadFeed("/api/gallery?limit=50",galleryContainer,function(container,posts){
      var hasImages=renderGallery(container,posts);
      var emptyNotice=document.querySelector("[data-gallery-empty]");
      if(emptyNotice&&hasImages)emptyNotice.hidden=true;
      if(emptyNotice&&!hasImages)emptyNotice.textContent="Approved gallery photographs will appear here when published.";
    },function(){
      var emptyNotice=document.querySelector("[data-gallery-empty]");
      if(emptyNotice)emptyNotice.textContent="The gallery is temporarily unavailable. Please try again later.";
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