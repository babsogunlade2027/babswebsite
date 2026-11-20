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
