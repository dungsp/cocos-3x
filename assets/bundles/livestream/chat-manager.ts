import { _decorator, Component } from 'cc';
import { Room } from 'livekit-client';
import { LiveKitStreamManager } from './livekit-manager';
const { ccclass, property } = _decorator;

export interface ChatMessage {
    id: string;
    text: string;
    senderIdentity: string;
    timestamp: number;
    isMine: boolean;
}

const CHAT_TOPIC = 'lk.chat';

@ccclass('LiveChatManager')
export class LiveChatManager extends Component {
    @property(LiveKitStreamManager)
    private stream: LiveKitStreamManager | null = null;

    public onMessage: ((message: ChatMessage) => void) | null = null;

    private handlerRegisteredFor: Room | null = null;

    protected onLoad(): void {
        if (!this.stream) {
            console.warn('[LiveChatManager] Missing LiveKitStreamManager');
        }

        this.schedule(this.checkRoomReady, 0.3);
    }

    private checkRoomReady() {
        const room = this.stream?.room;

        if (room && room !== this.handlerRegisteredFor) {
            this.registerHandler(room);
            return;
        }

        if (!room) {
            this.handlerRegisteredFor = null;
        }
    }

    private registerHandler(room: Room) {
        room.registerTextStreamHandler(
            CHAT_TOPIC,
            async (reader, participantInfo) => {
                try {
                    const text = await reader.readAll();

                    const msg: ChatMessage = {
                        id: reader.info.id,
                        text,
                        senderIdentity: participantInfo.identity,
                        timestamp: reader.info.timestamp,
                        isMine:
                            participantInfo.identity ===
                            room.localParticipant.identity,
                    };

                    this.onMessage?.(msg);
                } catch (error) {
                    console.error(
                        '[LiveChatManager] Read message error:',
                        error,
                    );
                }
            },
        );

        this.handlerRegisteredFor = room;
    }

    public async sendMessage(text: string): Promise<void> {
        const room = this.stream?.room;

        if (!room) {
            console.warn('[LiveChatManager] Missing LiveKitStreamManager');

            return;
        }

        const trimmed = text.trim();

        if (!trimmed) {
            return;
        }

        try {
            await room.localParticipant.sendText(trimmed, {
                topic: CHAT_TOPIC,
            });

            const msg: ChatMessage = {
                id: `local-${Date.now()}`,
                text: trimmed,
                senderIdentity: room.localParticipant.identity,
                timestamp: Date.now(),
                isMine: true,
            };

            this.onMessage?.(msg);
        } catch (error) {
            console.error('[LiveKitChatManager] Gửi chat thất bại:', error);
        }
    }

    protected onDestroy(): void {
        this.unschedule(this.checkRoomReady);
    }
}
