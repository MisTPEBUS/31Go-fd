let API_BASE_URL =
  "https://ab89-2001-b011-3-11e3-48c-6ba4-3f87-5184.ngrok-free.app";

const sendCodeBtn = document.getElementById("sendCodeBtn");

const loginStep1 = document.getElementById("loginStep1");

const loginStep2 = document.getElementById("loginStep2");

const countdownElement = document.getElementById("countdown");

const otpInputs = document.querySelectorAll(".otp");

let countdownTimer = null;

let loginCode = "";

/*
|--------------------------------------------------------------------------
| Modal
|--------------------------------------------------------------------------
*/

function showSuccess(message) {
  document.getElementById("successMessage").innerText = message;

  document.getElementById("successModal").classList.remove("hidden");
}

function showError(message) {
  document.getElementById("errorMessage").innerText = message;

  document.getElementById("errorModal").classList.remove("hidden");
}

document.getElementById("successCloseBtn")?.addEventListener("click", () => {
  document.getElementById("successModal").classList.add("hidden");
});

document.getElementById("errorCloseBtn")?.addEventListener("click", () => {
  document.getElementById("errorModal").classList.add("hidden");
});

/*
|--------------------------------------------------------------------------
| 取得驗證碼
|--------------------------------------------------------------------------
*/

sendCodeBtn?.addEventListener("click", handleSendCode);

async function handleSendCode() {
  const activityCode = document.getElementById("activityCode")?.value.trim();

  if (!activityCode) {
    showError("請輸入活動碼");

    return;
  }

  loginCode = activityCode;

  try {
    const response = await fetch(
      `${API_BASE_URL}/api/admin/Login-Line/${loginCode}/登入頁面`,
      {
        method: "POST",
        headers: {
          "ngrok-skip-browser-warning": "true",
        },
      },
    );

    const result = await response.json();

    if (!response.ok) {
      showError(result.message ?? "取得驗證碼失敗");

      return;
    }

    showSuccess(result.message ?? "驗證碼已發送");

    loginStep1.classList.add("hidden");

    loginStep2.classList.remove("hidden");

    startCountdown();
  } catch (error) {
    console.error(error);

    showError("取得驗證碼失敗");
  }
}

/*
|--------------------------------------------------------------------------
| 倒數計時
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
| OTP
|--------------------------------------------------------------------------
*/

otpInputs.forEach((input, index) => {
  input.addEventListener("input", () => {
    input.value = input.value.replace(/\D/g, "");

    if (input.value && index < otpInputs.length - 1) {
      otpInputs[index + 1].focus();
    }
  });

  input.addEventListener("keydown", (event) => {
    if (event.key === "Backspace" && !input.value && index > 0) {
      otpInputs[index - 1].focus();
    }
  });
});

/*
|--------------------------------------------------------------------------
| 驗證登入
|--------------------------------------------------------------------------
*/

document.getElementById("verifyBtn")?.addEventListener("click", async () => {
  const otp = Array.from(otpInputs)
    .map((input) => input.value)
    .join("");

  if (!loginCode) {
    showError("請重新輸入活動碼");

    return;
  }

  if (otp.length !== 4) {
    showError("請輸入完整驗證碼");

    return;
  }

  try {
    const response = await fetch(
      `${API_BASE_URL}/api/admin/Login-Verify/${loginCode}/登入頁面/${otp}`,
      {
        method: "POST",
        headers: {
          "ngrok-skip-browser-warning": "true",
        },
      },
    );

    const result = await response.json();

    if (!response.ok) {
      showError(result.message ?? "驗證失敗");

      return;
    }

    // JWT
    localStorage.setItem("accessToken", result.data.token);

    // 使用者資訊
    localStorage.setItem(
      "adminUser",
      JSON.stringify({
        userId: result.data.userId,
        role: result.data.role,
        activityCode: result.data.activityCode,
      }),
    );

    showSuccess("登入成功");

    setTimeout(() => {
      window.location.href = "./order.html";
    }, 1500);
  } catch (error) {
    console.error(error);

    showError("驗證失敗");
  }
});

/*
|--------------------------------------------------------------------------
| 重新發送
|--------------------------------------------------------------------------
*/

document.getElementById("resendBtn")?.addEventListener("click", async () => {
  if (!loginCode) {
    showError("請重新輸入活動碼");

    return;
  }

  try {
    const response = await fetch(
      `${API_BASE_URL}/api/admin/Login/${loginCode}/登入頁面`,
      {
        method: "POST",
        headers: {
          "ngrok-skip-browser-warning": "true",
        },
      },
    );

    const result = await response.json();

    if (!response.ok) {
      showError(result.message ?? "重新發送失敗");

      return;
    }

    startCountdown();

    showSuccess("驗證碼已重新發送");
  } catch (error) {
    console.error(error);

    showError("重新發送失敗");
  }
});
