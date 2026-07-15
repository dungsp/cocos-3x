import { _decorator, Component, Node, UITransform, view } from 'cc';
import {
    Room,
    RoomEvent,
    Track,
    RemoteParticipant,
    RemoteTrack,
    RemoteTrackPublication,
} from 'livekit-client';

const { ccclass, property } = _decorator;

/**
 * Component quản lý kết nối LiveKit + hiển thị video overlay đè lên canvas Cocos.
 * Gắn component này vào 1 Node bất kỳ trong scene (thường là 1 Node quản lý/manager).
 *
 * Cách dùng:
 * 1. Kéo Node placeholder (nơi video sẽ hiển thị) vào field `videoPlaceholder`.
 * 2. Điền `livekitUrl`, `tokenEndpoint`, `roomName`, `identity`.
 * 3. Gọi `connect()` sau khi user tương tác (vd bấm nút "Vào phòng live"),
 *    vì trình duyệt chặn autoplay audio/video nếu chưa có tương tác.
 */
@ccclass('LiveKitStreamManager')
export class LiveKitStreamManager extends Component {
    @property(Node)
    public videoPlaceholder: Node | null = null; // Node quyết định vị trí + kích thước video

    @property({ tooltip: 'vd: wss://your-project.livekit.cloud' })
    public livekitUrl: string = '';

    @property({ tooltip: 'Backend endpoint trả về JSON { token: string }' })
    public tokenEndpoint: string = '';

    @property
    public roomName: string = 'default-room';

    @property
    public identity: string = '';

    @property({ tooltip: 'Tự bật camera của người chơi (publish) khi connect' })
    public autoPublishCamera: boolean = false;

    @property({ tooltip: 'Tự bật mic của người chơi (publish) khi connect' })
    public autoPublishMic: boolean = false;

    @property({ tooltip: 'id của thẻ canvas Cocos trong index.html' })
    public canvasElementId: string = 'GameCanvas';

    private room: Room | null = null;
    private videoElements: Map<string, HTMLVideoElement> = new Map();
    private canvasEl: HTMLCanvasElement | null = null;

    onLoad() {
        this.canvasEl = document.getElementById(
            this.canvasElementId,
        ) as HTMLCanvasElement;
        if (!this.canvasEl) {
            console.warn(
                `[LiveKitStreamManager] Không tìm thấy canvas #${this.canvasElementId}, ` +
                    `kiểm tra lại id trong build-templates/web-mobile/index.html`,
            );
        }
    }

