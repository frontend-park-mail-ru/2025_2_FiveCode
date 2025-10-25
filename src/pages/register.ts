import ejs from 'ejs';
import { Header } from '../components/header';
import { apiClient } from "../api/apiClient";
import { renderNotes } from './notes';
import { renderLogin } from './login';

interface RegisterData {
  email: string;
  password: string;
  confirmPassword: string;
}

interface ValidationErrors {
  email?: string;
  password?: string;
  confirmPassword?: string;
}

const ICONS = {
  Icon: new URL('../static/svg/icon_goose.svg', import.meta.url).href,
};

function validateForm(form: HTMLFormElement): ValidationErrors {
  const errors: ValidationErrors = {};

  const email = (form.querySelector<HTMLInputElement>("[name='email']")?.value ?? "").trim();
  const password = (form.querySelector<HTMLInputElement>("[name='password']")?.value ?? "").trim();
  const confirmPassword = (form.querySelector<HTMLInputElement>("[name='confirmPassword']")?.value ?? "").trim();
  
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
export function renderRegister(app: HTMLElement): void {
  app.innerHTML = '';
  const pageEl = document.createElement('div');
  pageEl.innerHTML = `<div class="page"></div>`;
  const page = pageEl.firstElementChild as HTMLElement;

  const headerEl = Header({ user: null, app });
  
  if (headerEl) {
    page.appendChild(headerEl);
    typeof headerEl === 'string'
        ? (() => {
            const temp = document.createElement('div');
            temp.innerHTML = headerEl;
            return temp.firstElementChild as HTMLElement;
          })()
        : headerEl
  };

  
  const registerModalTemplate = `
    <div class="login-modal show">
    <a class="icon-login-form"> <img src="<%= icon %>"/ class="login-icon"> </a>
      <h2 class="icon-login-form"> Регистрация</h2>
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
          <span class="login-text-small" style="margin-bottom: -5px; display:flex; justify-content: center;"> Уже есть аккаунт? <a style="color: var(--primary-500)" href="/login"> Войти </a> </span>
          
        </div>
      </form>
    </div>
  `;
  const registerModalHtml = ejs.render(registerModalTemplate, { icon: ICONS.Icon });
  const registerModalEl = document.createElement('div');
  registerModalEl.innerHTML = registerModalHtml;
  const registerModal = registerModalEl.firstElementChild as HTMLElement;


  const form = registerModal.querySelector<HTMLFormElement>(".register-form")!;
  const emailErrorEl = registerModal.querySelector("#emailError")!;
  const passwordErrorEl = registerModal.querySelector("#passwordError")!;
  const confirmPasswordErrorEl = registerModal.querySelector("#confirmPasswordError")!;

  form?.addEventListener("submit", async (e) => {
    e.preventDefault();

    emailErrorEl!.textContent = "";
    passwordErrorEl!.textContent = "";
    confirmPasswordErrorEl!.textContent = "";

    const errors = validateForm(form);

    if (Object.keys(errors).length > 0) {
      if (errors.email) emailErrorEl!.textContent = errors.email;
      if (errors.password) passwordErrorEl!.textContent = errors.password;
      if (errors.confirmPassword) confirmPasswordErrorEl!.textContent = errors.confirmPassword;
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
      const email = data.email as string | null;
      const password = data.password as string | null;

      if (!email || !password) {
        throw new Error('Email и пароль обязательны');
      }

      await apiClient.login({ email, password });
      renderNotes(app);
    } catch (err) {
      if (err instanceof Error)
        alert("Ошибка: " + err.message);
      else
        alert("Неизвестная ошибка");
    }
  });

  page.appendChild(registerModal);
  app.appendChild(page);
}
