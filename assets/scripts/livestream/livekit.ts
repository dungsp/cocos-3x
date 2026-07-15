import { _decorator, Component, Node, UITransform } from 'cc';
import {
    Room,
    RoomEvent,
    Track,
    RemoteParticipant,
    RemoteTrack,
    RemoteTrackPublication,
} from 'livekit-client';

const { ccclass, property } = _decorator;

@ccclass('LiveKitStreamManager')
export class LiveKitStreamManager extends Component {
    @property(Node)
    public videoPlaceholder: Node | null = null;

    @property({
        tooltip: 'Chiều rộng thiết kế của game',
    })
    public designWidth = 720;

    @property({
        tooltip: 'Chiều cao thiết kế của game',
    })
    public designHeight = 1280;

    @property({
        tooltip: 'Ví dụ: wss://your-project.livekit.cloud',
    })
    public livekitUrl = '';

    @property({
        tooltip: 'Backend endpoint trả về JSON { token: string }',
    })
    public tokenEndpoint = '';

    @property
    public roomName = 'default-room';

    @property
    public identity = '';

    @property({
        tooltip: 'Tự bật camera của người chơi khi connect',
    })
    public autoPublishCamera = false;

    @property({
        tooltip: 'Tự bật micro của người chơi khi connect',
    })
    public autoPublishMic = false;

    @property({
        tooltip: 'ID của thẻ canvas Cocos',
    })
    public canvasElementId = 'GameCanvas';

    private room: Room | null = null;

    private videoElements = new Map<string, HTMLVideoElement>();

    private canvasEl: HTMLCanvasElement | null = null;

    protected onLoad(): void {
        this.canvasEl = document.getElementById(
            this.canvasElementId,
        ) as HTMLCanvasElement | null;

        if (!this.canvasEl) {
            console.warn(
                `[LiveKitStreamManager] Không tìm thấy canvas #${this.canvasElementId}`,
            );
        }
    }

    /**
     * Nên gọi sau khi người dùng click/tap để tránh trình duyệt chặn autoplay.
     */
    public async connect(): Promise<void> {
        if (!this.livekitUrl || !this.tokenEndpoint) {
            console.error(
                '[LiveKitStreamManager] Chưa điền livekitUrl hoặc tokenEndpoint',
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

            console.log(
                '[LiveKitStreamManager] Đã kết nối phòng:',
                this.roomName,
            );

            if (this.autoPublishCamera) {
                await this.room.localParticipant.setCameraEnabled(true);
            }

            if (this.autoPublishMic) {
                await this.room.localParticipant.setMicrophoneEnabled(true);
            }
        } catch (error) {
            console.error('[LiveKitStreamManager] Lỗi khi connect:', error);
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
        const url =
            `${this.tokenEndpoint}` +
            `?room=${encodeURIComponent(this.roomName)}` +
            `&identity=${encodeURIComponent(this.identity)}`;

        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(`Không lấy được token, status: ${response.status}`);
        }

        const data = await response.json();

        if (!data.token) {
            throw new Error('Response backend không có field "token"');
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

    /**
     * Self-preview của camera local.
     */
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
         * getBoundingClientRect() trả tọa độ theo viewport,
         * vì vậy position fixed sẽ khớp trực tiếp.
         */
        videoEl.style.position = 'fixed';

        videoEl.style.objectFit = 'cover';
        videoEl.style.pointerEvents = 'none';
        videoEl.style.zIndex = '10';

        videoEl.style.margin = '0';
        videoEl.style.padding = '0';
        videoEl.style.border = 'none';

        /*
         * Tránh video hiện sai vị trí trong frame đầu tiên.
         */
        videoEl.style.left = '0px';
        videoEl.style.top = '0px';
        videoEl.style.width = '0px';
        videoEl.style.height = '0px';

        videoEl.setAttribute('playsinline', 'true');
        videoEl.setAttribute('webkit-playsinline', 'true');
    }

    private onDisconnected(): void {
        console.log('[LiveKitStreamManager] Đã ngắt kết nối');

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
     * Đồng bộ vị trí Node Cocos với thẻ video HTML.
     *
     * Canvas browser có thể rộng hơn vùng game 720 × 1280,
     * tạo ra hai dải đen hai bên.
     *
     * Hàm này tính riêng vùng game thật và bỏ qua phần màu đen.
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

        /*
         * Chỉ dùng một scale để không làm biến dạng game.
         */
        const gameScale = Math.min(
            canvasRect.width / this.designWidth,
            canvasRect.height / this.designHeight,
        );

        /*
         * Kích thước vùng game thật trên browser.
         */
        const gameWidthPx = this.designWidth * gameScale;

        const gameHeightPx = this.designHeight * gameScale;

        /*
         * Phần dư do letterbox:
         *
         * - Màn hình ngang: offsetX là hai dải đen hai bên.
         * - Màn hình quá cao: offsetY là vùng dư trên dưới.
         */
        const offsetX = (canvasRect.width - gameWidthPx) / 2;

        const offsetY = (canvasRect.height - gameHeightPx) / 2;

        /*
         * Tọa độ vùng game thật theo viewport browser.
         */
        const gameLeft = canvasRect.left + offsetX;

        const gameTop = canvasRect.top + offsetY;

        const gameRight = gameLeft + gameWidthPx;

        const gameBottom = gameTop + gameHeightPx;

        const worldPos = this.videoPlaceholder.worldPosition;

        const widthPx = uiTransform.width * gameScale;

        const heightPx = uiTransform.height * gameScale;

        /*
         * Cocos:
         * - Trục Y hướng lên.
         *
         * DOM:
         * - Trục Y hướng xuống.
         *
         * Anchor:
         * - left dùng anchorX.
         * - top dùng phần đối xứng 1 - anchorY sau khi lật trục Y.
         */
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

        /*
         * Cắt phần video tràn sang vùng đen.
         */
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
        void this.disconnect();
    }
}
