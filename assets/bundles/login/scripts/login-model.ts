import { User } from 'db://assets/scripts/models/user';

export class LoginModel {
    username: string;
    password: string;

    checkValid(): boolean {
        return !!this.username && !!this.password;
    }

    login(): Promise<User> {
        return new Promise((res) => {
            setTimeout(() => {
                res({
                    userId: new Date() + '',
                    isHost: this.username.includes('a'),
                    username: this.username,
                });
            }, 2000);
        });
    }
}
