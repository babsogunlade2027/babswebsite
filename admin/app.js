(function(){
"use strict";
var state={user:null,csrf:"",view:"dashboard",editorType:"article",editingId:null,categories:[],articles:[],pages:[]};
var $=function(id){return document.getElementById(id);};
var roleNames={super_admin:"Super administrator",administrator:"Administrator",editor:"Editor",author:"Author",media_manager:"Media manager",viewer:"Viewer"};
function escapeHtml(value){return String(value==null?"":value).replace(/[&<>"']/g,function(c){return({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]);});}
function date(value){if(!value)return "—";var d=new Date(value);return isNaN(d.getTime())?"—":d.toLocaleDateString("en-GB",{day:"2-digit",month:"short",year:"numeric"});}
function toast(message){var node=$("toast");node.textContent=message;node.classList.add("show");window.setTimeout(function(){node.classList.remove("show");},2600);}
async function api(path,options){
 options=options||{};var headers=Object.assign({"Accept":"application/json"},options.headers||{});
 if(options.body){headers["Content-Type"]="application/json";}
 if(options.method&&options.method!=="GET"&&state.csrf){headers["X-CSRF-Token"]=state.csrf;}
 var response=await fetch(path,Object.assign({credentials:"same-origin",cache:"no-store"},options,{headers:headers}));
 var type=response.headers.get("content-type")||"",data=type.indexOf("application/json")>=0?await response.json():{error:await response.text()};
 if(!response.ok)throw new Error(data.error||"Request failed ("+response.status+")");
 return data;
}
function showLogin(message){
 $("login-view").hidden=false;$("admin-shell").hidden=true;
 $("login-message").textContent=message||"";
}
function showApp(){
 $("login-view").hidden=true;$("admin-shell").hidden=false;
 $("user-name").textContent=state.user.displayName||state.user.email;
 $("user-role").textContent=roleNames[state.user.role]||state.user.role;
 $("user-avatar").textContent=(state.user.displayName||"B").trim().charAt(0).toUpperCase();
 $("greeting-name").textContent=(state.user.displayName||"Administrator").split(" ")[0];
 $("team-nav").hidden=state.user.role!=="super_admin";
 $("enquiries-nav").hidden=!["super_admin","administrator"].includes(state.user.role);
 var canEdit=["super_admin","administrator","editor","author"].includes(state.user.role);
 $("new-article").hidden=!canEdit;$("quick-new-article").hidden=!canEdit;
 $("new-page").hidden=!["super_admin","administrator","editor"].includes(state.user.role);
}
function setView(view){
 state.view=view;
 document.querySelectorAll(".view").forEach(function(node){node.hidden=node.id!=="view-"+view;});
 document.querySelectorAll(".side-nav .nav-item").forEach(function(node){node.classList.toggle("active",node.dataset.view===view);});
 var titles={dashboard:"Overview",articles:"News & articles",pages:"Website pages",team:"Administrators",enquiries:"Website enquiries"};
 $("top-title").textContent=titles[view]||"Administration";
 $("sidebar").classList.remove("open");$("mobile-menu").setAttribute("aria-expanded","false");
 if(view==="dashboard")loadDashboard();
 if(view==="articles")loadArticles();
 if(view==="pages")loadPages();
 if(view==="team")loadTeam();
 if(view==="enquiries")loadEnquiries();
}
function statCard(label,value,foot){return '<article class="stat-card"><div class="stat-label">'+escapeHtml(label)+'</div><div class="stat-value">'+Number(value||0).toLocaleString("en-GB")+'</div><div class="stat-foot">'+escapeHtml(foot)+'</div></article>';}
async function loadDashboard(){
 try{
  var d=await api("/api/dashboard"),s=d.stats||{};
  $("stats-grid").innerHTML=[
   statCard("Published articles",s.publishedArticles,"Live editorial content"),
   statCard("Draft articles",s.draftArticles,"Saved but not public"),
   statCard("Scheduled articles",s.scheduledArticles,"Awaiting publication"),
   statCard("Website pages",s.pages,"All saved page records")
  ].join("");
  var activity=d.recentActivity||[];
  $("activity-list").innerHTML=activity.length?activity.map(function(x){return '<div class="activity-item"><span class="activity-dot"></span><div><strong>'+escapeHtml(x.summary)+'</strong><small>'+escapeHtml(x.display_name||"System")+' · '+date(x.created_at)+'</small></div></div>';}).join(""):'<p class="muted">No administrative activity has been recorded yet.</p>';
  $("workflow-list").innerHTML=[
   ["Published articles",s.publishedArticles],["Draft articles",s.draftArticles],["Scheduled articles",s.scheduledArticles],["Published pages",s.publishedPages],["Unread enquiries",s.unreadEnquiries]
  ].map(function(x){return '<div class="workflow-row"><span>'+escapeHtml(x[0])+'</span><strong>'+Number(x[1]||0).toLocaleString("en-GB")+'</strong></div>';}).join("");
 }catch(e){$("stats-grid").innerHTML='<p class="notice">'+escapeHtml(e.message)+'</p>';}
}
function statusPill(status){return '<span class="status '+escapeHtml(status)+'">'+escapeHtml(String(status||"draft").replace("_"," "))+'</span>';}
async function loadArticles(){
 $("article-rows").innerHTML='<tr><td colspan="5" class="empty-cell">Loading articles…</td></tr>';
 try{
  var params=new URLSearchParams();if($("article-status").value)params.set("status",$("article-status").value);if($("article-search").value.trim())params.set("q",$("article-search").value.trim());
  var d=await api("/api/articles?"+params.toString());state.articles=d.items||[];
  $("article-rows").innerHTML=state.articles.length?state.articles.map(function(a){return '<tr><td><span class="row-title">'+escapeHtml(a.title)+'</span><span class="row-sub">/'+escapeHtml(a.slug)+'</span></td><td>'+escapeHtml(a.category_name||"Uncategorised")+'</td><td>'+statusPill(a.status)+'</td><td>'+date(a.updated_at)+'</td><td><button class="table-action" data-edit-article="'+escapeHtml(a.id)+'">Edit</button></td></tr>';}).join(""):'<tr><td colspan="5" class="empty-cell">No articles found. Create your first article when ready.</td></tr>';
 }catch(e){$("article-rows").innerHTML='<tr><td colspan="5" class="empty-cell">'+escapeHtml(e.message)+'</td></tr>';}
}
async function loadPages(){
 $("page-rows").innerHTML='<tr><td colspan="5" class="empty-cell">Loading pages…</td></tr>';
 try{var d=await api("/api/pages");state.pages=d.items||[];
  $("page-rows").innerHTML=state.pages.length?state.pages.map(function(p){return '<tr><td><span class="row-title">'+escapeHtml(p.title)+'</span><span class="row-sub">'+escapeHtml(p.excerpt||"")+'</span></td><td>/'+escapeHtml(p.slug)+'</td><td>'+statusPill(p.status)+'</td><td>'+(p.show_in_navigation?"Visible":"Hidden")+'</td><td><button class="table-action" data-edit-page="'+escapeHtml(p.id)+'">Edit</button></td></tr>';}).join(""):'<tr><td colspan="5" class="empty-cell">No CMS-managed pages have been created yet.</td></tr>';
 }catch(e){$("page-rows").innerHTML='<tr><td colspan="5" class="empty-cell">'+escapeHtml(e.message)+'</td></tr>';}
}
async function loadEnquiries(){
 $("enquiry-rows").innerHTML='<tr><td colspan="5" class="empty-cell">Loading enquiries…</td></tr>';
 try{
  var status=$("enquiry-status").value,params=new URLSearchParams();if(status)params.set("status",status);
  var d=await api("/api/enquiries?"+params.toString()),items=d.items||[];
  $("enquiry-rows").innerHTML=items.length?items.map(function(x){
   return '<tr><td><span class="row-title">'+escapeHtml(x.sender_name)+'</span><span class="row-sub">'+escapeHtml(x.sender_email||"")+'</span><span class="row-sub">'+escapeHtml(x.sender_phone||"")+'</span></td><td><span class="row-title">'+escapeHtml(x.topic)+'</span><span class="row-sub">'+escapeHtml(x.message.slice(0,180))+(x.message.length>180?"…":"")+'</span></td><td>'+date(x.received_at)+'</td><td>'+statusPill(x.status)+'</td><td><select class="enquiry-state" data-enquiry-id="'+escapeHtml(x.id)+'" aria-label="Update enquiry status"><option value="unread" '+(x.status==="unread"?"selected":"")+'>Unread</option><option value="read" '+(x.status==="read"?"selected":"")+'>Read</option><option value="in_progress" '+(x.status==="in_progress"?"selected":"")+'>In progress</option><option value="responded" '+(x.status==="responded"?"selected":"")+'>Responded</option><option value="archived" '+(x.status==="archived"?"selected":"")+'>Archived</option></select></td></tr>';
  }).join(""):'<tr><td colspan="5" class="empty-cell">No enquiries in this view.</td></tr>';
 }catch(e){$("enquiry-rows").innerHTML='<tr><td colspan="5" class="empty-cell">'+escapeHtml(e.message)+'</td></tr>';}
}
async function loadTeam(){
 $("team-rows").innerHTML='<tr><td colspan="5" class="empty-cell">Loading administrators…</td></tr>';
 try{var d=await api("/api/users");$("team-rows").innerHTML=(d.items||[]).length?d.items.map(function(u){return '<tr><td><span class="row-title">'+escapeHtml(u.display_name)+'</span></td><td>'+escapeHtml(u.email)+'</td><td>'+escapeHtml(roleNames[u.role]||u.role)+'</td><td>'+statusPill(u.status)+'</td><td>'+date(u.last_login_at)+'</td></tr>';}).join(""):'<tr><td colspan="5" class="empty-cell">No administrator accounts found.</td></tr>';}catch(e){$("team-rows").innerHTML='<tr><td colspan="5" class="empty-cell">'+escapeHtml(e.message)+'</td></tr>';}
}
async function loadCategories(){
 try{var d=await api("/api/categories");state.categories=d.items||[];$("category-select").innerHTML='<option value="">Select category</option>'+state.categories.map(function(c){return '<option value="'+escapeHtml(c.id)+'">'+escapeHtml(c.name)+'</option>';}).join("");}catch(e){$("category-select").innerHTML='<option value="">Categories unavailable</option>';}
}
function openEditor(type,item){
 state.editorType=type;state.editingId=item?item.id:null;
 var form=$("content-form");form.reset();$("form-error").textContent="";
 $("editor-title").textContent=(item?"Edit ":"Create ")+(type==="article"?"article":"page");
 $("editor-kind").textContent=type==="article"?"EDITORIAL CONTENT":"WEBSITE PAGE";
 $("category-field").hidden=type!=="article";$("navigation-field").hidden=type!=="page";
 if(item){
  form.elements.title.value=item.title||"";form.elements.slug.value=item.slug||"";
  form.elements.excerpt.value=item.excerpt||"";
  form.elements.bodyMarkdown.value=item.body_markdown||"";
  form.elements.status.value=item.status||"draft";
  if(type==="article")form.elements.categoryId.value=item.category_id||"";
  if(type==="page")form.elements.showInNavigation.checked=!!item.show_in_navigation;
  if(item.scheduled_at){var dt=new Date(item.scheduled_at);form.elements.scheduledAt.value=new Date(dt.getTime()-dt.getTimezoneOffset()*60000).toISOString().slice(0,16);}
 }
 $("schedule-field").hidden=form.elements.status.value!=="scheduled";
 $("editor-modal").hidden=false;form.elements.title.focus();
}
async function editItem(type,id){
 try{var d=await api("/api/"+(type==="article"?"articles":"pages")+"/"+encodeURIComponent(id));openEditor(type,d.item);}catch(e){toast(e.message);}
}
function closeEditor(){$("editor-modal").hidden=true;}
async function submitEditor(event){
 event.preventDefault();var form=event.currentTarget,button=$("save-content"),data=new FormData(form);
 var payload={title:data.get("title"),slug:data.get("slug"),excerpt:data.get("excerpt"),bodyMarkdown:data.get("bodyMarkdown"),status:data.get("status")};
 if(payload.status==="scheduled"&&data.get("scheduledAt"))payload.scheduledAt=new Date(data.get("scheduledAt")).toISOString();
 if(state.editorType==="article")payload.categoryId=data.get("categoryId");
 else payload.showInNavigation=form.elements.showInNavigation.checked;
 button.disabled=true;button.textContent="Saving…";$("form-error").textContent="";
 try{
  var path="/api/"+(state.editorType==="article"?"articles":"pages")+(state.editingId?"/"+encodeURIComponent(state.editingId):"");
  await api(path,{method:state.editingId?"PUT":"POST",body:JSON.stringify(payload)});
  closeEditor();toast(state.editorType==="article"?"Article saved":"Page saved");
  if(state.editorType==="article"){await loadArticles();await loadDashboard();}
  else{await loadPages();await loadDashboard();}
 }catch(e){$("form-error").textContent=e.message;}
 finally{button.disabled=false;button.textContent="Save content";}
}
function bind(){
 document.querySelectorAll("[data-view]").forEach(function(b){b.addEventListener("click",function(){setView(b.dataset.view);});});
 $("quick-new-article").addEventListener("click",function(){loadCategories().then(function(){openEditor("article");});});
 $("new-article").addEventListener("click",function(){loadCategories().then(function(){openEditor("article");});});
 $("new-page").addEventListener("click",function(){openEditor("page");});
 $("article-search").addEventListener("input",function(){clearTimeout(window.__articleSearchTimer);window.__articleSearchTimer=setTimeout(loadArticles,250);});
 $("article-status").addEventListener("change",loadArticles);
 $("article-rows").addEventListener("click",function(e){var b=e.target.closest("[data-edit-article]");if(b)editItem("article",b.dataset.editArticle);});
 $("page-rows").addEventListener("click",function(e){var b=e.target.closest("[data-edit-page]");if(b)editItem("page",b.dataset.editPage);});
 $("enquiry-status").addEventListener("change",loadEnquiries);
 $("enquiry-rows").addEventListener("change",async function(e){var select=e.target.closest("[data-enquiry-id]");if(!select)return;select.disabled=true;try{await api("/api/enquiries/"+encodeURIComponent(select.dataset.enquiryId),{method:"PATCH",body:JSON.stringify({status:select.value})});toast("Enquiry status updated.");await loadDashboard();}catch(err){toast(err.message);await loadEnquiries();}finally{select.disabled=false;}});
 $("invite-user").addEventListener("click",async function(){
  var email=window.prompt("Enter the invitee's verified GitHub email address:");
  if(!email)return;
  var role=window.prompt("Choose a role: administrator, editor, author, media_manager or viewer","editor");
  if(!role)return;
  try{var result=await api("/api/users/invite",{method:"POST",body:JSON.stringify({email:email,role:role})});toast(result.message||"Invitation created.");await loadTeam();}
  catch(e){toast(e.message);}
 });
 $("content-form").addEventListener("submit",submitEditor);
 $("content-status").addEventListener("change",function(){$("schedule-field").hidden=this.value!=="scheduled";});
 $("close-editor").addEventListener("click",closeEditor);$("cancel-editor").addEventListener("click",closeEditor);
 $("editor-modal").addEventListener("click",function(e){if(e.target===$("editor-modal"))closeEditor();});
 $("mobile-menu").addEventListener("click",function(){var open=$("sidebar").classList.toggle("open");$("mobile-menu").setAttribute("aria-expanded",String(open));});
 $("logout-button").addEventListener("click",async function(){try{await api("/api/auth/logout",{method:"POST",body:"{}"});}catch(e){}state.csrf="";state.user=null;showLogin("You have signed out.");});
 $("content-form").elements.title.addEventListener("input",function(){if(!$("content-form").elements.slug.dataset.touched){$("content-form").elements.slug.value=this.value.toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"").slice(0,120);}});
 $("content-form").elements.slug.addEventListener("input",function(){this.dataset.touched="1";});
}
async function boot(){
 bind();
 var login=new URLSearchParams(location.search).get("login");
 var messages={"not-authorised":"This GitHub account has not been approved for CMS access.","invitation-required":"Your account is not invited. Ask the system administrator to grant access.","inactive":"This administrator account is inactive.","cancelled":"Sign-in was cancelled.","error":"Sign-in could not be completed. Please try again."};
 if(login)showLogin(messages[login]||"Sign in to continue.");
 try{
  var d=await api("/api/session");state.user=d.user;state.csrf=d.csrfToken;showApp();setView("dashboard");
 }catch(e){showLogin(messages[login]||"");}
}
document.addEventListener("DOMContentLoaded",boot);
})();