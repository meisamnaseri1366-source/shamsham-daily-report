const SUPABASE_URL = "https://mgfywvrylkftyyomfbcq.supabase.co";
const SUPABASE_KEY = "sb_publishable_OvCd2s2g70MsRhtpuI_xWA_bzNwz33V";

const db = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_KEY
);


// ======================================================
// ابزارهای عمومی
// ======================================================

const faNumber = new Intl.NumberFormat("fa-IR", {
  useGrouping: true,
  maximumFractionDigits: 2
});

const faInteger = new Intl.NumberFormat("fa-IR", {
  useGrouping: true,
  maximumFractionDigits: 0
});

function fa(n) {
  if (n === null || n === undefined || n === "") {
    return "۰";
  }

  try {
    return faNumber.format(Number(n));
  } catch {
    return String(n);
  }
}

function faMoney(n) {
  if (n === null || n === undefined || n === "") {
    return "۰";
  }

  try {
    return faInteger.format(BigInt(String(n)));
  } catch {
    return faInteger.format(Number(n) || 0);
  }
}


// ======================================================
// تبدیل اعداد فارسی و انگلیسی
// ======================================================

function normalizeDigits(value) {

  return String(value || "")
    .replace(/[۰-۹]/g, function (d) {
      return String("۰۱۲۳۴۵۶۷۸۹".indexOf(d));
    })
    .replace(/[٠-٩]/g, function (d) {
      return String("٠١٢٣٤٥٦٧٨٩".indexOf(d));
    });
}


function onlyDigits(value) {

  return normalizeDigits(value).replace(/[^\d]/g, "");

}


// ======================================================
// فرمت مبلغ فروش
// ======================================================

const salesFormatter = new Intl.NumberFormat("fa-IR", {
  useGrouping: true,
  maximumFractionDigits: 0
});


function formatSales(input) {

  if (!input) return;

  const oldValue = input.value;

  const oldCursor =
    input.selectionStart !== null
      ? input.selectionStart
      : oldValue.length;


  // تعداد رقم‌هایی که قبل از محل کرسر بوده
  const digitsBefore =
    (oldValue.slice(0, oldCursor).match(/[0-9۰-۹]/g) || []).length;


  // فقط رقم
  const raw = onlyDigits(oldValue);


  if (!raw) {

    input.value = "";

    return;
  }


  let formatted;


  try {

    // BigInt باعث می‌شود مبلغ‌های خیلی بزرگ هم دقیق بمانند
    formatted = salesFormatter.format(BigInt(raw));

  } catch {

    formatted = salesFormatter.format(Number(raw) || 0);

  }


  input.value = formatted;


  // برگرداندن کرسر به جای درست
  let seenDigits = 0;
  let newCursor = formatted.length;


  for (let i = 0; i < formatted.length; i++) {

    if (/[0-9۰-۹]/.test(formatted[i])) {

      seenDigits++;

    }

    if (seenDigits >= digitsBefore) {

      newCursor = i + 1;

      break;
    }
  }


  requestAnimationFrame(function () {

    try {

      input.setSelectionRange(
        newCursor,
        newCursor
      );

    } catch (e) {}

  });
}


// ======================================================
// تاریخ شمسی
// ======================================================

function jalaliDate(dateString, full = false) {

  if (!dateString) {
    return "-";
  }


  const d =
    new Date(dateString + "T12:00:00");


  const options = full
    ? {
        calendar: "persian",
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric"
      }
    : {
        calendar: "persian",
        year: "numeric",
        month: "2-digit",
        day: "2-digit"
      };


  return new Intl.DateTimeFormat(
    "fa-IR",
    options
  ).format(d);
}


// ======================================================
// صفحه
// ======================================================

function page(html) {

  document.body.innerHTML = `

    <main class="container">

      <div class="card">

        ${html}

      </div>

    </main>

  `;
}


// ======================================================
// ظاهر برنامه
// ======================================================

