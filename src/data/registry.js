import npcData from "./npc.json";
import spellsData from "./spells.json";
import itemsData from "./items.json";
import mapsData from "./maps.json";
import questsData from "./quests.json";
import dropsData from "./drops.json";
import texturesData from "./textures.json";
import npcSchema from "./schema/npc.json";
import spellsSchema from "./schema/spells.json";
import itemsSchema from "./schema/items.json";
import questsSchema from "./schema/quests.json";
import dropsSchema from "./schema/drops.json";
import texturesSchema from "./schema/textures.json";

const createIndex = (records) =>
  records.reduce((acc, record) => {
    acc[record.id] = record;
    return acc;
  }, {});

const isPlainObject = (value) =>
  value !== null && typeof value === "object" && !Array.isArray(value);

const schemaTypeMatches = (value, expectedType) => {
  switch (expectedType) {
    case "array":
      return Array.isArray(value);
    case "object":
      return isPlainObject(value);
    case "string":
      return typeof value === "string";
    case "number":
      return Number.isFinite(value);
    case "integer":
      return Number.isInteger(value);
    case "boolean":
      return typeof value === "boolean";
    default:
      return false;
  }
};

const formatPath = (pathSegments) =>
  pathSegments.length === 0 ? "root" : pathSegments.join(".");

const validateSchemaValue = (value, schema, pathSegments = []) => {
  const errors = [];

  if (!schema || typeof schema !== "object") {
    return errors;
  }

  if (schema.oneOf) {
    const matches = schema.oneOf.some(
      (subSchema) => validateSchemaValue(value, subSchema, pathSegments).length === 0
    );
    if (!matches) {
      errors.push({
        path: formatPath(pathSegments),
        message: "does not match any allowed schema variants",
      });
      return errors;
    }
  }

  if (schema.enum && !schema.enum.includes(value)) {
    errors.push({
      path: formatPath(pathSegments),
      message: `must be one of: ${schema.enum.join(", ")}`,
    });
    return errors;
  }

  if (schema.type) {
    const types = Array.isArray(schema.type) ? schema.type : [schema.type];
    const typeMatches = types.some((type) => schemaTypeMatches(value, type));
    if (!typeMatches) {
      errors.push({
        path: formatPath(pathSegments),
        message: `expected type ${types.join(" or ")}`,
      });
      return errors;
    }
  }

  if (schema.type === "object" && isPlainObject(value)) {
    const required = schema.required ?? [];
    required.forEach((key) => {
      if (!(key in value)) {
        errors.push({
          path: formatPath([...pathSegments, key]),
          message: "is required",
        });
      }
    });

    const properties = schema.properties ?? {};
    const patternProperties = schema.patternProperties ?? {};
    const patterns = Object.entries(patternProperties).map(([pattern, subSchema]) => [
      new RegExp(pattern),
      subSchema,
    ]);

    Object.entries(value).forEach(([key, childValue]) => {
      let matched = false;

      if (properties[key]) {
        matched = true;
        errors.push(
          ...validateSchemaValue(childValue, properties[key], [
            ...pathSegments,
            key,
          ])
        );
      }

      patterns.forEach(([regex, subSchema]) => {
        if (regex.test(key)) {
          matched = true;
          errors.push(
            ...validateSchemaValue(childValue, subSchema, [
              ...pathSegments,
              key,
            ])
          );
        }
      });

      if (!matched) {
        if (schema.additionalProperties === false) {
          errors.push({
            path: formatPath([...pathSegments, key]),
            message: "is not allowed",
          });
        } else if (isPlainObject(schema.additionalProperties)) {
          errors.push(
            ...validateSchemaValue(childValue, schema.additionalProperties, [
              ...pathSegments,
              key,
            ])
          );
        }
      }
    });
  }

  if (schema.type === "array" && Array.isArray(value)) {
    if (Number.isFinite(schema.minItems) && value.length < schema.minItems) {
      errors.push({
        path: formatPath(pathSegments),
        message: `must contain at least ${schema.minItems} items`,
      });
    }

    if (schema.items) {
      value.forEach((item, index) => {
        errors.push(
          ...validateSchemaValue(item, schema.items, [
            ...pathSegments,
            `[${index}]`,
          ])
        );
      });
    }
  }

  return errors;
};

const validateRegistryData = () => {
  const validationTargets = [
    { name: "npcs", data: npcData, schema: npcSchema },
    { name: "spells", data: spellsData, schema: spellsSchema },
    { name: "items", data: itemsData, schema: itemsSchema },
    { name: "quests", data: questsData, schema: questsSchema },
    { name: "drops", data: dropsData, schema: dropsSchema },
    { name: "textures", data: texturesData, schema: texturesSchema },
  ];

  const issues = validationTargets.flatMap(({ name, data, schema }) =>
    validateSchemaValue(data, schema).map((issue) => ({
      ...issue,
      name,
    }))
  );

  if (issues.length > 0) {
    issues.forEach((issue) => {
      console.error(
        `[schema] ${issue.name}:${issue.path} ${issue.message}`
      );
    });
    throw new Error(
      `Data schema validation failed (${issues.length} issue(s)).`
    );
  }
};

export const loadRegistry = () => {
  validateRegistryData();

  const registry = {
    npcs: npcData,
    spells: spellsData,
    items: itemsData,
    maps: mapsData,
    quests: questsData,
    drops: dropsData,
    textures: texturesData,
  };

  return {
    ...registry,
    index: {
      npcs: createIndex(npcData),
      spells: createIndex(spellsData),
      items: createIndex(itemsData),
      maps: createIndex(mapsData),
      quests: createIndex(questsData),
      drops: createIndex(dropsData),
      textures: createIndex(texturesData),
    },
  };
};
