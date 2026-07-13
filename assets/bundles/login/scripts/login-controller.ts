import { _decorator, Button, Color, Component } from 'cc';
import { LoginModel } from './login-model';
import { LoginUI } from './login-ui';
import { SceneManager } from 'db://assets/scripts/framework/scene-manager';

const { ccclass, property } = _decorator;

@ccclass('LoginController')
export class LoginController extends Component {
    @property(LoginUI) UI!: LoginUI;

    private model = new LoginModel();

    protected onLoad(): void {
        this.UI.button.node?.on(
            Button.EventType.CLICK,
            () => {
                this.onSubmit();
            },
            this,
        );
    }

    private async onSubmit() {
        this.model.username = this.UI.getUsername();
        this.model.password = this.UI.getPassword();

        if (!this.model.checkValid()) {
            this.UI.setMessage('Missing username or password', Color.RED);
            return;
        }

        this.UI.setLoading(true);
        this.UI.setMessage('Connecting to server...', Color.CYAN);

        try {
            await this.model.login();

            await SceneManager.loadBundle('lobby', 'Lobby');
        } catch (error) {
        } finally {
            this.UI.setLoading(false);
        }
    }

    protected onDestroy(): void {
        this.UI.button.node?.off(Button.EventType.CLICK);
    }
}
