interface User {
    id?: number;
    username?: string;
    password?: string;
    email?: string;
}
export declare function saveUser(user: User): void;
export declare function loadUser(): any;
export declare function clearUser(): void;
export {};
