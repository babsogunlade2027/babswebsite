(function(){
  "use strict";
  var menuButton=document.querySelector(".menu-btn");
  var nav=document.querySelector(".nav");
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
  document.querySelectorAll("[data-year]").forEach(function(node){
    node.textContent=String(new Date().getFullYear());
  });
})();