function addCSS() {

  const s =
    document.createElement("style");


  s.innerHTML = `

    body {

      margin: 0;

      background: #f3f4f6;

      font-family:
        Tahoma,
        Arial,
        sans-serif;

      color: #111827;

    }


    .container {

      padding: 15px;

    }


    .card {

      max-width: 950px;

      margin: 20px auto;

      background: white;

      border-radius: 20px;

      padding: 20px;

      box-shadow:
        0 5px 25px #0001;

    }


    h1,
    h2,
    h3 {

      margin-top: 0;

    }


    button {

      border: 0;

      border-radius: 12px;

      padding: 13px 18px;

      font-size: 15px;

      cursor: pointer;

    }


    button:disabled {

      opacity: .6;

      cursor: not-allowed;

    }


    .primary {

      background: #111827;

      color: white;

      width: 100%;

    }


    .green {

      background: #16a34a;

      color: white;

    }


    .red {

      background: #dc2626;

      color: white;

    }


    .blue {

      background: #2563eb;

      color: white;

    }


    .gray {

      background: #e5e7eb;

      color: #111827;

    }


    input,
    select,
    textarea {

      width: 100%;

      box-sizing: border-box;

      padding: 12px;

      margin: 6px 0 14px;

      border:
        1px solid #d1d5db;

      border-radius: 10px;

      font-size: 15px;

      background: white;

    }


    textarea {

      min-height: 90px;

      resize: vertical;

    }


    label {

      font-weight: bold;

      font-size: 14px;

    }


    .grid {

      display: grid;

      grid-template-columns:
        repeat(4, 1fr);

      gap: 10px;

    }


    .stat {

      background: #f9fafb;

      border-radius: 14px;

      padding: 15px;

      text-align: center;

    }


    .stat b {

      display: block;

      font-size: 19px;

      margin-top: 7px;

    }


    .topbar {

      display: flex;

      justify-content:
        space-between;

      align-items: center;

      gap: 10px;

      flex-wrap: wrap;

    }


    .topbar-buttons {

      display: flex;

      gap: 8px;

      flex-wrap: wrap;

    }


    .money-wrap {

      position: relative;

    }


    .money-wrap input {

      padding-left: 65px;

      direction: ltr;

      text-align: right;

    }


    .money-unit {

      position: absolute;

      left: 12px;

      top: 50%;

      transform:
        translateY(-50%);

      color: #6b7280;

      font-weight: bold;

      pointer-events: none;

      font-size: 13px;

    }


    .day-box {

      margin-top: 15px;

      border:
        1px solid #e5e7eb;

      border-radius: 16px;

      overflow: hidden;

      background: white;

    }


    .day-title {

      padding: 16px;

      background: #f8fafc;

      cursor: pointer;

      font-size: 16px;

      font-weight: bold;

      display: flex;

      justify-content:
        space-between;

      align-items: center;

    }


    .day-title:hover {

      background: #f1f5f9;

    }


    .day-content {

      padding:
        10px
        12px
        14px;

    }


    .day-summary {

      font-size: 13px;

      color: #6b7280;

      margin-top: 5px;

    }


    .report {

      border:
        1px solid #e5e7eb;

      border-radius: 14px;

      padding: 14px;

      margin-top: 10px;

      background: white;

    }


    .report h3 {

      margin-bottom: 10px;

    }


    .row {

      display: flex;

      justify-content:
        space-between;

      gap: 10px;

      border-bottom:
        1px solid #eee;

      padding: 7px 0;

    }


    .row:last-child {

      border: 0;

    }


    .rank {

      padding: 12px;

      background: #f9fafb;

      border-radius: 10px;

      margin: 6px 0;

    }


    .arrow {

      font-size: 18px;

    }


    .filters {

      background: #f8fafc;

      padding: 15px;

      border-radius: 14px;

      margin-top: 15px;

    }


    .filter-grid {

      display: grid;

      grid-template-columns:
        repeat(4, 1fr);

      gap: 10px;

    }


    .empty {

      text-align: center;

      padding: 30px 10px;

      color: #6b7280;

    }


    .success-box {

      background: #dcfce7;

      color: #166534;

      padding: 14px;

      border-radius: 12px;

      margin: 15px 0;

      text-align: center;

      font-weight: bold;

    }


    .danger-box {

      background: #fee2e2;

      color: #991b1b;

      padding: 14px;

      border-radius: 12px;

      margin: 15px 0;

      text-align: center;

    }


    @media(max-width:650px) {

      .grid {

        grid-template-columns:
          repeat(2, 1fr);

      }


      .filter-grid {

        grid-template-columns:
          repeat(2, 1fr);

      }


      .card {

        padding: 15px;

      }

    }


    @media(max-width:450px) {

      .filter-grid {

        grid-template-columns: 1fr;

      }


      .grid {

        grid-template-columns:
          repeat(2, 1fr);

      }

    }

  `;


  document.head.appendChild(s);

}


