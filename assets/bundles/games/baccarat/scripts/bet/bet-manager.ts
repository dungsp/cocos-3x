import { _decorator, Component } from 'cc';
import { BetType } from './bet-type';

const { ccclass } = _decorator;

type BetChangedListener = (type: BetType, amount: number) => void;
type ChipChangedListener = (chip: number) => void;

@ccclass('BetManager')
export class BetManager extends Component {
    private static _instance: BetManager | null = null;

    static get instance(): BetManager {
        return this._instance!;
    }

    private currentBets = new Map<BetType, number>();
    private lastRoundBets = new Map<BetType, number>();
    private selectedChip = 10;

    private betChangedListeners = new Set<BetChangedListener>();
    private chipChangedListeners = new Set<ChipChangedListener>();

    protected onLoad(): void {
        BetManager._instance = this;
    }

    protected onDestroy(): void {
        this.betChangedListeners.clear();
        this.chipChangedListeners.clear();

        if (BetManager._instance === this) {
            BetManager._instance = null;
        }
    }

    addBetChangedListener(listener: BetChangedListener): () => void {
        this.betChangedListeners.add(listener);

        return () => {
            this.betChangedListeners.delete(listener);
        };
    }

    addChipChangedListener(listener: ChipChangedListener): () => void {
        this.chipChangedListeners.add(listener);

        return () => {
            this.chipChangedListeners.delete(listener);
        };
    }

    private emitBetChanged(type: BetType, amount: number): void {
        this.betChangedListeners.forEach((listener) => {
            listener(type, amount);
        });
    }

    private emitChipChanged(chip: number): void {
        this.chipChangedListeners.forEach((listener) => {
            listener(chip);
        });
    }

    selectChip(value: number): void {
        if (this.selectedChip === value) return;

        this.selectedChip = value;
        this.emitChipChanged(value);
    }

    getSelectedChip(): number {
        return this.selectedChip;
    }

    placeBet(type: BetType): void {
        const current = this.currentBets.get(type) ?? 0;
        const next = current + this.selectedChip;

        this.currentBets.set(type, next);
        this.emitBetChanged(type, next);
    }

    allIn(type: BetType, playerBalance: number): void {
        this.currentBets.set(type, playerBalance);
        this.emitBetChanged(type, playerBalance);
    }

    getBetAmount(type: BetType): number {
        return this.currentBets.get(type) ?? 0;
    }

    getAllBets(): ReadonlyMap<BetType, number> {
        return this.currentBets;
    }

    confirmBets(): void {
        console.log('Sending bets:', Array.from(this.currentBets.entries()));

        this.lastRoundBets = new Map(this.currentBets);
    }

    cancelBets(): void {
        this.currentBets.forEach((_, type) => {
            this.emitBetChanged(type, 0);
        });

        this.currentBets.clear();
    }

    repeatLastRound(): void {
        this.cancelBets();

        this.lastRoundBets.forEach((amount, type) => {
            this.currentBets.set(type, amount);
            this.emitBetChanged(type, amount);
        });
    }
}
