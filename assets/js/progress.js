
import {
    initLiff
} from "../liff/liff-init.js";

let API_BASE_URL =
    "https://ab89-2001-b011-3-11e3-48c-6ba4-3f87-5184.ngrok-free.app";
let html5QrCode = null;
let isScanningLocked = false;
let scanResultTimer = null;
let isScannerOpening = false;
/*
|--------------------------------------------------------------------------
| 初始化
|--------------------------------------------------------------------------
*/

async function init() {

    try {

        const profile =
            await initLiff();

        if (!profile) {
            return;
        }

        console.log(profile);

        const userId =
            profile.userId;

        /*
        |--------------------------------------------------------------------------
        | 讀取活動資料
        |--------------------------------------------------------------------------
        */

        const response =
            await fetch(
                `${API_BASE_URL}/api/activity/user-activities/${userId}`,
                {
                    method: "GET",

                    headers: {
                        "Content-Type":
                            "application/json",

                        "ngrok-skip-browser-warning":
                            "true"
                    }
                }
            );

        if (!response.ok) {

            alert(
                "活動資料讀取失敗"
            );

            return;
        }

        const activity =
            await response.json();

        renderPage(
            activity,
            userId
        );

        document
            .getElementById(
                "profileButton"
            )
            ?.addEventListener(
                "click",
                () => {

                    window.location.href =
                        "./info.html";
                }
            );

        document
            .querySelectorAll(".navigateButton")
            .forEach(button => {

                button.addEventListener(
                    "click",
                    () => {

                        const name =
                            button.dataset.name;

                        const googleMapUrl =
                            `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(name)}`;

                        liff.openWindow({
                            url: googleMapUrl,
                            external: true
                        });


                    }
                );
            });



        /*
        |--------------------------------------------------------------------------
        | 綁定 QRCode 掃描
        |--------------------------------------------------------------------------
        */




    } catch (error) {

        console.error(error);

        alert(
            "LIFF 初始化失敗"
        );
    }
}

init();
document
    .getElementById("closeScanner")
    .addEventListener("click", closeScanner);
async function closeScanner() {

    const modal =
        document.getElementById(
            "scannerModal"
        );

    if (modal) {

        modal.classList.remove(
            "flex"
        );

        modal.classList.add(
            "hidden"
        );
    }

    if (!html5QrCode) {
        return;
    }

    const scanner =
        html5QrCode;

    html5QrCode = null;

    try {
        await scanner.stop();
    } catch { }

    try {
        await scanner.clear();
    } catch { }
}

/*
|--------------------------------------------------------------------------
| 掃描 QRCode
|--------------------------------------------------------------------------
*/


async function openScanner(
    lineUserId
) {
    if (isScannerOpening || html5QrCode) {
        return;
    }

    isScannerOpening = true;
    isScanningLocked = false;

    const modal =
        document.getElementById(
            "scannerModal"
        );

    modal.classList.remove(
        "hidden"
    );

    modal.classList.add(
        "flex"
    );

    html5QrCode =
        new Html5Qrcode(
            "reader"
        );

    const qrSize =
        Math.min(
            window.innerWidth * 0.8,
            320
        );

    try {

        await html5QrCode.start(
            {
                facingMode:
                    "environment"
            },
            {
                fps: 10,
                qrbox: {
                    width: qrSize,
                    height: qrSize
                }
            },
            async decodedText => {

                if (isScanningLocked) {
                    return;
                }

                isScanningLocked = true;

                await closeScanner();

                await handleScanResult(
                    lineUserId,
                    decodedText
                );
            }
        );

    } catch (error) {

        console.error(error);

        await closeScanner();

        showScanError(
            "相機啟動失敗，請確認瀏覽器權限"
        );

    } finally {

        isScannerOpening = false;
    }
}

