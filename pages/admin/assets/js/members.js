'use strict';

let currentMember = null;

document.addEventListener('DOMContentLoaded', () => {
    $('#searchMemberBtn').addEventListener(
        'click',
        renderMemberByCode
    );

    $('#memberCodeInput').addEventListener(
        'keydown',
        (event) => {
            if (event.key === 'Enter') {
                renderMemberByCode();
            }
        }
    );

    renderMemberEmpty('請輸入活動碼查詢會員。');
});

async function renderMemberByCode() {
    const code = $('#memberCodeInput').value.trim();

    if (!code) {
        renderMemberEmpty('請輸入活動碼。');
        return;
    }

    renderMemberEmpty('查詢中...');

    try {
        const response =
            await UserApi.getAdminUserByActiveCode(code);

        currentMember = response.data;

        renderMember(currentMember);
    } catch (error) {
        currentMember = null;

        renderMemberEmpty(
            error?.data?.message ||
            '查無會員資料，請確認活動碼是否正確。'
        );
    }
}

function renderMember(member) {
    $('#memberResult').innerHTML = `
        <article class="rounded-card border border-white bg-white/80 p-5 shadow-sm">
            <div class="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                    <p class="text-xs font-black tracking-[.3em] text-primary-700">
                        ${escapeHtml(member.activityCode)}
                    </p>
                    <h4 class="mt-2 text-2xl font-black">
                        ${escapeHtml(member.name)}
                    </h4>
                    <p class="mt-2 text-sm text-slate-500">
                        LINE ID：${escapeHtml(member.lineUserId)}
                    </p>
                </div>

                <label class="block sm:w-56">
                    <span class="mb-2 block text-sm font-medium text-slate-600">
                        身分權限
                    </span>
                    <select id="roleSelect"
                        class="h-14 w-full rounded-soft border border-slate-200 bg-slate-50 px-5 outline-none focus:border-primary-500 focus:ring-4 focus:ring-blue-100">
                        <option value="一般會員">一般會員</option>
                        <option value="工作人員">工作人員</option>
                        <option value="管理者">管理者</option>
                    </select>
                </label>
            </div>

            <button id="saveRoleBtn"
                class="primary-gradient mt-5 h-14 w-full rounded-soft font-black text-white shadow-lg sm:w-auto sm:px-8">
                儲存權限
            </button>
        </article>
    `;

    $('#roleSelect').value = member.role;

    $('#saveRoleBtn').addEventListener(
        'click',
        updateMemberRole
    );
}

async function updateMemberRole() {
    if (!currentMember) {
        return;
    }

    const role = $('#roleSelect').value;

    try {
        const response =
            await UserApi.updateUserRole(
                currentMember.activityCode,
                role
            );

        currentMember.role = role;

        showModal(
            'success',
            '權限已更新',
            `${currentMember.name} 已設定為 ${role}。`
        );
    } catch (error) {
        showModal(
            'error',
            '更新失敗',
            error?.data?.message || '請稍後再試。'
        );
    }
}

function renderMemberEmpty(message) {
    $('#memberResult').innerHTML = `
        <div class="rounded-card bg-slate-50 p-8 text-center text-sm text-slate-500">
            ${escapeHtml(message)}
        </div>
    `;
}