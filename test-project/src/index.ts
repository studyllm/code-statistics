// 测试文件 - TypeScript
import { calculateSum } from '../utils/math';

interface User {
    id: number;
    name: string;
    email: string;
}

class UserManager {
    private users: User[] = [];

    addUser(user: User): void {
        this.users.push(user);
    }

    getUserById(id: number): User | undefined {
        return this.users.find(user => user.id === id);
    }

    getAllUsers(): User[] {
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