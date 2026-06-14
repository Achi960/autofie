// Ghana administrative regions and a representative set of districts.
// This is a sensible seed list — edit freely.

export const REGIONS: Record<string, string[]> = {
  "Greater Accra": ["Accra Metro", "Tema Metro", "Ga East", "Ga West", "Ga South", "Ga Central", "Adentan", "Ledzokuku", "Krowor", "Ashaiman", "La Nkwantanang Madina", "Ningo Prampram"],
  "Ashanti": ["Kumasi Metro", "Obuasi", "Ejisu", "Asokore Mampong", "Bekwai", "Mampong", "Kwabre East", "Atwima Nwabiagya", "Offinso", "Konongo"],
  "Western": ["Sekondi-Takoradi", "Tarkwa-Nsuaem", "Prestea-Huni Valley", "Ahanta West", "Nzema East", "Jomoro", "Wassa East"],
  "Western North": ["Sefwi Wiawso", "Bibiani-Anhwiaso-Bekwai", "Aowin", "Suaman", "Juaboso", "Bia East", "Bia West"],
  "Central": ["Cape Coast Metro", "Kasoa", "Mfantseman", "Komenda-Edina-Eguafo-Abirem", "Awutu Senya East", "Agona West", "Effutu", "Gomoa Central"],
  "Eastern": ["Koforidua", "Nsawam Adoagyiri", "Suhum", "Akwapim North", "New Juaben South", "East Akim", "West Akim", "Birim Central", "Kwahu South"],
  "Volta": ["Ho Municipal", "Keta Municipal", "Hohoe Municipal", "Akatsi South", "South Tongu", "Adaklu", "Anloga"],
  "Oti": ["Dambai", "Nkwanta South", "Krachi East", "Krachi West", "Jasikan", "Kadjebi", "Biakoye"],
  "Northern": ["Tamale Metro", "Sagnarigu", "Yendi", "Savelugu", "Gushegu", "Karaga", "Kpandai"],
  "Savannah": ["Damongo", "Bole", "Sawla-Tuna-Kalba", "Central Gonja", "East Gonja", "North Gonja", "North East Gonja"],
  "North East": ["Nalerigu", "Bunkpurugu Nyankpanduri", "East Mamprusi", "West Mamprusi", "Yunyoo-Nasuan", "Chereponi"],
  "Upper East": ["Bolgatanga Municipal", "Bawku Municipal", "Navrongo", "Bongo", "Kassena Nankana West", "Builsa North", "Builsa South"],
  "Upper West": ["Wa Municipal", "Jirapa", "Lawra", "Nadowli-Kaleo", "Sissala East", "Sissala West", "Daffiama-Bussie-Issa"],
  "Bono": ["Sunyani Municipal", "Dormaa Central", "Berekum East", "Wenchi", "Tain", "Banda", "Jaman South", "Jaman North"],
  "Bono East": ["Techiman Municipal", "Nkoranza South", "Nkoranza North", "Atebubu-Amantin", "Kintampo North", "Kintampo South", "Sene East", "Sene West", "Pru East", "Pru West"],
  "Ahafo": ["Goaso", "Asunafo North", "Asunafo South", "Asutifi North", "Asutifi South", "Tano North", "Tano South"],
};

export const ALL_REGIONS = Object.keys(REGIONS);

