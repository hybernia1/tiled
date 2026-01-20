# Textures registry

Tento adresář obsahuje registr textur pro generování atlasů v Phaseru. Registr se nachází v `registry.js` a každá položka mapuje `id` na metadata a `create` funkci, která konkrétní texturu vykreslí do canvasu.

## Příklad registrace nové textury

```js
import { TILE_WIDTH, TILE_HEIGHT } from "../../config/constants.js";
import { createCrystalTexture } from "./crystal.js";

export const textureRegistry = [
  // ...existující záznamy
  {
    id: "crystal",
    type: "terrain",
    size: { width: TILE_WIDTH, height: TILE_HEIGHT * 2 },
    palette: ["#79c1ff", "#3b83d1", "#1d4f91"],
    rarity: "rare",
    isAnimated: false,
    tags: ["terrain", "resource", "crystal"],
    effectTag: "terrain",
    materialType: "crystal",
    impactVFX: "crystal-shards",
    soundId: "hit-crystal",
    lightEmission: 0.4,
    version: 1,
    create: createCrystalTexture,
  },
];
```

> Doporučení: držte metadata konzistentní, protože UI a FX systémy využívají `tags`, `effectTag`, `materialType`, `impactVFX` a `soundId` pro výběr správných efektů a zvuků.

## Doporučené parametry a vazba na UI/FX

- **`size`**
  - Udává rozměry výsledného canvasu. Měl by odpovídat reálné velikosti sprite v UI (např. tile vs. entita). Přesné rozměry zjednodušují zarovnání a kolize.
  - UI/FX: větší `size` často znamená větší hitbox nebo větší prostor pro částice (např. u stromů nebo stěn).

- **`palette`**
  - Paleta barev použitá při kreslení. Udržuje vizuální konzistenci mezi texturami (např. stejné odstíny pro terén).
  - UI/FX: konzistentní palety usnadňují stylování UI overlayů, highlightů a VFX (např. glowy outline může vycházet z hlavní barvy z palety).

- **`tags`**
  - Slouží k semantickému označení textur (např. `terrain`, `tile`, `foliage`, `water`).
  - UI/FX: používají se pro rozhodování, jaké efekty, particle emittery nebo UI stavy se mají aktivovat (např. `water` → splash VFX, `foliage` → rustle zvuk).

Další metadata související s UI/FX:
- **`effectTag`** a **`materialType`**: mapují texturu na konkrétní sadu efektů.
- **`impactVFX`** a **`soundId`**: řídí, jaký efekt/zvuk se použije při interakci.
- **`lightEmission`**: podporuje UI/FX vrstvy s dynamickým osvětlením.

## Naming pravidla (`textureId`, `variant`) a fallback

- **`textureId` (pole `id`)**
  - Používejte krátké, jednoznačné a stabilní ID v kebab-case (např. `tree-conifer`, `player`, `collision-tiles`).
  - Vyhněte se změnám ID, protože jsou používána napříč UI, FX a gameplay logikou.
  - ID musí být unikátní (validuje se v `TextureLoader.validateTextureRegistry`).

- **`variant`**
  - Varianty držte buď jako:
    - samostatné `id` s konzistentním prefixem (`tree-conifer`, `tree-deciduous`), nebo
    - logickou variantu uvnitř jedné `create` funkce (např. různé velikosti v `mountains`).
  - Pokud UI vybírá variantu (např. skiny, rarity), zvažte explicitní `id` pro každou variantu.

- **Fallback mechanizmy**
  - Pokud textura neexistuje, `TextureLoader` ji nahradí fallbackem `missing-texture` (magenta checker), aby bylo snadné chybu odhalit.
  - Při chybě během `create` se také použije fallback.
  - Doporučení: vždy zajistěte, že `create` funkce bezpečně vytvoří canvas a že `id` existuje v registru.
