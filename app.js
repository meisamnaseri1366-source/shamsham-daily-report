const SUPABASE_URL = "https://mgfywvrylkftyyomfbcq.supabase.co";
const SUPABASE_KEY = "sb_publishable_OvCd2s2g70MsRhtpuI_xWA_bzNwz33V";

const client = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

const $ = (id) => document.getElementById(id);

document.addEventListener("DOMContentLoaded", () => {
  const loginForm = $("loginForm");

  if (!loginForm) {
    console.error("loginForm پیدا نشد");
    return;
  }

  loginForm.addEventListener("submit", login);
});

async function login(event) {
  event.preventDefault();

  const username = $("username")?.value.trim();
  const password = $("password")?.value;

  if (!username || !password) {
    alert("نام کاربری و رمز عبور را وارد کنید.");
    return;
  }

  const button = event.submitter;
  if (button) {
    button.disabled = true;
    button.textContent = "در حال ورود...";
  }

  try {
    const { data: email, error: rpcError } =
      await client.rpc("resolve_login_email", {
        p_username: username
      });

    if (rpcError) {
      console.error(rpcError);
      throw new Error("خطا در ارتباط با سرور.");
    }

    if (!email) {
      throw new Error("نام کاربری پیدا نشد.");
    }

    const { data, error } =
      await client.auth.signInWithPassword({
        email: email,
        password: password
      });

    if (error) {
      throw new Error("نام کاربری یا رمز عبور اشتباه است.");
    }

    const user = data.user;

    const { data: profile, error: profileError } =
      await client
        .from("visitors")
        .select("*")
        .eq("user_id", user.id)
        .single();

    if (profileError || !profile) {
      throw new Error("اطلاعات کاربر پیدا نشد.");
    }

    localStorage.setItem("shamsham_user", JSON.stringify(profile));

    if (profile.role === "admin") {
      showManagerPanel(profile);
    } else {
      showVisitorPanel(profile);
    }

  } catch (error) {
    console.error(error);
    alert(error.message || "ورود انجام نشد.");
  } finally {
    if (button) {
      button.disabled = false;
      button.textContent = "ورود به برنامه";
    }
  }
}

function showVisitorPanel(profile) {
  document.body.innerHTML = `
    <div class="container">
      <h1>گزارش روزانه ویزیتورهای شام شام</h1>
      <p>سلام ${profile.full_name} 👋</p>

      <form id="reportForm">

        <label>مسیر</label>
        <input id="route" required>

        <label>تاریخ</label>
        <input id="reportDate" type="date" required>

        <label>فروش روز (ریال)</label>
        <input id="sales" type="number" min="0" required>

        <label>تعداد فاکتور</label>
        <input id="invoices" type="number" min="0" required>

        <label>تناژ فروش</label>
        <input id="tonnage" type="number" min="0" step="0.01" required>

        <label>آیا چیدمان مسیر انجام شد؟</label>
        <select id="arrangement">
          <option value="بله">بله</option>
          <option value="خیر">خیر</option>
        </select>

        <label>آیا تمام مشتریان مسیر ویزیت شدند؟</label>
        <select id="routeVisits">
          <option value="بله">بله</option>
          <option value="خیر">خیر</option>
        </select>

        <label>مشکلات مسیر / موارد نیازمند پیگیری</label>
        <textarea id="problems"></textarea>

        <button type="submit">ثبت گزارش</button>
      </form>

      <button id="logoutBtn">خروج</button>
    </div>
  `;

  $("reportForm").addEventListener("submit", submitReport);
  $("logoutBtn").addEventListener("click", logout);
}

async function submitReport(event) {
  event.preventDefault();

  const profile = JSON.parse(localStorage.getItem("shamsham_user"));

  const report = {
    user_id: profile.user_id,
    visitor_id: profile.id,
    visitor_name: profile.full_name,
    route: $("route").value.trim(),
    report_date: $("reportDate").value,
    sales_rial: Number($("sales").value) || 0,
    invoice_count: Number($("invoices").value) || 0,
    tonnage: Number($("tonnage").value) || 0,
    arrangement: $("arrangement").value,
    route_visits: $("routeVisits").value,
    problems: $("problems").value.trim()
  };

  const { error } = await client
    .from("daily_reports")
    .insert(report);

  if (error) {
    console.error(error);
    alert("گزارش ثبت نشد: " + error.message);
    return;
  }

  alert("✅ گزارش با موفقیت ثبت شد.");
  $("reportForm").reset();
}

async function showManagerPanel(profile) {
  document.body.innerHTML = `
    <div class="container">
      <h1>داشبورد مدیریت شام شام</h1>
      <p>سلام ${profile.full_name} 👋</p>

      <button id="loadReports">نمایش گزارش‌ها</button>
      <button id="logoutBtn">خروج</button>

      <div id="reports"></div>
    </div>
  `;

  $("loadReports").addEventListener("click", loadReports);
  $("logoutBtn").addEventListener("click", logout);

  await loadReports();
}

async function loadReports() {
  const box = $("reports");

  box.innerHTML = "در حال دریافت گزارش‌ها...";

  const { data, error } = await client
    .from("daily_reports")
    .select("*")
    .order("report_date", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) {
    console.error(error);
    box.innerHTML = "خطا در دریافت گزارش‌ها: " + error.message;
    return;
  }

  if (!data || data.length === 0) {
    box.innerHTML = "<p>هنوز گزارشی ثبت نشده است.</p>";
    return;
  }

  box.innerHTML = data.map(report => `
    <div style="border:1px solid #ddd;padding:12px;margin:10px 0;border-radius:10px">
      <strong>${escapeHtml(report.visitor_name || "")}</strong>
      <br>مسیر: ${escapeHtml(report.route || "")}
      <br>تاریخ: ${escapeHtml(report.report_date || "")}
      <br>فروش: ${Number(report.sales_rial || 0).toLocaleString("fa-IR")} ریال
      <br>فاکتور: ${report.invoice_count || 0}
      <br>تناژ: ${report.tonnage || 0}
      <br>چیدمان: ${escapeHtml(report.arrangement || "")}
      <br>ویزیت کامل: ${escapeHtml(report.route_visits || "")}
      <br>مشکلات: ${escapeHtml(report.problems || "-")}
    </div>
  `).join("");
}

function escapeHtml(text) {
  return String(text)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

async function logout() {
  await client.auth.signOut();
  localStorage.removeItem("shamsham_user");
  location.reload();
}
