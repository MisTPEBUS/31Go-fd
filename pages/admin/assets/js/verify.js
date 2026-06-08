'use strict';

let html5QrCode = null;
let isSubmitting = false;
let lastScannedText = '';
let lastScannedAt = 0;
let currentVerifyToken = '';

document.addEventListener('DOMContentLoaded', () => {
    $('#startScannerBtn')?.addEventListener('click', startScanner);
    $('#stopScannerBtn')?.addEventListener('click', stopScanner);
    $('#otpForm')?.addEventListener('submit', handleOtpSubmit);
    $('#cancelOtpBtn')?.addEventListener('click', closeOtpModal);
});

async function startScanner() {
    if (!window.Html5Qrcode) {
        showModal('error', '套件載入失敗', 'html5-qrcode CDN 未載入。');
        return;
    }

    if (html5QrCode) {
        await stopScanner();
    }

    html5QrCode = new Html5Qrcode('reader');

    try {
        await html5QrCode.start(
            { facingMode: 'environment' },
            {
                fps: 10,
                qrbox: {
                    width: 260,
                    height: 260
                }
            },
            handleScanSuccess,
            () => undefined
        );

        showToast('掃描器已開啟');
    } catch (error) {
        showModal(
            'error',
            '無法開啟相機',
            error instanceof Error ? error.message : '請確認瀏覽器相機權限。'
        );
    }
}

async function stopScanner() {
    if (!html5QrCode) return;

    try {
        await html5QrCode.stop();
        await html5QrCode.clear();
    } catch {
        // 部分瀏覽器重複 stop 會丟錯，忽略即可。
    } finally {
        html5QrCode = null;
    }
}

async function handleScanSuccess(decodedText) {
    const now = Date.now();

    if (decodedText === lastScannedText && now - lastScannedAt < 3000) {
        return;
    }

    lastScannedText = decodedText;
    lastScannedAt = now;

    await requestVerify(decodedText);
}

async function requestVerify(rawQrText) {
    if (isSubmitting) return;

    isSubmitting = true;

    const payload = {
        qrCodeText: rawQrText,
        verifierUserId: localStorage.getItem('user_id') || '',
        scannedAt: new Date().toISOString()
    };

    try {
        const result = await apiFetch('/api/admin/redeem/request', {
            method: 'POST',
            body: payload
        });

        currentVerifyToken = result?.data?.verifyToken || result?.verifyToken || '';

        if (!currentVerifyToken) {
            throw new Error('後端未回傳 verifyToken');
        }

        await stopScanner();
        openOtpModal();
    } catch (error) {
        showModal(
            'error',
            '建立核銷驗證失敗',
            error?.message || '請確認 QR Code 或後端 API 狀態。'
        );
    } finally {
        isSubmitting = false;
    }
}

async function handleOtpSubmit(event) {
    event.preventDefault();

    if (isSubmitting) return;

    const code = $('#verifyCodeInput')?.value.trim() || '';

    if (!/^\d{4}$/.test(code)) {
        showModal('error', '驗證碼格式錯誤', '請輸入 4 位數字驗證碼。');
        return;
    }

    isSubmitting = true;

    try {
        await apiFetch('/api/admin/redeem/confirm', {
            method: 'POST',
            body: {
                verifyToken: currentVerifyToken,
                verifyCode: code
            }
        });

        closeOtpModal();
        showModal('success', '核銷完成', '驗證碼正確，獎品已完成核銷。');
    } catch (error) {
        showModal(
            'error',
            '驗證失敗',
            error?.message || '驗證碼錯誤或已逾期。'
        );
    } finally {
        isSubmitting = false;
    }
}

function openOtpModal() {
    const modal = $('#otpModal');
    const input = $('#verifyCodeInput');

    if (!modal || !input) return;

    input.value = '';
    modal.classList.remove('hidden');
    modal.classList.add('flex');

    window.setTimeout(() => {
        input.focus();
    }, 100);
}

function closeOtpModal() {
    const modal = $('#otpModal');

    if (!modal) return;

    modal.classList.add('hidden');
    modal.classList.remove('flex');

    currentVerifyToken = '';
}