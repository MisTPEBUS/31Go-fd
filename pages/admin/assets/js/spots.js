'use strict';

let spots = [];

const LIFF_URL_TEMPLATE =
    'https://liff.line.me/2010150440-sbW0urAy?page=spot-check&spot=';

function getSpotLiffUrl(spotId) {
    return `${LIFF_URL_TEMPLATE}${encodeURIComponent(spotId)}`;
}

document.addEventListener('DOMContentLoaded', () => {
    $('#spotForm').addEventListener('submit', handleSpotSubmit);
    $('#spotSearch').addEventListener('input', renderSpots);
    $('#resetSpotFormBtn').addEventListener('click', resetSpotForm);

    loadSpots();
});

async function loadSpots() {
    try {
        $('#spotList').innerHTML = loadingHtml();

        const response = await SpotsApi.getAll();
        spots = response.data ?? [];

        renderSpots();
    } catch (error) {
        console.error(error);
        $('#spotList').innerHTML = emptyHtml('讀取打卡地點失敗');
    }
}

async function handleSpotSubmit(event) {
    event.preventDefault();

    const form = event.currentTarget;
    const payload = getSpotPayload(form);
    const id = String(new FormData(form).get('id') ?? '').trim();

    try {
        $('#submitSpotBtn').disabled = true;
        $('#submitSpotBtn').textContent = id ? '更新中...' : '新增中...';

        if (id) {
            await SpotsApi.update(id, payload);
            showModal('success', '更新完成', `${payload.name} 已更新。`);
        } else {
            await SpotsApi.create(payload);
            showModal('success', '新增完成', `${payload.name} 已加入打卡地點。`);
        }

        resetSpotForm();
        await loadSpots();
    } catch (error) {
        console.error(error);
        showModal('error', id ? '更新失敗' : '新增失敗', error.message || 'API 發生錯誤。');
    } finally {
        $('#submitSpotBtn').disabled = false;
        $('#submitSpotBtn').textContent = id ? '更新地點' : '新增地點';
    }
}

function getSpotPayload(form) {
    const formData = new FormData(form);
    const id = clean(formData.get('id'));
    const currentSpot = spots.find((spot) => String(spot.id) === id);
    const name = clean(formData.get('name'));

    return {
        name,
        description: clean(formData.get('description')),
        address: clean(formData.get('address')),
        qrcodeToken: currentSpot?.qrcodeToken || clean(formData.get('qrcodeToken')) || createQrCodeToken(),
        imageUrl: currentSpot?.imageUrl || clean(formData.get('imageUrl')),
        sortOrder: Number(formData.get('sortOrder') || 0),
        isEnabled: formData.get('isEnabled') === 'on'
    };
}

function renderSpots() {
    const keyword = $('#spotSearch')?.value.trim().toLowerCase() ?? '';

    const filteredSpots = spots.filter((spot) => {
        return (
            String(spot.name ?? '').toLowerCase().includes(keyword) ||
            String(spot.address ?? '').toLowerCase().includes(keyword) ||
            String(spot.qrcodeToken ?? '').toLowerCase().includes(keyword)
        );
    });

    if (!filteredSpots.length) {
        $('#spotList').innerHTML = emptyHtml('查無打卡地點');
        return;
    }

    $('#spotList').innerHTML = filteredSpots.map((spot) => `
        <article class="rounded-card border border-white bg-white/80 p-5 shadow-sm">
            <div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div class="min-w-0">
                    ${enabledBadge(spot.isEnabled)}
                    <h4 class="mt-3 text-lg font-black text-slate-800">${escapeHtml(spot.name)}</h4>
                    <p class="mt-1 text-sm font-bold text-slate-500">${escapeHtml(spot.address ?? '')}</p>
                    <p class="mt-2 line-clamp-2 text-sm leading-6 text-slate-500">${escapeHtml(spot.description ?? '')}</p>
                </div>

                <div class="rounded-soft bg-slate-50 px-4 py-3 text-xs text-slate-500 sm:min-w-[140px]">
                    <p>
                        <span class="font-black text-slate-600">排序：</span>
                        ${escapeHtml(spot.sortOrder ?? 0)}
                    </p>
                </div>
            </div>

            <div class="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
                <button class="edit-spot-btn h-12 rounded-soft border border-slate-200 bg-white text-sm font-black text-primary-700" data-id="${escapeAttr(spot.id)}">
                    修改
                </button>

                <button class="toggle-spot-btn h-12 rounded-soft text-sm font-black ${spot.isEnabled ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600'}" data-id="${escapeAttr(spot.id)}">
                    ${spot.isEnabled ? '停用' : '啟用'}
                </button>

                <button class="copy-liff-btn h-12 rounded-soft border border-slate-200 bg-white text-sm font-black text-primary-700" data-id="${escapeAttr(spot.id)}">
                    複製 LIFF URL
                </button>

                <button class="generate-qr-btn primary-gradient h-12 rounded-soft text-sm font-black text-white" data-id="${escapeAttr(spot.id)}">
                    產生 QRCode
                </button>
            </div>
        </article>
    `).join('');

    bindSpotActions();
}

