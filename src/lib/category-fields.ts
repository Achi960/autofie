import type { CategorySlug } from "@/lib/ghana";
import { CAR_BRANDS, ALL_BRANDS } from "@/lib/ghana";
import {
  MOTORCYCLE_BRANDS,
  BUS_BRANDS,
  TRUCK_BRANDS,
  HEAVY_EQUIPMENT_BRANDS,
  type CategoryBrandLib,
} from "@/lib/brands";

export type MakeMode = "list" | "text" | "off";

export interface CategoryFieldConfig {
  vehicle: boolean;
  make: MakeMode;
  makeLabel: string;
  modelLabel: string;
  year: boolean;
  mileage: boolean;
  transmission: boolean;
  fuel: boolean;
  bodyType: boolean;
  colour: boolean;
  engine: boolean;
  engineLabel: string;
  registration: boolean;
  condition: boolean;
  titlePlaceholder: string;
}

const DEFAULTS: CategoryFieldConfig = {
  vehicle: true,
  make: "list",
  makeLabel: "Make",
  modelLabel: "Model",
  year: true,
  mileage: true,
  transmission: true,
  fuel: true,
  bodyType: true,
  colour: true,
  engine: true,
  engineLabel: "Engine",
  registration: true,
  condition: true,
  titlePlaceholder: "e.g. 2018 Toyota Corolla XLE Foreign Used",
};

export function fieldsFor(cat: CategorySlug | ""): CategoryFieldConfig {
  switch (cat) {
    case "car":
      return { ...DEFAULTS };
    case "bus":
      return { ...DEFAULTS, makeLabel: "Make", bodyType: false, titlePlaceholder: "e.g. 2016 Toyota Hiace 14-seater" };
    case "truck":
      return { ...DEFAULTS, makeLabel: "Make", bodyType: false, titlePlaceholder: "e.g. 2014 Hino 500 Series Tipper" };
    case "motorcycle":
      return {
        ...DEFAULTS,
        makeLabel: "Brand",
        bodyType: false,
        transmission: false,
        fuel: false,
        engineLabel: "Engine cc",
        titlePlaceholder: "e.g. 2020 Haojue 150cc",
      };
    case "heavy_equipment":
      return {
        ...DEFAULTS,
        makeLabel: "Brand",
        modelLabel: "Model / type",
        transmission: false,
        bodyType: false,
        registration: false,
        engineLabel: "Operating hours",
        titlePlaceholder: "e.g. Caterpillar 320D Excavator",
      };
    case "parts":
      return {
        ...DEFAULTS, vehicle: true, make: "text",
        makeLabel: "Fits brand (optional)", modelLabel: "Fits model (optional)",
        year: false, mileage: false, transmission: false, fuel: false, bodyType: false,
        engine: false, registration: false, colour: false, condition: true,
        titlePlaceholder: "e.g. Toyota Corolla 2014 headlight (LH)",
      };
    case "accessories":
      return {
        ...DEFAULTS, vehicle: true, make: "text",
        makeLabel: "Brand (optional)", modelLabel: "Model (optional)",
        year: false, mileage: false, transmission: false, fuel: false, bodyType: false,
        engine: false, registration: false, colour: true, condition: true,
        titlePlaceholder: "e.g. Pioneer Car Stereo with Bluetooth",
      };
    case "services":
      return {
        ...DEFAULTS, vehicle: false, make: "off",
        makeLabel: "", modelLabel: "",
        year: false, mileage: false, transmission: false, fuel: false, bodyType: false,
        engine: false, registration: false, colour: false, condition: false,
        titlePlaceholder: "e.g. Mobile car AC repair — Accra",
      };
    default:
      return DEFAULTS;
  }
}

/** Returns the brand → models dictionary to use for a given category. */
export function brandLibFor(cat: CategorySlug | ""): CategoryBrandLib {
  switch (cat) {
    case "motorcycle": return MOTORCYCLE_BRANDS;
    case "bus": return BUS_BRANDS;
    case "truck": return TRUCK_BRANDS;
    case "heavy_equipment": return HEAVY_EQUIPMENT_BRANDS;
    case "car": return CAR_BRANDS;
    default: return CAR_BRANDS;
  }
}

export function brandsFor(cat: CategorySlug | ""): string[] {
  if (cat === "car" || cat === "") return ALL_BRANDS;
  return Object.keys(brandLibFor(cat));
}
