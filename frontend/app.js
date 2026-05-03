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

  const match = loginTable.find(u => u.email === email && u.password === password);
  if (match) {
    errorMsg.textContent = "";
    sessionStorage.setItem("loggedInEmail", match.email);
    sessionStorage.setItem("loggedInUsername", match.username || match.email);
    globalThis.location.href = "main.html";
  } else {
    errorMsg.textContent = "Email or password is invalid";
  }
});