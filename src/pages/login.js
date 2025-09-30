import { htmlToElement } from '../templates.js';
import { Header } from '../components/header.js';
import { apiClient } from "../api/apiClient.js";
import { renderNotes } from './notes.js';
import { renderRegister } from './register.js';

const ICONS = {
  Icon: new URL('../assets/icon_goose.svg', import.meta.url).href,
};

function validateForm(form) {
  const errors = {};
  const email = form.querySelector("[name='email']").value.trim();
  const password = form.querySelector("[name='password']").value.trim();

  if (!email) {
    errors.email = "Обязательное поле";
  } else if (email.length < 3) {
    errors.email = "Email должен быть не короче 3 символов";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.email = "Некорректный формат email";
  }

  if (!password) {
    errors.password = "Обязательное поле";
  }
  else if (password.length < 6) {
    errors.password = "Пароль должен быть не короче 6 символов";
  } else if (!/^[A-Za-z0-9!@#$%^&*]+$/.test(password)) {
    errors.password = "Пароль содержит недопустимые символы";
  } else if (!/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) {
    errors.password = "Пароль должен содержать буквы и цифры";
  }

  return errors;
}



/**
 * Рендерит страницу входа пользователя
 * @returns {HTMLElement} DOM-элемент страницы входа
 */
export function renderLogin(app) {
  app.innerHTML = '';
  const el = htmlToElement(`<div class="page"></div>`);

  let headerEl = Header({ user: null });
  if (typeof headerEl === "string") {
    headerEl = htmlToElement(headerEl);
  }

  if (headerEl) {
    el.appendChild(headerEl);
  }

  const welcome = htmlToElement(`
    <div class="welcome">
      <h1>WELCOME</h1>
    </div>
  `);

  const loginModal = htmlToElement(`
    <div class="login-modal">
    
    <a class="icon-login-form"><img src="${ICONS.Icon}"/ class="login-icon"> </a> 
      <h2 class="icon-login-form"> Вход</h2>
      <form class="login-form">
        <label class="login-text">Почта</label>
        <input type="text" name="email" placeholder="введите почту" class="input"/>
        <span class="error-message" id="emailError">&nbsp;</span>

        <label class="login-text">Пароль</label>
        <input type="password" name="password" placeholder="введите пароль" class="input"/>
        <span class="error-message" id="passwordError">&nbsp;</span>

        <span class="error-message" id="loginError">&nbsp;</span>
        <span class="login-text-small">Забыли пароль? <a style="color: var(--primary-500)">Восстановить доступ </a></span>
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
  const emailErrorEl = loginModal.querySelector("#emailError");
  const passwordErrorEl = loginModal.querySelector("#passwordError");
  const loginErrorEl = loginModal.querySelector("#loginError");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    emailErrorEl.textContent = "&nbsp;";
    passwordErrorEl.textContent = "&nbsp;";
    loginErrorEl.textContent = "&nbsp;";

    const errors = validateForm(form);

    if (Object.keys(errors).length > 0) {
      if (errors.email) {
        emailErrorEl.textContent = errors.email;
        emailErrorEl.classList.add('visible');

      }
      if (errors.password) {
        passwordErrorEl.textContent = errors.password;
        passwordErrorEl.classList.add('visible');

      }
      return;
    }

    const formData = new FormData(form);
    const data = {
      email: formData.get("email"),
      password: formData.get("password"),
    };

    try { 
      const user = await apiClient.login(data);
      renderNotes(app);
    } catch (err) {
      loginErrorEl.textContent = "Логин или пароль неверный";      
    }
  });

  loginModal.querySelector(".register-btn").addEventListener("click", () => {
    renderRegister(app);
  });
  
  el.appendChild(loginModal);
  app.appendChild(el);
}
