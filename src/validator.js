/**
 * Простейшая валидация полей.
 */
export function validateLogin({ username, password }){
  const errors = {};
  if (!username || username.trim().length < 3) errors.username = 'Имя должно быть не менее 3 символов';
  if (!password || password.length < 6) errors.password = 'Пароль должен быть не менее 6 символов';
  return errors;
}

export function displayErrors(formEl, errors){
  // удаляем старые
  formEl.querySelectorAll('.err').forEach(e=>e.remove());
  Object.entries(errors).forEach(([k,v])=>{
    const input = formEl.querySelector(`[name="${k}"]`);
    if (!input) return;
    const div = document.createElement('div');
    div.className='err';
    div.textContent = v;
    input.parentNode.appendChild(div);
  });
}