async function handleScanResult(lineUserId, qrValue) {
    let spot = "";

    try {
        const url = new URL(qrValue);
        spot = url.searchParams.get("spot") || "";
    } catch {
        showScanError("QRCode 格式錯誤");
        autoCloseScanResult();
        return;
    }

    if (!spot) {
        showScanError("QRCode 缺少景點參數");
        autoCloseScanResult();
        return;
    }

    try {
        const response = await fetch(
            `${API_BASE_URL}/api/activity/spot-check/${lineUserId}/${spot}`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "ngrok-skip-browser-warning": "true"
                }
            }
        );

        const data = await response.json();

        if (!response.ok || !data.success) {
            showScanError(data.message || "打卡失敗");
            autoCloseScanResult();
            return;
        }

        showScanSuccess(data.message || "景點打卡完成");

        scanResultTimer = setTimeout(async () => {
            try {
                const activity = await fetchActivity(lineUserId);
                renderPage(activity, lineUserId);
            } catch (error) {
                console.error(error);
            } finally {
                resetScanState();
            }
        }, 3000);

    } catch (error) {
        console.error(error);
        showScanError("系統連線失敗，請稍後再試");
        autoCloseScanResult();
    }
}
function autoCloseScanResult() {
    scanResultTimer = setTimeout(() => {
        resetScanState();
    }, 3000);
}

function hideScanResultModal() {

    const modal =
        document.getElementById(
            "scanResultModal"
        );

    if (!modal) {
        return;
    }

    modal.classList.remove(
        "flex"
    );

    modal.classList.add(
        "hidden"
    );
    if (scanResultTimer) {

        clearTimeout(
            scanResultTimer
        );

        scanResultTimer =
            null;
    }
}
function renderReward(
    activity
) {

    const rewardBox =
        document.getElementById(
            "rewardBox"
        );

    const completedCount =
        activity.spots.filter(
            spot =>
                spot.status ===
                "COMPLETED"
        ).length;

    const totalCount =
        activity.spots.length;

    const canClaim =
        completedCount === totalCount &&
        activity.status?.toLowerCase() ===
        "active";

    rewardBox.innerHTML = "";
}
function canClaimReward(activity) {
    const completedCount =
        activity.spots.filter(
            spot =>
                spot.status === "COMPLETED"
        ).length;

    const totalCount =
        activity.spots.length;

    return (
        totalCount > 0 &&
        completedCount === totalCount &&
        activity.status?.toLowerCase() === "active"
    );
}

function renderHeroStatus(activity) {

    const NextSPOT = document.getElementById(
        "NextSPOT"
    );

    const heroLabel =
        document.getElementById(
            "heroLabel"
        );

    const heroTitle =
        document.getElementById(
            "heroTitle"
        );
    /*
    |--------------------------------------------------------------------------
    | Progress Bar
    |--------------------------------------------------------------------------
    */

    const progressBar =
        document.getElementById(
            "progressBar"
        );

    let completedCount =
        activity.spots.filter(
            spot =>
                spot.status ===
                "COMPLETED"
        ).length;

    let totalCount =
        activity.spots.length;

    let progressPercent =
        totalCount === 0
            ? 0
            : Math.round(
                (completedCount / totalCount) * 100
            );

    progressBar.style.width =
        `${progressPercent}%`;

    /*
    |--------------------------------------------------------------------------
    | Progress Text
    |--------------------------------------------------------------------------
    */

    let completedText =
        document.getElementById(
            "completedText"
        );

    let remainingText =
        document.getElementById(
            "remainingText"
        );

    completedCount =
        activity.spots.filter(
            spot =>
                spot.status ===
                "COMPLETED"
        ).length;

    totalCount =
        activity.spots.length;

    let remainingCount =
        totalCount - completedCount;

    completedText.innerText =
        `已完成 ${completedCount} 個景點`;

    remainingText.innerText =
        remainingCount <= 0
            ? "已完成全部景點"
            : `尚差 ${remainingCount} 個景點`;
    /*
 |--------------------------------------------------------------------------
 | Next Spot 
 |--------------------------------------------------------------------------
 */



    const pendingSpot =
        activity.spots.find(
            spot =>
                spot.status ===
                "PENDING"
        );

    NextSPOT.innerText =
        pendingSpot?.name || "";

    /*
|--------------------------------------------------------------------------
| Spot Count
|--------------------------------------------------------------------------
*/

    completedCount =
        activity.spots.filter(
            spot =>
                spot.status ===
                "COMPLETED"
        ).length;

    totalCount =
        activity.spots.length;

    /*
    |--------------------------------------------------------------------------
    | 狀態判斷
    |--------------------------------------------------------------------------
    */

    const now =
        new Date();

    const expiredAt =
        new Date(
            activity.expiredAt
                .replace(" ", "T")
        );

    /*
    |--------------------------------------------------------------------------
    | 已逾時
    |--------------------------------------------------------------------------
    */

    if (expiredAt < now) {

        heroLabel.innerText =
            "ACTIVITY EXPIRED";

        heroTitle.innerText =
            "已逾時";



        return;
    }

    /*
    |--------------------------------------------------------------------------
    | 待核可
    |--------------------------------------------------------------------------
    */

    if (
        activity.status
            .toLowerCase()
        === "pending"
    ) {

        heroLabel.innerText =
            "PENDING APPROVAL";

        heroTitle.innerText =
            "待核可";



        return;
    }

    /*
    |--------------------------------------------------------------------------
    | 活動進行中
    |--------------------------------------------------------------------------
    */

    if (
        activity.status
            .toLowerCase()
        === "active"
    ) {

        heroLabel.innerText =
            "ACTIVITY PROGRESS";

        heroTitle.innerText =
            "活動進行中";



        return;
    }
}



