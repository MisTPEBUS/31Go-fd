const LIFF_ID = "2010150440-sbW0urAy";

const API_BASE_URL =
  "https://ab89-2001-b011-3-11e3-48c-6ba4-3f87-5184.ngrok-free.app";

async function init() {
  try {
    await liff.init({
      liffId: LIFF_ID,
    });

    if (!liff.isLoggedIn()) {
      liff.login();

      return;
    }

    const profile = await liff.getProfile();

    console.log(profile);

    const lineUserId = profile.userId;

    const params = new URLSearchParams(window.location.search);

    const page = params.get("page");

    console.log(`page: ${page}`);

    /*
            activity api
        */

    const response = await fetch(
      `${API_BASE_URL}/api/activity/current/${lineUserId}`,
      {
        method: "GET",

        headers: {
          "ngrok-skip-browser-warning": "true",
        },
      },
    );

    console.log(response);

    if (!response.ok) {
      console.error("活動狀態讀取失敗");

      return;
    }

    /*
            response json
        */

    const data = await response.json();

    console.log(data);

    /*
            page route
        */

    console.log(`page: ${page}`);

    switch (page) {
      case "login":
        window.location.href = "./pages/admin/login.html";

        break;
      case "redeem":
        window.location.href = "./pages/admin/redeem/index.html";

        break;
      case "admin-dashboard":
        window.location.href = "./pages/admin/dashboard.html";

        break;
      case "admin-redeem":
        window.location.href = "./pages/admin/redeem/index.html";

        break;

      case "progress":
        window.location.href = "./pages/progress.html";

        break;
      case "faq":
        window.location.href = "./pages/faq.html";

        break;
      case "register":
        window.location.href = "./pages/register.html";

        break;
      case "info":
        window.location.href = "./pages/info.html";

        break;

      case "spot-check":
        window.location.href = `./pages/spot-check.html${window.location.search}`;

        break;
    }
  } catch (error) {
    console.error(error);
  }
}

init();
