import { htmlToElement } from '../templates.js';
import { Header } from '../components/header.js';
import { apiClient } from "../api/apiClient.js";

function validateForm(form) {
  const errors = [];
  const email = form.querySelector("[name='email']").value.trim();
  const password = form.querySelector("[name='password']").value.trim();

  if (!email) errors.push("Email is required");
  if (email.length < 3) errors.push("Email must be at least 3 characters");
  if (!password) errors.push("Password is required");
  // if (password.length < 6) errors.push("Password must be at least 6 characters");

  return errors;
}


export function renderLogin() {
  const el = htmlToElement(`<div class="page"></div>`);
  el.appendChild(Header({ user: null }));

  const welcome = htmlToElement(`
    <div class="welcome">
      <h1>WELCOME TO NOTION</h1>
    </div>
  `);

  const loginModal = htmlToElement(`
    <div class="login-modal">
      <h2>Log in</h2>
      <form class="login-form">
        <input type="text" name="email" placeholder="Email" class="input" required />
        <input type="password" name="password" placeholder="Password" class="input" required />
        <div class="login-buttons">
          <button type="submit" class="btn">Log in</button>
          <button type="button" class="btn register-btn">Register</button>
        </div>
      </form>
    </div>
  `);
  
  setTimeout(() => {
    loginModal.classList.remove("hidden");
    loginModal.classList.add("show");
  }, 1000);

  const form = loginModal.querySelector(".login-form");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const formData = new FormData(form);
    const data = {
      email: formData.get("email"),
      password: formData.get("password"),
    };

    const errors = validateForm(form);
    if (errors.length > 0) {
      alert(errors.join("\n"));
      return;
    }
    try { 
      const user = await apiClient.login(data);
      window.navigate("/notes");
    } catch (err) {
      alert("Ошибка: " + err.message);
    }
  });

  loginModal.querySelector(".register-btn").addEventListener("click", () => {
    window.navigate("/register");
  });
  
  el.appendChild(loginModal);
  el.appendChild(welcome);
  return el;
}
