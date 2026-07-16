import { _decorator, Component } from 'cc';
import { Track } from 'livekit-client';
import { LiveKitStreamManager } from './livekit-manager';
const { ccclass, property } = _decorator;

@ccclass('LiveKitController')
export class LiveKitController extends Component {
    @property(LiveKitStreamManager)
    private stream: LiveKitStreamManager | null = null;

    protected onLoad(): void {
        if (!this.stream) {
            console.warn('[LiveKitController] Not assign LiveKitStreamManager');
        }
    }

    private get room() {
        return this.stream.room ?? null;
    }

    private get isHost() {
        return this.stream.isHost;
    }

    public async setCameraEnabled(enabled: boolean): Promise<void> {
        if (!this.guardHostAction('setCameraEnabled')) {
            return;
        }

        await this.room!.localParticipant.setCameraEnabled(enabled);
    }

    public async setMicEnabled(enabled: boolean): Promise<void> {
        if (!this.guardHostAction('setMicEnabled')) {
            return;
        }

        await this.room!.localParticipant.setMicrophoneEnabled(enabled);
    }

    public async setMicMuted(muted: boolean): Promise<void> {
        if (!this.guardHostAction('setMicMuted')) {
            return;
        }

        const micPub = this.room!.localParticipant.getTrackPublication(
            Track.Source.Microphone,
        );

        if (muted) {
            await micPub?.mute();
        } else {
            await micPub?.unmute();
        }
    }

    public async startLive(): Promise<void> {
        if (!this.guardHostAction('startLive')) {
            return;
        }

        await this.setCameraEnabled(true);
        await this.setMicEnabled(true);
    }

    public async stopLive(): Promise<void> {
        if (!this.guardHostAction('stopLive')) {
            return;
        }

        await this.setCameraEnabled(false);
        await this.setMicEnabled(false);
    }

    private guardHostAction(actionName: string): boolean {
        if (!this.room) {
            console.warn(
                `[LiveKitHostControls] ${actionName} passed: room didnt connect yet`,
            );

            return false;
        }

        if (!this.isHost) {
            console.warn(
                `[LiveKitHostControls] ${actionName} blocked: Current role is VIEWER`,
            );

            return false;
        }

        return true;
    }
}
