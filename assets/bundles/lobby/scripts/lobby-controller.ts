import { _decorator, Button, Component } from 'cc';
import { SceneManager } from 'db://assets/scripts/framework/scene-manager';
import { LiveSessionParams } from 'db://assets/bundles/livestream/live-params';
import { UserSession } from 'db://assets/scripts/models/user';
import { LobbyUI } from './lobby-ui';
const { ccclass, property } = _decorator;

@ccclass('LobbyController')
export class LobbyController extends Component {
    @property(LobbyUI) private lobbyUI: LobbyUI | null;

    private isLoggingOut = false;

    protected onLoad(): void {
        this.lobbyUI.setWelcome();

        this.lobbyUI?.joinRoomBtn.node?.on(
            Button.EventType.CLICK,
            this.onJoinRoom,
            this,
        );

        this.lobbyUI?.logoutBtn.node?.on(
            Button.EventType.CLICK,
            this.onLogout,
            this,
        );
    }

    private async onLogout(): Promise<void> {
        if (this.isLoggingOut) return;

        this.isLoggingOut = true;

        if (this.lobbyUI?.logoutBtn) {
            this.lobbyUI.logoutBtn.interactable = false;
        }

        UserSession.clear();

        try {
            await SceneManager.loadBundle('login', 'Login');
        } catch (error) {
            console.error('Failed to load login scene:', error);

            this.isLoggingOut = false;

            if (this.lobbyUI?.logoutBtn?.isValid) {
                this.lobbyUI.logoutBtn.interactable = true;
            }
        }
    }

    private async onJoinRoom() {
        const searchVal = this.lobbyUI.searchInput.string.trim();

        if (!searchVal) {
            console.warn('[LobbyController] Missing search input');
            return;
        }

        LiveSessionParams.roomName = searchVal;

        try {
            await SceneManager.loadBundle('livestream', 'Livestream');
        } catch (error) {
            console.error('[LobbyController] Failed load Scene', error);
        }
    }

    protected onDestroy(): void {
        if (this.lobbyUI?.joinRoomBtn?.node?.isValid) {
            this.lobbyUI.joinRoomBtn.node.off(
                Button.EventType.CLICK,
                this.onJoinRoom,
                this,
            );
        }
        if (this.lobbyUI?.logoutBtn?.node?.isValid) {
            this.lobbyUI.logoutBtn.node.off(
                Button.EventType.CLICK,
                this.onLogout,
                this,
            );
        }
    }
}
