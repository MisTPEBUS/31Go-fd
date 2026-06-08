'use strict';

document.addEventListener('DOMContentLoaded', () => {
    const today = new Date().toISOString().slice(0, 10);
    $('#reportStart').value = today;
    $('#reportEnd').value = today;
    $('#downloadReportBtn').addEventListener('click', downloadReport);
});

function downloadReport() {
    const state = getState();
    const type = $('#reportType').value;
    const start = $('#reportStart').value;
    const end = $('#reportEnd').value;
    const rows = type === 'orders' ? buildOrderRows(state.orders, start, end) : buildRedeemRows(state.verifyLogs, start, end);
    const csv = rows.map((row) => row.map(csvEscape).join(',')).join('\n');
    const blob = new Blob([`\ufeff${csv}`], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');

    link.href = URL.createObjectURL(blob);
    link.download = `${type}-${start}-to-${end}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
    showToast('CSV 報表已產生');
}

function buildOrderRows(orders, start, end) {
    const filtered = orders.filter((order) => order.createdAt >= start && order.createdAt <= end);
    return [
        ['訂單編號', '購票人', '電話', '活動碼', '付款狀態', '兌換狀態', '建立時間'],
        ...filtered.map((order) => [order.orderNo, order.buyer, order.phone, order.activityCode, STATUS_TEXT_MAP[order.paidStatus], STATUS_TEXT_MAP[order.redeemStatus], order.createdAt])
    ];
}

function buildRedeemRows(logs, start, end) {
    const filtered = logs.filter((log) => String(log.scannedAt).slice(0, 10) >= start && String(log.scannedAt).slice(0, 10) <= end);
    return [
        ['活動碼', '地點代碼', '核銷人員', '核銷狀態', '核銷時間', '原始內容'],
        ...filtered.map((log) => [log.activityCode, log.spotCode, log.verifierId, STATUS_TEXT_MAP[log.status] ?? log.status, log.scannedAt, log.rawText])
    ];
}

function csvEscape(value) {
    const text = String(value ?? '');
    return `"${text.replaceAll('"', '""')}"`;
}
