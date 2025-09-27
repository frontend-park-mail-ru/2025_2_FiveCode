import { htmlToElement } from '../templates.js';
import { Header } from '../components/header.js';
import { apiClient } from "../api/apiClient.js";

export function renderRegister() {
  const el = htmlToElement(`<div class="page"></div>`);
  el.appendChild(Header({ user: null }));

  const registerModal = htmlToElement(`
    <div class="login-modal show">
      <h2>Register</h2>
      <form class="register-form">
        <input type="text" name="username" placeholder="Username" class="input" required />
        <input type="email" name="email" placeholder="Email" class="input" required />
        <input type="password" name="password" placeholder="Password" class="input" required />
        <input type="password" name="confirmPassword" placeholder="Confirm password" class="input" required />
        <div class="login-buttons">
          <button type="submit" class="btn">Register</button>
          <button type="button" class="btn login-btn">Back to login</button>
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
