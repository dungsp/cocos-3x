import {
    _decorator,
    Color,
    Component,
    Node,
    Sprite,
    SpriteFrame,
    tween,
    Tween,
    UIOpacity,
    Vec3,
} from 'cc';

const { ccclass, property } = _decorator;

@ccclass('ChipItem')
export class ChipItem extends Component {
    @property(Node)
    chipRoot: Node | null = null;

    @property(Sprite)
    chipSprite: Sprite | null = null;

    @property(Sprite)
    glowBack: Sprite | null = null;

    @property(Sprite)
    flashOverlay: Sprite | null = null;

    value = 0;

    private glowOpacity: UIOpacity | null = null;
    private flashOpacity: UIOpacity | null = null;

    protected onLoad(): void {
        this.glowOpacity = this.getOrAddOpacity(this.glowBack?.node);
        this.flashOpacity = this.getOrAddOpacity(this.flashOverlay?.node);

        this.resetVisual();
    }

    init(value: number, frame: SpriteFrame | undefined): void {
        this.value = value;

        if (frame) {
            if (this.chipSprite) {
                this.chipSprite.spriteFrame = frame;
            }

            if (this.glowBack) {
                this.glowBack.spriteFrame = frame;
            }

            if (this.flashOverlay) {
                this.flashOverlay.spriteFrame = frame;
            }
        }

        this.resetVisual();
    }

    setSelected(selected: boolean): void {
        if (selected) {
            this.playSelectedAnimation();
            return;
        }

        this.resetVisual();
    }

    private playSelectedAnimation(): void {
        this.stopAllAnimations();

        if (this.chipRoot) {
            this.chipRoot.setScale(Vec3.ONE);

            tween(this.chipRoot)
                .to(
                    0.12,
                    { scale: new Vec3(1.1, 1.1, 1) },
                    { easing: 'backOut' },
                )
                .to(
                    0.1,
                    { scale: new Vec3(1.05, 1.05, 1) },
                    { easing: 'quadOut' },
                )
                .start();
        }

        if (this.glowBack && this.glowOpacity) {
            this.glowBack.node.setScale(new Vec3(1, 1, 1));
            this.glowBack.color = new Color(255, 225, 145, 255);
            this.glowOpacity.opacity = 0;

            tween(this.glowBack.node)
                .to(
                    0.2,
                    { scale: new Vec3(1.25, 1.25, 1) },
                    { easing: 'sineOut' },
                )
                .to(0.12, { scale: new Vec3(1.18, 1.18, 1) })
                .start();

            tween(this.glowOpacity)
                .to(0.12, { opacity: 150 })
                .to(0.18, { opacity: 65 })
                .start();
        }

        if (this.flashOverlay && this.flashOpacity) {
            this.flashOverlay.node.setScale(new Vec3(0.65, 0.65, 1));
            this.flashOverlay.color = Color.WHITE;
            this.flashOpacity.opacity = 0;

            tween(this.flashOverlay.node)
                .to(
                    0.2,
                    { scale: new Vec3(1.08, 1.08, 1) },
                    { easing: 'quadOut' },
                )
                .start();

            tween(this.flashOpacity)
                .to(0.08, { opacity: 150 })
                .to(0.2, { opacity: 0 })
                .start();
        }
    }

    private resetVisual(): void {
        this.stopAllAnimations();

        this.chipRoot?.setScale(Vec3.ONE);
        this.glowBack?.node.setScale(Vec3.ONE);
        this.flashOverlay?.node.setScale(Vec3.ONE);

        if (this.glowOpacity) {
            this.glowOpacity.opacity = 0;
        }

        if (this.flashOpacity) {
            this.flashOpacity.opacity = 0;
        }
    }

    private stopAllAnimations(): void {
        if (this.chipRoot) {
            Tween.stopAllByTarget(this.chipRoot);
        }

        if (this.glowBack) {
            Tween.stopAllByTarget(this.glowBack.node);
        }

        if (this.flashOverlay) {
            Tween.stopAllByTarget(this.flashOverlay.node);
        }

        if (this.glowOpacity) {
            Tween.stopAllByTarget(this.glowOpacity);
        }

        if (this.flashOpacity) {
            Tween.stopAllByTarget(this.flashOpacity);
        }
    }

    private getOrAddOpacity(node: Node | undefined): UIOpacity | null {
        if (!node) return null;

        return node.getComponent(UIOpacity) ?? node.addComponent(UIOpacity);
    }
}
