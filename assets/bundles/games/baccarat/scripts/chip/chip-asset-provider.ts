import { _decorator, Component, SpriteFrame } from 'cc';

const { ccclass, property } = _decorator;

@ccclass('ChipAssetsEntry')
export class ChipAssetsEntry {
    @property value = 0;

    @property(SpriteFrame)
    frame: SpriteFrame | null = null;
}

@ccclass('ChipAssetsProvider')
export class ChipAssetsProvider extends Component {
    private static _instance: ChipAssetsProvider | null = null;
    static get instance(): ChipAssetsProvider {
        return this._instance!;
    }

    @property([ChipAssetsEntry])
    entries: ChipAssetsEntry[] = [];

    private map = new Map<number, SpriteFrame>();

    onLoad() {
        ChipAssetsProvider._instance = this;
        this.entries.forEach((e) => {
            if (e.frame) this.map.set(e.value, e.frame);
        });
    }

    get(value: number): SpriteFrame | undefined {
        return this.map.get(value);
    }
}
