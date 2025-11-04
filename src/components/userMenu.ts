import ejs from 'ejs';

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
                <button class="user-menu__btn settings-btn" style="border: 1px var(--primary-300) solid;">
                    <img src="<%= settingsIcon %>" style="width: 20px; height: 20px;"> Настройки</button>
                <button class="user-menu__btn logout-btn" style="border: 1px var(--danger-500) solid;">
                    <img src="<%= logoutIcon %>" style="width: 20px; height: 20px;"> Выйти</button>
            </div>
        </div>
    `;

    const container = document.createElement('div');
    container.innerHTML = ejs.render(template, { user, userIcon, isVisible, position, settingsIcon, logoutIcon });
    const el = container.firstElementChild as HTMLElement;

    return el;
}