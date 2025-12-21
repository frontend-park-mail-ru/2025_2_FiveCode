import { showNotification } from "../components/notification";

const errorTranslations: Record<string, string> = {
  "user with this email already exists":
    "Пользователь с таким Email уже существует",
  "user already exists": "Пользователь уже существует",
  "invalid email or password": "Неверный Email или пароль",
  "invalid username":
    "Некорректное имя пользователя (допустимы латинские буквы и цифры)",
  "username must be between":
    "Имя пользователя должно быть от 3 до 50 символов",
  "passwords do not match": "Пароли не совпадают",
  "password is too short": "Пароль слишком короткий (минимум 8 символов)",
  "email is required": "Email обязателен",
  "user not authenticated": "Вы не авторизованы",
  "authentication required": "Требуется авторизация",
  "invalid session": "Сессия истекла. Пожалуйста, войдите снова",
  "no session cookie": "Не найдена сессия. Выполните вход",
  "session expired": "Время сессии истекло",

  "access denied": "Доступ запрещен",
  "permission denied": "Доступ запрещен",
  "no access to parent note": "Нет доступа к родительской заметке",
  "user has no access to note": "У вас нет доступа к этой заметке",
  "no access": "У вас нет доступа",
  "user cannot edit note": "У вас нет прав на редактирование этой заметки",
  "user cannot create sub-note": "Недостаточно прав для создания подзаметки",
  "only owner can delete note": "Только владелец может удалить эту заметку",
  "is not the note owner": "Вы не являетесь владельцем этой заметки",
  "cannot add note owner as collaborator":
    "Владелец заметки уже имеет полный доступ",
  "user already has access": "Этот пользователь уже добавлен",
  "permission does not belong to this note":
    "Ошибка прав доступа (неверный контекст)",
  "permission not found": "Пользователь не найден в списке участников",

  "cannot create sub-note of a sub-note": "Максимальный уровень вложенности: 1",
  "maximum nesting level is 1": "Максимальный уровень вложенности: 1",
  "parent note not found": "Родительская заметка не найдена",
  "note not found": "Заметка не найдена",
  "block not found": "Блок не найден",
  "invalid note id": "Некорректный ID заметки",
  "invalid block id": "Некорректный ID блока",
  "unsupported block type": "Неподдерживаемый тип блока",

  "file size exceeds": "Файл слишком большой (макс. 50МБ)",
  "invalid file type": "Недопустимый формат файла (разрешены изображения)",
  "file is required": "Файл не выбран",
  "failed to upload file": "Не удалось загрузить файл",
  "failed to get file": "Не удалось получить файл",

  "csrf token expired": "Токен безопасности истек. Обновите страницу",
  "csrf token invalid": "Ошибка проверки безопасности. Обновите страницу",
  csrf_token_missing: "Ошибка безопасности. Попробуйте снова",
  "csrf token session mismatch":
    "Ошибка сессии безопасности. Перезайдите в систему",

  "internal server error": "Внутренняя ошибка сервера",
  "bad request": "Некорректный запрос",
  "invalid request body": "Ошибка в данных запроса",
  "failed to parse": "Ошибка обработки данных",
  "not found": "Ресурс не найден",
};

export function getErrorMessage(error: any): string {
  let rawMessage = "Произошла неизвестная ошибка";

  if (error?.body?.error) {
    rawMessage = error.body.error;
  } else if (error?.message) {
    rawMessage = error.message;
  }

  const lowerRaw = rawMessage.toLowerCase();

  for (const [key, value] of Object.entries(errorTranslations)) {
    if (lowerRaw.includes(key)) {
      return value;
    }
  }

  if (rawMessage === "API Error") return "Ошибка соединения с сервером";
  if (rawMessage === "Failed to fetch") return "Нет соединения с сервером";

  return rawMessage;
}

export function handleError(
  error: any,
  defaultMessage: string = "Ошибка выполнения операции"
) {
  console.error(defaultMessage, error);
  const msg = getErrorMessage(error);

  const isTranslated =
    msg !== error?.body?.error &&
    msg !== error?.message &&
    msg !== "Произошла неизвестная ошибка";

  const displayMessage = isTranslated ? msg : defaultMessage;

  showNotification(displayMessage, "error");
}
