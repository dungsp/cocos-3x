import { _decorator, Component, Node } from 'cc';
import { BetManager } from './bet-manager';

const { ccclass, property } = _decorator;

@ccclass('BetAction')
export class BetAction extends Component {
    @property(Node) btnOk: Node | null = null;
    @property(Node) btnRepeat: Node | null = null;
    @property(Node) btnCancel: Node | null = null;

    onLoad() {
        this.btnOk!.on(
            Node.EventType.TOUCH_END,
            () => BetManager.instance.confirmBets(),
            this,
        );
        this.btnRepeat!.on(
            Node.EventType.TOUCH_END,
            () => BetManager.instance.repeatLastRound(),
            this,
        );
        this.btnCancel!.on(
            Node.EventType.TOUCH_END,
            () => BetManager.instance.cancelBets(),
            this,
        );
    }
}
