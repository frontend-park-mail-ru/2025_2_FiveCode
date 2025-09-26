export const apiClient = {
  async login({ username, password }) {
    if (username === "test" && password === "123456") {
      document.cookie = "session=mockSessionId; path=/; max-age=3600";
      const user = { username };
      localStorage.setItem("mockCurrentUser", JSON.stringify(user));
      return user;
    }
    throw new Error("Invalid credentials");
  },

  async register({ username, password }) {
    // эмуляция регистрации
    return this.login({ username, password });
  },

  async logout() {
    document.cookie = "session=; path=/; max-age=0";
    localStorage.removeItem("mockCurrentUser");
  },

  async me() {
    const user = localStorage.getItem("mockCurrentUser");
    if (user) return JSON.parse(user);
    throw new Error("Not authenticated");
  }
};