    /** Gọi hàm này sau khi user đã tương tác (click/tap) để tránh bị chặn autoplay. */
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
                RoomEvent.Disconnected,
                this.onDisconnected.bind(this),
            );
            // Quan trọng: TrackSubscribed KHÔNG bắn cho track do chính mình publish.
            // Muốn tự xem lại camera/mic của mình thì phải lắng nghe riêng sự kiện này.
            this.room.on(
                RoomEvent.LocalTrackPublished,
                this.onLocalTrackPublished.bind(this),
            );
            this.room.on(
                RoomEvent.LocalTrackUnpublished,
                this.onLocalTrackUnpublished.bind(this),
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
        } catch (err) {
            console.error('[LiveKitStreamManager] Lỗi khi connect:', err);
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
            `${this.tokenEndpoint}?room=${encodeURIComponent(this.roomName)}` +
            `&identity=${encodeURIComponent(this.identity)}`;
        const res = await fetch(url);
        if (!res.ok) {
            throw new Error(`Không lấy được token, status: ${res.status}`);
        }
        const data = await res.json();
        if (!data.token) {
            throw new Error('Response backend không có field "token"');
        }
        return data.token as string;
    }

    private onTrackSubscribed(
        track: RemoteTrack,
        _publication: RemoteTrackPublication,
        participant: RemoteParticipant,
    ) {
        if (track.kind === Track.Kind.Audio) {
            track.attach(); // audio không cần overlay vị trí, cứ để browser tự phát
            return;
        }

        if (track.kind !== Track.Kind.Video) return;

        const videoEl = track.attach() as HTMLVideoElement;
        videoEl.id = `livekit-video-${participant.identity}`;
        videoEl.style.position = 'absolute';
        videoEl.style.objectFit = 'cover';
        videoEl.style.pointerEvents = 'none'; // không chặn touch/click của game
        videoEl.style.zIndex = '10';
        document.body.appendChild(videoEl);

        this.videoElements.set(participant.identity, videoEl);
    }

    private onTrackUnsubscribed(
        track: RemoteTrack,
        _publication: RemoteTrackPublication,
        participant: RemoteParticipant,
    ) {
        track.detach().forEach((el) => el.remove());
        this.videoElements.delete(participant.identity);
    }

    /**
     * Bắn ra khi CHÍNH MÌNH publish 1 track (camera/mic) thành công.
     * Dùng để tự hiển thị lại camera của mình (self-preview), giống như "xem trước" khi livestream.
     * Nếu bạn KHÔNG cần tự xem lại camera của mình (chỉ cần người khác xem), có thể bỏ qua video ở đây.
     */
    private onLocalTrackPublished(publication: any) {
        const track = publication.track;
        if (!track) return;

        if (track.kind === Track.Kind.Audio) {
            return; // không cần tự phát lại mic của mình (sẽ bị vọng/echo)
        }
        if (track.kind !== Track.Kind.Video) return;

        const identity = this.room?.localParticipant.identity ?? 'local';
        const videoEl = track.attach() as HTMLVideoElement;
        videoEl.id = `livekit-video-${identity}`;
        videoEl.muted = true; // local video luôn mute để tránh vọng âm
        videoEl.style.position = 'absolute';
        videoEl.style.objectFit = 'cover';
        videoEl.style.pointerEvents = 'none';
        videoEl.style.zIndex = '10';
        document.body.appendChild(videoEl);

        this.videoElements.set(identity, videoEl);
    }

    private onLocalTrackUnpublished(publication: any) {
        const identity = this.room?.localParticipant.identity ?? 'local';
        if (publication.track) {
            publication.track
                .detach()
                .forEach((el: HTMLVideoElement) => el.remove());
        }
        this.videoElements.delete(identity);
    }

    private onDisconnected() {
        console.log('[LiveKitStreamManager] Đã ngắt kết nối');
        this.clearAllVideoElements();
    }

    private clearAllVideoElements() {
        this.videoElements.forEach((el) => el.remove());
        this.videoElements.clear();
    }

    update() {
        if (
            this.videoElements.size === 0 ||
            !this.videoPlaceholder ||
            !this.canvasEl
        ) {
            return;
        }
        this.videoElements.forEach((el) => this.syncVideoPosition(el));
    }

    /**
     * Đồng bộ vị trí + kích thước thẻ <video> theo Node placeholder mỗi frame.
     *
     * KHÔNG cần Camera.worldToScreen() ở đây: với 1 Node UI nằm dưới Canvas (screen-space
     * overlay, trường hợp chuẩn cho UI 2D), world position của Node đã chính là toạ độ
     * "design space" với gốc (0,0) ở góc DƯỚI-TRÁI của canvas thiết kế. Chỉ cần tự lật trục Y
     * (world Y hướng lên, DOM Y hướng xuống) rồi scale theo tỉ lệ canvas thật/design là đủ.
     */
    private syncVideoPosition(videoEl: HTMLVideoElement) {
        if (!this.videoPlaceholder || !this.canvasEl) return;

        const uiTransform = this.videoPlaceholder.getComponent(UITransform);
        if (!uiTransform) return;

        const canvasRect = this.canvasEl.getBoundingClientRect();
        const visibleSize = view.getVisibleSize();
        const worldPos = this.videoPlaceholder.worldPosition;

        const scaleX = canvasRect.width / visibleSize.width;
        const scaleY = canvasRect.height / visibleSize.height;

        const widthPx = uiTransform.width * scaleX;
        const heightPx = uiTransform.height * scaleY;

        // worldPos.x: giữ nguyên (trục X giống nhau giữa world và DOM)
        // worldPos.y: lật lại vì world Y hướng lên, DOM Y hướng xuống
        const screenYFromTop = visibleSize.height - worldPos.y;

        const leftPx = canvasRect.left + worldPos.x * scaleX - widthPx / 2;
        const topPx = canvasRect.top + screenYFromTop * scaleY - heightPx / 2;

        videoEl.style.left = `${leftPx}px`;
        videoEl.style.top = `${topPx}px`;
        videoEl.style.width = `${widthPx}px`;
        videoEl.style.height = `${heightPx}px`;
    }

    onDestroy() {
        this.disconnect();
    }
}
