import { _decorator, Component, Enum, SpriteFrame } from 'cc';
import { BetType } from './bet-type';

const { ccclass, property } = _decorator;

@ccclass('BetAssetsEntry')
export class BetAssetsEntry {
    @property({ type: Enum(BetType) })
    type: BetType = BetType.TayCon;

    @property(SpriteFrame)
    cardFrame: SpriteFrame | null = null;

    @property(SpriteFrame)
    titleFrame: SpriteFrame | null = null;
}

@ccclass('BetAssetsProvider')
export class BetAssetsProvider extends Component {
    private static _instance: BetAssetsProvider | null = null;
    static get instance(): BetAssetsProvider {
        return this._instance!;
    }

    @property([BetAssetsEntry])
    entries: BetAssetsEntry[] = [];

    private map = new Map<BetType, BetAssetsEntry>();

    onLoad() {
        BetAssetsProvider._instance = this;
        this.entries.forEach((e) => this.map.set(e.type, e));
    }

    get(type: BetType): BetAssetsEntry | undefined {
        return this.map.get(type);
    }
}
