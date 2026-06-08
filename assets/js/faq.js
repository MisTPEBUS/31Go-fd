
import {
    initLiff
} from "../liff/liff-init.js";

let API_BASE_URL =
    "https://9f4d-59-124-220-148.ngrok-free.app";
let html5QrCode = null;


async function init() {
    try {

        const profile =
            await initLiff();

        if (!profile) {
            return;
        }

        console.log(profile);

        const lineUserId =
            profile.userId;

        const response =
            await fetch(
                `${API_BASE_URL}/api/user/info/${lineUserId}`,
                {
                    method: "GET",

                    headers: {
                        "ngrok-skip-browser-warning":
                            "true"
                    }
                }
            );
        const resData =
            await response.json();

        const data =
            resData.data;

        const activityCode =
            data.activityCode
                ?.toString()
                .padStart(8, "0");






        document
            .getElementById(
                "registerCampaignBtn"
            )
            ?.addEventListener(
                "click",
                () => {
                    console.log("Register button clicked");
                    window.location.href =
                        "./register.html";
                }
            );

        document
            .querySelectorAll(
                ".activity-toggle"
            )
            .forEach(button => {

                button.addEventListener(
                    "click",
                    () => {

                        const content =
                            button.nextElementSibling;

                        const arrow =
                            button.querySelector(
                                ".arrow"
                            );

                        content.classList.toggle(
                            "hidden"
                        );

                        arrow.classList.toggle(
                            "rotate-180"
                        );
                    }
                );
            });




    }
    catch (error) {
        alert(error.message || "發生錯誤，請稍後再試。");
        console.error(error);
    }
}

init();