export const CAR_BRANDS: Record<string, string[]> = {
  Toyota: ["Corolla", "Camry", "RAV4", "Hilux", "Highlander", "Land Cruiser", "Yaris", "Vitz", "Avensis", "Fortuner", "Tacoma", "4Runner"],
  Honda: ["Civic", "Accord", "CR-V", "Pilot", "Fit", "Odyssey", "HR-V"],
  Nissan: ["Sentra", "Altima", "Maxima", "Rogue", "X-Trail", "Patrol", "Navara", "Note", "Qashqai", "Pathfinder"],
  Hyundai: ["Elantra", "Sonata", "Tucson", "Santa Fe", "i10", "i20", "Accent", "Creta"],
  Kia: ["Rio", "Picanto", "Cerato", "Sportage", "Sorento", "Optima", "Soul"],
  Ford: ["Focus", "Fusion", "Escape", "Edge", "Explorer", "Ranger", "F-150", "Transit"],
  Chevrolet: ["Spark", "Cruze", "Malibu", "Equinox", "Tahoe", "Silverado"],
  Mercedes: ["C-Class", "E-Class", "S-Class", "GLA", "GLC", "GLE", "GLS", "ML", "Sprinter"],
  BMW: ["3 Series", "5 Series", "7 Series", "X1", "X3", "X5", "X6", "X7"],
  Audi: ["A3", "A4", "A6", "Q3", "Q5", "Q7"],
  Volkswagen: ["Golf", "Polo", "Passat", "Tiguan", "Touareg", "Jetta"],
  Mazda: ["Mazda 2", "Mazda 3", "Mazda 6", "CX-3", "CX-5", "CX-9"],
  Mitsubishi: ["Lancer", "Outlander", "ASX", "Pajero", "L200"],
  Lexus: ["IS", "ES", "RX", "GX", "LX", "NX"],
  Subaru: ["Impreza", "Legacy", "Forester", "Outback", "XV"],
  Suzuki: ["Swift", "Alto", "Vitara", "Jimny", "Baleno"],
  Peugeot: ["208", "301", "308", "3008", "5008", "Partner"],
  Renault: ["Clio", "Megane", "Duster", "Captur", "Logan"],
  Citroen: ["C3", "C4", "Berlingo", "C-Elysée"],
  Fiat: ["500", "Punto", "Tipo", "Doblo"],
  Opel: ["Astra", "Corsa", "Insignia", "Mokka"],
  Volvo: ["S60", "S90", "XC40", "XC60", "XC90"],
  Jeep: ["Wrangler", "Cherokee", "Grand Cherokee", "Compass", "Renegade"],
  Land_Rover: ["Defender", "Discovery", "Range Rover", "Range Rover Sport", "Evoque"],
  Porsche: ["Cayenne", "Macan", "Panamera", "911"],
  Tesla: ["Model 3", "Model Y", "Model S", "Model X"],
  GMC: ["Sierra", "Yukon", "Acadia", "Terrain"],
  Dodge: ["Charger", "Challenger", "Durango", "Ram 1500"],
  Acura: ["TLX", "MDX", "RDX", "ILX"],
  Infiniti: ["Q50", "Q60", "QX50", "QX60", "QX80"],
  Cadillac: ["CTS", "XTS", "Escalade", "XT5"],
  Buick: ["Encore", "Enclave", "LaCrosse"],
  Chrysler: ["300", "Pacifica"],
  Mini: ["Cooper", "Countryman", "Clubman"],
  Jaguar: ["XE", "XF", "F-Pace", "E-Pace"],
  Skoda: ["Octavia", "Fabia", "Kodiaq", "Karoq"],
  Seat: ["Ibiza", "Leon", "Ateca"],
  Isuzu: ["D-Max", "MU-X", "NPR"],
  Daihatsu: ["Terios", "Sirion", "Hijet"],
  Tata: ["Indica", "Indigo", "Xenon"],
};

export const ALL_BRANDS = Object.keys(CAR_BRANDS);

export const CATEGORIES = [
  { slug: "car", label: "Cars" },
  { slug: "motorcycle", label: "Motorcycles" },
  { slug: "bus", label: "Buses" },
  { slug: "truck", label: "Trucks" },
  { slug: "heavy_equipment", label: "Heavy Equipment" },
  { slug: "parts", label: "Parts" },
  { slug: "accessories", label: "Accessories" },
  { slug: "services", label: "Services" },
] as const;

export type CategorySlug = (typeof CATEGORIES)[number]["slug"];

export const CONDITIONS = ["Brand New", "Foreign Used", "Locally Used"] as const;
export const TRANSMISSIONS = ["Automatic", "Manual", "CVT"] as const;
export const FUELS = ["Petrol", "Diesel", "Hybrid", "Electric", "LPG"] as const;
export const BODY_TYPES = ["Sedan", "SUV", "Hatchback", "Pickup", "Coupe", "Convertible", "Van", "Wagon"] as const;
export const REGISTRATION_STATUS = ["Registered", "Unregistered"] as const;

export const LISTING_REJECTION_REASONS = [
  "Photos are unclear or insufficient",
  "Price seems incorrect or unrealistic",
  "Description is incomplete",
  "Duplicate listing",
  "Vehicle details don't match photos",
  "Suspected fraudulent listing",
  "Inappropriate content",
  "Other policy violation",
];

export const LISTING_CLOSE_REASONS = [
  "Sold through Autofie",
  "Sold elsewhere",
  "No longer for sale",
  "Other",
];
