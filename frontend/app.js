const wrapper = document.querySelector(".wrapper");
const loginLink = document.querySelector(".login-link");
const registerLink = document.querySelector(".register-link");
const btnPopup = document.querySelector(".btnLogin-popup");
const iconClose = document.querySelector(".icon-close");


btnPopup.addEventListener("click", () => {
  wrapper.classList.add("active-popup");
});

if (new URLSearchParams(globalThis.location.search).get("showLogin") === "true") {
  wrapper.classList.add("active-popup");
}

iconClose.addEventListener("click", () => {
  wrapper.classList.remove("active-popup");
});

registerLink.addEventListener("click", () => {
  wrapper.classList.add("active");
});

loginLink.addEventListener("click", () => {
  wrapper.classList.remove("active");
});

document.getElementById("registerForm").addEventListener("submit", (e) => {
    e.preventDefault();

    const username = document.getElementById("registerUsername").value.trim();
    const email = document.getElementById("registerEmail").value.trim();
    const password = document.getElementById("registerPassword").value;
    const errorMsg = document.getElementById("registerError");

    fetch("https://exb2yo4udg.execute-api.us-east-1.amazonaws.com/prod/register", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            email: email,
            user_name: username,
            password: password
        })
    })
    .then(res => res.json())
    .then(data => {
        console.log("REGISTER RESPONSE:", data);

        if (data.ok) {
            errorMsg.textContent = "";
            document.getElementById("registerForm").reset();
            alert("Register success!");
            wrapper.classList.remove("active");
        } else {
            errorMsg.textContent = data.error || "Register failed";
        }
    })
    .catch(err => {
        console.error(err);
        errorMsg.textContent = "Server error";
    });
});

document.getElementById("loginForm").addEventListener("submit", (e) => {
    e.preventDefault();

    const email = document.getElementById("loginEmail").value.trim();
    const password = document.getElementById("loginPassword").value;
    const errorMsg = document.getElementById("loginError");

    fetch("https://exb2yo4udg.execute-api.us-east-1.amazonaws.com/prod/login", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ email, password })
    })
    .then(res => res.json())
    .then(data => {
        console.log("RESPONSE:", data);

        if (data.ok) {
            errorMsg.textContent = "";

            sessionStorage.setItem("loggedInEmail", data.data.email);
            sessionStorage.setItem("loggedInUsername", data.data.user_name);

            window.location.href = "main.html";
        } else {
            errorMsg.textContent = data.error || "Login failed";
        }
    })
    .catch(err => {
        console.error(err);
        errorMsg.textContent = "Server error";
    });
});

/*window.addEventListener("DOMContentLoaded", () => {

    const form = document.getElementById("registerForm");

    if (!form) {
        console.log(" registerForm not found");
        return;
    }

    console.log("registerForm loaded");

    form.addEventListener("submit", (e) => {
        e.preventDefault();

        const username = document.getElementById("registerUsername").value.trim();
        const email = document.getElementById("registerEmail").value.trim();
        const password = document.getElementById("registerPassword").value;
        const errorMsg = document.getElementById("registerError");

        fetch("https://exb2yo4udg.execute-api.us-east-1.amazonaws.com/prod/register", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                email: email,
                user_name: username,
                password: password
            })
        })
        .then(res => res.json())
        .then(data => {
            console.log("REGISTER RESPONSE:", data);

            if (data.ok) {
                errorMsg.textContent = "";
                alert("Register success!");
            } else {
                errorMsg.textContent = data.error || "Register failed";
            }
        })
        .catch(err => {
            console.error(err);
            errorMsg.textContent = "Server error";
        });
    });

});*/
