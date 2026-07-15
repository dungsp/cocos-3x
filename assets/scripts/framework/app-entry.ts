import { _decorator, Component } from 'cc';
import { SceneManager } from './scene-manager';

const { ccclass } = _decorator;

@ccclass('AppEntry')
export class AppEntry extends Component {
    protected async onLoad() {
        await SceneManager.loadBundle('login', 'Login');
    }
}
