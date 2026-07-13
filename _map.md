# Cocos Creator Project Structure Guide — v2
*Bundle-based, lazy-loading, hot-update-ready — reviewed & extended*

---

## 1. Core Principles

1. **Anything outside a Bundle gets compiled into the main bundle.** This includes scripts. If a `.ts` file sits in a plain folder (not inside a folder marked as Bundle), it is downloaded on app start and cannot be hot-updated independently — even if its related assets are lazy-loaded.
2. **One feature = one bundle**, not one feature = one asset folder. Scripts, prefabs, textures, scenes, and sounds that belong to a feature should live *inside* that feature's bundle folder, so the whole feature can be versioned, downloaded, and hot-updated as one unit.
3. **`resources/` is the exception, not the default.** It is always packed into the app and always loaded via `resources.load()`. Keep it to a handful of files needed before any bundle can load (boot logo, loading bar, error icon).
4. **Split game modes into separate bundles from day one.** Retrofitting this later (e.g. going from 1 slot game to 10) is expensive. Treat `game/` as a category, not a single bundle.
5. **`common` is a de-facto core dependency, not "just another bundle."** Because login, lobby, and every game bundle depend on it, it loads early and often. Split it *before* it becomes a bottleneck, not after — retrofitting a split once many bundles reference its asset UUIDs is painful.
6. **Verify script-splitting behavior with a real build before locking this structure.** Whether scripts in different bundles actually end up in separate output files depends on your Cocos Creator version and build target (native/JSB builds in particular). Build two dummy bundles, inspect `build/<platform>/assets/`, and confirm before committing the architecture to this assumption.

---

## 2. Full Folder Structure

