import ejs from 'ejs';
import { Header } from '../components/header';
import { apiClient } from "../api/apiClient";
import { renderNotes } from './notes';
import { renderRegister } from './register';

const ICONS = {
  Icon: new URL('../static/svg/icon_goose.svg', import.meta.url).href,
};

interface ValidationErrors {
  email?: string;
  password?: string;
  confirmPassword?: string;
}

interface User{
  id: number;
  username: string;
  password?: string;
  email?: string;
}

function validateForm(form: HTMLElement) {
  const errors: ValidationErrors = {};
  const email = (form.querySelector<HTMLInputElement>("[name='email']")?.value ?? "").trim();
  const password = (form.querySelector<HTMLInputElement>("[name='password']")?.value ?? "").trim();

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
export function renderLogin(app: HTMLElement) : void {
  app.innerHTML = '';
  const pageTemplate = `<div class="page"></div>`;
  const el = document.createElement('div');
  el.innerHTML = pageTemplate;
  const pageEl = el.firstElementChild as HTMLElement;

  let headerEl = Header({ user: null, app });
  if (headerEl) {
    pageEl.appendChild(headerEl);
  }

  const welcomeEl = document.createElement('div');
  welcomeEl.innerHTML = `
    <div class="welcome">
      <h1>WELCOME</h1>
    </div>
  `;
  pageEl.appendChild(welcomeEl.firstElementChild as HTMLElement);

  const loginModalTemplate = `
    <div class="login-modal">
    
    <a class="icon-login-form"><img src="<%= icon %>"/ class="login-icon"> </a> 
      <h2 class="icon-login-form"> Вход</h2>
      <form class="login-form">
        <label class="login-text">Почта</label>
        <input type="text" name="email" placeholder="введите почту" class="input"/>
        <span class="error-message" id="emailError"></span>

        <label class="login-text">Пароль</label>
        <input type="password" name="password" placeholder="введите пароль" class="input"/>
        <span class="error-message" id="passwordError"></span>

        <span class="error-message" id="loginError"></span>
        <span class="login-text-small">Забыли пароль? <a style="color: var(--primary-500)" href="/">Восстановить доступ </a></span>
        <div class="login-buttons">
          <button type="submit" class="btn">Войти</button>
          <button type="button" class="btn register-btn">Создать аккаунт</button>
        </div>
        
      </form>
    </div>
  `;
  
  const loginModalHtml = ejs.render(loginModalTemplate, { icon: ICONS.Icon });
  const loginModalEl = document.createElement('div');
  loginModalEl.innerHTML = loginModalHtml;
  const loginModal = loginModalEl.firstElementChild as HTMLElement;

  setTimeout(() => {
    loginModal.classList.remove("hidden");
    loginModal.classList.add("show");
  }, 1000);

  const form = loginModal.querySelector<HTMLFormElement>(".login-form")!;
  const emailErrorEl = loginModal.querySelector("#emailError")!;
  const passwordErrorEl = loginModal.querySelector("#passwordError")!;
  const loginErrorEl = loginModal.querySelector("#loginError")!;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    emailErrorEl.textContent = "";
    passwordErrorEl.textContent = "";
    loginErrorEl.textContent = "";

    const errors = validateForm(form);

    if (Object.keys(errors).length > 0) {
      if (errors.email) emailErrorEl.textContent = errors.email;
      if (errors.password) passwordErrorEl.textContent = errors.password;
      return;
    }

    const formData = new FormData(form);
    const data : User = {
      id: 0,
      username: "",
      email: formData.get("email") as string,
      password: formData.get("password") as string,
    };

    try { 
      const user = await apiClient.login(data);
      renderNotes(app);
    } catch (err) {
      loginErrorEl.textContent = "Логин или пароль неверный";      
    }
  });
  loginModal.querySelector(".register-btn")?.addEventListener("click", () => {
  renderRegister(app);
});

  
  pageEl.appendChild(loginModal);
  app.appendChild(el);
}
