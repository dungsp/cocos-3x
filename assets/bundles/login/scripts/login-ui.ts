import { Button, Color, Component, EditBox, Label, _decorator } from 'cc';

const { ccclass, property } = _decorator;

@ccclass('LoginUI')
export class LoginUI extends Component {
    @property(EditBox) private usernameInput!: EditBox;
    @property(EditBox) private passwordInput!: EditBox;

    @property(Label) private message: Label = null;

    @property(Button) button!: Button;

    public getUsername() {
        return this.usernameInput.string;
    }

    public getPassword() {
        return this.passwordInput.string;
    }

    public setMessage(message: string, color: Color = Color.BLACK) {
        this.message.string = message;
        this.message.color = color;
    }

    public setLoading(state: boolean) {
        this.button.interactable = !state;
    }
}
