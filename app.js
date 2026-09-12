const SUPABASE_URL = "https://mgfywvrylkftyyomfbcq.supabase.co";
const SUPABASE_KEY = "sb_publishable_OvCd2s2g70MsRhtpuI_xWA_bzNwz33V";

const db = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

const fa = n => Number(n || 0).toLocaleString("fa-IR");

function page(html) {
  document.body.innerHTML = `
  <main class="container">
    <div class="card" style="max-width:900px;margin:20px auto">
      ${html}
    </div>
  </main>`;
}

function css() {
  const s = document.createElement("style");
  s.innerHTML = `
  body{margin:0;background:#f3f4f6;font-family:Tahoma,Arial;color:#111827}
  .container{padding:15px}
  .card{background:white;border-radius:18px;padding:20px;box-shadow:0 5px 25px #0001}
  h1,h2{margin-top:0}
  button{border:0;border-radius:12px;padding:13px 18px;font-size:15px;cursor:pointer}
  .primary{background:#111827;color:white;width:100%}
  .green{background:#16a34a;color:white}
  .red{background:#dc2626;color:white}
  input,select,textarea{
    width:100%;box-sizing:border-box;padding:12px;margin:6px 0 14px;
    border:1px solid #d1d5db;border-radius:10px;font-size:15px
  }
  label{font-weight:bold;font-size:14px}
  .grid{display:grid;grid-template-columns:repeat(4,1fr);gap:10px}
  .stat{background:#f9fafb;border-radius:14px;padding:15px;text-align:center}
  .stat b{display:block;font-size:20px;margin-top:7px}
  .report{border:1px solid #e5e7eb;border-radius:15px;padding:15px;margin-top:12px}
  .row{display:flex;justify-content:space-between;gap:10px;border-bottom:1px solid #eee;padding:7px 0}
  .row:last-child{border:0}
  .rank{padding:10px;background:#f9fafb;border-radius:10px;margin:6px 0}
  .topbar{display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap}
  @media(max-width:650px){.grid{grid-template-columns:repeat(2,1fr)}}
  `;
  document.head.appendChild(s);
}
css();

async function login() {
  const username = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value;

  const btn = document.getElementById("loginButton");
  btn.disabled = true;
  btn.textContent = "در حال ورود...";

  try {
    const { data: email, error: rpcError } =
      await db.rpc("resolve_login_email", { p_username: username });

    if (rpcError || !email) {
      alert("نام کاربری پیدا نشد");
      return;
    }

    const { error } = await db.auth.signInWithPassword({
      email: email,
      password: password
    });

    if (error) {
      alert("نام کاربری یا رمز عبور اشتباه است");
      return;
    }

    const { data: profile } = await db
      .from("visitors")
      .select("*")
      .eq("user_id", (await db.auth.getUser()).data.user.id)
      .single();

    if (profile && profile.role === "admin") {
      showAdmin();
    } else {
      showVisitor(profile);
    }

  } catch (e) {
    alert("خطا در اتصال به سامانه");
    console.error(e);
  } finally {
    btn.disabled = false;
    btn.textContent = "ورود به برنامه";
  }
}

document.getElementById("loginForm").addEventListener("submit", e => {
  e.preventDefault();
  login();
});

function showVisitor(profile) {
  page(`
    <div class="topbar">
      <div>
        <h2>گزارش روزانه</h2>
        <div>ویزیتور: <b>${profile?.full_name || ""}</b></div>
      </div>
      <button class="red" onclick="logout()">خروج</button>
    </div>

    <hr>

    <label>مسیر</label>
    <input id="route" placeholder="مثلاً اهواز">

    <label>تاریخ</label>
    <input id="report_date" type="date">

    <label>فروش روز (ریال)</label>
    <input id="sales_rial" type="number" placeholder="مثلاً 120000000">

    <label>تعداد فاکتور</label>
    <input id="invoice_count" type="number">

    <label>تناژ فروش روز</label>
    <input id="tonnage" type="number" step="0.01">

    <label>آیا چیدمان در مسیر انجام شد؟</label>
    <select id="arrangement">
      <option value="بله">بله</option>
      <option value="خیر">خیر</option>
    </select>

    <label>آیا از تمام عامل‌های مسیر سرکشی شد؟</label>
    <select id="route_visits">
      <option value="بله">بله</option>
      <option value="خیر">خیر</option>
    </select>

    <label>مشکلات مسیر / موارد نیازمند پیگیری</label>
    <textarea id="problems" rows="4"></textarea>

    <button class="primary" onclick="submitReport()">
      ارسال گزارش
    </button>
  `);

  document.getElementById("report_date").value =
    new Date().toISOString().split("T")[0];
}

