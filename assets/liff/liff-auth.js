export async function ensureLogin() {
    if (!liff.isLoggedIn()) {
        liff.login();

        return false;
    }

    return true;
}