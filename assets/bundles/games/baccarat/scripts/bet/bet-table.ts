import { _decorator, Component, instantiate, Node, Prefab } from 'cc';
import { BetCell } from './bet-cell';
import { BetManager } from './bet-manager';
import { BET_STATIC_CONFIGS, BetType, ROW_BOTTOM, ROW_TOP } from './bet-type';

const { ccclass, property } = _decorator;

@ccclass('BetTable')
export class BetTable extends Component {
    @property(Prefab) cellPrefabSmall: Prefab | null = null; // BetCellSmall (91x66) — dùng cho RowTop
    @property(Prefab) cellPrefabLarge: Prefab | null = null; // BetCellLarge (122x89) — dùng cho RowBottom
    @property(Node) rowTop: Node | null = null;
    @property(Node) rowBottom: Node | null = null;

    private cellMap = new Map<BetType, BetCell>();

    private unsubscribeBetChanged: (() => void) | null = null;

    onLoad() {
        this.spawnRow(ROW_TOP, this.rowTop!, this.cellPrefabSmall!);
        this.spawnRow(ROW_BOTTOM, this.rowBottom!, this.cellPrefabLarge!);

        this.unsubscribeBetChanged = BetManager.instance.addBetChangedListener(
            this.handleBetChanged,
        );
    }

    private handleBetChanged = (type: BetType, amount: number): void => {
        this.cellMap.get(type)?.refreshBetAmount(amount);
    };

    private spawnRow(types: BetType[], parent: Node, prefab: Prefab) {
        types.forEach((t) => {
            const config = BET_STATIC_CONFIGS.find((c) => c.type === t)!;
            const node = instantiate(prefab);
            const cell = node.getComponent(BetCell)!;
            cell.init(config);
            this.cellMap.set(t, cell);
            parent.addChild(node);
        });
    }

    getCell(type: BetType): BetCell | undefined {
        return this.cellMap.get(type);
    }

    protected onDestroy(): void {
        this.unsubscribeBetChanged?.();
        this.unsubscribeBetChanged = null;
    }
}
