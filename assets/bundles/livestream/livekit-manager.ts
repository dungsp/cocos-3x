import { _decorator, Component, Node, UITransform } from 'cc';
import {
    RemoteParticipant,
    RemoteTrack,
    RemoteTrackPublication,
    Room,
    RoomEvent,
    Track,
} from 'livekit-client';
import { UserSession } from '../../scripts/models/user';
import { LiveSessionParams } from './live-params';

const { ccclass, property } = _decorator;

@ccclass('LiveKitStreamManager')
export class LiveKitStreamManager extends Component {
    @property(Node)
    public videoPlaceholder: Node | null = null;

    @property()
    public canvasElementId = 'GameCanvas';

    public designWidth = 720;
    public designHeight = 1280;

    public tokenEndpoint = 'http://localhost:3001/get-token';
    public livekitUrl = 'wss://cocos-yt9r3slt.livekit.cloud';
    public roomId = '';

    public identity = '';

    public autoPublishCamera = false;
    public autoPublishMic = false;

    public room: Room | null = null;
    private videoElements = new Map<string, HTMLVideoElement>();
    private canvasEl: HTMLCanvasElement | null = null;

    protected onLoad(): void {
        this.canvasEl = document.getElementById(
            this.canvasElementId,
        ) as HTMLCanvasElement | null;

        if (!this.canvasEl) {
            console.warn(
                `[LiveKitStreamManager] Not found Canvas: #${this.canvasElementId}`,
            );
        }

        this.resolveRoleFromUserSession();
        this.applySessiontParams();
    }

    private resolveRoleFromUserSession() {
        const user = UserSession.getUser();

        if (!user) {
            console.warn('Missing User information');
            return;
        }
        this.identity = user.username;
    }

    private applySessiontParams() {
        console.log('LiveSessionParams.roomName: ', LiveSessionParams.roomId);
        this.roomId = LiveSessionParams.roomId;
    }

    public async connect(): Promise<void> {
        if (!this.livekitUrl || !this.tokenEndpoint) {
            console.error(
                '[LiveKitStreamManager] Missing livekitUrl or tokenEndpoint',
            );

            return;
        }

        try {
            const token = await this.fetchToken();

            this.room = new Room();

            this.room.on(
                RoomEvent.TrackSubscribed,
                this.onTrackSubscribed.bind(this),
            );

            this.room.on(
                RoomEvent.TrackUnsubscribed,
                this.onTrackUnsubscribed.bind(this),
            );

            this.room.on(
                RoomEvent.LocalTrackPublished,
                this.onLocalTrackPublished.bind(this),
            );

            this.room.on(
                RoomEvent.LocalTrackUnpublished,
                this.onLocalTrackUnpublished.bind(this),
            );

            this.room.on(
                RoomEvent.Disconnected,
                this.onDisconnected.bind(this),
            );

            await this.room.connect(this.livekitUrl, token);

            console.log('[LiveKitStreamManager] Room connected:', this.roomId);

            // if (this.autoPublishCamera) {
            //     await this.room.localParticipant.setCameraEnabled(true);
            // }

            // if (this.autoPublishMic) {
            //     await this.room.localParticipant.setMicrophoneEnabled(true);
            // }
        } catch (error) {
            console.error('[LiveKitStreamManager] Connected error:', error);
        }
    }

    public async disconnect(): Promise<void> {
        if (this.room) {
            await this.room.disconnect();
            this.room = null;
        }

        this.clearAllVideoElements();
    }

