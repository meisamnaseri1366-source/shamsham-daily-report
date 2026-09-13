const SUPABASE_URL = "https://mgfywvrylkftyyomfbcq.supabase.co";
const SUPABASE_KEY = "sb_publishable_OvCd2s2g70MsRhtpuI_xWA_bzNwz33V";

const db = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_KEY
);


// ===============================
// شروع برنامه
// ===============================

document.addEventListener("DOMContentLoaded", function () {

  const form = document.getElementById("loginForm");

  if (!form) {
    console.error("loginForm پیدا نشد");
    return;
  }

  form.addEventListener("submit", function (event) {

    event.preventDefault();

    login();

  });

});


// ===============================
// ورود
// ===============================

async function login() {

  const username =
    document.getElementById("username").value.trim();

  const password =
    document.getElementById("password").value;

  const button =
    document.getElementById("loginButton");


  if (!username || !password) {

    alert("نام کاربری و رمز عبور را وارد کنید.");

    return;
  }


  button.disabled = true;
  button.textContent = "در حال ورود...";


  try {

    // پیدا کردن ایمیل مربوط به نام کاربری
    const {
      data: email,
      error: rpcError
    } = await db.rpc(
      "resolve_login_email",
      {
        p_username: username
      }
    );


    if (rpcError) {

      console.error(rpcError);

      alert(
        "خطا در پیدا کردن نام کاربری:\n" +
        rpcError.message
      );

      return;
    }


    if (!email) {

      alert("نام کاربری پیدا نشد.");

      return;
    }


    // ورود به Supabase
    const {
      data,
      error
    } = await db.auth.signInWithPassword({

      email: email,

      password: password

    });


    if (error) {

      console.error(error);

      alert(
        "نام کاربری یا رمز عبور اشتباه است."
      );

      return;
    }


    if (!data || !data.user) {

      alert("ورود انجام نشد.");

      return;
    }


    // دریافت پروفایل
    const {
      data: profile,
      error: profileError
    } = await db
      .from("visitors")
      .select("*")
      .eq(
        "user_id",
        data.user.id
      )
      .single();


    if (profileError) {

      console.error(profileError);

      alert(
        "ورود انجام شد، اما اطلاعات کاربر پیدا نشد."
      );

      return;
    }


    // مدیر
    if (
      profile.role === "admin"
    ) {

      showAdmin();

    }

    // ویزیتور
    else {

      showVisitor(profile);

    }


  } catch (error) {

    console.error(error);

    alert(
      "خطای غیرمنتظره در ورود:\n" +
      error.message
    );


  } finally {

    button.disabled = false;

    button.textContent =
      "ورود به برنامه";

  }

}


// ===============================
// صفحه ویزیتور
// ===============================

function showVisitor(profile) {

  document.body.innerHTML = `

    <main class="container">

      <div class="card">

        <h2>
          گزارش روزانه
        </h2>

        <p>
          ویزیتور:
          <b>${profile.full_name}</b>
        </p>

        <hr>

        <label>
          مسیر
        </label>

        <input
          id="route"
          type="text"
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

        <input
          id="sales_rial"
          type="number"
          inputmode="numeric"
          placeholder="مثلاً 120000000"
        >

        <label>
          تعداد فاکتور
        </label>

        <input
          id="invoice_count"
          type="number"
          inputmode="numeric"
          placeholder="مثلاً 12"
        >

        <label>
          تناژ فروش روز
        </label>

        <input
          id="tonnage"
          type="number"
          step="0.01"
          inputmode="decimal"
          placeholder="مثلاً 104"
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
          مشکلات مسیر
        </label>

        <textarea
          id="problems"
          placeholder="در صورت وجود مشکل بنویسید..."
        ></textarea>


        <button
          id="submitReportButton"
          class="primary"
          onclick="submitReport()"
        >
          ارسال گزارش
        </button>


        <br><br>


        <button
          class="red"
          onclick="logout()"
        >
          خروج
        </button>

      </div>

    </main>

  `;


  // تاریخ امروز
  const today =
    new Date()
      .toISOString()
      .split("T")[0];


  document.getElementById(
    "report_date"
  ).value = today;

}


