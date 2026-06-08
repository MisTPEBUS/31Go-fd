
import { initLiff }
    from "./liff/liff-init.js";

import { ensureLogin }
    from "./liff/liff-auth.js";

import { getLiffProfile }
    from "./liff/liff-profile.js";

async function initializeLiffApp() {
    await initLiff();

    const loggedIn =
        await ensureLogin();

    if (!loggedIn) {
        return;
    }

    const profile =
        await getLiffProfile();

    console.log(profile);

    document.getElementById("app").innerHTML = `
    <div class="space-y-4">

      <img
        src="${profile.pictureUrl}"
        class="w-24 h-24 rounded-full mx-auto"
      />

      <h2 class="text-center text-xl font-semibold">
        ${profile.displayName}
      </h2>

      <p class="text-center text-gray-500 break-all">
        ${profile.userId}
      </p>

    </div>
  `;
}

initializeLiffApp();

