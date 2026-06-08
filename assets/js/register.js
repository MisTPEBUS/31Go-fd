import { initLiff } from "../liff/liff-init.js";

const API_BASE_URL =
  "https://ab89-2001-b011-3-11e3-48c-6ba4-3f87-5184.ngrok-free.app";

const CAMPAIGN_ID = "2750ef49-8292-42fa-9660-273c46678aad";

let html5QrCode = null;

let currentMode = "manual";

let profile = null;

/*
|--------------------------------------------------------------------------
| DOM
|--------------------------------------------------------------------------
*/

const manualModeBtn = document.getElementById("manualModeBtn");

const scanModeBtn = document.getElementById("scanModeBtn");

const manualPanel = document.getElementById("manualPanel");

const scanPanel = document.getElementById("scanPanel");

const startScanBtn = document.getElementById("startScanBtn");

const scannerContainer = document.getElementById("scannerContainer");

const ticketNoInput = document.getElementById("ticketNoInput");

const resultMessage = document.getElementById("resultMessage");

const submitBtn = document.getElementById("submitBtn");

const successModal = document.getElementById("successModal");

const successText = document.getElementById("successText");

const successCloseBtn = document.getElementById("successCloseBtn");

/*
|--------------------------------------------------------------------------
| 初始化
|--------------------------------------------------------------------------
*/

async function init() {
  try {
    profile = await initLiff();

    if (!profile) {
      showMessage("LIFF 初始化失敗，請重新開啟頁面。");

      return;
    }

    console.log("profile", profile);

    const userId = profile.userId;

    /*
        |--------------------------------------------------------------------------
        | 讀取活動狀態
        |--------------------------------------------------------------------------
        */

    const response = await fetch(
      `${API_BASE_URL}/api/activity/current/${userId}`,
      {
        method: "GET",

        headers: {
          "Content-Type": "application/json",

          "ngrok-skip-browser-warning": "true",
        },
      },
    );

    if (!response.ok) {
      showMessage("活動狀態讀取失敗");

      return;
    }

    const data = await response.json();

    console.log("activity current", data);

    bindEvents();
  } catch (error) {
    console.error(error);

    showMessage("LIFF 初始化失敗");
  }
}

init();

/*
|--------------------------------------------------------------------------
| Events
|--------------------------------------------------------------------------
*/

function bindEvents() {
  manualModeBtn?.addEventListener("click", () => switchMode("manual"));

  scanModeBtn?.addEventListener("click", () => switchMode("scan"));

  ticketNoInput?.addEventListener("input", formatTicketNo);

  startScanBtn?.addEventListener("click", startTicketScanner);

  submitBtn?.addEventListener("click", submitRegister);

  successCloseBtn?.addEventListener("click", () => {
    successModal.classList.add("hidden");

    window.location.href = `./progress.html?campaignId=${CAMPAIGN_ID}`;
  });
}

/*
|--------------------------------------------------------------------------
| Mode Switch
|--------------------------------------------------------------------------
*/

function switchMode(mode) {
  currentMode = mode;

  if (mode === "manual") {
    manualPanel.classList.remove("hidden");

    scanPanel.classList.add("hidden");

    manualModeBtn.className =
      "h-12 rounded-2xl bg-white text-[#2C6E9B] font-black shadow-sm transition";

    scanModeBtn.className =
      "h-12 rounded-2xl text-slate-500 font-black transition";

    return;
  }

  scanPanel.classList.remove("hidden");

  manualPanel.classList.add("hidden");

  scanModeBtn.className =
    "h-12 rounded-2xl bg-white text-[#2C6E9B] font-black shadow-sm transition";

  manualModeBtn.className =
    "h-12 rounded-2xl text-slate-500 font-black transition";
}

/*
|--------------------------------------------------------------------------
| 車票格式
|--------------------------------------------------------------------------
*/

function formatTicketNo() {
  ticketNoInput.value = ticketNoInput.value
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, 10);
}

function getOrderNo() {
  const value = ticketNoInput.value.trim().toUpperCase();

  return `PO-${value}`;
}

function isValidOrderNo(orderNo) {
  return /^PO-[A-Z0-9]{10}$/.test(orderNo);
}

/*
|--------------------------------------------------------------------------
| Scanner
|--------------------------------------------------------------------------
*/