// ===============================
// ارسال گزارش
// ===============================

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
    } = await db.auth.getUser();


    if (
      userError ||
      !userData.user
    ) {

      alert(
        "جلسه ورود شما منقضی شده است."
      );

      return;
    }


    const user =
      userData.user;


    const {
      data: profile,
      error: profileError
    } = await db
      .from("visitors")
      .select("*")
      .eq(
        "user_id",
        user.id
      )
      .single();


    if (
      profileError ||
      !profile
    ) {

      alert(
        "اطلاعات ویزیتور پیدا نشد."
      );

      return;
    }


    const report = {

      visitor_name:
        profile.full_name,

      route:
        document
          .getElementById("route")
          .value
          .trim(),

      report_date:
        document
          .getElementById("report_date")
          .value,

      sales_rial:
        Number(
          document
            .getElementById("sales_rial")
            .value || 0
        ),

      invoice_count:
        Number(
          document
            .getElementById("invoice_count")
            .value || 0
        ),

      tonnage:
        Number(
          document
            .getElementById("tonnage")
            .value || 0
        ),

      arrangement:
        document
          .getElementById("arrangement")
          .value,

      route_visits:
        document
          .getElementById("route_visits")
          .value,

      problems:
        document
          .getElementById("problems")
          .value
          .trim(),

      visitor_id:
        profile.id,

      user_id:
        user.id

    };


    if (!report.route) {

      alert("مسیر را وارد کنید.");

      return;
    }


    if (!report.report_date) {

      alert("تاریخ گزارش را انتخاب کنید.");

      return;
    }


    const {
      error
    } = await db
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


    alert(
      "✅ گزارش با موفقیت ارسال شد."
    );


    location.reload();


  } catch (error) {

    console.error(error);

    alert(
      "خطا:\n" +
      error.message
    );

  } finally {

    button.disabled = false;

    button.textContent =
      "ارسال گزارش";

  }

}


// ===============================
// مدیر
// ===============================

function showAdmin() {

  document.body.innerHTML = `

    <main class="container">

      <div class="card">

        <h2>
          داشبورد مدیریت
        </h2>

        <p>
          گزارش روزانه ویزیتورهای شام شام
        </p>

        <hr>

        <button
          class="primary"
          onclick="loadReports()"
        >
          نمایش گزارش‌ها
        </button>

        <br><br>

        <button
          class="red"
          onclick="logout()"
        >
          خروج
        </button>

        <div id="reports"></div>

      </div>

    </main>

  `;

}


// ===============================
// دریافت گزارش‌ها
// ===============================

async function loadReports() {

  const box =
    document.getElementById(
      "reports"
    );


  box.innerHTML =
    "<p>در حال دریافت گزارش‌ها...</p>";


  const {
    data,
    error
  } = await db
    .from("daily_reports")
    .select("*")
    .order(
      "report_date",
      {
        ascending: false
      }
    );


  if (error) {

    console.error(error);

    box.innerHTML =
      "<p>خطا در دریافت گزارش‌ها</p>";

    return;
  }


  if (!data || !data.length) {

    box.innerHTML =
      "<p>هنوز گزارشی ثبت نشده است.</p>";

    return;
  }


  const groups = {};


  data.forEach(function (report) {

    const date =
      report.report_date ||
      "بدون تاریخ";


    if (!groups[date]) {

      groups[date] = [];

    }


    groups[date].push(report);

  });


  box.innerHTML =
    Object.keys(groups)
      .map(function (date, index) {

        return `

          <div
            style="
              margin-top:15px;
              border:1px solid #ddd;
              border-radius:14px;
              overflow:hidden;
            "
          >

            <div
              onclick="
                document.getElementById(
                  'day${index}'
                ).style.display =
                document.getElementById(
                  'day${index}'
                ).style.display === 'none'
                  ? 'block'
                  : 'none'
              "
              style="
                padding:15px;
                background:#f3f4f6;
                font-weight:bold;
                cursor:pointer;
              "
            >

              📅
              ${jalaliDate(date, true)}

            </div>


            <div
              id="day${index}"
              style="
                padding:10px;
              "
            >

              ${groups[date]
                .map(function (r) {

                  return `

                    <div
                      style="
                        border:1px solid #eee;
                        border-radius:12px;
                        padding:12px;
                        margin-bottom:10px;
                      "
                    >

                      <b>
                        👤
                        ${r.visitor_name || "-"}
                      </b>

                      <p>
                        مسیر:
                        ${r.route || "-"}
                      </p>

                      <p>
                        فروش:
                        ${Number(
                          r.sales_rial || 0
                        ).toLocaleString("fa-IR")}
                        ریال
                      </p>

                      <p>
                        فاکتور:
                        ${Number(
                          r.invoice_count || 0
                        ).toLocaleString("fa-IR")}
                      </p>

                      <p>
                        تناژ:
                        ${Number(
                          r.tonnage || 0
                        ).toLocaleString("fa-IR")}
                        تن
                      </p>

                      <p>
                        چیدمان:
                        ${r.arrangement || "-"}
                      </p>

                      <p>
                        سرکشی:
                        ${r.route_visits || "-"}
                      </p>

                      <p>
                        مشکلات:
                        ${r.problems || "موردی ثبت نشده"}
                      </p>

                    </div>

                  `;

                })
                .join("")}

            </div>

          </div>

        `;

      })
      .join("");

}


// ===============================
// تاریخ شمسی
// ===============================

function jalaliDate(
  dateString,
  full
) {

  if (!dateString) {
    return "-";
  }


  const date =
    new Date(
      dateString +
      "T12:00:00"
    );


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
  ).format(date);

}


// ===============================
// خروج
// ===============================

async function logout() {

  await db.auth.signOut();

  location.reload();

}