function renderSpotCarousel(activity) {

    const spotCarousel =
        document.getElementById(
            "spotCarousel"
        );

    if (!spotCarousel) {
        return;
    }

    spotCarousel.innerHTML =
        activity.spots.map(
            spot => {

                /*
                |--------------------------------------------------------------------------
                | Google Navigation URL
                |--------------------------------------------------------------------------
                */

                const googleMapUrl =
                    `https://www.google.com/maps/search/?api=1&query=${spot.name}`;

                return `
                <section
                    class="
                        relative
                        overflow-hidden
                        rounded-[32px]
                        bg-white
                        border
                        border-slate-100
                        shadow-xl
                        p-6
                         w-full
                        snap-center
                        flex-shrink-0
                    "
                >

                    <div
                        class="
                            absolute
                            top-0
                            right-0
                            w-32
                            h-32
                            bg-sky-50
                            rounded-full
                            blur-3xl
                        "
                    >
                    </div>

                    <div class="relative z-10">

                        <div
                            class="
                                flex
                                items-start
                                justify-between
                            "
                        >

                            <div>

                                <p
                                    class="
                                        text-xs
                                        tracking-[0.2em]
                                        text-slate-400
                                    "
                                >
                                    CURRENT DESTINATION
                                </p>

                                <h2
                                    class="
                                        text-2xl
                                        font-black
                                        mt-3
                                    "
                                >
                                    ${spot.name}
                                </h2>

                                <p
                                    class="
                                        text-sm
                                        text-slate-500
                                        leading-7
                                        mt-3
                                    "
                                >
                                    ${spot.description}
                                </p>

                            </div>

                            <div
                                class="
                                    w-14
                                    h-14
                                    rounded-2xl
                                    bg-[#EDF5FB]
                                    flex
                                    items-center
                                    justify-center
                                "
                            >

                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    class="w-7 h-7 text-[#295A86]"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                >
                                    <path
                                        stroke-linecap="round"
                                        stroke-linejoin="round"
                                        stroke-width="1.8"
                                        d="M19 21H5a2 2 0 01-2-2V7h18v12a2 2 0 01-2 2z"
                                    />

                                    <path
                                        stroke-linecap="round"
                                        stroke-linejoin="round"
                                        stroke-width="1.8"
                                        d="M16 3v4M8 3v4M3 11h18"
                                    />
                                </svg>

                            </div>

                        </div>

                        <button
                           data-name="${spot.name}"
                            class="
                                navigateButton
                                w-full
                                mt-6
                                rounded-2xl
                                bg-gradient-to-r
                                from-[#183B5B]
                                to-[#2F6998]
                                text-white
                                py-4
                                font-bold
                                tracking-wide
                                shadow-lg
                            "
                        >
                            開始導航
                        </button>

                    </div>

                </section>
                `;
            }
        ).join("");
}




