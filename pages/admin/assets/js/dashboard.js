'use strict';

document.addEventListener('DOMContentLoaded', () => {
    const state = getState();
    const today = new Date().toISOString().slice(0, 10);
    const todayOrders = state.orders.filter((order) => order.createdAt === today);
    const redeemed = state.verifyLogs.filter((log) => String(log.scannedAt).startsWith(today));
    const ticketCount = todayOrders.length || state.orders.filter((order) => order.paidStatus === 'paid').length;
    const redeemCount = redeemed.length || state.orders.filter((order) => order.redeemStatus === 'completed_claimed' || order.redeemStatus === 'completed_unclaimed').length;
    const rate = ticketCount > 0 ? Math.round((redeemCount / ticketCount) * 100) : 0;

    $('#ticketCount').textContent = String(ticketCount);
    $('#redeemCount').textContent = String(redeemCount);
    $('#redeemRate').textContent = `${rate}%`;

    renderVerifyLogs(state.verifyLogs);
});

function renderVerifyLogs(logs) {
    const target = $('#verifyLogList');
    if (!logs.length) {
        target.innerHTML = '<div class="rounded-soft bg-slate-50 p-5 text-sm text-slate-500">尚無核銷紀錄。可先到「打卡核銷」頁面掃描或手動送出測試資料。</div>';
        return;
    }

    target.innerHTML = logs.slice().reverse().map((log) => `
        <article class="rounded-soft border border-slate-200 bg-white/70 p-4">
            <div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <p class="font-black text-slate-800">${escapeHtml(log.activityCode || '-')} / ${escapeHtml(log.spotCode || '-')}</p>
                    <p class="mt-1 text-xs text-slate-500">${escapeHtml(log.scannedAt)}</p>
                </div>
                ${statusBadge(log.status || 'completed_claimed')}
            </div>
        </article>
    `).join('');
}
