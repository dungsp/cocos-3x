// assets/scripts/framework/SceneManager.ts

import { assetManager, AssetManager, director } from 'cc';
import { BUNDLE_DEPENDENCIES, PERSISTENT_BUNDLES } from '../config/app';

export class SceneManager {
    private static currentBundleName: string | null = null;
    private static isLoading: boolean = false;

    static async loadBundle(
        bundleName: string,
        sceneName: string,
    ): Promise<void> {
        if (this.isLoading) {
            console.warn(
                `[SceneManager] Đang load dở "${this.currentBundleName ?? '...'}", bỏ qua request load "${bundleName}"`,
            );
            return;
        }

        this.isLoading = true;
        const previousBundleName = this.currentBundleName;

        try {
            const deps = BUNDLE_DEPENDENCIES[bundleName] ?? [];
            await Promise.all(deps.map((dep) => this.getOrLoadBundle(dep)));

            const bundle = await this.getOrLoadBundle(bundleName);

            await new Promise<void>((resolve, reject) => {
                bundle.loadScene(sceneName, (err) => {
                    if (err) return reject(err);
                    resolve();
                });
            });

            await new Promise<void>((resolve) => {
                director.loadScene(sceneName, () => resolve());
            });

            this.currentBundleName = bundleName;

            if (previousBundleName && previousBundleName !== bundleName) {
                this.releaseBundleSafe(previousBundleName);
            }
        } catch (err) {
            console.error(
                `[SceneManager] Load bundle "${bundleName}" thất bại:`,
                err,
            );
            throw err;
        } finally {
            this.isLoading = false;
        }
    }

    private static getOrLoadBundle(
        bundleName: string,
    ): Promise<AssetManager.Bundle> {
        return new Promise((resolve, reject) => {
            const existing = assetManager.getBundle(bundleName);
            if (existing) return resolve(existing);

            assetManager.loadBundle(bundleName, (err, bundle) => {
                if (err) return reject(err);
                resolve(bundle!);
            });
        });
    }

    private static releaseBundleSafe(bundleName: string): void {
        if (PERSISTENT_BUNDLES.indexOf(bundleName) !== -1) {
            return;
        }

        const bundle = assetManager.getBundle(bundleName);
        if (bundle) {
            bundle.releaseAll();
            assetManager.removeBundle(bundle);
            console.log(`[SceneManager] Đã release bundle "${bundleName}"`);
        }
    }

    static getCurrentBundleName(): string | null {
        return this.currentBundleName;
    }
}
