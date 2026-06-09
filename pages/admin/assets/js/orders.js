"use strict";

/*
|--------------------------------------------------------------------------
| DOM Ready
|--------------------------------------------------------------------------
*/

document.addEventListener("DOMContentLoaded", () => {
  initDefaultDate();

  const filterOrderBtn = document.getElementById("filterOrderBtn");

  filterOrderBtn.addEventListener("click", fetchActivityReport);

  fetchActivityReport();
});

/*
|--------------------------------------------------------------------------
| 初始化日期
|--------------------------------------------------------------------------
*/

function initDefaultDate() {
  const today = getTodayDateString();

  const dateFromInput = document.getElementById("dateFrom");

  const dateToInput = document.getElementById("dateTo");

  if (dateFromInput && !dateFromInput.value) {
    dateFromInput.value = today;
  }

  if (dateToInput && !dateToInput.value) {
    dateToInput.value = today;
  }
}

function getTodayDateString() {
  const now = new Date();

  const year = now.getFullYear();

  const month = String(now.getMonth() + 1).padStart(2, "0");

  const day = String(now.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

/*
|--------------------------------------------------------------------------
| 查詢活動報表
|--------------------------------------------------------------------------
*/

async function fetchActivityReport() {
  const keyword = document.getElementById("orderKeyword").value.trim();

  const dateFrom = document.getElementById("dateFrom").value;

  const dateTo = document.getElementById("dateTo").value;

  if (!dateFrom || !dateTo) {
    showToastSafe("請選擇查詢日期區間");

    return;
  }

  setLoading(true);

  try {
    const params = new URLSearchParams();

    params.append("dateFrom", dateFrom);

    params.append("dateTo", dateTo);

    if (keyword) {
      params.append("keyword", keyword);
    }

    const url = `${API_BASE_URL}/api/admin/reports/activity?${params.toString()}`;

    const response = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "application/json",
        "ngrok-skip-browser-warning": "true",
      },
    });

    const result = await response.json();

    if (!response.ok || !result.success) {
      throw new Error(result.message || "查詢失敗");
    }

    renderSummary(result.data.summary);

    renderOrders(result.data.items);
  } catch (error) {
    console.error(error);

    showToastSafe(error.message || "系統錯誤，請稍後再試");

    renderSummary(null);

    renderOrders([]);
  } finally {
    setLoading(false);
  }
}

/*
|--------------------------------------------------------------------------
| Render Summary
|--------------------------------------------------------------------------
*/

function renderSummary(summary) {
  document.getElementById("totalParticipants").innerText =
    summary?.totalParticipants ?? 0;

  document.getElementById("totalTickets").innerText =
    summary?.totalTickets ?? 0;

  document.getElementById("totalRedeemed").innerText =
    summary?.totalRedeemed ?? 0;

  document.getElementById("totalUnredeemed").innerText =
    summary?.totalUnredeemed ?? 0;
}

/*
|--------------------------------------------------------------------------
| Render Table
|--------------------------------------------------------------------------
*/

function renderOrders(items) {
  const orderTable = document.getElementById("orderTable");

  if (!items || items.length === 0) {
    orderTable.innerHTML = `
            <tr>
                <td
                    colspan="8"
                    class="py-8 text-center text-slate-500"
                >
                    查無訂單。
                </td>
            </tr>
        `;

    return;
  }

  orderTable.innerHTML = items
    .map(
      (item) => `
                    <tr class="border-b border-slate-100">
                        <td class="py-4 pr-4 font-bold text-slate-700">
                            ${escapeHtmlSafe(item.orderNo)}
                        </td>

                        <td class="py-4 pr-4">
                            ${escapeHtmlSafe(item.participantName)}
                            <br />
                            <span class="text-xs text-slate-400">
                                ${escapeHtmlSafe(item.participantPhone || "-")}
                            </span>
                            <br />
                            <span class="text-xs text-slate-400">
                                ${escapeHtmlSafe(item.participantEmail || "-")}
                            </span>
                        </td>

                        <td class="py-4 pr-4">
                            ${renderTicketStatus(item)}
                        </td>

                        <td class="py-4 pr-4">
                            ${renderActivityStatus(item.activityStatus)}
                        </td>

                        <td class="py-4 pr-4">
                            ${renderRewardStatus(item)}
                        </td>

                        <td class="py-4 pr-4 text-slate-500">
                            ${escapeHtmlSafe(formatDateText(item.startedAt))}
                        </td>

                        <td class="py-4 pr-4 text-slate-500">
                            ${escapeHtmlSafe(formatDateText(item.expiredAt))}
                        </td>

                        <td class="py-4 pr-4 text-slate-500">
                            ${escapeHtmlSafe(formatDateText(item.redeemedAt))}
                        </td>
                    </tr>
                `,
    )
    .join("");
}

