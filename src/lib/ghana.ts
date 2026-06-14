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
  Toyota: ["Corolla", "Camry", "RAV4", "Hilux", "Highlander", "Land Cruiser", "Land Cruiser Prado", "Yaris", "Vitz", "Avensis", "Fortuner", "Tacoma", "Tundra", "4Runner", "Sienna", "Sequoia", "Venza", "Matrix", "Echo", "Solara", "Prius", "Rush", "Wish", "Innova", "Avanza", "Hiace", "Coaster", "Aygo", "Auris", "Verso", "Mark X", "Crown", "Yaris Cross", "C-HR", "bZ4X", "Granvia"],
  Honda: ["Civic", "Accord", "CR-V", "Pilot", "Fit", "Odyssey", "HR-V", "Passport", "Ridgeline", "Insight", "Element", "Crosstour", "Stream", "Jazz", "City", "BR-V", "WR-V", "Freed", "Vezel", "Stepwgn"],
  Nissan: ["Sentra", "Altima", "Maxima", "Rogue", "X-Trail", "Patrol", "Navara", "Note", "Qashqai", "Pathfinder", "Murano", "Juke", "Versa", "Kicks", "Frontier", "Titan", "Armada", "Leaf", "370Z", "GT-R", "Sunny", "Tiida", "Almera", "March", "Cube", "Bluebird", "Caravan", "Urvan", "Hardbody", "Sylphy", "Teana"],
  Hyundai: ["Elantra", "Sonata", "Tucson", "Santa Fe", "i10", "i20", "i30", "i40", "Accent", "Creta", "Kona", "Palisade", "Venue", "Veloster", "Genesis", "Equus", "Azera", "Getz", "Matrix", "Terracan", "H1", "H100", "Starex", "Grand Starex", "ix35", "Ioniq", "Ioniq 5", "Ioniq 6"],
  Kia: ["Rio", "Picanto", "Cerato", "Sportage", "Sorento", "Optima", "K5", "Soul", "Forte", "Stinger", "Telluride", "Seltos", "Carnival", "Sedona", "Carens", "Pregio", "Pride", "Spectra", "Mohave", "Mentor", "Niro", "EV6"],
  Ford: ["Focus", "Fusion", "Escape", "Edge", "Explorer", "Expedition", "Ranger", "F-150", "F-250", "F-350", "Transit", "Transit Connect", "Mustang", "Taurus", "Fiesta", "EcoSport", "Bronco", "Bronco Sport", "Maverick", "Flex", "Galaxy", "Kuga", "Mondeo", "Endeavour", "Everest", "Tourneo"],
  Chevrolet: ["Spark", "Cruze", "Malibu", "Equinox", "Tahoe", "Suburban", "Silverado", "Colorado", "Trax", "Trailblazer", "Traverse", "Blazer", "Captiva", "Aveo", "Sonic", "Impala", "Camaro", "Corvette", "Astro", "Express"],
  Mercedes: ["A-Class", "B-Class", "C-Class", "E-Class", "S-Class", "CLA", "CLS", "GLA", "GLB", "GLC", "GLE", "GLS", "G-Class", "ML", "GL", "Sprinter", "Vito", "Viano", "V-Class", "SLK", "SL", "AMG GT", "EQC", "EQS", "Actros", "Atego", "Axor"],
  BMW: ["1 Series", "2 Series", "3 Series", "4 Series", "5 Series", "6 Series", "7 Series", "8 Series", "X1", "X2", "X3", "X4", "X5", "X6", "X7", "Z3", "Z4", "M2", "M3", "M4", "M5", "M8", "i3", "i4", "i7", "iX", "iX3"],
  Audi: ["A1", "A3", "A4", "A5", "A6", "A7", "A8", "Q2", "Q3", "Q4", "Q5", "Q7", "Q8", "TT", "R8", "RS3", "RS4", "RS6", "RS7", "e-tron", "e-tron GT"],
  Volkswagen: ["Up", "Polo", "Golf", "Jetta", "Passat", "Arteon", "Beetle", "Scirocco", "T-Cross", "T-Roc", "Tiguan", "Touareg", "Atlas", "Touran", "Sharan", "Caddy", "Transporter", "Crafter", "Amarok", "ID.3", "ID.4"],
  Mazda: ["Mazda 2", "Mazda 3", "Mazda 5", "Mazda 6", "CX-3", "CX-30", "CX-5", "CX-7", "CX-8", "CX-9", "CX-50", "CX-60", "CX-90", "MX-5", "MX-30", "BT-50", "Tribute", "Premacy", "Demio", "Axela", "Atenza", "Bongo"],
  Mitsubishi: ["Lancer", "Outlander", "ASX", "Eclipse Cross", "Pajero", "Pajero Sport", "Montero", "Montero Sport", "L200", "Triton", "Galant", "Mirage", "Attrage", "Colt", "Space Star", "Space Wagon", "i-MiEV", "Xpander", "Fuso Canter", "Fuso Fighter"],
  Lexus: ["IS", "ES", "GS", "LS", "CT", "UX", "NX", "RX", "GX", "LX", "RC", "LC", "RZ", "LM"],
  Subaru: ["Impreza", "WRX", "Legacy", "Forester", "Outback", "XV", "Crosstrek", "Ascent", "BRZ", "Tribeca", "Justy", "Sambar"],
  Suzuki: ["Swift", "Alto", "Celerio", "Vitara", "Grand Vitara", "Jimny", "Baleno", "Ertiga", "Wagon R", "Ignis", "S-Cross", "SX4", "Splash", "APV", "Carry", "Kizashi", "Ciaz"],
  Peugeot: ["108", "208", "2008", "301", "308", "3008", "408", "5008", "508", "Partner", "Expert", "Boxer", "Rifter", "Traveller", "Landtrek", "RCZ"],
  Renault: ["Clio", "Megane", "Captur", "Duster", "Kadjar", "Koleos", "Logan", "Sandero", "Symbol", "Talisman", "Scenic", "Espace", "Kangoo", "Trafic", "Master", "Twingo", "Zoe", "Arkana"],
  Citroen: ["C1", "C3", "C3 Aircross", "C4", "C4 Cactus", "C5", "C5 Aircross", "Berlingo", "Jumpy", "Jumper", "DS3", "DS4", "DS5", "C-Elysée", "Spacetourer"],
  Fiat: ["500", "500X", "500L", "Punto", "Tipo", "Doblo", "Panda", "Bravo", "Linea", "Fiorino", "Ducato", "Fullback", "124 Spider"],
  Opel: ["Astra", "Corsa", "Insignia", "Mokka", "Crossland", "Grandland", "Zafira", "Combo", "Vivaro", "Movano", "Adam", "Karl", "Antara"],
  Volvo: ["S40", "S60", "S80", "S90", "V40", "V60", "V90", "XC40", "XC60", "XC70", "XC90", "C30", "C40", "C70", "FH", "FM", "FMX"],
  Jeep: ["Wrangler", "Cherokee", "Grand Cherokee", "Compass", "Renegade", "Patriot", "Liberty", "Commander", "Gladiator", "Wagoneer", "Grand Wagoneer"],
  Land_Rover: ["Defender", "Discovery", "Discovery Sport", "Range Rover", "Range Rover Sport", "Range Rover Velar", "Range Rover Evoque", "Freelander", "LR2", "LR3", "LR4"],
  Porsche: ["911", "718 Cayman", "718 Boxster", "Cayenne", "Macan", "Panamera", "Taycan", "Cayman", "Boxster"],
  Tesla: ["Model 3", "Model Y", "Model S", "Model X", "Cybertruck", "Roadster"],
  GMC: ["Sierra", "Sierra HD", "Yukon", "Yukon XL", "Acadia", "Terrain", "Canyon", "Savana", "Hummer EV"],
  Dodge: ["Charger", "Challenger", "Durango", "Journey", "Caravan", "Grand Caravan", "Dart", "Avenger", "Nitro", "Ram 1500", "Ram 2500", "Ram 3500"],
  Acura: ["TLX", "MDX", "RDX", "ILX", "RLX", "ZDX", "Integra", "NSX"],
  Infiniti: ["Q50", "Q60", "Q70", "QX30", "QX50", "QX55", "QX60", "QX70", "QX80", "G37", "FX35", "FX37", "M37"],
  Cadillac: ["CT4", "CT5", "CT6", "CTS", "XTS", "ATS", "STS", "Escalade", "XT4", "XT5", "XT6", "SRX", "Lyriq"],
  Buick: ["Encore", "Enclave", "Envision", "LaCrosse", "Regal", "Verano", "Cascada"],
  Chrysler: ["300", "Pacifica", "Voyager", "Town & Country", "Sebring", "200"],
  Mini: ["Cooper", "Cooper S", "Countryman", "Clubman", "Paceman", "Coupe", "Roadster", "John Cooper Works"],
  Jaguar: ["XE", "XF", "XJ", "F-Type", "F-Pace", "E-Pace", "I-Pace", "S-Type", "X-Type"],
  Skoda: ["Citigo", "Fabia", "Rapid", "Scala", "Octavia", "Superb", "Kamiq", "Karoq", "Kodiaq", "Yeti", "Roomster"],
  Seat: ["Ibiza", "Leon", "Ateca", "Arona", "Tarraco", "Toledo", "Alhambra", "Mii"],
  Isuzu: ["D-Max", "MU-X", "NPR", "NQR", "NLR", "Trooper", "Rodeo", "Bighorn", "Forward", "Giga"],
  Daihatsu: ["Terios", "Sirion", "Hijet", "Charade", "Mira", "Move", "Tanto", "Rocky", "Materia", "Copen"],
  Tata: ["Indica", "Indigo", "Xenon", "Nano", "Bolt", "Zest", "Tiago", "Tigor", "Nexon", "Harrier", "Safari", "Hexa", "Sumo", "Aria", "LPT", "Prima"],
  Geely: ["Emgrand", "Coolray", "Atlas", "Tugella", "Boyue", "Vision", "GC6", "GC7", "GX7", "EC7"],
  BYD: ["F0", "F3", "F6", "Atto 3", "Dolphin", "Seal", "Han", "Tang", "Song", "Yuan", "Qin"],
  Changan: ["CS35", "CS55", "CS75", "CS85", "Eado", "Alsvin", "Hunter", "UNI-T", "UNI-K"],
  Great_Wall: ["Wingle", "Steed", "Haval H6", "Haval H9", "Haval Jolion", "Poer", "Tank 300"],
  Haval: ["H1", "H2", "H6", "H9", "Jolion", "F7", "Dargo"],
  Chery: ["Tiggo 2", "Tiggo 3", "Tiggo 4", "Tiggo 7", "Tiggo 8", "Arrizo 5", "Arrizo 6", "QQ"],
  MG: ["3", "5", "6", "ZS", "HS", "RX5", "RX8", "Marvel R", "Cyberster"],
  Genesis: ["G70", "G80", "G90", "GV60", "GV70", "GV80"],
  Ssangyong: ["Tivoli", "Korando", "Rexton", "Musso", "Stavic", "Rodius", "Actyon", "Kyron"],
  Hummer: ["H1", "H2", "H3", "H3T"],
  Maserati: ["Ghibli", "Quattroporte", "Levante", "GranTurismo", "GranCabrio", "MC20", "Grecale"],
  Bentley: ["Continental", "Continental GT", "Flying Spur", "Bentayga", "Mulsanne", "Arnage"],
  Rolls_Royce: ["Phantom", "Ghost", "Wraith", "Dawn", "Cullinan", "Spectre", "Silver Shadow"],
  Ferrari: ["488", "F8", "812", "Roma", "Portofino", "SF90", "296", "Purosangue", "California"],
  Lamborghini: ["Huracan", "Aventador", "Urus", "Gallardo", "Murcielago", "Revuelto"],
  Mahindra: ["Scorpio", "XUV300", "XUV500", "XUV700", "Bolero", "Thar", "TUV300", "KUV100", "Marazzo", "Pik Up"],
  Hino: ["300 Series", "500 Series", "700 Series", "Dutro", "Ranger", "Profia"],
  MAN: ["TGE", "TGL", "TGM", "TGS", "TGX"],
  Scania: ["P-Series", "G-Series", "R-Series", "S-Series"],
  Iveco: ["Daily", "Eurocargo", "Stralis", "Trakker", "S-Way"],
  Foton: ["Tunland", "Sauvana", "View", "Aumark", "Auman", "Toano"],
  Yutong: ["ZK6107", "ZK6122", "ZK6938", "T7", "U12"],
  King_Long: ["Higer", "Kingo", "Citystar", "Longwei"],
  JAC: ["S3", "S5", "T6", "T8", "Refine", "iEV7"],
  DFSK: ["Glory 500", "Glory 580", "Glory 600", "K01", "K07", "C31"],
  Dongfeng: ["AX3", "AX4", "AX7", "Rich", "DFM", "T5"],
  Daewoo: ["Matiz", "Lanos", "Nubira", "Leganza", "Tacuma", "Kalos"],
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

export const CONDITIONS = ["Brand New", "Foreign Used", "Ghana Used"] as const;
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