addCSS();


// ======================================================
// ورود
// ======================================================

async function login() {

  const username =
    document
      .getElementById("username")
      .value
      .trim();


  const password =
    document
      .getElementById("password")
      .value;


  const btn =
    document.getElementById(
      "loginButton"
    );


  btn.disabled = true;

  btn.textContent =
    "در حال ورود...";


  try {

    const {
      data: email,
      error: rpcError
    } = await db.rpc(
      "resolve_login_email",
      {
        p_username: username
      }
    );


    if (rpcError || !email) {

      alert(
        "نام کاربری پیدا نشد"
      );

      return;
    }


    const {
      error
    } =
      await db.auth.signInWithPassword({

        email: email,

        password: password

      });


    if (error) {

      alert(
        "نام کاربری یا رمز عبور اشتباه است"
      );

      return;
    }


    const {
      data: userData
    } =
      await db.auth.getUser();


    const user =
      userData.user;


    const {
      data: profile
    } =
      await db
        .from("visitors")
        .select("*")
        .eq(
          "user_id",
          user.id
        )
        .single();


    if (
      profile &&
      profile.role === "admin"
    ) {

      showAdmin();

    } else {

      showVisitor(profile);

    }

  } catch (e) {

    console.error(e);

    alert(
      "خطا در اتصال به سامانه"
    );

  } finally {

    btn.disabled = false;

    btn.textContent =
      "ورود به برنامه";

  }

}


// ======================================================
// فرم ورود
// ======================================================

const loginForm =
  document.getElementById(
    "loginForm"
  );


if (loginForm) {

  loginForm.addEventListener(
    "submit",
    function (e) {

      e.preventDefault();

      login();

    }
  );

}


// ======================================================
// صفحه ویزیتور
// ======================================================

function showVisitor(profile) {

  page(`

    <div class="topbar">

      <div>

        <h2>
          گزارش روزانه
        </h2>

        <div>

          ویزیتور:

          <b>
            ${profile?.full_name || ""}
          </b>

        </div>

      </div>


      <button
        class="red"
        onclick="logout()"
      >
        خروج
      </button>

    </div>


    <hr>


    <label>
      مسیر
    </label>

    <input
      id="route"
      placeholder="مثلاً اهواز"
    >


    <label>
      تاریخ گزارش
    </label>

    <input
      id="report_date"
      type="date"
    >


    <label>
      فروش روز (ریال)
    </label>

    <div class="money-wrap">

      <input
        id="sales_rial"
        type="text"
        inputmode="numeric"
        autocomplete="off"
        placeholder="مثلاً ۷۵۶۰۰۰۰۰"
        oninput="formatSales(this)"
      >

      <span class="money-unit">
        ریال
      </span>

    </div>


    <label>
      تعداد فاکتور
    </label>

    <input
      id="invoice_count"
      type="number"
      min="0"
      inputmode="numeric"
      placeholder="مثلاً ۱۲"
    >


    <label>
      تناژ فروش روز
    </label>

    <input
      id="tonnage"
      type="number"
      min="0"
      step="0.01"
      inputmode="decimal"
      placeholder="مثلاً ۱۰۴"
    >


    <label>
      آیا چیدمان در مسیر انجام می‌شود؟
    </label>

    <select id="arrangement">

      <option value="">
        انتخاب کنید
      </option>

      <option value="بله">
        بله
      </option>

      <option value="خیر">
        خیر
      </option>

    </select>


    <label>
      سرکشی به تمام عامل‌های مسیر صورت می‌گیرد؟
    </label>

    <select id="route_visits">

      <option value="">
        انتخاب کنید
      </option>

      <option value="بله">
        بله
      </option>

      <option value="خیر">
        خیر
      </option>

    </select>


    <label>
      مشکلات مسیر / موارد نیازمند پیگیری
    </label>

    <textarea
      id="problems"
      placeholder="در صورت وجود مشکل اینجا بنویسید..."
    ></textarea>


    <button
      class="primary"
      id="submitReportButton"
      onclick="submitReport()"
    >
      ارسال گزارش
    </button>

  `);


  // تاریخ امروز
  const today =
    new Date()
      .toISOString()
      .split("T")[0];


  document
    .getElementById(
      "report_date"
    )
    .value = today;

}


