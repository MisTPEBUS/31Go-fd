'use strict';

let orderState = getState();

document.addEventListener('DOMContentLoaded', () => {
    $('#filterOrderBtn').addEventListener('click', filterOrders);
    renderOrders(orderState.orders);
});

function filterOrders() {
    const keyword = $('#orderKeyword').value.trim().toLowerCase();
    const date = $('#orderDate').value;
    const orders = orderState.orders.filter((order) => {
        const matchKeyword = !keyword || [order.orderNo, order.buyer, order.phone, order.activityCode].some((value) => value.toLowerCase().includes(keyword));
        const matchDate = !date || order.createdAt === date;
        return matchKeyword && matchDate;
    });
    renderOrders(orders);
}

function renderOrders(orders) {
    $('#orderTable').innerHTML = orders.map((order) => `
        <tr class="border-b border-slate-100">
            <td class="py-4 pr-4 font-bold text-slate-700">${escapeHtml(order.orderNo)}</td>
            <td class="py-4 pr-4">${escapeHtml(order.buyer)}<br><span class="text-xs text-slate-400">${escapeHtml(order.phone)}</span></td>
            <td class="py-4 pr-4">${escapeHtml(order.activityCode)}</td>
            <td class="py-4 pr-4">${statusBadge(order.paidStatus)}</td>
            <td class="py-4 pr-4">${statusBadge(order.redeemStatus)}</td>
            <td class="py-4 pr-4 text-slate-500">${escapeHtml(order.createdAt)}</td>
        </tr>
    `).join('') || '<tr><td colspan="6" class="py-8 text-center text-slate-500">查無訂單。</td></tr>';
}