/*
|--------------------------------------------------------------------------
| 狀態顯示
|--------------------------------------------------------------------------
*/

function renderTicketStatus(item) {
  if (item.orderNo && item.orderNo.trim() !== "") {
    return badge("已購票", "bg-sky-100 text-sky-700");
  }

  return badge("未購票", "bg-slate-100 text-slate-500");
}

function renderActivityStatus(status) {
  const value = status || "";

  const map = {
    pending: {
      label: "未完成",
      className: "bg-slate-100 text-slate-600",
    },
    active: {
      label: "活動中",
      className: "bg-blue-100 text-blue-700",
    },
    approved: {
      label: "已核准",
      className: "bg-cyan-100 text-cyan-700",
    },
    expired: {
      label: "已逾期",
      className: "bg-rose-100 text-rose-700",
    },
    completed_unclaimed: {
      label: "完成未領獎",
      className: "bg-amber-100 text-amber-700",
    },
    completed_claimed: {
      label: "完成已領獎",
      className: "bg-emerald-100 text-emerald-700",
    },
    reward_pending: {
      label: "獎品待補",
      className: "bg-orange-100 text-orange-700",
    },
  };

  const target = map[value] || {
    label: value || "-",
    className: "bg-slate-100 text-slate-500",
  };

  return badge(target.label, target.className);
}

function renderRewardStatus(item) {
  const rewardStatus = item.rewardStatus;

  if (
    rewardStatus === "redeemed" ||
    item.activityStatus === "completed_claimed"
  ) {
    return badge("已兌換", "bg-emerald-100 text-emerald-700");
  }

  if (rewardStatus === "pending") {
    return badge("待兌換", "bg-amber-100 text-amber-700");
  }

  if (rewardStatus === "rejected") {
    return badge("兌換失敗", "bg-rose-100 text-rose-700");
  }

  if (rewardStatus === "cancelled") {
    return badge("已取消", "bg-slate-100 text-slate-500");
  }

  return badge("未兌換", "bg-slate-100 text-slate-500");
}

function badge(text, className) {
  return `
        <span class="inline-flex rounded-full px-3 py-1 text-xs font-black ${className}">
            ${escapeHtmlSafe(text)}
        </span>
    `;
}

/*
|--------------------------------------------------------------------------
| Loading
|--------------------------------------------------------------------------
*/

function setLoading(isLoading) {
  const button = document.getElementById("filterOrderBtn");

  if (!button) {
    return;
  }

  button.disabled = isLoading;

  button.innerText = isLoading ? "查詢中" : "查詢";

  button.classList.toggle("opacity-60", isLoading);

  button.classList.toggle("cursor-not-allowed", isLoading);
}

/*
|--------------------------------------------------------------------------
| Utils
|--------------------------------------------------------------------------
*/

function formatDateText(value) {
  if (value === null || value === undefined || String(value).trim() === "") {
    return "-";
  }

  return String(value).trim();
}

function escapeHtmlSafe(value) {
  if (typeof escapeHtml === "function") {
    return escapeHtml(String(value ?? ""));
  }

  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function showToastSafe(message) {
  if (typeof showToast === "function") {
    showToast(message);
    return;
  }

  alert(message);
}