// ======================================================
// ارسال گزارش
// ======================================================

async function submitReport() {

  const button =
    document.getElementById(
      "submitReportButton"
    );


  button.disabled = true;

  button.textContent =
    "در حال ارسال...";


  try {

    const {
      data: userData,
      error: userError
    } =
      await db.auth.getUser();


    if (
      userError ||
      !userData.user
    ) {

      alert(
        "جلسه ورود شما منقضی شده است. دوباره وارد شوید."
      );

      return;
    }


    const user =
      userData.user;


    const {
      data: profile
    } =
      await db
        .from("visitors")
        .select("*")
        .eq(
          "user_id",
          user.id
        )
        .single();


    if (!profile) {

      alert(
        "اطلاعات ویزیتور پیدا نشد."
      );

      return;
    }


    const salesRaw =
      onlyDigits(
        document
          .getElementById(
            "sales_rial"
          )
          .value
      );


    const invoiceRaw =
      onlyDigits(
        document
          .getElementById(
            "invoice_count"
          )
          .value
      );


    const tonnageValue =
      document
        .getElementById(
          "tonnage"
        )
        .value;


    const report = {

      visitor_name:
        profile.full_name,

      route:
        document
          .getElementById(
            "route"
          )
          .value
          .trim(),

      report_date:
        document
          .getElementById(
            "report_date"
          )
          .value,

      sales_rial:
        Number(salesRaw || 0),

      invoice_count:
        Number(invoiceRaw || 0),

      tonnage:
        Number(tonnageValue || 0),

      arrangement:
        document
          .getElementById(
            "arrangement"
          )
          .value,

      route_visits:
        document
          .getElementById(
            "route_visits"
          )
          .value,

      problems:
        document
          .getElementById(
            "problems"
          )
          .value
          .trim(),

      visitor_id:
        profile.id,

      user_id:
        user.id

    };


    if (!report.route) {

      alert(
        "لطفاً مسیر را وارد کنید."
      );

      return;
    }


    if (!report.report_date) {

      alert(
        "لطفاً تاریخ گزارش را انتخاب کنید."
      );

      return;
    }


    const {
      error
    } =
      await db
        .from("daily_reports")
        .insert(report);


    if (error) {

      console.error(error);

      alert(
        "ارسال گزارش ناموفق بود:\n" +
        error.message
      );

      return;
    }


    page(`

      <div class="success-box">

        ✅ گزارش با موفقیت ارسال شد

      </div>


      <h2>
        گزارش شما ثبت شد
      </h2>


      <p>
        تاریخ:
        <b>
          ${jalaliDate(
            report.report_date,
            true
          )}
        </b>
      </p>


      <p>
        فروش:
        <b>
          ${faMoney(
            report.sales_rial
          )}
          ریال
        </b>
      </p>


      <button
        class="primary"
        onclick="location.reload()"
      >
        ثبت گزارش جدید
      </button>


      <br><br>


      <button
        class="red"
        onclick="logout()"
      >
        خروج
      </button>

    `);


  } catch (e) {

    console.error(e);

    alert(
      "خطای غیرمنتظره رخ داد."
    );

  } finally {

    button.disabled = false;

    button.textContent =
      "ارسال گزارش";

  }

}


// ======================================================
// صفحه مدیریت
// ======================================================

async function showAdmin() {

  page(`

    <div class="topbar">

      <div>

        <h2>
          داشبورد مدیریت
        </h2>

        <div>
          گزارش روزانه ویزیتورهای شام شام
        </div>

      </div>


      <div class="topbar-buttons">

        <button
          class="blue"
          onclick="loadAdminReports()"
        >
          نمایش گزارش‌ها
        </button>


        <button
          class="red"
          onclick="logout()"
        >
          خروج
        </button>

      </div>

    </div>


    <div id="adminContent">

      <div class="empty">

       
