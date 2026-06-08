'use strict';

const API_BASE_URL = 'https://9f4d-59-124-220-148.ngrok-free.app';
const LIFF_BASE_URL = 'https://liff.line.me/YOUR_LIFF_ID';

const STATUS_TEXT_MAP = {
    enabled: '啟用',
    disabled: '停用',
    paid: '已付款',
    failed: '付款失敗',
    pending: '未完成',
    expired: '已逾期',
    completed_unclaimed: '未領獎',
    completed_claimed: '已領獎',
    reward_pending: '獎品待補',
    approved: '已核准',
    member: '一般會員',
    staff: '工作人員',
    admin: '管理員'
};

const DEFAULT_DATA = {
    spots: [
        { id: 'SPOT-ID-001', name: '鶯歌陶瓷博物館', code: 'SPOT-001', status: 'enabled', url: `${LIFF_BASE_URL}?spot=SPOT-001` },
        { id: 'SPOT-ID-002', name: '新北市美術館', code: 'SPOT-002', status: 'enabled', url: `${LIFF_BASE_URL}?spot=SPOT-002` },
        { id: 'SPOT-ID-003', name: '新北市客家文化館', code: 'SPOT-003', status: 'disabled', url: `${LIFF_BASE_URL}?spot=SPOT-003` }
    ],
    members: [
        { id: 'MEM-0001', name: '王小明', phone: '0912-345-678', activityCode: 'ACT-2026-0001', role: 'member', checkins: 3, rewardStatus: 'completed_unclaimed' },
        { id: 'MEM-0002', name: '林小美', phone: '0922-111-222', activityCode: 'ACT-2026-0002', role: 'staff', checkins: 2, rewardStatus: 'pending' },
        { id: 'MEM-0003', name: '陳大華', phone: '0933-222-333', activityCode: 'ACT-2026-0003', role: 'member', checkins: 1, rewardStatus: 'pending' }
    ],
    orders: [
        { orderNo: 'ORD-20260606-001', buyer: '王小明', phone: '0912-345-678', activityCode: 'ACT-2026-0001', paidStatus: 'paid', redeemStatus: 'completed_unclaimed', createdAt: '2026-06-06' },
        { orderNo: 'ORD-20260606-002', buyer: '林小美', phone: '0922-111-222', activityCode: 'ACT-2026-0002', paidStatus: 'paid', redeemStatus: 'pending', createdAt: '2026-06-06' },
        { orderNo: 'ORD-20260605-008', buyer: '陳大華', phone: '0933-222-333', activityCode: 'ACT-2026-0003', paidStatus: 'failed', redeemStatus: 'expired', createdAt: '2026-06-05' }
    ],
    verifyLogs: []
};

function getState() {
    const raw = localStorage.getItem('sanying-admin-state');

    if (!raw) {
        saveState(DEFAULT_DATA);
        return structuredClone(DEFAULT_DATA);
    }

    try {
        return JSON.parse(raw);
    } catch {
        saveState(DEFAULT_DATA);
        return structuredClone(DEFAULT_DATA);
    }
}

function getToken() {
    return localStorage.getItem(
        "accessToken"
    );
}

function requireLogin() {
    const token =
        localStorage.getItem(
            "accessToken"
        );

    if (!token) {
        window.location.href =
            "/pages/admin/login.html";

        return false;
    }

    return true;
}

function saveState(nextState) {
    localStorage.setItem('sanying-admin-state', JSON.stringify(nextState));
}

function $(selector) {
    return document.querySelector(selector);
}

function $$(selector) {
    return [...document.querySelectorAll(selector)];
}

function escapeHtml(value) {
    return String(value)
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#039;');
}

function escapeAttr(value) {
    return escapeHtml(value);
}

function getQrCodeUrl(value, size = 180) {
    return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(value)}`;
}

function statusBadge(value) {
    const successValues = ['enabled', 'paid', 'completed_claimed', 'completed_unclaimed', 'approved'];
    const dangerValues = ['disabled', 'failed', 'expired'];
    const color = successValues.includes(value)
        ? 'bg-emerald-50 text-emerald-600'
        : dangerValues.includes(value)
            ? 'bg-red-50 text-red-600'
            : 'bg-amber-50 text-amber-600';

    return `<span class="rounded-full ${color} px-3 py-1 text-xs font-black">${STATUS_TEXT_MAP[value] ?? value}</span>`;
}

function showModal(type, title, message) {
    const modal = $('#appModal');
    if (!modal) return;

    const isSuccess = type === 'success';
    $('#modalIcon').className = `mx-auto flex h-16 w-16 items-center justify-center rounded-full text-2xl font-black ${isSuccess ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'}`;
    $('#modalIcon').textContent = isSuccess ? '✓' : '!';
    $('#modalTitle').textContent = title;
    $('#modalMessage').textContent = message;
    modal.classList.remove('hidden');
    modal.classList.add('flex');
}

function closeModal() {
    const modal = $('#appModal');
    if (!modal) return;
    modal.classList.add('hidden');
    modal.classList.remove('flex');
}

function showToast(message) {
    const toast = $('#appToast');
    if (!toast) return;

    toast.textContent = message;
    toast.classList.remove('translate-y-6', 'opacity-0');
    toast.classList.add('translate-y-0', 'opacity-100');

    window.setTimeout(() => {
        toast.classList.add('translate-y-6', 'opacity-0');
        toast.classList.remove('translate-y-0', 'opacity-100');
    }, 2200);
}

async function postJson(path, payload) {
    const response = await fetch(`${API_BASE_URL}${path}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });

    if (!response.ok) {
        throw new Error(`API failed: ${response.status}`);
    }

    return response.json();
}

function bindLayout() {
    const sidebar = $('#sidebar');
    const backdrop = $('#sidebarBackdrop');
    const openBtn = $('#openSidebarBtn');
    const closeSidebar = () => {
        sidebar?.classList.add('-translate-x-full');
        backdrop?.classList.add('hidden');
    };

    openBtn?.addEventListener('click', () => {
        sidebar?.classList.remove('-translate-x-full');
        backdrop?.classList.remove('hidden');
    });

    backdrop?.addEventListener('click', closeSidebar);
    $('#modalCloseBtn')?.addEventListener('click', closeModal);
    $('#printBtn')?.addEventListener('click', () => window.print());

    const current = document.body.dataset.page;
    $$('.nav-link').forEach((link) => {
        if (link.dataset.page === current) link.classList.add('active');
    });
}

document.addEventListener('DOMContentLoaded', bindLayout);
