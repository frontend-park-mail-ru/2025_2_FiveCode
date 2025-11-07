import ejs from "ejs";
import { Header } from "../components/header";
import { apiClient } from "../api/apiClient";
import router from "../router";
import { renderAppLayout } from "../layout";

interface ValidationErrors {
  email?: string;
  password?: string;
  confirmPassword?: string;
}

const ICONS = {
  Icon: new URL("../static/svg/icon_goose.svg", import.meta.url).href,
  eye: new URL("../static/svg/icon_eye.svg", import.meta.url).href,
  eyeOff: new URL("../static/svg/icon_eye_off.svg", import.meta.url).href,
};

function validateForm(form: HTMLFormElement): ValidationErrors {
  const errors: ValidationErrors = {};

  const email = (
    form.querySelector<HTMLInputElement>("[name='email']")?.value ?? ""
  ).trim();
  const password = (
    form.querySelector<HTMLInputElement>("[name='password']")?.value ?? ""
  ).trim();
  const confirmPassword = (
    form.querySelector<HTMLInputElement>("[name='confirmPassword']")?.value ??
    ""
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

  if (!confirmPassword) {
    errors.confirmPassword = "Обязательное поле";
  } else if (confirmPassword !== password) {
    errors.confirmPassword = "Пароли не совпадают";
  }

  return errors;
}

export function renderRegister(app: HTMLElement): void {
  app.innerHTML = "";
  const pageEl = document.createElement("div");
  pageEl.innerHTML = `<div class="page"></div>`;
  const page = pageEl.firstElementChild as HTMLElement;

  const headerEl = Header({ user: null, app });

  if (headerEl) {
    page.appendChild(headerEl);
  }

  const registerModalTemplate = `
  <div class="modal modal--show">
    <a class="modal__icon-container"> <img src="<%= icon %>"/ class="modal__icon"> </a>
      <h2 class="modal__icon-container"> Регистрация</h2>
      <form class="modal__form">

        <label class="modal__text">Почта<span class="validation-icon">?
            <div class="tooltip">
              Формат email: <br>
              • латинские буквы и цифры<br>
              • символ "@" и домен (например: test@mail.com)
            </div>
          </span>
        <div class="input-wrapper">
          <input type="text" name="email" placeholder="введите почту" class="input" id="email"/>
        </div></label>
        <span class="error-message" id="emailError">&nbsp;</span>

        <label class="modal__text">Пароль<span class="validation-icon">?
            <div class="tooltip">
              Пароль должен содержать:<br>
              • минимум 8 символов<br>
              • хотя бы одну цифру<br>
              • хотя бы одну букву<br>
              • спецсимволы (!@#$%^&*)
            </div>
          </span></label>
        <div class="input-wrapper">
          <input type="password" name="password" placeholder="введите пароль" class="input" id="password"/>
          <span class="toggle-password" id="togglePassword"><img src="<%= eye %>"></span>
        </div>
        </span>

        <span class="error-message" id="passwordError">&nbsp;</span>

        <label class="modal__text">Подтвердите пароль</label>
        <div class="input-wrapper">
          <input type="password" name="confirmPassword" id="confirmPassword" placeholder="введите пароль" class="input" required />
          <span class="toggle-password" id="toggleConfirmPassword"><img src="<%= eye %>"></span>
        </div>
        <span class="error-message" id="confirmPasswordError">&nbsp;</span>

        <div class="modal__buttons">
          <button type="submit" class="btn">Создать аккаунт</button>
        </div>
        <span class="modal__sub-text"> Уже есть аккаунт? <a href="/login" data-link> Войти </a> </span>
      </form>
    </div>
  `;
  const registerModalHtml = ejs.render(registerModalTemplate, {
    icon: ICONS.Icon,
    eye: ICONS.eye,
  });
  const registerModalEl = document.createElement("div");
  registerModalEl.innerHTML = registerModalHtml;
  const registerModal = registerModalEl.firstElementChild as HTMLElement;

  const form = registerModal.querySelector<HTMLFormElement>(".modal__form")!;
  const emailErrorEl = registerModal.querySelector("#emailError")!;
  const passwordErrorEl = registerModal.querySelector("#passwordError")!;
  const confirmPasswordErrorEl = registerModal.querySelector(
    "#confirmPasswordError"
  )!;

  form?.addEventListener("submit", async (e) => {
    e.preventDefault();

    emailErrorEl!.textContent = "\u00A0";
    passwordErrorEl!.textContent = "\u00A0";
    confirmPasswordErrorEl!.textContent = "\u00A0";
    emailErrorEl.classList.remove("error-message--visible");
    passwordErrorEl.classList.remove("error-message--visible");
    confirmPasswordErrorEl.classList.remove("error-message--visible");

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
      if (errors.confirmPassword) {
        confirmPasswordErrorEl.textContent = errors.confirmPassword;
        confirmPasswordErrorEl.classList.add("error-message--visible");
      }
      return;
    }

    const data = Object.fromEntries(new FormData(form));

    try {
      await apiClient.register({
        email: data.email,
        password: data.password,
        confirm_password: data.confirmPassword,
      });
      await renderAppLayout(app);
      router.navigate("notes");
    } catch (err) {
      if (err instanceof Error && confirmPasswordErrorEl) {
        const body = (err as any).body;
        if (body && body.error) {
          confirmPasswordErrorEl.textContent = body.error;
        } else {
          confirmPasswordErrorEl.textContent = err.message;
        }
        confirmPasswordErrorEl.classList.add("error-message--visible");
      }
      console.error("Ошибка регистрации: ", err);
    }
  });

  const togglePassword =
    registerModal.querySelector<HTMLSpanElement>("#togglePassword");
  const toggleIcon = registerModal.querySelector<HTMLImageElement>(
    "#togglePassword img"
  );
  const passwordInput =
    registerModal.querySelector<HTMLInputElement>("#password");

  if (togglePassword && toggleIcon && passwordInput) {
    togglePassword.addEventListener("click", () => {
      const type =
        passwordInput.getAttribute("type") === "password" ? "text" : "password";
      passwordInput.setAttribute("type", type);
      toggleIcon.src = type === "password" ? ICONS.eye : ICONS.eyeOff;
    });
  }

  const confirmPasswordInput =
    registerModal.querySelector<HTMLInputElement>("#confirmPassword");
  const toggleConfirmPassword = registerModal.querySelector<HTMLSpanElement>(
    "#toggleConfirmPassword"
  );
  const toggleIconConfirm = registerModal.querySelector<HTMLImageElement>(
    "#toggleConfirmPassword img"
  );
  if (toggleConfirmPassword && toggleIconConfirm && confirmPasswordInput) {
    toggleConfirmPassword.addEventListener("click", () => {
      const type =
        confirmPasswordInput.getAttribute("type") === "password"
          ? "text"
          : "password";
      confirmPasswordInput.setAttribute("type", type);
      toggleIconConfirm.src = type === "password" ? ICONS.eye : ICONS.eyeOff;
    });
  }

  page.appendChild(registerModal);
  app.appendChild(page);
}
