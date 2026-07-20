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
const MAX_UNREAD_DISPLAY = 99;

@ccclass('LiveChatController')
export class LiveChatController extends Component {
    @property(LiveChatManager)
    private chatManger: LiveChatManager | null = null;

    @property(EditBox) private input!: EditBox;
    @property(Button) private button!: Button;

    @property(Prefab) private msgPrefab: Prefab | null = null;

    @property(Node) private content: Node | null = null;

    @property(ScrollView) private scrollView: ScrollView | null = null;

    // --- Modal ---
    @property({
        type: Node,
        tooltip: 'Node gốc của popup chat (chứa list tin nhắn + input)',
    })
    private modalRoot: Node | null = null;

    @property({
        type: Button,
        tooltip: 'Nút bên ngoài dùng để mở/đóng modal chat',
    })
    private toggleModalButton: Button | null = null;

    @property({
        type: Button,
        tooltip: 'Nút đóng (nằm bên trong modal), có thể để trống',
    })
    private closeModalButton: Button | null = null;

    @property({
        type: Node,
        tooltip: 'Badge hiển thị số tin nhắn chưa đọc, có thể để trống',
    })
    private unreadBadge: Node | null = null;

    @property({
        type: Label,
        tooltip: 'Label hiển thị số tin nhắn chưa đọc, có thể để trống',
    })
    private unreadLabel: Label | null = null;

    private isModalOpen = false;
    private unreadCount = 0;

    protected onLoad(): void {
        this.button.node?.on(Button.EventType.CLICK, this.onSubmit, this);

        this.toggleModalButton?.node?.on(
            Button.EventType.CLICK,
            this.toggleModal,
            this,
        );

        this.closeModalButton?.node?.on(
            Button.EventType.CLICK,
            this.closeModal,
            this,
        );

        // Mặc định đóng modal, ẩn badge khi chưa có tin nhắn
        this.setModalActive(false);
        this.updateUnreadBadge();

        if (!this.chatManger) {
            console.error('[LiveChatController] Missing chatManager');

            return;
        }

        if (!this.msgPrefab || !this.content) {
            console.error('[LiveChatController] Missing msgPrefab or Content');
        }

        this.chatManger.onMessage = this.onMessage.bind(this);
    }

    public openModal(): void {
        this.setModalActive(true);
        this.unreadCount = 0;
        this.updateUnreadBadge();
        this.scrollToBottom();
    }

    public closeModal(): void {
        this.setModalActive(false);
    }

    public toggleModal(): void {
        if (this.isModalOpen) {
            this.closeModal();
        } else {
            this.openModal();
        }
    }

    private setModalActive(active: boolean): void {
        this.isModalOpen = active;

        if (this.modalRoot) {
            this.modalRoot.active = active;
        }
    }

    private updateUnreadBadge(): void {
        if (!this.unreadBadge) return;

        const hasUnread = this.unreadCount > 0;

        this.unreadBadge.active = hasUnread;

        if (hasUnread && this.unreadLabel) {
            this.unreadLabel.string =
                this.unreadCount > MAX_UNREAD_DISPLAY
                    ? `${MAX_UNREAD_DISPLAY}+`
                    : `${this.unreadCount}`;
        }
    }

    private onMessage(message: ChatMessage) {
        this.renderMsg(message);
        this.trimOldMessages();
        this.scrollToBottom();

        if (!this.isModalOpen && !message.isMine) {
            this.unreadCount += 1;
            this.updateUnreadBadge();
        }
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

        if (!this.chatManger || !message.trim()) {
            return;
        }

        this.input.string = '';

        await this.chatManger.sendMessage(message);
    }

    protected onDestroy(): void {
        this.button.node?.off(Button.EventType.CLICK, this.onSubmit, this);
        this.toggleModalButton?.node?.off(
            Button.EventType.CLICK,
            this.toggleModal,
            this,
        );
        this.closeModalButton?.node?.off(
            Button.EventType.CLICK,
            this.closeModal,
            this,
        );

        if (this.chatManger) {
            this.chatManger = null;
        }
    }
}
