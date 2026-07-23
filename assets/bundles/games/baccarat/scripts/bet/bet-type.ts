export enum BetType {
    ConLongBao = 'con_long_bao',
    ConDoi = 'con_doi',
    CaiDoi = 'cai_doi',
    CaiLongBao = 'cai_long_bao',
    TayCon = 'tay_con',
    Hoa = 'hoa',
    NhaCai = 'nha_cai',
}

export interface BetStaticConfig {
    type: BetType;
    percent?: number;
}

export const BET_STATIC_CONFIGS: BetStaticConfig[] = [
    { type: BetType.ConLongBao },
    { type: BetType.ConDoi },
    { type: BetType.CaiDoi },
    { type: BetType.CaiLongBao },
    { type: BetType.TayCon, percent: 61 },
    { type: BetType.Hoa },
    { type: BetType.NhaCai, percent: 49 },
];

export const ROW_TOP: BetType[] = [
    BetType.ConLongBao,
    BetType.ConDoi,
    BetType.CaiDoi,
    BetType.CaiLongBao,
];
export const ROW_BOTTOM: BetType[] = [
    BetType.TayCon,
    BetType.Hoa,
    BetType.NhaCai,
];

export const CHIP_VALUES = [10, 20, 50, 100, 200, 500];
