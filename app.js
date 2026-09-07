const SUPABASE_URL = "https://mgfywvrylkftyyomfbcq.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_OvCd2s2g70MsRhtpuI_xWA_bzNwz33V";
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
const $ = id => document.getElementById(id);
$("todayFa").textContent = new Intl.DateTimeFormat("fa-IR-u-ca-persian",{dateStyle:"full"}).format(new Date());
let currentUser=null, profile=null;
function msg(el,text,ok=false){el.textContent=text;el.style.color=ok?"#166534":"#b91c1c";}
function actualDate(){return new Date().toISOString().slice(0,10);}
async function resolveEmail(username){
  const {data,error}=await supabase.rpc("resolve_login_email",{p_username:username.trim()});
  if(error) throw error; if(!data) throw new Error("نام کاربری پیدا نشد."); return data;
}
async function loadProfile(){
  const {data,error}=await supabase.from("visitors").select("id,full_name,username,role,user_id").eq("user_id",currentUser.id).single();
  if(error) throw error; profile=data;
  $("welcome").textContent="سلام "+profile.full_name;
  $("roleLabel").textContent=profile.role==="admin"?"مدیر":"ویزیتور";
  $("adminView").classList.toggle("hidden",profile.role!=="admin");
  await loadMyReports(); if(profile.role==="admin") await loadAllReports();
}
async function loadMyReports(){
  const {data,error}=await supabase.from("daily_reports").select("id,report_date,route,sales_rial,invoice_count,tonnage,arrangement,route_visits,problems").eq("user_id",currentUser.id).order("report_date",{ascending:false}).limit(30);
  if(error){$("myReports").innerHTML="<div class='muted'>خطا در دریافت گزارش‌ها</div>";return;}
  $("myReports").innerHTML=data.length?data.map(r=>`<div class="report"><strong>${r.report_date} — ${r.route||"بدون مسیر"}</strong><div>فروش: ${Number(r.sales_rial||0).toLocaleString("fa-IR")} ریال</div><div>فاکتور: ${r.invoice_count||0} | تناژ: ${r.tonnage||0}</div><div class="muted">چیدمان: ${r.arrangement||"-"} | بازدید کامل: ${r.route_visits||"-"}</div>${r.problems?`<div>پیگیری: ${r.problems}</div>`:""}</div>`).join(""):"<div class='muted'>هنوز گزارشی ثبت نشده.</div>";
}
async function loadAllReports(){
  let q=supabase.from("daily_reports").select("id,report_date,visitor_name,user_id,route,sales_rial,invoice_count,tonnage,arrangement,route_visits,problems").order("report_date",{ascending:false}).limit(500);
  const visitor=$("filterVisitor").value.trim(), date=$("filterDate").value;
  if(visitor) q=q.ilike("visitor_name",`%${visitor}%`); if(date) q=q.eq("report_date",date);
  const {data,error}=await q;
  if(error){$("allReports").innerHTML="<div class='muted'>خطا در دریافت گزارش‌های مدیر</div>";return;}
  $("allReports").innerHTML=data.length?data.map(r=>`<div class="report"><strong>${r.visitor_name||"-"} — ${r.report_date} — ${r.route||"-"}</strong><div>فروش: ${Number(r.sales_rial||0).toLocaleString("fa-IR")} ریال | فاکتور: ${r.invoice_count||0} | تناژ: ${r.tonnage||0}</div><div class="muted">چیدمان: ${r.arrangement||"-"} | بازدید کامل: ${r.route_visits||"-"}</div>${r.problems?`<div>پیگیری: ${r.problems}</div>`:""}</div>`).join(""):"<div class='muted'>گزارشی پیدا نشد.</div>";
}
$("loginBtn").onclick=async()=>{
  msg($("loginMsg"),"در حال ورود...",true);
  try{const u=$("username").value,p=$("password").value;if(!u||!p)throw new Error("نام کاربری و رمز را وارد کن.");
    const email=await resolveEmail(u);const {data,error}=await supabase.auth.signInWithPassword({email,password:p});if(error)throw error;
    currentUser=data.user;$("loginView").classList.add("hidden");$("appView").classList.remove("hidden");await loadProfile();
  }catch(e){msg($("loginMsg"),e.message||"ورود ناموفق بود.");}
};
$("logoutBtn").onclick=async()=>{await supabase.auth.signOut();location.reload();};
$("saveBtn").onclick=async()=>{
  msg($("saveMsg"),"در حال ثبت...",true);
  try{const row={user_id:currentUser.id,visitor_id:profile.id,visitor_name:profile.full_name,route:$("route").value.trim(),report_date:actualDate(),sales_rial:Number($("sales").value||0),invoice_count:Number($("invoiceCount").value||0),tonnage:Number($("tonnage").value||0),arrangement:$("arrangement").value,route_visits:$("routeVisits").value,problems:$("problems").value.trim()};
    const {error}=await supabase.from("daily_reports").insert(row);if(error)throw error;msg($("saveMsg"),"گزارش با موفقیت ثبت شد ✅",true);
    ["route","sales","invoiceCount","tonnage","problems"].forEach(id=>$(id).value="");$("arrangement").value="";$("routeVisits").value="";await loadMyReports();if(profile.role==="admin")await loadAllReports();
  }catch(e){msg($("saveMsg"),e.message||"ثبت گزارش ناموفق بود.");}
};
$("refreshBtn").onclick=loadAllReports;$("filterVisitor").oninput=loadAllReports;$("filterDate").onchange=loadAllReports;
(async()=>{const {data}=await supabase.auth.getSession();if(data.session){currentUser=data.session.user;$("loginView").classList.add("hidden");$("appView").classList.remove("hidden");try{await loadProfile()}catch(e){await supabase.auth.signOut();location.reload();}}})();
