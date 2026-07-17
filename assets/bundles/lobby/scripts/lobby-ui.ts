import { _decorator, Button, Component, EditBox, Label } from 'cc';
import { UserSession } from 'db://assets/scripts/models/user';
import { LogService } from 'db://assets/scripts/services/log';
const { ccclass, property } = _decorator;

@ccclass('LobbyUI')
export class LobbyUI extends Component {
    @property(Label) username: Label | null = null;

    @property(EditBox) searchInput: EditBox | null = null;

    @property(Button) joinRoomBtn: Button | null = null;
    @property(Button) logoutBtn: Button | null = null;

    protected onLoad(): void {
        LogService.checkAssignments(this, [
            'joinRoomBtn',
            'username',
            'logoutBtn',
            'searchInput',
        ]);
    }

    public setWelcome() {
        this.username.string = `Welcome, ` + UserSession.getUser().username;
    }
}
