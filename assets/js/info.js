
import {
    initLiff
} from "../liff/liff-init.js";

const API_BASE_URL =
    "https://9f4d-59-124-220-148.ngrok-free.app";
let html5QrCode = null;
/*
|--------------------------------------------------------------------------
| 初始化
|--------------------------------------------------------------------------
*/

/*
|--------------------------------------------------------------------------
| 使用者須知狀態
|--------------------------------------------------------------------------
*/

let isAgreeNotice = false;

/*
|--------------------------------------------------------------------------
| Modal DOM
|--------------------------------------------------------------------------
*/

const noticeModal =
    document.getElementById(
        "noticeModal"
    );

const confirmNoticeBtn =
    document.getElementById(
        "confirmNoticeBtn"
    );

const cancelNoticeBtn =
    document.getElementById(
        "cancelNoticeBtn"
    );

/*
|--------------------------------------------------------------------------
| 使用者須知事件
|--------------------------------------------------------------------------
*/

confirmNoticeBtn?.addEventListener(
    "click",
    () => {

        isAgreeNotice = true;

        noticeModal.classList.add(
            "hidden"
        );
    }
);

cancelNoticeBtn?.addEventListener(
    "click",
    () => {

        if (window.liff) {

            liff.closeWindow();

            return;
        }

        window.history.back();
    }
);

async function init() {
    try {

        const profile =
            await initLiff();

        if (!profile) {
            return;
        }

        console.log(profile);

        const lineUserId =
            profile.userId;

        const response =
            await fetch(
                `${API_BASE_URL}/api/user/info/${lineUserId}`,
                {
                    method: "GET",

                    headers: {
                        "ngrok-skip-browser-warning":
                            "true"
                    }
                }
            );
        const resData =
            await response.json();

        const data =
            resData.data;

        const activityCode =
            data.activityCode
                ?.toString()
                .padStart(8, "0");

        document
            .getElementById(
                "coverImage"
            )
            .src =
            profile.pictureUrl;

        document
            .getElementById(
                "avatarImage"
            )
            .src =
            profile.pictureUrl;

        document
            .getElementById(
                "displayName"
            )
            .innerText =
            profile.displayName;
        document
            .getElementById(
                "registerCampaignBtn"
            )
            ?.addEventListener(
                "click",
                () => {

                    window.location.href =
                        "./register.html";
                }
            );

        document
            .querySelectorAll(
                ".activity-toggle"
            )
            .forEach(button => {

                button.addEventListener(
                    "click",
                    () => {

                        const content =
                            button.nextElementSibling;

                        const arrow =
                            button.querySelector(
                                ".arrow"
                            );

                        content.classList.toggle(
                            "hidden"
                        );

                        arrow.classList.toggle(
                            "rotate-180"
                        );
                    }
                );
            });

        document
            .getElementById(
                "activityCode"
            )
            .innerText =
            activityCode;

        renderRoleBadge(
            data.role
        );
        renderActivities(
            data.userActivities
        );
    }
    catch (error) {
        alert(error.message || "發生錯誤，請稍後再試。");
        console.error(error);
    }
}

init();

