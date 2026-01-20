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
  }

  load() {
    const errors = validateTextureRegistry(this.registry);
    if (errors.length > 0) {
      console.warn("Texture registry validation issues:", errors);
    }

    ensureMissingTexture(this.scene);

    this.registry.forEach((entry) => {
      if (!entry?.id) {
        return;
      }

      if (this.scene.textures.exists(entry.id)) {
        return;
      }

      if (typeof entry.create !== "function") {
        this.applyFallback(entry.id);
        return;
      }

      try {
        entry.create(this.scene);
      } catch (error) {
        console.warn(`Failed to create texture "${entry.id}":`, error);
      }

      if (!this.scene.textures.exists(entry.id)) {
        this.applyFallback(entry.id);
      }
    });
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