async function submitReport() {
  const user = (await db.auth.getUser()).data.user;

  const { data: profile } = await db
    .from("visitors")
    .select("*")
    .eq("user_id", user.id)
    .single();

  const report = {
    user_id: user.id,
    visitor_id: user.id,
    visitor_name: profile.full_name,
    route: document.getElementById("route").value,
    report_date: document.getElementById("report_date").value,
    sales_rial: Number(document.getElementById("sales_rial").value || 0),
    invoice_count: Number(document.getElementById("invoice_count").value || 0),
    tonnage: Number(document.getElementById("tonnage").value || 0),
    arrangement: document.getElementById("arrangement").value,
    route_visits: document.getElementById("route_visits").value,
    problems: document.getElementById("problems").value
  };

  if (!report.route) {
    alert("لطفاً مسیر را وارد کنید");
    return;
  }

  const { error } = await db.from("daily_reports").insert(report);

  if (error) {
    console.error(error);
    alert("ارسال گزارش انجام نشد");
    return;
  }

  alert("✅ گزارش با موفقیت ارسال شد");
  showVisitor(profile);
}

async function showAdmin() {
  page(`
    <div class="topbar">
      <div>
        <h2>داشبورد مدیریت شام شام</h2>
        <div>شعبه خوزستان</div>
      </div>
      <button class="red" onclick="logout()">خروج</button>
    </div>

    <hr>

    <div class="grid">
      <div class="stat">فروش کل<b id="totalSales">0</b></div>
      <div class="stat">فاکتور<b id="totalInvoices">0</b></div>
      <div class="stat">تناژ<b id="totalTonnage">0</b></div>
      <div class="stat">تعداد گزارش<b id="reportCount">0</b></div>
    </div>

    <br>

    <label>فیلتر ویزیتور</label>
    <select id="visitorFilter">
      <option value="">همه ویزیتورها</option>
    </select>

    <label>از تاریخ</label>
    <input id="fromDate" type="date">

    <label>تا تاریخ</label>
    <input id="toDate" type="date">

    <label>مسیر</label>
    <input id="routeFilter" placeholder="مثلاً اهواز">

    <button class="primary" onclick="loadAdminReports()">
      🔎 نمایش گزارش‌ها
    </button>

    <br><br>

    <button class="green" onclick="exportCSV()">
      📊 خروجی Excel / CSV
    </button>

    <h3>🏆 رتبه‌بندی ویزیتورها</h3>
    <div id="ranking"></div>

    <h3>📋 گزارش‌ها</h3>
    <div id="reports"></div>
  `);

  await loadAdminReports();
}

async function loadAdminReports() {
  const { data, error } = await db
    .from("daily_reports")
    .select("*")
    .order("report_date", { ascending: false });

  if (error) {
    console.error(error);
    alert("دریافت گزارش‌ها با خطا مواجه شد");
    return;
  }

  window.allReports = data || [];

  const names = [...new Set(
    window.allReports.map(x => x.visitor_name).filter(Boolean)
  )];

  const select = document.getElementById("visitorFilter");

  if (select) {
    select.innerHTML =
      `<option value="">همه ویزیتورها</option>` +
      names.map(n => `<option value="${n}">${n}</option>`).join("");
  }

  renderAdmin();
}

function getFilteredReports() {
  let reports = [...(window.allReports || [])];

  const visitor = document.getElementById("visitorFilter")?.value;
  const from = document.getElementById("fromDate")?.value;
  const to = document.getElementById("toDate")?.value;
  const route = document.getElementById("routeFilter")?.value.trim();

  if (visitor)
    reports = reports.filter(x => x.visitor_name === visitor);

  if (from)
    reports = reports.filter(x => x.report_date >= from);

  if (to)
    reports = reports.filter(x => x.report_date <= to);

  if (route)
    reports = reports.filter(x =>
      (x.route || "").includes(route)
    );

  return reports;
}

