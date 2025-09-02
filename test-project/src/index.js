"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class UserManager {
    constructor() {
        this.users = [];
    }
    addUser(user) {
        this.users.push(user);
    }
    getUserById(id) {
        return this.users.find(user => user.id === id);
    }
    getAllUsers() {
        return [...this.users];
    }
}
const userManager = new UserManager();
userManager.addUser({
    id: 1,
    name: "张三",
    email: "zhangsan@example.com"
});
console.log("用户总数:", userManager.getAllUsers().length);
//# sourceMappingURL=index.js.map