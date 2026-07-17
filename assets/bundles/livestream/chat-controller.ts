import {
    _decorator,
    Button,
    Component,
    EditBox,
    instantiate,
    Label,
    Node,
    Prefab,
    ScrollView,
} from 'cc';

import { ChatMessage, LiveChatManager } from './chat-manager';
const { ccclass, property } = _decorator;

const MAX_MESSAGES = 200;

@ccclass('LiveChatController')
export class LiveChatController extends Component {
    @property(LiveChatManager)
    private chatManger: LiveChatManager | null = null;

    @property(EditBox) private input!: EditBox;
    @property(Button) private button!: Button;

    @property(Prefab) private msgPrefab: Prefab | null = null;

    @property(Node) private content: Node | null = null;

    @property(ScrollView) private scrollView: ScrollView | null = null;

    protected onLoad(): void {
        this.button.node?.on(Button.EventType.CLICK, this.onSubmit, this);

        if (!this.chatManger) {
            console.error('[LiveChatController] Missing chatManager');

            return;
        }

        if (!this.msgPrefab || !this.content) {
            console.error('[LiveChatController] Missing msgPrefab or Content');
        }

        this.chatManger.onMessage = this.onMessage.bind(this);
    }

    private onMessage(message: ChatMessage) {
        this.renderMsg(message);
        this.trimOldMessages();
        this.scrollToBottom();
    }

    private renderMsg(message: ChatMessage) {
        if (!this.msgPrefab || !this.content) {
            return;
        }

        const item = instantiate(this.msgPrefab);

        const label =
            item.getComponent(Label) ?? item.getComponentInChildren(Label);

        if (label) {
            const displayName = message.isMine ? 'Bạn' : message.senderIdentity;

            label.string = `${displayName}: ${message.text}`;
        } else {
            console.warn('[LiveChatController] mgs prefabs not have Label');
        }

        this.content.addChild(item);
    }

    private trimOldMessages() {
        if (!this.content) return;

        const children = this.content.children;

        while (children.length > MAX_MESSAGES) {
            children[0].destroy();
        }
    }

    private scrollToBottom() {
        if (!this.scrollView) return;

        this.scheduleOnce(() => {
            this.scrollView.scrollToBottom(0.15);
        }, 0);
    }

    private async onSubmit() {
        const message = this.input.string;

        await this.chatManger.sendMessage(message);
    }

    protected onDestroy(): void {
        this.button.node?.off(Button.EventType.CLICK, this.onSubmit, this);

        if (this.chatManger) {
            this.chatManger = null;
        }
    }
}
