import { htmlToElement } from '../templates.js';
import { Header } from '../components/header.js';
import { apiClient } from "../api/apiClient.js";

const ICONS = {
  Icon: new URL('../assets/icon_goose.svg', import.meta.url).href,
};

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
      <h1>WELCOME</h1>
    </div>
  `);

  const loginModal = htmlToElement(`
    <div class="login-modal">
      <h2 class="icon-login-form"> <img src="${ICONS.Icon}"/ class="login-icon"> Goose</h2>
      <form class="login-form">
        <label class="login-text">Почта</label>
        <input type="text" name="email" placeholder="введите почту" class="input" required />
        <span class="error-message" id="emailError"></span>

        <label class="login-text">Пароль</label>
        <input type="password" name="password" placeholder="введите пароль" class="input" required />
        <span class="error-message" id="passwordError"></span>
        <div class="login-buttons">
          <button type="submit" class="btn">Войти</button>
          <button type="button" class="btn register-btn">Создать аккаунт</button>
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
  // el.appendChild(welcome);
  return el;
}
