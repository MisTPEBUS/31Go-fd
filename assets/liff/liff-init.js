
const LIFF_ID = "2010150440-sbW0urAy";





export async function initLiff() {

    await liff.init({
        liffId: LIFF_ID
    });

    if (!liff.isLoggedIn()) {

        liff.login();

        return null;
    }

    return await liff.getProfile();
}

