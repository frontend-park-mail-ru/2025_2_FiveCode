import { htmlToElement } from '../templates.js';
import { Header } from '../components/header.js';
import { apiClient } from "../api/apiClient.js";

const ICONS = {
  Icon: new URL('../assets/icon_goose.svg', import.meta.url).href,
};

export function renderRegister() {
  const el = htmlToElement(`<div class="page"></div>`);
  el.appendChild(Header({ user: null }));

  const registerModal = htmlToElement(`
    <div class="login-modal show">
      <h2 class="icon-login-form"> <img src="${ICONS.Icon}"/ class="login-icon"> Goose</h2>
      <form class="register-form">
        <a class="login-text">Почта</a>
        <input type="email" name="email" placeholder="введите почту" class="input" required />
        <a class="login-text">Пароль</a>
        <input type="password" name="password" placeholder="введите пароль" class="input" required />
        <a class="login-text">Подтвердите пароль</a>
        <input type="password" name="confirmPassword" placeholder="введите пароль" class="input" required />
        <div class="login-buttons">
          <button type="submit" class="btn">Создать аккаунт</button>
          <a class="login-text"> Уже есть аккаунт? </a>
          <button type="button" class="btn login-btn">Войти</button>
        </div>
      </form>
    </div>
  `);

  const form = registerModal.querySelector(".register-form");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(form));

    if (data.password !== data.confirmPassword) {
      alert("Passwords do not match!");
      return;
    }

    try {
      const user = await apiClient.register({
        username: data.username,
        email: data.email,
        password: data.password,
        confirm_password: data.confirmPassword
      });
      await apiClient.login({ email: data.email, password: data.password });
      window.navigate("/notes");
    } catch (err) {
      alert("Ошибка: " + err.message);
    }
  });

  registerModal.querySelector(".login-btn").addEventListener("click", () => {
    window.navigate("/login");
  });

  el.appendChild(registerModal);
  return el;
}
