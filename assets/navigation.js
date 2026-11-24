(function(){
"use strict";
fetch("/api/public/navigation",{credentials:"same-origin",cache:"no-store"}).then(function(r){return r.ok?r.json():null;}).then(function(d){var items=d&&d.items||[];if(!items.length)return;document.querySelectorAll(".nav").forEach(function(nav){nav.replaceChildren();items.forEach(function(item){var a=document.createElement("a");a.href=item.url;a.textContent=item.label;if(item.target==="_blank"){a.target="_blank";a.rel="noopener noreferrer";}var path=new URL(a.href,location.origin).pathname;if(path===location.pathname||((path==="/"||path==="/index.html")&&(location.pathname==="/"||location.pathname==="/index.html")))a.setAttribute("aria-current","page");nav.appendChild(a);});});}).catch(function(){});
})();
