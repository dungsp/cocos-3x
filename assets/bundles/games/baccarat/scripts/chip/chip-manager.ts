import {
    _decorator,
    Component,
    instantiate,
    Node,
    Prefab,
    ScrollView,
    Vec2,
} from 'cc';

import { BetManager } from '../bet/bet-manager';
import { CHIP_VALUES } from '../bet/bet-type';
import { ChipAssetsProvider } from './chip-asset-provider';
import { ChipItem } from './chip-item';

const { ccclass, property } = _decorator;

@ccclass('ChipManager')
export class ChipManager extends Component {
    @property(ScrollView) scrollView: ScrollView | null = null;

    // content node của ScrollView, nên gắn sẵn component Layout (Horizontal) trong editor
    @property(Node) content: Node | null = null;

    @property(Prefab) chipItemPrefab: Prefab | null = null;

    @property(Node) btnPrev: Node | null = null;
    @property(Node) btnNext: Node | null = null;

    // Khoảng cách cuộn (px) mỗi lần bấm prev/next
    @property scrollStep = 300;

    // Thời gian animation cuộn (giây)
    @property scrollDuration = 0.2;

    private chipItems: ChipItem[] = [];
    private selectedItem: ChipItem | null = null;

    onLoad() {
        this.spawnChips();

        this.btnPrev?.on(
            Node.EventType.TOUCH_END,
            () => this.scrollBy(-this.scrollStep),
            this,
        );
        this.btnNext?.on(
            Node.EventType.TOUCH_END,
            () => this.scrollBy(this.scrollStep),
            this,
        );
    }

    private spawnChips() {
        this.content!.removeAllChildren();
        this.chipItems = [];

        CHIP_VALUES.forEach((value) => {
            const node = instantiate(this.chipItemPrefab!);
            const item = node.getComponent(ChipItem)!;
            const frame = ChipAssetsProvider.instance.get(value);

            item.init(value, frame);
            node.on(
                Node.EventType.TOUCH_END,
                () => this.onSelectChip(item),
                this,
            );

            this.content!.addChild(node);
            this.chipItems.push(item);
        });

        if (this.chipItems.length > 0) {
            this.onSelectChip(this.chipItems[0]);
        }
    }

    private onSelectChip(item: ChipItem) {
        this.selectedItem?.setSelected(false);
        item.setSelected(true);
        this.selectedItem = item;

        BetManager.instance.selectChip(item.value);
    }

    private scrollBy(dx: number) {
        if (!this.scrollView) return;

        const current = this.scrollView.getScrollOffset();
        const target = new Vec2(current.x + dx, current.y);

        this.scrollView.scrollToOffset(target, this.scrollDuration, true);
    }
}
