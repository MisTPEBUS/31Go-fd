
const LIFF_ID = "2010150440-sbW0urAy";


const API_BASE_URL =
    "https://9f4d-59-124-220-148.ngrok-free.app";



async function init() {

    await liff.init({
        liffId: LIFF_ID
    });

    if (!liff.isLoggedIn()) {

        liff.login();

        return;
    }

    const profile =
        await liff.getProfile();

    console.log(profile);

    document.getElementById(
        "userId"
    ).value = profile.userId;

    document.getElementById(
        "displayName"
    ).value = profile.displayName;

    await loadUser(
        profile.userId
    );
}

async function loadUser(userId) {

    const response = await fetch(
        `${API_BASE_URL}/api/users/${userId}`
    );

    if (!response.ok) {
        return;
    }

    const data =
        await response.json();

    document.getElementById(
        "carNo"
    ).value =
        data.carNo ?? "";
}

init();

