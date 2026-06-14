import type { CategorySlug } from "@/lib/ghana";

export type MakeMode = "list" | "text" | "off";

export interface CategoryFieldConfig {
  /** Show the "vehicle details" block at all (make/model/year/etc) */
  vehicle: boolean;
  /** Make/Model input style. "list" uses CAR_BRANDS, "text" is free text, "off" hides them. */
  make: MakeMode;
  /** Label for the make field — e.g. "Make", "Brand", "Manufacturer" */
  makeLabel: string;
  modelLabel: string;
  year: boolean;
  mileage: boolean;
  transmission: boolean;
  fuel: boolean;
  bodyType: boolean;
  colour: boolean;
  engine: boolean;
  /** Label for engine field (e.g. "Engine", "Engine cc", "Operating hours") */
  engineLabel: string;
  registration: boolean;
  condition: boolean;
  /** Default title placeholder */
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
      return { ...DEFAULTS, bodyType: false, titlePlaceholder: "e.g. 2016 Toyota Hiace 14-seater" };
    case "truck":
      return { ...DEFAULTS, bodyType: false, titlePlaceholder: "e.g. 2014 Hino 500 Series Tipper" };
    case "motorcycle":
      return {
        ...DEFAULTS,
        make: "text",
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
        make: "text",
        makeLabel: "Brand",
        modelLabel: "Model / type",
        transmission: false,
        bodyType: false,
        colour: false,
        registration: false,
        engineLabel: "Operating hours",
        titlePlaceholder: "e.g. Caterpillar 320D Excavator",
      };
    case "parts":
      return {
        ...DEFAULTS,
        vehicle: true,
        make: "text",
        makeLabel: "Fits brand (optional)",
        modelLabel: "Fits model (optional)",
        year: false,
        mileage: false,
        transmission: false,
        fuel: false,
        bodyType: false,
        engine: false,
        registration: false,
        colour: false,
        condition: true,
        titlePlaceholder: "e.g. Toyota Corolla 2014 headlight (LH)",
      };
    case "accessories":
      return {
        ...DEFAULTS,
        vehicle: true,
        make: "text",
        makeLabel: "Brand (optional)",
        modelLabel: "Model (optional)",
        year: false,
        mileage: false,
        transmission: false,
        fuel: false,
        bodyType: false,
        engine: false,
        registration: false,
        colour: true,
        condition: true,
        titlePlaceholder: "e.g. Pioneer Car Stereo with Bluetooth",
      };
    case "services":
      return {
        ...DEFAULTS,
        vehicle: false,
        make: "off",
        makeLabel: "",
        modelLabel: "",
        year: false,
        mileage: false,
        transmission: false,
        fuel: false,
        bodyType: false,
        engine: false,
        registration: false,
        colour: false,
        condition: false,
        titlePlaceholder: "e.g. Mobile car AC repair — Accra",
      };
    default:
      return DEFAULTS;
  }
}
