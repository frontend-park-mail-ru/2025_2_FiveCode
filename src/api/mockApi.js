// temporary
let users = JSON.parse(localStorage.getItem("mockUsers") || "[]");
let currentUser = JSON.parse(localStorage.getItem("mockCurrentUser") || "null");

function save() {
  localStorage.setItem("mockUsers", JSON.stringify(users));
  localStorage.setItem("mockCurrentUser", JSON.stringify(currentUser));
}

export const mockApi = {
  async register({ username, email, password }) {
    if (users.find(u => u.username === username)) {
      throw new Error("User already exists");
    }
    const user = { id: Date.now(), username, email, password };
    users.push(user);
    currentUser = { id: user.id, username, email };
    save();
    return currentUser;
  },

  async login({ username, password }) {
    const user = users.find(u => u.username === username && u.password === password);
    if (!user) {
      throw new Error("Invalid username or password");
    }
    currentUser = { id: user.id, username: user.username, email: user.email };
    save();
    return currentUser;
  },

  async me() {
    if (!currentUser) throw new Error("Not authenticated");
    return currentUser;
  },

  async logout() {
    currentUser = null;
    save();
    return { success: true };
  }
};
