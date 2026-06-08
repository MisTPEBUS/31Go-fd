
import {
    initLiff
} from "../liff/liff-init.js";

let API_BASE_URL =
    "https://9f4d-59-124-220-148.ngrok-free.app";
async function init() {

    try {

        /*
        |--------------------------------------------------------------------------
        | LIFF Login
        |--------------------------------------------------------------------------
        */

        const profile =
            await initLiff();

        if (!profile) {
            return;
        }

        console.log(profile);

        /*
        |--------------------------------------------------------------------------
        | Query String
        |--------------------------------------------------------------------------
        */

        const params =
            new URLSearchParams(
                window.location.search
            );

        const spotToken =
            params.get("spot");

        console.log(
            "spotToken:",
            spotToken
        );

        /*
        |--------------------------------------------------------------------------
        | 檢查 spot token
        |--------------------------------------------------------------------------
        */

        if (!spotToken) {

            showError(
                "缺少景點資訊"
            );

            return;
        }

        /*
        |--------------------------------------------------------------------------
        | api result
        |--------------------------------------------------------------------------
        */

        const response =
            await fetch(
                `${API_BASE_URL}/api/activity/spot-check/${profile.userId}/${spotToken}`,
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json",

                        "ngrok-skip-browser-warning":
                            "true"
                    }
                }
            );

        const data =
            await response.json();

        console.log(data);

        if (response.ok && data.success) {

            showSuccess(
                data.message ||
                "景點打卡成功，返回查詢頁面"
            );

            setTimeout(() => {


                window.location.href =
                    `./progress.html?spot=${spotToken}`;

            }, 1500);


            return;
        }
        else {

            showError(
                data.message ||
                "打卡失敗，返回查詢頁面"
            );

            setTimeout(() => {
                window.location.href =
                    "./register.html";

                /*  window.location.href =
                     `./progress.html?spot=${spotToken}`; */

            }, 1500);
        }




    } catch (error) {

        console.error(error);
        //重複打卡

        //未註冊活動或是活動逾時


    }
}

/*
|--------------------------------------------------------------------------
| 成功
|--------------------------------------------------------------------------
*/

function showSuccess(message) {

    document
        .getElementById("loading")
        .classList.add("hidden");

    document
        .getElementById("successBox")
        .classList.remove("hidden");

    document
        .getElementById("successMessage")
        .innerText =
        message;

    /*
    |--------------------------------------------------------------------------
    | redirect
    |--------------------------------------------------------------------------
    */

    setTimeout(() => {

        window.location.href =
            "./progress.html";

    }, 2000);
}

/*
|--------------------------------------------------------------------------
| 失敗
|--------------------------------------------------------------------------
*/

function showError(message) {

    document
        .getElementById("loading")
        .classList.add("hidden");

    document
        .getElementById("errorBox")
        .classList.remove("hidden");

    document
        .getElementById("errorMessage")
        .innerText =
        message;

    /*
    |--------------------------------------------------------------------------
    | redirect
    |--------------------------------------------------------------------------
    */

    setTimeout(() => {

        window.location.href =
            "./register.html";

    }, 2000);
}

init();

