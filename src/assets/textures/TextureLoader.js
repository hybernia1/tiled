import { textureRegistry } from "./registry.js";
import { createMissingTexture, MISSING_TEXTURE_KEY } from "./missing.js";

const ensureMissingTexture = (scene) => createMissingTexture(scene);

export const validateTextureRegistry = (registry) => {
  const seen = new Set();
  const errors = [];

  registry.forEach((entry, index) => {
    if (!entry || !entry.id) {
      errors.push(`Texture registry entry at index ${index} is missing an id.`);
      return;
    }

    if (seen.has(entry.id)) {
      errors.push(`Duplicate texture id detected: "${entry.id}".`);
    } else {
      seen.add(entry.id);
    }

    if (typeof entry.create !== "function") {
      errors.push(`Texture "${entry.id}" is missing a create callback.`);
    }
  });

  return errors;
};

export class TextureLoader {
  constructor(scene, registry = textureRegistry) {
    this.scene = scene;
    this.registry = registry;
    this.textureCache = new Map();
    this.registryMap = new Map(
      this.registry.map((entry) => [entry?.id, entry])
    );
  }

  load() {
    const errors = validateTextureRegistry(this.registry);
    if (errors.length > 0) {
      console.warn("Texture registry validation issues:", errors);
    }

    ensureMissingTexture(this.scene);
  }

  ensureTexture(id) {
    if (!id) {
      return null;
    }

    if (this.textureCache.has(id)) {
      return this.scene.textures.get(id) ?? null;
    }

    if (this.scene.textures.exists(id)) {
      this.textureCache.set(id, "existing");
      return this.scene.textures.get(id);
    }

    const entry = this.registryMap.get(id);
    if (!entry || typeof entry.create !== "function") {
      this.applyFallback(id);
      this.textureCache.set(id, "fallback");
      return this.scene.textures.get(id) ?? null;
    }

    this.textureCache.set(id, "creating");
    try {
      entry.create(this.scene);
    } catch (error) {
      console.warn(`Failed to create texture "${id}":`, error);
    }

    if (!this.scene.textures.exists(id)) {
      this.applyFallback(id);
      this.textureCache.set(id, "fallback");
      return this.scene.textures.get(id) ?? null;
    }

    this.textureCache.set(id, "created");
    return this.scene.textures.get(id);
  }

  prefetch(ids = []) {
    ids.forEach((id) => this.ensureTexture(id));
  }

  applyFallback(id) {
    if (!id || this.scene.textures.exists(id)) {
      return;
    }

    const fallbackTexture =
      this.scene.textures.get(MISSING_TEXTURE_KEY) ?? ensureMissingTexture(this.scene);
    const fallbackSource = fallbackTexture?.getSourceImage?.();

    if (!fallbackSource) {
      console.warn(`Missing fallback texture source for "${id}".`);
      return;
    }

    this.scene.textures.addCanvas(id, fallbackSource);
  }
}
