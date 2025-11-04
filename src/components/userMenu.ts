import ejs from 'ejs';

const ICONS = {
  default_file: new URL('../static/svg/icon_dot.svg', import.meta.url).href,
  icon_triangle: new URL('../static/svg/icon_triangle.svg', import.meta.url).href,
  icon_shared: new URL('../static/svg/icon_shared.svg', import.meta.url).href,
  icon_folder: new URL('../static/svg/icon_folder.svg', import.meta.url).href,
  icon_close: new URL('../static/svg/icon_close.svg', import.meta.url).href,
};

interface User {
    id?: number;
    username?: string;
    password?: string;
    email?: string;
}

interface UserMenuParams {
    user: User | null;
    userIcon: string;
    isVisible?: boolean;
    position?: { top: number; left: number };
    settingsIcon?: string;
    logoutIcon?: string;
}


export function UserMenu({ user, userIcon, isVisible = false, position, settingsIcon, logoutIcon }: UserMenuParams): HTMLElement {
    const template = `
        <div class="user-menu" role="menu" style="display: <%= isVisible ? 'block' : 'none' %>; position: fixed; top: <%= position?.top %>px; left: <%= position?.left %>px;">
            <div class="user-menu__profile">
                <img src="<%= userIcon %>" class="user-menu__avatar" alt="avatar" />
                <div class="user-menu__meta">
                    <div class="user-menu__name"><%= user?.email?.split('@')[0] || 'Имя' %></div>
                    <div class="user-menu__email"><%= user?.email || '' %></div>
                </div>
            </div>
            <div class="user-menu__actions">
                <button class="user-menu__btn user-menu__btn--settings" style="border: 1px var(--primary-300) solid;">
                    <img src="<%= settingsIcon %>" style="width: 20px; height: 20px;"> Настройки</button>
                <button class="user-menu__btn user-menu__btn--logout" style="border: 1px var(--danger-500) solid;">
                    <img src="<%= logoutIcon %>" style="width: 20px; height: 20px;"> Выйти</button>
            </div>
        </div>
    `;

    const container = document.createElement('div');
    container.innerHTML = ejs.render(template, { user, userIcon, isVisible, position, settingsIcon, logoutIcon });
    const el = container.firstElementChild as HTMLElement;
    return el;
}

interface AccountSettingsParams {
    user: User | null;
    userIcon: string;
    isVisible?: boolean;
}

export function AccountSettings({user, userIcon, isVisible = false} : AccountSettingsParams) : HTMLElement {
    const template = `
        <div class="account-settings">
        <div class="account-settings-header">
            <h2>Настройки аккаунта</h2>
            <button class="close-button"><img src="<%= close %>"></button>
        </div>

        <div class="account-settings-content">
            <div class="avatar-section">
            <p>Аватар</p>
            <div class="avatar-placeholder">
                <div class="avatar"><img src="<%= userIcon %>"></div>
            </div>
            </div>

            <div class="name-section">
            <p>Имя</p>
            <input type="text" value="<%= user?.email?.split('@')[0] || 'Имя' %>" placeholder="Имя" />
            </div>

            <div class="email-section">
            <p>Ваша почта</p>
            <input type="email" value="<%= user?.email %>" readonly />
            </div>

            <div class="actions">
            <button class="save-button">Сохранить</button>
            <button class="cancel-button">Отменить изменения</button>
            </div>
        </div>

        <div class="delete-account-section">
            <h3>Осторожно!</h3>
            <button class="delete-account-button">Удалить аккаунт</button>
        </div>
        </div>
        `
    const container = document.createElement('div');
    container.innerHTML = ejs.render(template, { user, userIcon, isVisible, close: ICONS.icon_close });
    const el = container.firstElementChild as HTMLElement;
    return el;
}