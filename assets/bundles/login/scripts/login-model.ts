export class LoginModel {
    username: string;
    password: string;

    checkValid(): boolean {
        return !!this.username && !!this.password;
    }

    login(): Promise<boolean> {
        return new Promise((res) => {
            setTimeout(() => {
                res(true);
            }, 2000);
        });
    }
}