    private async fetchToken(): Promise<string> {
        console.log({
            roomId: this.roomId,
            identity: this.identity,
        });
        const user = UserSession.getUser();

        if (!user) {
            throw new Error('User chưa đăng nhập');
        }

        const response = await fetch('http://localhost:3001/get-token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-user-id': user.userId,
            },
            body: JSON.stringify({
                room: this.roomId,
                name: user.username,
            }),
        });

        if (!response.ok) {
            throw new Error(
                `[LiveKitStreamManager] Get Token failed, status: ${response.status}`,
            );
        }

        const data = await response.json();

        if (!data.token) {
            throw new Error(
                '[LiveKitStreamManager] Get Token failed, empty token',
            );
        }

        return data.token as string;
    }

    private onTrackSubscribed(
        track: RemoteTrack,
        _publication: RemoteTrackPublication,
        participant: RemoteParticipant,
    ): void {
        if (track.kind === Track.Kind.Audio) {
            track.attach();
            return;
        }

        if (track.kind !== Track.Kind.Video) {
            return;
        }

        const identity = participant.identity;

        this.removeVideoElement(identity);

        const videoEl = track.attach() as HTMLVideoElement;

        this.setupVideoElement(videoEl, `livekit-video-${identity}`);

        document.body.appendChild(videoEl);

        this.videoElements.set(identity, videoEl);

        this.syncVideoPosition(videoEl);
    }

    private onTrackUnsubscribed(
        track: RemoteTrack,
        _publication: RemoteTrackPublication,
        participant: RemoteParticipant,
    ): void {
        track.detach().forEach((element) => {
            element.remove();
        });

        this.videoElements.delete(participant.identity);
    }

    private onLocalTrackPublished(publication: any): void {
        const track = publication.track;

        if (!track) {
            return;
        }

        if (track.kind === Track.Kind.Audio) {
            return;
        }

        if (track.kind !== Track.Kind.Video) {
            return;
        }

        const identity = this.room?.localParticipant.identity ?? 'local';

        this.removeVideoElement(identity);

        const videoEl = track.attach() as HTMLVideoElement;

        videoEl.muted = true;

        this.setupVideoElement(videoEl, `livekit-video-${identity}`);

        document.body.appendChild(videoEl);

        this.videoElements.set(identity, videoEl);

        this.syncVideoPosition(videoEl);
    }

    private onLocalTrackUnpublished(publication: any): void {
        const identity = this.room?.localParticipant.identity ?? 'local';

        if (publication.track) {
            publication.track.detach().forEach((element: HTMLVideoElement) => {
                element.remove();
            });
        }

        this.videoElements.delete(identity);
    }

    private setupVideoElement(videoEl: HTMLVideoElement, id: string): void {
        videoEl.id = id;

        /*
         * getBoundingClientRect() return position following viewport,
         */
        videoEl.style.position = 'fixed';

        videoEl.style.objectFit = 'cover';
        videoEl.style.pointerEvents = 'none';
        videoEl.style.zIndex = '10';

        videoEl.style.margin = '0';
        videoEl.style.padding = '0';
        videoEl.style.border = 'none';

        videoEl.style.left = '0px';
        videoEl.style.top = '0px';
        videoEl.style.width = '0px';
        videoEl.style.height = '0px';

        videoEl.setAttribute('playsinline', 'true');
        videoEl.setAttribute('webkit-playsinline', 'true');
    }

    private onDisconnected(): void {
        console.log('[LiveKitStreamManager] Disconnected');

        this.clearAllVideoElements();
    }

    private removeVideoElement(identity: string): void {
        const oldVideo = this.videoElements.get(identity);

        if (!oldVideo) {
            return;
        }

        oldVideo.remove();
        this.videoElements.delete(identity);
    }

    private clearAllVideoElements(): void {
        this.videoElements.forEach((videoEl) => {
            videoEl.remove();
        });

        this.videoElements.clear();
    }

    protected update(): void {
        if (
            this.videoElements.size === 0 ||
            !this.videoPlaceholder ||
            !this.canvasEl
        ) {
            return;
        }

        this.videoElements.forEach((videoEl) => {
            this.syncVideoPosition(videoEl);
        });
    }

    /**
     * Slice universe black outside canvas 720px
     */
    private syncVideoPosition(videoEl: HTMLVideoElement): void {
        if (
            !this.videoPlaceholder ||
            !this.canvasEl ||
            this.designWidth <= 0 ||
            this.designHeight <= 0
        ) {
            return;
        }

        const uiTransform = this.videoPlaceholder.getComponent(UITransform);

        if (!uiTransform) {
            return;
        }

        const canvasRect = this.canvasEl.getBoundingClientRect();

        const gameScale = Math.min(
            canvasRect.width / this.designWidth,
            canvasRect.height / this.designHeight,
        );

        const gameWidthPx = this.designWidth * gameScale;

        const gameHeightPx = this.designHeight * gameScale;

        const offsetX = (canvasRect.width - gameWidthPx) / 2;

        const offsetY = (canvasRect.height - gameHeightPx) / 2;

        const gameLeft = canvasRect.left + offsetX;

        const gameTop = canvasRect.top + offsetY;

        const gameRight = gameLeft + gameWidthPx;

        const gameBottom = gameTop + gameHeightPx;

        const worldPos = this.videoPlaceholder.worldPosition;

        const widthPx = uiTransform.width * gameScale;

        const heightPx = uiTransform.height * gameScale;

        const leftPx =
            gameLeft + worldPos.x * gameScale - widthPx * uiTransform.anchorX;

        const topPx =
            gameTop +
            (this.designHeight - worldPos.y) * gameScale -
            heightPx * (1 - uiTransform.anchorY);

        videoEl.style.left = `${leftPx}px`;
        videoEl.style.top = `${topPx}px`;
        videoEl.style.width = `${widthPx}px`;
        videoEl.style.height = `${heightPx}px`;

        const videoRight = leftPx + widthPx;
        const videoBottom = topPx + heightPx;

        const clipLeft = Math.max(0, gameLeft - leftPx);

        const clipTop = Math.max(0, gameTop - topPx);

        const clipRight = Math.max(0, videoRight - gameRight);

        const clipBottom = Math.max(0, videoBottom - gameBottom);

        videoEl.style.clipPath =
            `inset(${clipTop}px ` +
            `${clipRight}px ` +
            `${clipBottom}px ` +
            `${clipLeft}px)`;
    }

    protected onDestroy(): void {
        LiveSessionParams.clear();
        void this.disconnect();
    }
}
