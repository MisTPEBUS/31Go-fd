import { initLiff } from "../liff/liff-init.js";

let API_BASE_URL =
  "https://ab89-2001-b011-3-11e3-48c-6ba4-3f87-5184.ngrok-free.app";
let html5QrCode = null;

async function init() {
  try {
    const profile = await initLiff();

    if (!profile) {
      return;
    }

    console.log(profile);

    const lineUserId = profile.userId;

    document
      .getElementById("registerCampaignBtn")
      ?.addEventListener("click", () => {
        console.log("Register button clicked");
        window.location.href = "./register.html";
      });

    document.querySelectorAll(".activity-toggle").forEach((button) => {
      button.addEventListener("click", () => {
        const content = button.nextElementSibling;

        const arrow = button.querySelector(".arrow");

        content.classList.toggle("hidden");

        arrow.classList.toggle("rotate-180");
      });
    });
  } catch (error) {
    alert(error.message || "發生錯誤，請稍後再試。");
    console.error(error);
  }
}

init();
