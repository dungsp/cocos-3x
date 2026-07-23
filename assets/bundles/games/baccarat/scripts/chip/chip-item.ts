import { _decorator, Component, Node, Sprite, SpriteFrame } from 'cc';

const { ccclass, property } = _decorator;

@ccclass('ChipItem')
export class ChipItem extends Component {
    @property(Sprite) chipSprite: Sprite | null = null;
    @property(Node) selectedOutline: Node | null = null;

    value = 0;

    init(value: number, frame: SpriteFrame | undefined) {
        this.value = value;

        if (frame && this.chipSprite) {
            this.chipSprite.spriteFrame = frame;
        }

        this.setSelected(false);
    }

    setSelected(selected: boolean) {
        if (this.selectedOutline) {
            this.selectedOutline.active = selected;
        }
    }
}
