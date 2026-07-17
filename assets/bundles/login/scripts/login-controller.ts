import {
    _decorator,
    Button,
    Color,
    Component,
    ResolutionPolicy,
    view,
} from 'cc';
import { SceneManager } from 'db://assets/scripts/framework/scene-manager';
import { LoginModel } from './login-model';
import { LoginUI } from './login-ui';
import { UserSession } from 'db://assets/scripts/models/user';

const { ccclass, property } = _decorator;

view.setDesignResolutionSize(720, 1280, ResolutionPolicy.SHOW_ALL);
view.resizeWithBrowserSize(true);

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
            const user = await this.model.login();

            this.UI.setLoading(false);

            UserSession.setUser(user);

            await SceneManager.loadBundle('lobby', 'Lobby');
        } catch (error) {
            this.UI.setLoading(false);
        }
    }
}
