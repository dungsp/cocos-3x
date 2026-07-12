export interface User {
    userId: string;
    avatar: string;
    username: string;
    fullname: string;
    balance: number;
}

export class UserSession {
    private static _token: string | null = null;
    private static _user: User | null = null;

    static setToken(token: string) {
        this._token = token;
    }

    static getToken() {
        return this._token;
    }

    static getUser() {
        return this._user;
    }

    static updateBalance(balance: number) {
        if (!this._user) return;

        this._user.balance = balance;
    }

    static clear() {
        this._token = null;
        this._user = null;
    }
}
