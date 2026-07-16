import { _decorator, Button, Component } from 'cc';
import { LiveKitStreamManager } from '../../../scripts/livestream/livekit-manager';
const { ccclass, property } = _decorator;

@ccclass('HomeController')
export class HomeController extends Component {
    @property(Button) button!: Button;

    @property(LiveKitStreamManager) livekit: LiveKitStreamManager;

    protected onLoad(): void {
        this.button.node?.on(Button.EventType.CLICK, this.onShow, this);
    }

    private onShow() {
        if (!this.livekit) {
            console.warn('Missing livekit!');
            return;
        }

        this.livekit.connect();
    }

    protected onDestroy(): void {
        this.button.node?.off(Button.EventType.CLICK, this.onShow, this);
    }
}