```
assets/
├── resources/                          // Always bundled into main package. Keep minimal.
│   ├── boot/
│   │   ├── loading_bar.prefab
│   │   ├── splash_logo.png
│   │   └── error_icon.png
│   └── i18n/
│       └── boot_strings.json           // Only strings needed before login bundle loads
│
├── bundles/
│   │
│   ├── login/                          // Bundle = true
│   │   ├── scripts/
│   │   │   ├── LoginController.ts
│   │   │   ├── LoginView.ts
│   │   │   └── models/
│   │   │       └── LoginModel.ts
│   │   ├── scenes/
│   │   │   └── Login.scene
│   │   ├── prefabs/
│   │   │   └── popup_forgot_password.prefab
│   │   ├── textures/
│   │   └── spine/
│   │
│   ├── lobby/                          // Bundle = true
│   │   ├── scripts/
│   │   │   ├── LobbyController.ts
│   │   │   ├── LobbyView.ts
│   │   │   ├── popups/
│   │   │   │   ├── ProfilePopupController.ts
│   │   │   │   ├── ShopPopupController.ts
│   │   │   │   └── SettingsPopupController.ts
│   │   │   └── models/
│   │   │       └── LobbyModel.ts
│   │   ├── scenes/
│   │   │   └── Lobby.scene
│   │   ├── prefabs/
│   │   │   ├── popup_profile.prefab
│   │   │   ├── popup_shop.prefab
│   │   │   └── popup_settings.prefab
│   │   ├── textures/
│   │   └── spine/
│   │
│   ├── game_slot_a/                    // Bundle = true — ONE game mode = ONE bundle
│   │   ├── scripts/
│   │   │   ├── SlotAController.ts
│   │   │   ├── SlotAReelLogic.ts
│   │   │   └── models/
│   │   │       └── SlotAConfig.ts
│   │   ├── scenes/
│   │   │   └── SlotA.scene
│   │   ├── prefabs/
│   │   ├── textures/
│   │   ├── effects/
│   │   ├── sounds/
│   │   ├── config/
│   │   │   └── paytable.json           // versioned data table, ships independently of code
│   │   └── i18n/                       // game-specific strings (paytable text, etc.)
│   │       ├── en.json
│   │       └── vi.json
│   │
│   ├── game_poker/                     // Bundle = true — separate game mode, same pattern
│   │   ├── scripts/
│   │   ├── scenes/
│   │   ├── prefabs/
│   │   ├── textures/
│   │   ├── effects/
│   │   ├── sounds/
│   │   ├── config/
│   │   └── i18n/
│   │
│   ├── game_xxx/                       // Add new bundle per new game mode, same pattern
│   │
│   ├── game_common/                    // Bundle = true — shared ONLY across game_* bundles
│   │   ├── scripts/
│   │   │   ├── SpinEngineBase.ts       // reel spin engine shared by slot games
│   │   │   ├── PaylineEvaluator.ts
│   │   │   ├── RngDisplayLogic.ts
│   │   │   └── ReelAnimationBase.ts
│   │   ├── prefabs/
│   │   └── effects/
│   │
│   ├── common_ui/                      // Bundle = true — split out of common (4.2)
│   │   ├── scripts/
│   │   │   ├── ButtonEx.ts
│   │   │   └── PopupBase.ts
│   │   ├── ui_atlas/
│   │   └── fonts/
│   │
│   ├── common_audio/                   // Bundle = true — split out of common (4.2)
│   │   └── sfx/
│   │       ├── click.mp3
│   │       └── coin_collect.mp3
│   │
│   └── common_i18n/                    // Bundle = true — split out of common (4.2)
│       └── i18n/                       // shared strings only (OK/Cancel/numbers, etc.)
│           ├── en.json
│           ├── vi.json
│           └── ...
│
└── scripts/                            // NOT a bundle — loaded at app start, keep it small
    ├── framework/
    │   ├── AppEntry.ts
    │   ├── BundleLoader.ts             // wraps assetManager.loadBundle logic
    │   ├── SceneManager.ts             // also owns bundle unload/release on scene exit
    │   └── EventBus.ts
    ├── network/
    │   ├── SocketClient.ts
    │   ├── HttpClient.ts
    │   └── protocols/
    ├── models/
    │   └── UserSession.ts              // global session state, needed pre-login
    └── config/
        ├── GameConfig.ts               // static app-wide config (endpoints, bundle names,
        │                                // and bundle DEPENDENCY GRAPH, e.g.
        │                                // { "game_slot_a": ["common_ui","common_audio","game_common"] })
        └── VersionConfig.ts            // hot-update manifest / remote bundle versions
```

---

## 3. Why Scripts Live *Inside* Each Bundle

| Location | Loaded when | Hot-updatable independently |
|---|---|---|
| `assets/scripts/` (outside bundles) | App start, always | ❌ No — part of main bundle |
| `assets/resources/` | App start (via `resources.load`) | ❌ No |
| `assets/bundles/<feature>/scripts/` | Only when that bundle loads | ✅ Yes (verify with a real build first — see Principle 6) |

**Rule of thumb:** if a script only matters for one feature (e.g. `SlotAReelLogic.ts`), it belongs inside that feature's bundle — not in the global `scripts/` folder. Only put code in the top-level `scripts/` folder if it must exist before any bundle is even downloaded (networking, bundle loader itself, session/auth state, event bus).

---

## 4. Scaling Strategy for Future Growth

### 4.1 Adding new game modes
Just add a new `bundles/game_<name>/` folder with the same internal pattern (`scripts/scenes/prefabs/textures/effects/sounds/config/i18n`). No changes needed elsewhere except registering its dependencies in `GameConfig.ts`.

### 4.2 `common` split (done proactively in this version)
Instead of one `common/` bundle, split by change cadence:
```
bundles/common_ui/       // ButtonEx, PopupBase, shared prefabs, fonts
bundles/common_audio/    // sfx, music
bundles/common_i18n/     // shared language strings only — game-specific i18n stays in each game bundle
bundles/game_common/     // logic shared only among game_* bundles (spin engine, payline evaluator...)
```
This avoids re-downloading unrelated shared assets when only translations change, and keeps login/lobby from pulling in game-only logic they never use.

