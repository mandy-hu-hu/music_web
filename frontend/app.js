const wrapper = document.querySelector(".wrapper");
const loginLink = document.querySelector(".login-link");
const registerLink = document.querySelector(".register-link");
const btnPopup = document.querySelector(".btnLogin-popup");
const iconClose = document.querySelector(".icon-close");

const loginTable = [
  { username: "User", email: "user@example.com", password: "password123" },
  { username: "Admin", email: "admin@musicweb.com", password: "admin2024" }
];

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

  const duplicate = loginTable.find(u => u.email === email);
  if (duplicate) {
    errorMsg.textContent = "The email already exists";
  } else {
    loginTable.push({ username, email, password });
    errorMsg.textContent = "";
    wrapper.classList.remove("active");
  }
});

document.getElementById("loginForm").addEventListener("submit", (e) => {
    e.preventDefault();

    const email = document.getElementById("loginEmail").value.trim();
    const password = document.getElementById("loginPassword").value;
    const errorMsg = document.getElementById("loginError");

    fetch("http://100.31.2.68:5000/login", {
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