function renderAdmin() {
  const reports = getFilteredReports();

  const sales = reports.reduce(
    (a, x) => a + Number(x.sales_rial || 0), 0
  );

  const invoices = reports.reduce(
    (a, x) => a + Number(x.invoice_count || 0), 0
  );

  const tonnage = reports.reduce(
    (a, x) => a + Number(x.tonnage || 0), 0
  );

  const visitors = new Set(
    reports.map(x => x.visitor_name).filter(Boolean)
  ).size;

  document.getElementById("totalSales").textContent = fa(sales) + " ریال";
  document.getElementById("totalInvoices").textContent = fa(invoices);
  document.getElementById("totalTonnage").textContent = fa(tonnage);
  document.getElementById("reportCount").textContent =
    fa(reports.length) + " / " + fa(visitors) + " نفر";

  renderRanking(reports);
  renderReports(reports);
}

function renderRanking(reports) {
  const map = {};

  reports.forEach(r => {
    const name = r.visitor_name || "نامشخص";

    if (!map[name])
      map[name] = { sales: 0, invoices: 0, tonnage: 0 };

    map[name].sales += Number(r.sales_rial || 0);
    map[name].invoices += Number(r.invoice_count || 0);
    map[name].tonnage += Number(r.tonnage || 0);
  });

  const list = Object.entries(map)
    .sort((a,b) => b[1].sales - a[1].sales);

  document.getElementById("ranking").innerHTML =
    list.length
      ? list.map((x,i) => `
        <div class="rank">
          <b>${i+1}. ${x[0]}</b>
          <br>
          فروش: ${fa(x[1].sales)} ریال
          | فاکتور: ${fa(x[1].invoices)}
          | تناژ: ${fa(x[1].tonnage)}
        </div>
      `).join("")
      : "هنوز گزارشی ثبت نشده است.";
}

function renderReports(reports) {
  const box = document.getElementById("reports");

  if (!reports.length) {
    box.innerHTML = "<p>گزارشی پیدا نشد.</p>";
    return;
  }

  box.innerHTML = reports.map(r => `
    <div class="report">
      <h3>${r.visitor_name || "بدون نام"}</h3>

      <div class="row">
        <span>تاریخ</span>
        <b>${r.report_date || "-"}</b>
      </div>

      <div class="row">
        <span>مسیر</span>
        <b>${r.route || "-"}</b>
      </div>

      <div class="row">
        <span>فروش</span>
        <b>${fa(r.sales_rial)} ریال</b>
      </div>

      <div class="row">
        <span>فاکتور</span>
        <b>${fa(r.invoice_count)}</b>
      </div>

      <div class="row">
        <span>تناژ</span>
        <b>${fa(r.tonnage)}</b>
      </div>

      <div class="row">
        <span>چیدمان</span>
        <b>${r.arrangement || "-"}</b>
      </div>

      <div class="row">
        <span>سرکشی</span>
        <b>${r.route_visits || "-"}</b>
      </div>

      <div class="row">
        <span>مشکلات</span>
        <b>${r.problems || "موردی ثبت نشده"}</b>
      </div>
    </div>
  `).join("");
}

function exportCSV() {
  const reports = getFilteredReports();

  if (!reports.length) {
    alert("گزارشی برای خروجی وجود ندارد");
    return;
  }

  const header =
    "ویزیتور,مسیر,تاریخ,فروش ریال,تعداد فاکتور,تناژ,چیدمان,سرکشی,مشکلات\n";

  const rows = reports.map(r =>
    [
      r.visitor_name,
      r.route,
      r.report_date,
      r.sales_rial,
      r.invoice_count,
      r.tonnage,
      r.arrangement,
      r.route_visits,
      r.problems
    ].map(v => `"${String(v || "").replace(/"/g,'""')}"`).join(",")
  ).join("\n");

  const blob = new Blob(
    ["\ufeff" + header + rows],
    {type:"text/csv;charset=utf-8;"}
  );

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");

  a.href = url;
  a.download = "گزارش_ویزیتورها.csv";
  a.click();

  URL.revokeObjectURL(url);
}

async function logout() {
  await db.auth.signOut();
  location.reload();
}
