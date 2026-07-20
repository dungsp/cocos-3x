import { _decorator, Button, Component, Node } from 'cc';
import { PopupController } from '../../../common_ui/scripts/popup';

const { ccclass, property } = _decorator;

@ccclass('FooterManager')
export class FooterManager extends Component {
    @property(PopupController) private popup: PopupController | null = null;

    @property(Node) private chatPanel: Node | null = null;

    @property(Button) private openChatBtn: Button | null = null;
    @property(Button) private closeChatBtn: Button | null = null;

    protected onLoad() {
        this.openChatBtn?.node.on(Button.EventType.CLICK, this.openChat, this);
        this.closeChatBtn?.node.on(
            Button.EventType.CLICK,
            this.closeChat,
            this,
        );
    }

    private openChat() {
        if (!this.popup || !this.chatPanel) return;

        this.popup.open(this.chatPanel);
    }

    private closeChat() {
        this.popup?.close();
    }
}