function renderSpotList(activity) {

    const spotList =
        document.getElementById(
            "spotList"
        );

    if (!spotList) {
        return;
    }

    const now =
        new Date();

    const expiredAt =
        new Date(
            activity.expiredAt
                .replace(" ", "T")
        );

    const isExpired =
        expiredAt < now;

    spotList.innerHTML =
        activity.spots.map(
            spot => {


                /*
                |--------------------------------------------------------------------------
                | COMPLETED
                |--------------------------------------------------------------------------
                */

                if (
                    spot.status ===
                    "COMPLETED"
                ) {

                    return `
                    <div
                        class="bg-white rounded-[28px] border border-slate-100 shadow-lg p-5"
                    >

                        <div class="flex items-center justify-between">

                            <div>

                                <p class="text-xs tracking-[0.2em] text-slate-400">
                                    COMPLETED
                                </p>

                                <h3 class="font-black text-lg mt-2">
                                    ${spot.name}
                                </h3>

                                <p class="text-sm text-slate-500 mt-2">
                                    已完成景點集章
                                </p>

                            </div>

                            <div
                                class="w-11 h-11 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center"
                            >

                                ✓

                            </div>

                        </div>

                    </div>
                    `;
                }

                /*
                |--------------------------------------------------------------------------
                | PENDING
                |--------------------------------------------------------------------------
                */
                if (
                    spot.status ===
                    "PENDING"
                ) {

                    return `
                    <div
                        class="bg-gradient-to-br from-[#183B5B] to-[#2C628F] rounded-[30px] shadow-2xl p-5 text-white"
                    >
    
                        <p class="text-xs tracking-[0.2em] text-cyan-100">
                            IN PROGRESS
                        </p>
    
                        <h3 class="text-2xl font-black mt-3">
                            ${spot.name}
                        </h3>
    
                        <p class="text-cyan-100 text-sm leading-7 mt-3">
                            前往現場掃描 QRCode，
                            完成景點集章。
                        </p>
    
                       

    
                    </div>
                    `;
                }

                if (isExpired) {

                    return `
                <div
                    class="bg-white rounded-2xl shadow p-4 flex items-center justify-between border-2 border-dashed border-gray-300"
                >

                    <div>
                        <p class="text-xs tracking-[0.2em] text-cyan-100">
                                                    TIME EXPIRED
                        </p>
                        <h2
                            class="font-bold text-lg text-gray-400"
                        >
                            ${spot.name}
                        </h2>

                        <p
                            class="text-sm text-gray-400 mt-1"
                        >
                            活動逾時
                        </p>

                    </div>

                    <div
                        class="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center text-red-400 text-xl"
                    >
                        ✕
                    </div>

                </div>
                `;
                }
            }
        ).join("");
}

function openSpotCheckModal() {

    document
        .getElementById(
            "spotCheckModal"
        )
        .classList.remove(
            "hidden"
        );

    document
        .getElementById(
            "spotCheckModal"
        )
        .classList.add(
            "flex"
        );
}

function closeSpotCheckModal() {

    document
        .getElementById(
            "spotCheckModal"
        )
        .classList.remove(
            "flex"
        );

    document
        .getElementById(
            "spotCheckModal"
        )
        .classList.add(
            "hidden"
        );
}


/*
|--------------------------------------------------------------------------
| 成功
|--------------------------------------------------------------------------
*/

function showSuccess(message) {

    document
        .getElementById("loading")
        .classList.add("hidden");

    document
        .getElementById("successBox")
        .classList.remove("hidden");

    document
        .getElementById("successMessage")
        .innerText =
        message;

    /*
    |--------------------------------------------------------------------------
    | redirect
    |--------------------------------------------------------------------------
    */

    setTimeout(() => {



    }, 2000);
}

/*
|--------------------------------------------------------------------------
| 失敗
|--------------------------------------------------------------------------
*/

function showError(message) {

    document
        .getElementById("loading")
        .classList.add("hidden");

    document
        .getElementById("errorBox")
        .classList.remove("hidden");

    document
        .getElementById("errorMessage")
        .innerText =
        message;

    /*
    |--------------------------------------------------------------------------
    | redirect
    |--------------------------------------------------------------------------
    */

    setTimeout(() => {



    }, 2000);
}

