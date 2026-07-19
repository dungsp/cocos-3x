import { _decorator, Component } from 'cc';
import { LiveKitStreamManager } from '../../../livestream/livekit-manager';

const { ccclass, property } = _decorator;

@ccclass('BaccaratControler')
export class BaccaratControler extends Component {
    @property(LiveKitStreamManager)
    private liveKit: LiveKitStreamManager | null = null;

    protected onLoad(): void {}

    protected start(): void {
        if (this.liveKit) {
            this.liveKit.connect();
        }
    }
}
