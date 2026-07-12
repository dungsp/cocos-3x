export const BUNDLE_DEPENDENCIES: Record<string, string[]> = {
    login: ['common_ui', 'common_i18n'],
    lobby: ['common_ui', 'common_audio', 'common_i18n'],
    game_slot_a: ['common_ui', 'common_audio', 'common_i18n', 'game_common'],
    game_poker: ['common_ui', 'common_audio', 'common_i18n', 'game_common'],
};

export const PERSISTENT_BUNDLES: string[] = [
    'common_ui',
    'common_audio',
    'common_i18n',
    'game_common',
];
