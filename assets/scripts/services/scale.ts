import { _decorator, Component, Node, UITransform, view } from 'cc';

const { ccclass, property } = _decorator;

@ccclass('DesignScaler')
export class DesignScaler extends Component {
    @property(Node)
    private designRoot: Node | null = null;

    @property
    private designWidth = 390;

    @property
    private designHeight = 710;

    protected onLoad(): void {
        this.updateScale();

        view.on('canvas-resize', this.updateScale, this);
    }

    protected onDestroy(): void {
        view.off('canvas-resize', this.updateScale, this);
    }

    private updateScale(): void {
        if (!this.designRoot) return;

        const screenTransform = this.getComponent(UITransform);
        const designTransform = this.designRoot.getComponent(UITransform);

        if (!screenTransform || !designTransform) return;

        designTransform.setContentSize(this.designWidth, this.designHeight);

        const availableWidth = screenTransform.width;
        const availableHeight = screenTransform.height;

        const scale = Math.min(
            availableWidth / this.designWidth,
            availableHeight / this.designHeight,
        );

        this.designRoot.setScale(scale, scale, 1);
        this.designRoot.setPosition(0, 0);
    }
}