function bindSpotActions() {
    $$('.edit-spot-btn').forEach((button) => {
        button.addEventListener('click', () => {
            const spot = spots.find((item) => item.id === button.dataset.id);
            if (!spot) return;

            fillSpotForm(spot);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    });

    $$('.toggle-spot-btn').forEach((button) => {
        button.addEventListener('click', async () => {
            const spot = spots.find((item) => item.id === button.dataset.id);
            if (!spot) return;

            await updateSpotEnabled(spot, !spot.isEnabled);
        });
    });
    $$('.copy-liff-btn').forEach((button) => {
        button.addEventListener('click', async () => {
            const liffUrl = getSpotLiffUrl(button.dataset.id ?? '');

            await navigator.clipboard.writeText(liffUrl);

            showToast('LIFF URL 已複製');
        });
    });

    $$('.generate-qr-btn').forEach((button) => {
        button.addEventListener('click', () => {
            const liffUrl = getSpotLiffUrl(button.dataset.id ?? '');

            openQrCodeWindow(liffUrl);
        });
    });
}

async function updateSpotEnabled(spot, isEnabled) {
    try {
        await SpotsApi.update(spot.id, {
            name: spot.name,
            description: spot.description,
            address: spot.address,
            qrcodeToken: spot.qrcodeToken,
            imageUrl: spot.imageUrl,
            sortOrder: spot.sortOrder,
            isEnabled
        });

        showToast(isEnabled ? '地點已啟用' : '地點已停用');
        await loadSpots();
    } catch (error) {
        console.error(error);
        showModal('error', '狀態更新失敗', error.message || 'API 發生錯誤。');
    }
}

function fillSpotForm(spot) {
    const form = $('#spotForm');

    form.elements.id.value = spot.id ?? '';
    form.elements.name.value = spot.name ?? '';
    form.elements.description.value = spot.description ?? '';
    form.elements.address.value = spot.address ?? '';
    form.elements.qrcodeToken.value = spot.qrcodeToken ?? '';
    form.elements.imageUrl.value = spot.imageUrl ?? '';
    form.elements.sortOrder.value = spot.sortOrder ?? 0;
    form.elements.isEnabled.checked = Boolean(spot.isEnabled);

    $('#spotFormTitle').textContent = '修改打卡地點';
    $('#submitSpotBtn').textContent = '更新地點';
}

function resetSpotForm() {
    $('#spotForm').reset();
    $('#spotForm').elements.id.value = '';
    $('#spotForm').elements.isEnabled.checked = true;
    $('#spotFormTitle').textContent = '新增打卡地點';
    $('#submitSpotBtn').textContent = '新增地點';
}

function enabledBadge(isEnabled) {
    return isEnabled
        ? '<span class="rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-600">啟用</span>'
        : '<span class="rounded-full bg-red-50 px-3 py-1 text-xs font-black text-red-600">停用</span>';
}

function createQrCodeToken() {
    if (crypto?.randomUUID) {
        return crypto.randomUUID();
    }

    return `spot-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function loadingHtml() {
    return '<div class="rounded-soft bg-slate-50 p-5 text-sm text-slate-500">讀取中...</div>';
}

function emptyHtml(message) {
    return `<div class="rounded-soft bg-slate-50 p-5 text-sm text-slate-500">${escapeHtml(message)}</div>`;
}

function clean(value) {
    return String(value ?? '').trim();
}

function openQrCodeWindow(liffUrl) {
    const holder = document.createElement('div');
    holder.className = 'fixed -left-[9999px] -top-[9999px]';
    document.body.appendChild(holder);

    new QRCode(holder, {
        text: liffUrl,
        width: 600,
        height: 600,
        correctLevel: QRCode.CorrectLevel.H
    });

    setTimeout(() => {
        const canvas = holder.querySelector('canvas');
        const image = holder.querySelector('img');
        const qrDataUrl = canvas ? canvas.toDataURL('image/png') : image?.src;

        holder.remove();

        if (!qrDataUrl) {
            showModal('error', '產生失敗', 'QRCode 圖片產生失敗。');
            return;
        }

        const popup = window.open('', '_blank', 'width=800,height=900');

        if (!popup) {
            showModal('error', '視窗被阻擋', '請允許瀏覽器開啟彈出視窗後再產生 QRCode。');
            return;
        }

        popup.document.write(`
            <!DOCTYPE html>
            <html lang="zh-Hant">
            <head>
                <meta charset="UTF-8">
                <title>QRCode</title>
                <style>
                    body{
                        font-family:sans-serif;
                        padding:30px;
                        text-align:center;
                        color:#334155;
                    }

                    img{
                        max-width:100%;
                        border:1px solid #e2e8f0;
                        border-radius:24px;
                    }

                    a{
                        display:inline-block;
                        margin-top:20px;
                        padding:14px 28px;
                        border-radius:18px;
                        background:#2C6E9B;
                        color:#fff;
                        font-weight:800;
                        text-decoration:none;
                    }

                    textarea{
                        box-sizing:border-box;
                        width:100%;
                        margin-top:20px;
                        padding:12px;
                        height:90px;
                        border:1px solid #e2e8f0;
                        border-radius:16px;
                    }
                </style>
            </head>
            <body>
                <h2>打卡地點 QRCode</h2>
                <img src="${qrDataUrl}" alt="打卡地點 QRCode" />
                <textarea readonly>${escapeHtml(liffUrl)}</textarea>
                <br>
                <a href="${qrDataUrl}" download="spot-qrcode.png">下載 QRCode</a>
            </body>
            </html>
        `);

        popup.document.close();
    }, 0);
}
