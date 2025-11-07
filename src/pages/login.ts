import ejs from "ejs";
import { Header } from "../components/header";
import { apiClient } from "../api/apiClient";
import router from "../router";
import { renderAppLayout } from "../layout";

const ICONS = {
  Icon: new URL("../static/svg/icon_goose.svg", import.meta.url).href,
  eye: new URL("../static/svg/icon_eye.svg", import.meta.url).href,
  eyeOff: new URL("../static/svg/icon_eye_off.svg", import.meta.url).href,
};

interface ValidationErrors {
  email?: string;
  password?: string;
}

interface User {
  id: number;
  username: string;
  password?: string;
  email?: string;
}

function validateForm(form: HTMLElement) {
  const errors: ValidationErrors = {};
  const email = (
    form.querySelector<HTMLInputElement>("[name='email']")?.value ?? ""
  ).trim();
  const password = (
    form.querySelector<HTMLInputElement>("[name='password']")?.value ?? ""
  ).trim();

  if (!email) {
    errors.email = "Обязательное поле";
  } else if (email.length < 3) {
    errors.email = "Email должен быть не короче 3 символов";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.email = "Некорректный формат email";
  }

  if (!password) {
    errors.password = "Обязательное поле";
  } else if (password.length < 8) {
    errors.password = "Пароль должен быть не короче 8 символов";
  } else if (!/^[A-Za-z0-9!@#$%^&*]+$/.test(password)) {
    errors.password = "Пароль содержит недопустимые символы";
  } else if (!/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) {
    errors.password = "Пароль должен содержать буквы и цифры";
  }

  return errors;
}

export function renderLogin(app: HTMLElement): void {
  app.innerHTML = "";
  const pageTemplate = `<div class="page"></div>`;
  const el = document.createElement("div");
  el.innerHTML = pageTemplate;
  const pageEl = el.firstElementChild as HTMLElement;

  let headerEl = Header({ user: null, app });
  if (headerEl) {
    pageEl.appendChild(headerEl);
  }

  const loginModalTemplate = `
    <div class="modal">
      <a class="modal__icon-container"><img src="<%= icon %>" class="modal__icon"></a>
      <h2 class="modal__icon-container">Вход</h2>
      <form class="modal__form">
        <label class="modal__text">Почта<span class="validation-icon">?
            <div class="tooltip">
              Формат email: <br>
              • латинские буквы и цифры<br>
              • символ "@" и домен (например: test@mail.com)
            </div>
          </span>
        </label>
        <div class="input-wrapper">
          <input type="text" name="email" placeholder="введите почту" class="input" id="email"/>
        </div>
        <span class="error-message" id="emailError">&nbsp;</span>
        <label class="modal__text">Пароль<span class="validation-icon">?
            <div class="tooltip">
              Пароль должен содержать:<br>
              • минимум 8 символов<br>
              • хотя бы одну цифру<br>
              • хотя бы одну букву<br>
            </div>
          </span>
        </label>
        <div class="input-wrapper">
          <input type="password" name="password" placeholder="введите пароль" class="input" id="password"/>
          <span class="toggle-password" id="togglePassword"><img src="<%= eye %>"></span>
        </div>
        <span class="error-message" id="passwordError">&nbsp;</span>
        <span class="error-message" id="loginError">&nbsp;</span>
        <div class="modal__buttons">
          <button type="submit" class="btn">Войти</button>
          <a href="/register" class="btn modal__btn--secondary" data-link>Создать аккаунт</a>
        </div>
      </form>
    </div>
  `;

  const loginModalHtml = ejs.render(loginModalTemplate, {
    icon: ICONS.Icon,
    eye: ICONS.eye,
  });
  const loginModalEl = document.createElement("div");
  loginModalEl.innerHTML = loginModalHtml;
  const loginModal = loginModalEl.firstElementChild as HTMLElement;

  const form = loginModal.querySelector<HTMLFormElement>(".modal__form")!;
  const emailErrorEl = loginModal.querySelector("#emailError")!;
  const passwordErrorEl = loginModal.querySelector("#passwordError")!;
  const loginErrorEl = loginModal.querySelector("#loginError")!;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    emailErrorEl.textContent = "";
    passwordErrorEl.textContent = "";
    loginErrorEl.textContent = "";
    emailErrorEl.classList.remove("error-message--visible");
    passwordErrorEl.classList.remove("error-message--visible");
    loginErrorEl.classList.remove("error-message--visible");

    const errors = validateForm(form);
    if (Object.keys(errors).length > 0) {
      if (errors.email) {
        emailErrorEl.textContent = errors.email;
        emailErrorEl.classList.add("error-message--visible");
      }
      if (errors.password) {
        passwordErrorEl.textContent = errors.password;
        passwordErrorEl.classList.add("error-message--visible");
      }
      return;
    }
    const formData = new FormData(form);
    const data: User = {
      id: 0,
      username: "",
      email: formData.get("email") as string,
      password: formData.get("password") as string,
    };
    try {
      await apiClient.login(data);
      await renderAppLayout(app);
      router.navigate("notes");
    } catch (err) {
      loginErrorEl.textContent = "Логин или пароль неверный";
      loginErrorEl.classList.add("error-message--visible");
    }
  });

  const togglePassword =
    loginModal.querySelector<HTMLSpanElement>("#togglePassword");
  const toggleIcon = loginModal.querySelector<HTMLImageElement>(
    "#togglePassword img"
  );
  const passwordInput = loginModal.querySelector<HTMLInputElement>("#password");

  if (togglePassword && toggleIcon && passwordInput) {
    togglePassword.addEventListener("click", () => {
      const type =
        passwordInput.getAttribute("type") === "password" ? "text" : "password";
      passwordInput.setAttribute("type", type);
      toggleIcon.src = type === "password" ? ICONS.eye : ICONS.eyeOff;
    });
  }

  pageEl.appendChild(loginModal);
  app.appendChild(pageEl);
}