function renderActivities(
    userActivities
) {

    const container =
        document.getElementById(
            "activityListContainer"
        );

    if (!container) {
        return;
    }

    /*
    無資料
    */

    if (
        !userActivities ||
        userActivities.length === 0
    ) {

        container.innerHTML = `
            <div
                class="
                    mt-8
                    rounded-[32px]
                    bg-white
                    border
                    border-slate-100
                    p-10
                    text-center
                    shadow-sm
                "
            >

                <div
                    class="
                        w-20
                        h-20
                        mx-auto
                        rounded-full
                        bg-slate-50
                        flex
                        items-center
                        justify-center
                    "
                >

                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        class="w-10 h-10 text-slate-300"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                        <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="1.5"
                            d="M3 8.25h18M3 15.75h18"
                        />
                    </svg>

                </div>

                <h3
                    class="
                        mt-6
                        text-xl
                        font-black
                        text-slate-800
                    "
                >
                    尚無活動紀錄
                </h3>

                <p
                    class="
                        mt-3
                        text-sm
                        text-slate-500
                        leading-7
                    "
                >
                    參加活動後將顯示於此
                </p>

            </div>
        `;

        return;
    }

    /*
    有資料
    */

    container.innerHTML =
        userActivities
            .map(
                activity =>
                    renderActivityCard(
                        activity
                    )
            )
            .join("");

    bindAccordionEvents();
    bindActionEvents();
}
function renderActivityCard(
    activity
) {

    const statusMap = {

        active: {
            text: "活動中",
            bg: "bg-sky-50",
            color: "text-sky-700"
        },

        expired: {
            text: "已逾期",
            bg: "bg-red-50",
            color: "text-red-700"
        },

        completed_unclaimed: {
            text: "未兌獎",
            bg: "bg-amber-50",
            color: "text-amber-700"
        },

        completed_claimed: {
            text: "已兌獎",
            bg: "bg-emerald-50",
            color: "text-emerald-700"
        },

        pending: {
            text: "未驗證",
            bg: "bg-slate-100",
            color: "text-slate-600"
        }
    };

    const status =
        statusMap[
        activity.status
        ] ??
        statusMap.pending;
    let actionButton = `
    <button
        disabled
        class="
            mt-5
            w-full
            rounded-2xl
            bg-slate-200
            py-4
            text-slate-500
            font-bold
            cursor-not-allowed
        "
    >
        不可操作
    </button>
`;

    if (activity.status === "active") {

        actionButton = `
        <button
            class="
                activity-enter-btn
                mt-5
                w-full
                rounded-2xl
                bg-sky-600
                py-4
                text-white
                font-bold
            "
            data-id="${activity.userActivityId}"
        >
            前往活動
        </button>
    `;
    }

    if (
        activity.status ===
        "completed_unclaimed"
    ) {

        actionButton = `
        <button
         id="generate-qrcode-btn-${activity.userActivityId}"
            class="
                activity-qrcode-btn
                mt-5
                w-full
                rounded-2xl
                bg-amber-500
                py-4
                text-white
                font-bold
            "
            data-id="${activity.userActivityId}"
            data-order="${activity.orderNo}"
        >
            產生 QRCode
        </button>
    `;
    }

    if (
        activity.status ===
        "completed_claimed"
    ) {

        actionButton = `
        <button
            disabled
            class="
                mt-5
                w-full
                rounded-2xl
                bg-emerald-100
                py-4
                text-emerald-700
                font-bold
                cursor-not-allowed
            "
        >
            已兌獎
        </button>
    `;
    }

    if (
        activity.status ===
        "expired"
    ) {

        actionButton = `
        <button
            disabled
            class="
                mt-5
                w-full
                rounded-2xl
                bg-red-100
                py-4
                text-red-700
                font-bold
                cursor-not-allowed
            "
        >
            已逾期
        </button>
    `;
    }

    return `
        <div
            class="
                activity-card
                mt-5
                overflow-hidden
                rounded-[32px]
                bg-white
                border
                border-slate-100
                shadow-sm
            "
        >

            <button
                class="
                    activity-toggle
                    w-full
                    p-6
                    text-left
                "
            >

                <div
                    class="
                        flex
                        items-start
                        justify-between
                    "
                >

                    <div>

                        <div
                            class="
                                text-xs
                                tracking-[0.2em]
                                text-slate-400
                            "
                        >
                            TICKET
                        </div>

                        <h3
                            class="
                                mt-2
                                text-xl
                                font-black
                                text-slate-900
                            "
                        >
                            ${activity.orderNo}
                        </h3>

                        <p
                            class="
                                mt-2
                                text-sm
                                text-slate-500
                            "
                        >
                            ${activity.startedAt}
                        </p>

                    </div>

                    <div
                        class="
                            flex
                            flex-col
                            items-end
                            gap-3
                        "
                    >

                        <span
                            class="
                                px-4
                                py-2
                                rounded-full
                                ${status.bg}
                                ${status.color}
                                text-xs
                                font-bold
                            "
                        >
                            ${status.text}
                        </span>

                        <svg
                            class="
                                arrow
                                w-5
                                h-5
                                text-slate-300
                                transition
                            "
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                stroke-width="2"
                                d="M19 9l-7 7-7-7"
                            />
                        </svg>

                    </div>

                </div>

            </button>

            <div
                class="
                    activity-content
                    hidden
                    px-6
                    pb-6
                "
            >

                <div
                    class="
                        rounded-3xl
                        bg-slate-50
                        p-5
                    "
                >

                    <div
                        class="
                            flex
                            justify-between
                            py-2
                        "
                    >

                        <span class="text-slate-500">
                            打卡進度
                        </span>

                        <span class="font-bold">
                            ${activity.checkedInCount}
                            /
                            ${activity.totalSpotCount}
                        </span>

                    </div>

                    <div
                        class="
                            flex
                            justify-between
                            py-2
                        "
                    >

                        <span class="text-slate-500">
                            到期時間
                        </span>

                        <span>
                            ${activity.expiredAt}
                        </span>

                    </div>

                </div>

              ${actionButton}

<div
    id="qrcode-panel-${activity.userActivityId}"
    class="
        hidden
        mt-6
        rounded-[28px]
        border
        border-dashed
        border-slate-300
        p-5
        text-center
    "
>

    <div
        class="
            text-xs
            tracking-[0.2em]
            text-slate-400
        "
    >
        REWARD QR CODE
    </div>

    <div
    id="qrcode-${activity.userActivityId}"
    class="
        mt-4
        flex
        justify-center
    "
>
</div>

<div
    id="qrcode-timer-${activity.userActivityId}"
    class="
        mt-4
        text-sm
        font-bold
        text-amber-600
    "
>
    QRCode 尚未產生
</div>

<p
    class="
        mt-3
        text-sm
        text-slate-500
    "
>
     5 分鐘後自動失效
</p>

<button
    class="
        refresh-qrcode-btn
        mt-4
        w-full
        rounded-2xl
        bg-slate-900
        py-3
        text-white
        font-bold
    "
    data-id="${activity.userActivityId}"
>
    重新產生 QRCode
</button>

</div>

            </div>

        </div>

            </div>

        </div>
    `;
}
function bindAccordionEvents() {

    document
        .querySelectorAll(
            ".activity-toggle"
        )
        .forEach(button => {

            button.onclick =
                () => {

                    const content =
                        button.nextElementSibling;

                    const arrow =
                        button.querySelector(
                            ".arrow"
                        );

                    content?.classList.toggle(
                        "hidden"
                    );

                    arrow?.classList.toggle(
                        "rotate-180"
                    );
                };
        });
}
function bindActionEvents() {
    const qrcodeTimers = {};

    async function generateRewardQRCode(
        userActivityId
    ) {

        const qrcodeContainer =
            document.getElementById(
                `qrcode-${userActivityId}`
            );

        const timerContainer =
            document.getElementById(
                `qrcode-timer-${userActivityId}`
            );

        if (!qrcodeContainer || !timerContainer) {
            return;
        }

        qrcodeContainer.innerHTML = "";

        timerContainer.innerText =
            "QRCode 產生中...";

        try {

            const response =
                await fetch(
                    `${API_BASE_URL}/api/rewards/qrcode-token`,
                    {
                        method: "POST",
                        headers: {
                            "Content-Type":
                                "application/json",
                            "ngrok-skip-browser-warning":
                                "true"
                        },
                        body: JSON.stringify({
                            activityId:
                                userActivityId
                        })
                    }
                );

            const result =
                await response.json();

            if (!response.ok) {

                timerContainer.innerText =
                    result.message;

                return;
            }

            const token =
                result.data.token;

            const expiresAt =
                Date.now() +
                (
                    result.data.expiresIn *
                    1000
                );

            new QRCode(
                qrcodeContainer,
                {
                    text: token,
                    width: 180,
                    height: 180
                }
            );

            updateQRCodeTimer(
                userActivityId,
                expiresAt
            );

            qrcodeTimers[userActivityId] =
                setInterval(
                    () => {

                        updateQRCodeTimer(
                            userActivityId,
                            expiresAt
                        );

                    },
                    1000
                );

        }
        catch (error) {

            console.error(error);

            timerContainer.innerText =
                "QRCode 產生失敗";
        }
    }
    function updateQRCodeTimer(
        userActivityId,
        expiresAt
    ) {
        const qrcodeContainer =
            document.getElementById(
                `qrcode-${userActivityId}`
            );

        const timerContainer =
            document.getElementById(
                `qrcode-timer-${userActivityId}`
            );

        if (!qrcodeContainer || !timerContainer) {
            return;
        }

        const remaining =
            expiresAt -
            Date.now();

        if (remaining <= 0) {

            clearInterval(
                qrcodeTimers[
                userActivityId
                ]
            );

            timerContainer.innerText =
                "QRCode 已失效，請重新產生";

            qrcodeContainer.innerHTML =
                "";

            return;
        }

        const minutes =
            Math.floor(
                remaining / 1000 / 60
            );

        const seconds =
            Math.floor(
                (
                    remaining / 1000
                ) % 60
            );

        timerContainer.innerText =
            `剩餘時間 ${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
    }
    document
        .querySelectorAll(
            ".activity-enter-btn"
        )
        .forEach(btn => {

            btn.onclick = () => {

                const userActivityId =
                    btn.dataset.id;

                window.location.href =
                    `./progress.html?userActivityId=${userActivityId}`;
            };
        });

    document
        .querySelectorAll(
            ".activity-qrcode-btn"
        )
        .forEach(btn => {

            btn.onclick =
                async () => {

                    const userActivityId =
                        btn.dataset.id;

                    const panel =
                        document.getElementById(
                            `qrcode-panel-${userActivityId}`
                        );

                    const generateBtn =
                        document.getElementById(
                            `generate-qrcode-btn-${userActivityId}`
                        );

                    if (!panel) {
                        return;
                    }

                    panel.classList.remove(
                        "hidden"
                    );

                    if (generateBtn) {

                        generateBtn.classList.add(
                            "hidden"
                        );
                    }

                    await generateRewardQRCode(
                        userActivityId
                    );
                };
        });
    document
        .querySelectorAll(
            ".refresh-qrcode-btn"
        )
        .forEach(btn => {

            btn.onclick =
                async () => {

                    const userActivityId =
                        btn.dataset.id;

                    await generateRewardQRCode(
                        userActivityId
                    );
                };
        });
}

function renderRoleBadge(role) {

    const container =
        document.getElementById(
            "roleBadgeContainer"
        );

    if (!container) {
        return;
    }

    const roleConfig = {
        "一般會員": {
            bg: "bg-emerald-100",
            text: "text-emerald-700"
        },

        "管理者": {
            bg: "bg-red-100",
            text: "text-red-700"
        },

        "核銷人員": {
            bg: "bg-fuchsia-100",
            text: "text-fuchsia-700"
        }
    };

    const config =
        roleConfig[role] ??
        roleConfig["一般會員"];

    container.innerHTML = `
        <span
            class="
                px-4
                py-2
                rounded-full
                ${config.bg}
                ${config.text}
                text-xs
                font-bold
            "
        >
            ${role}
        </span>
    `;
}