function renderPage(activity,
    userId) {

    renderHeroStatus(activity);

    renderSpotList(activity);

    renderSpotCarousel(activity);

    renderReward(activity);

    bindEvents(userId, activity);
}
function bindEvents(
    userId,
    activity
) {
    const checkBtn =
        document.getElementById(
            "checkBtn"
        );

    if (checkBtn) {

        const isRewardReady =
            canClaimReward(activity);

        const isActivityActive =
            activity.status?.toLowerCase() === "active";

        checkBtn.innerText =
            isRewardReady
                ? "完成集章・立即領獎"
                : isActivityActive
                    ? "點我打卡"
                    : "活動尚未開放";

        if (isRewardReady) {

            checkBtn.classList.remove(
                "from-[#4FA3D9]",
                "to-[#2C6E9B]"
            );

            checkBtn.classList.add(
                "from-emerald-500",
                "to-green-600"
            );

        } else {

            checkBtn.classList.remove(
                "from-emerald-500",
                "to-green-600"
            );

            checkBtn.classList.add(
                "from-[#4FA3D9]",
                "to-[#2C6E9B]"
            );
        }

        checkBtn.onclick =
            async () => {

                if (isRewardReady) {
                    window.location.href =
                        `./info.html?userActivityId=${activity.userActivityId}`;

                    return;
                }

                if (!isActivityActive) {
                    showScanError(
                        "活動尚未開放，無法進行打卡"
                    );

                    autoCloseScanResult();

                    return;
                }

                await openScanner(
                    userId
                );
            };
    }

    document
        .querySelectorAll(
            ".navigateButton"
        )
        .forEach(button => {

            button.onclick =
                () => {

                    const name =
                        button.dataset.name;

                    const url =
                        `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(name)}`;

                    liff.openWindow({
                        url,
                        external: true
                    });
                };
        });



}

async function fetchActivity(userId) {

    const response =
        await fetch(
            `${API_BASE_URL}/api/activity/user-activities/${userId}`,
            {
                headers: {
                    "Content-Type": "application/json",
                    "ngrok-skip-browser-warning": "true"
                }
            }
        );

    if (!response.ok) {
        throw new Error("活動資料讀取失敗");
    }

    return await response.json();
}

function showScanSuccess(
    message
) {

    showScanResultModal(
        true,
        "打卡成功",
        message || "景點打卡完成"
    );
}

function showScanError(message) {
    showScanResultModal(
        false,
        "",
        message || "請確認 QRCode 是否正確或是否已完成打卡"
    );
}

function showScanResultModal(
    success,
    title,
    message
) {
    if (scanResultTimer) {

        clearTimeout(
            scanResultTimer
        );

        scanResultTimer =
            null;
    }
    const modal =
        document.getElementById(
            "scanResultModal"
        );

    const resultIcon =
        document.getElementById(
            "resultIcon"
        );

    const resultTitle =
        document.getElementById(
            "resultTitle"
        );

    const resultMessage =
        document.getElementById(
            "resultMessage"
        );

    if (
        !modal ||
        !resultIcon ||
        !resultTitle ||
        !resultMessage
    ) {
        return;
    }

    modal.classList.remove(
        "hidden"
    );

    modal.classList.add(
        "flex"
    );

    resultIcon.innerHTML =
        success
            ? `
                <div
                    class="
                        w-24
                        h-24
                        rounded-full
                        bg-emerald-50
                        border
                        border-emerald-100
                        flex
                        items-center
                        justify-center
                        mx-auto
                    "
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        class="w-12 h-12 text-emerald-600"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                        <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2.5"
                            d="M5 13l4 4L19 7"
                        />
                    </svg>
                </div>
            `
            : `
                <div
                    class="
                        w-24
                        h-24
                        rounded-full
                        bg-red-50
                        border
                        border-red-100
                        flex
                        items-center
                        justify-center
                        mx-auto
                    "
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        class="w-12 h-12 text-red-500"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                        <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2.5"
                            d="M6 18L18 6M6 6l12 12"
                        />
                    </svg>
                </div>
            `;

    resultTitle.innerText =
        title;

    resultMessage.innerText =
        message;
}

function resetScanState() {

    isScanningLocked =
        false;

    if (scanResultTimer) {

        clearTimeout(
            scanResultTimer
        );

        scanResultTimer =
            null;
    }

    hideScanResultModal();
}