async function startTicketScanner() {
  try {
    scannerContainer.classList.remove("hidden");

    scannerContainer.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });

    startScanBtn.disabled = true;

    startScanBtn.innerText = "掃描中...";

    if (html5QrCode) {
      await stopScanner();
    }

    html5QrCode = new Html5Qrcode("reader");

    await html5QrCode.start(
      {
        facingMode: "environment",
      },
      {
        fps: 10,
        qrbox: 240,
      },
      async (decodedText) => {
        await handleScanSuccess(decodedText);
      },
    );
  } catch (error) {
    console.error(error);

    showMessage("無法開啟相機，請確認瀏覽器權限。");

    startScanBtn.disabled = false;

    startScanBtn.innerText = "開啟相機掃描";
  }
}

async function handleScanSuccess(decodedText) {
  try {
    const orderNo = await getTicketCodeFromQr(decodedText);

    const ticketNumber = orderNo.replace(/^PO-/, "");

    ticketNoInput.value = ticketNumber;

    showMessage(`已取得票號：${orderNo}`);

    await stopScanner();

    scannerContainer.classList.add("hidden");

    startScanBtn.disabled = false;

    startScanBtn.innerText = "重新掃描";

    switchMode("manual");
  } catch (error) {
    await stopScanner();

    scannerContainer.classList.add("hidden");

    startScanBtn.disabled = false;

    startScanBtn.innerText = "重新掃描";

    showMessage(error.message || "車票不存在");
  }
}

async function getTicketCodeFromQr(qrTicketCode) {
  const response = await fetch(
    `${API_BASE_URL}/api/activity/register/Qr-Ticket-check`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "ngrok-skip-browser-warning": "true",
      },
      body: JSON.stringify({
        qrTicketCode,
      }),
    },
  );

  const result = await response.json();

  console.log("QRCode Check Result", result);

  if (!response.ok || !result.success) {
    throw new Error(result.message || "查無票券資料");
  }

  return result.data.redeemCode;
}

async function stopScanner() {
  if (!html5QrCode) {
    return;
  }

  try {
    await html5QrCode.stop();
  } catch {}

  try {
    await html5QrCode.clear();
  } catch {}

  html5QrCode = null;
}

/*
|--------------------------------------------------------------------------
| Submit
|--------------------------------------------------------------------------
*/

async function submitRegister() {
  hideMessage();

  const orderNo = getOrderNo();

  if (!isValidOrderNo(orderNo)) {
    showMessage("請輸入正確票號格式：PO-xxxxxxxxxx");

    return;
  }

  if (!profile) {
    showMessage("LINE 使用者資料讀取失敗，請重新開啟頁面。");

    return;
  }

  submitBtn.disabled = true;

  submitBtn.innerText = "註冊中...";

  const payload = {
    LineUserId: profile.userId,

    Name: profile.displayName || "",

    OrderNo: orderNo,

    TicketNo: "",

    CampaignId: CAMPAIGN_ID,
  };

  console.log("payload", payload);

  try {
    const registerResponse = await fetch(
      `${API_BASE_URL}/api/activity/register`,
      {
        method: "POST",

        headers: {
          "Content-Type": "application/json",

          "ngrok-skip-browser-warning": "true",
        },

        body: JSON.stringify(payload),
      },
    );

    const registerData = await registerResponse.json();

    console.log("registerData", registerData);

    if (!registerResponse.ok) {
      showMessage(registerData.message || "報名失敗");

      return;
    }

    if (registerData.success === false) {
      showMessage(registerData.message || "報名失敗");

      return;
    }

    successText.innerText =
      registerData.message || `車票號碼 ${orderNo} 已完成註冊。`;

    successModal.classList.remove("hidden");
  } catch (error) {
    console.error(error);

    showMessage("系統發生錯誤");
  } finally {
    submitBtn.disabled = false;

    submitBtn.innerText = "確認註冊";
  }
}

/*
|--------------------------------------------------------------------------
| UI Helper
|--------------------------------------------------------------------------
*/

function showMessage(message) {
  resultMessage.innerText = message;

  resultMessage.classList.remove("hidden");
}

function hideMessage() {
  resultMessage.innerText = "";

  resultMessage.classList.add("hidden");
}