### 4.3 Hot-update / remote bundle versioning
Keep a `VersionConfig.ts` (or a remote-hosted JSON, e.g. `bundles-manifest.json` on your CDN) mapping:
```json
{
  "login": "1.0.3",
  "lobby": "1.2.0",
  "game_slot_a": "2.4.1",
  "game_poker": "1.0.0",
  "common_ui": "1.1.5",
  "common_audio": "1.0.2",
  "common_i18n": "1.3.0",
  "game_common": "1.0.1"
}
```
Because each feature's code + assets are self-contained inside its bundle, you can ship a patch to `game_slot_a` alone without touching other bundles' binaries.

Give versioned config/data tables (e.g. `paytable.json`) their own internal `version` field too — so old client code doesn't misread a newer, incompatible config after a data-only hot-update.

### 4.4 Team scaling (multiple developers/teams)
Bundle-per-feature maps cleanly to team ownership: one dev/team owns `game_slot_a/`, another owns `lobby/`, without merge conflicts in a shared global scripts folder. Keep `scripts/framework` and `scripts/network` owned by a small "core" team since everything depends on it.

### 4.5 Config & data tables
Keep data-driven config (paytables, level configs, drop rates) **inside the bundle that uses them** (e.g. `bundles/game_slot_a/config/paytable.json`), not in a global config folder — config changes often need to ship without a full app update.

### 4.6 Bundle dependency graph
Define explicit dependencies in `GameConfig.ts` rather than hardcoding load order in scene code:
```ts
export const BUNDLE_DEPENDENCIES: Record<string, string[]> = {
  login:        ["common_ui", "common_i18n"],
  lobby:        ["common_ui", "common_audio", "common_i18n"],
  game_slot_a:  ["common_ui", "common_audio", "common_i18n", "game_common"],
  game_poker:   ["common_ui", "common_audio", "common_i18n", "game_common"],
};
```
`BundleLoader.ts` reads this to load dependencies before the target bundle.

### 4.7 Memory management across many games
When switching between games, unused bundles (textures, spine, sounds) stay resident in memory unless explicitly released. With 10+ games this is the most common leak source. `SceneManager.ts` should own `assetManager.removeBundle()` / asset release when leaving a game, not leave it to each game's own controller.

### 4.8 Mini-game platform constraints
If targeting WeChat/Zalo Mini App etc. alongside native, check subpackage count/size limits for that platform *before* assuming "one bundle per game" holds everywhere — some platforms cap total subpackages or per-package size.

---

## 5. Quick Checklist Before Locking This Structure

- [ ] Built a small test with 2 dummy bundles and confirmed scripts actually output to separate files on your target platform (native/JSB especially)
- [ ] Every feature-specific script is inside its bundle's `scripts/` folder, not in the top-level `assets/scripts/`
- [ ] Top-level `assets/scripts/` only contains code needed before any bundle loads
- [ ] Each game mode has its own bundle (`game_<mode>/`), not one shared `game/` bundle
- [ ] `resources/` contains only boot-time assets
- [ ] `common` is already split by cadence (`common_ui` / `common_audio` / `common_i18n`) rather than left as one monolith
- [ ] Shared game-only logic lives in `game_common/`, not in `common_*` (which login/lobby also pull in)
- [ ] Bundle dependency graph is defined centrally (`GameConfig.ts`), not hardcoded per scene
- [ ] `SceneManager.ts` releases/unloads bundles on game exit
- [ ] Each game bundle has its own `i18n/` for game-specific strings; `common_i18n` holds only truly shared strings
- [ ] Versioned config files (paytables etc.) carry their own internal version field
- [ ] A version manifest strategy exists (even a placeholder) for future hot-update
- [ ] Mini-game platform subpackage limits checked, if applicable
