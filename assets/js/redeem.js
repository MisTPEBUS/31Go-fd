import { initLiff } from "../liff/liff-init.js";

let API_BASE_URL =
  "https://ab89-2001-b011-3-11e3-48c-6ba4-3f87-5184.ngrok-free.app";

let html5QrCode = null;

let currentQrCode = null;

let currentLineUserId = null;

let countdownTimer = null;

/*
|--------------------------------------------------------------------------
| Elements
|--------------------------------------------------------------------------
*/

const startScanBtn = document.getElementById("startScanBtn");

const scanner = document.getElementById("scanner");

const scanResult = document.getElementById("scanResult");

const loadingModal = document.getElementById("loadingModal");

const otpModal = document.getElementById("otpModal");

const resultModal = document.getElementById("resultModal");

const countdownElement = document.getElementById("countdown");

const otpInputs = document.querySelectorAll(".otp");

/*
|--------------------------------------------------------------------------
| Init
|--------------------------------------------------------------------------
*/

async function init() {
  try {
    const profile = await initLiff();

    currentLineUserId = profile.userId;

    console.log(profile);
  } catch (error) {
    console.error(error);
  }
}

init();

/*
|--------------------------------------------------------------------------
| Scanner
|--------------------------------------------------------------------------
*/

startScanBtn?.addEventListener("click", startScanner);

async function startScanner() {
  try {
    scanner.classList.remove("hidden");

    html5QrCode = new Html5Qrcode("scanner");

    await html5QrCode.start(
      {
        facingMode: "environment",
      },
      {
        fps: 10,
        qrbox: 240,
      },
      onScanSuccess,
    );
  } catch (error) {
    console.error(error);

    showResult(false, "無法開啟相機");
  }
}

async function onScanSuccess(decodedText) {
  currentQrCode = decodedText;

  scanResult.innerText = decodedText;

  if (html5QrCode) {
    await html5QrCode.stop();
  }

  await sendOtp();
}

/*
|--------------------------------------------------------------------------
| Login API
|--------------------------------------------------------------------------
*/

async function sendOtp() {
  try {
    showLoading();

    const response = await fetch(
      `${API_BASE_URL}/api/admin/TicketCheck/${currentLineUserId}/${currentQrCode}/打卡核銷`,
      {
        method: "POST",
      },
    );

    const result = await response.json();

    hideLoading();

    if (!response.ok) {
      showResult(false, result.message);

      return;
    }

    showOtpModal();

    startCountdown();
  } catch (error) {
    hideLoading();

    console.error(error);

    showResult(false, "發送驗證碼失敗");
  }
}

/*
|--------------------------------------------------------------------------
| OTP
|--------------------------------------------------------------------------
*/

otpInputs.forEach((input, index) => {
  input.addEventListener("input", () => {
    if (input.value && index < otpInputs.length - 1) {
      otpInputs[index + 1].focus();
    }
  });
});

document.getElementById("verifyBtn")?.addEventListener("click", verifyOtp);

async function verifyOtp() {
  const otp = Array.from(otpInputs)
    .map((input) => input.value)
    .join("");

  if (otp.length !== 4) {
    showResult(false, "請輸入完整驗證碼");

    return;
  }

  try {
    const response = await fetch(
      `${API_BASE_URL}/api/admin/Login-Verify/${currentLineUserId}/打卡核銷/${otp}`,
      {
        method: "POST",
      },
    );

    const result = await response.json();

    otpModal.classList.add("hidden");

    if (!response.ok) {
      showResult(false, result.message);

      return;
    }

    showResult(true, "驗證成功，完成打卡核銷");
  } catch (error) {
    console.error(error);

    showResult(false, "驗證失敗");
  }
}

/*
|--------------------------------------------------------------------------
| Countdown
|--------------------------------------------------------------------------
*/

function startCountdown() {
  let seconds = 300;

  clearInterval(countdownTimer);

  countdownTimer = setInterval(() => {
    const min = Math.floor(seconds / 60);

    const sec = seconds % 60;

    countdownElement.innerText = `${String(min).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;

    seconds--;

    if (seconds < 0) {
      clearInterval(countdownTimer);

      countdownElement.innerText = "驗證碼已失效";
    }
  }, 1000);
}

/*
|--------------------------------------------------------------------------
| Loading
|--------------------------------------------------------------------------
*/

function showLoading() {
  loadingModal.classList.remove("hidden");
}

function hideLoading() {
  loadingModal.classList.add("hidden");
}

/*
|--------------------------------------------------------------------------
| OTP Modal
|--------------------------------------------------------------------------
*/

function showOtpModal() {
  otpModal.classList.remove("hidden");

  otpInputs[0]?.focus();
}

/*
|--------------------------------------------------------------------------
| Result
|--------------------------------------------------------------------------
*/

function showResult(success, message) {
  const title = document.getElementById("resultTitle");

  const content = document.getElementById("resultMessage");

  title.innerText = success ? "核銷成功" : "核銷失敗";

  content.innerText = message;

  resultModal.classList.remove("hidden");
}

document.getElementById("closeResultBtn")?.addEventListener("click", () => {
  resultModal.classList.add("hidden");

  location.reload();
});
