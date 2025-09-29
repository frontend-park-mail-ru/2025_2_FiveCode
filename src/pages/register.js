import { htmlToElement } from '../templates.js';
import { Header } from '../components/header.js';
import { apiClient } from "../api/apiClient.js";
import { renderNotes } from './notes.js';
import { renderLogin } from './login.js';


const ICONS = {
  Icon: new URL('../assets/icon_goose.svg', import.meta.url).href,
};

function validateForm(form) {
  const errors = {};
  const email = form.querySelector("[name='email']").value.trim();
  const password = form.querySelector("[name='password']").value.trim();
  const confirmPassword = form.querySelector("[name='confirmPassword']").value.trim();

  
  if (!email) {
    errors.email = "Обязательное поле";
  } else if (email.length < 3) {
    errors.email = "Email должен быть не короче 3 символов";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.email = "Некорректный формат email";
  }

  
  if (!password) {
    errors.password = "Обязательное поле";
  } else if (password.length < 6) {
    errors.password = "Пароль должен быть не короче 6 символов";
  } else if (!/^[A-Za-z0-9!@#$%^&*]+$/.test(password)) {
    errors.password = "Пароль содержит недопустимые символы";
  } else if (!/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) {
    errors.password = "Пароль должен содержать буквы и цифры";
  }

  
  if (!confirmPassword) {
    errors.confirmPassword = "Обязательное поле";
  } else if (confirmPassword !== password) {
    errors.confirmPassword = "Пароли не совпадают";
  }

  return errors;
}



/**
 * Рендерит страницу регистрации пользователя
 * @returns {HTMLElement} DOM-элемент страницы регистрации
 */
export function renderRegister(app) {
  app.innerHTML = '';
  const el = htmlToElement(`<div class="page"></div>`);
  // el.appendChild(Header({ user: null }));

  let headerEl = Header({ user: null });
  if (typeof headerEl === "string") {
    headerEl = htmlToElement(headerEl);
  }

  if (headerEl) {
    el.appendChild(headerEl);
  }

  const registerModal = htmlToElement(`
    <div class="login-modal show">
      <h2 class="icon-login-form"> <img src="${ICONS.Icon}"/ class="login-icon"> Goose</h2>
      <form class="register-form">
        <label class="login-text">Почта</label>
        <input type="text" name="email" placeholder="введите почту" class="input" required />
        <span class="error-message" id="emailError"></span>

        <label class="login-text">Пароль</label>
        <input type="password" name="password" placeholder="введите пароль" class="input" required />
        <span class="error-message" id="passwordError"></span>

        <label class="login-text">Подтвердите пароль</label>
        <input type="password" name="confirmPassword" placeholder="введите пароль" class="input" required />
        <span class="error-message" id="confirmPasswordError"></span>

        <div class="login-buttons">
          <button type="submit" class="btn">Создать аккаунт</button>
          <a class="login-text"> Уже есть аккаунт? </a>
          <button type="button" class="btn login-btn">Войти</button>
        </div>
      </form>
    </div>
  `);

  const form = registerModal.querySelector(".register-form");
  const emailErrorEl = registerModal.querySelector("#emailError");
  const passwordErrorEl = registerModal.querySelector("#passwordError");
  const confirmPasswordErrorEl = registerModal.querySelector("#confirmPasswordError");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    // очищаем старые ошибки
    emailErrorEl.textContent = "";
    passwordErrorEl.textContent = "";
    confirmPasswordErrorEl.textContent = "";

    const errors = validateForm(form);

    if (Object.keys(errors).length > 0) {
      if (errors.email) emailErrorEl.textContent = errors.email;
      if (errors.password) passwordErrorEl.textContent = errors.password;
      if (errors.confirmPassword) confirmPasswordErrorEl.textContent = errors.confirmPassword;
      return;
    }

    const data = Object.fromEntries(new FormData(form));

    try {
      const user = await apiClient.register({
        username: data.email,
        email: data.email,
        password: data.password,
        confirm_password: data.confirmPassword
      });
      await apiClient.login({ email: data.email, password: data.password });
      renderNotes(app);
      // window.navigate("/notes");
    } catch (err) {
      alert("Ошибка: " + err.message);
    }
  });

  registerModal.querySelector(".login-btn").addEventListener("click", () => {
    // window.navigate("/login");
    renderLogin(app);
  });

  el.appendChild(registerModal);
  app.appendChild(el);
  // return el;
}
