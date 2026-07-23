import {
    _decorator,
    Component,
    Label,
    Node,
    Sprite,
    SpriteFrame,
    UITransform,
} from 'cc';
import { BetAssetsProvider } from './bet-assets-provider';
import { BetManager } from './bet-manager';
import { BetStaticConfig, BetType } from './bet-type';

const { ccclass, property } = _decorator;

@ccclass('BetCell')
export class BetCell extends Component {
    @property(Sprite) bgSprite: Sprite | null = null;
    @property(Sprite) titleSprite: Sprite | null = null;
    @property(Label) labelTotalBet: Label | null = null;
    @property(Label) labelPlayerCount: Label | null = null;
    @property(Label) labelBetAmount: Label | null = null;
    @property(Node) percentBadge: Node | null = null;
    @property(Label) labelPercent: Label | null = null;

    @property titleHeight = 13;

    private betType!: BetType;

    init(config: BetStaticConfig) {
        this.betType = config.type;
        const asset = BetAssetsProvider.instance.get(config.type);

        if (asset?.cardFrame) {
            this.bgSprite!.spriteFrame = asset.cardFrame;
        }

        if (asset?.titleFrame) {
            this.titleSprite!.spriteFrame = asset.titleFrame;
            this.applyTitleAutoWidth(asset.titleFrame);
        }

        this.percentBadge!.active = config.percent !== undefined;
        if (config.percent !== undefined) {
            this.labelPercent!.string = `${config.percent}%`;
        }

        this.labelTotalBet!.string = '0';
        this.labelPlayerCount!.string = '0';
        this.refreshBetAmount(0);

        this.node.on(Node.EventType.TOUCH_END, this.onClick, this);
    }

    private applyTitleAutoWidth(frame: SpriteFrame) {
        const titleUI = this.titleSprite!.getComponent(UITransform)!;
        const original = frame.originalSize;
        const ratio = original.width / original.height;

        const newHeight = this.titleHeight;
        const newWidth = newHeight * ratio;

        titleUI.setContentSize(newWidth, newHeight);
    }

    refreshLive(totalBetAmount: number, playerCount: number) {
        this.labelTotalBet!.string = this.formatMoney(totalBetAmount);
        this.labelPlayerCount!.string = String(playerCount);
    }

    private onClick() {
        BetManager.instance.placeBet(this.betType);
    }

    refreshBetAmount(amount: number) {
        if (!this.labelBetAmount) return;
        this.labelBetAmount.node.parent!.active = amount > 0;
        this.labelBetAmount.string = this.formatMoney(amount);
    }

    private formatMoney(v: number): string {
        if (v >= 1_000_000) return (v / 1_000_000).toFixed(0) + 'M';
        if (v >= 1_000) return (v / 1_000).toFixed(0) + 'K';
        return String(v);
    }
}
