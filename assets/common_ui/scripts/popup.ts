import { _decorator, Component, Node, Tween, tween, Vec3 } from 'cc';

const { ccclass, property } = _decorator;

@ccclass('PopupController')
export class PopupController extends Component {
    @property(Node) private wrapper: Node | null = null;
    @property(Node) private container: Node | null = null;

    private currentContent: Node | null = null;
    private onCloseContent: ((node: Node) => void) | null = null;

    public open(
        content: Node | null,
        onRemoveOldContent?: (node: Node) => void,
    ) {
        if (!this.wrapper || !this.container) return;

        if (this.currentContent) {
            this.container.removeChild(this.currentContent);
            onRemoveOldContent?.(this.currentContent);
        }

        this.currentContent = content;

        if (content) {
            this.container.addChild(content);
            content.setPosition(Vec3.ZERO);
        }

        this.node.active = true;

        Tween.stopAllByTarget(this.wrapper);
        this.wrapper.setScale(Vec3.ZERO);

        tween(this.wrapper)
            .to(0.2, { scale: new Vec3(1.1, 1.1, 1) }, { easing: 'quadOut' })
            .to(0.1, { scale: Vec3.ONE })
            .start();
    }

    public close(onRemoveContent?: (node: Node) => void) {
        if (!this.wrapper) return;

        Tween.stopAllByTarget(this.wrapper);

        tween(this.wrapper)
            .to(0.15, { scale: Vec3.ZERO }, { easing: 'quadIn' })
            .call(() => {
                this.node.active = false;

                if (this.currentContent && this.container) {
                    this.container.removeChild(this.currentContent);
                    onRemoveContent?.(this.currentContent);
                    this.currentContent = null;
                }
            })
            .start();
    }

    protected onDestroy() {
        if (this.wrapper) Tween.stopAllByTarget(this.wrapper);
    }
}

// Content new instantiate → destroy on close
// const newContent = instantiate(myPrefab);
// popup.open(newContent, (node) => node.destroy());

// Content get from pool → return pool on close
// const pooledContent = myPool.get();
// popup.open(pooledContent, (node) => myPool.put(node));
