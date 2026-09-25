import type { Tender, DelhiZone, TenderCategory } from "@/types/tender";
import { detectZone } from "./zones";
import { detectCategory } from "./categories";
import { isClosingSoon, isNewTender } from "./utils";

const ORGS = [
  { name: "Public Works Department", dept: "PWD", chain: "Public Works Department||CE/SE" },
  { name: "Delhi Jal Board", dept: "DJB", chain: "Delhi Jal Board||EE (Civil)" },
  { name: "New Delhi Municipal Council", dept: "NDMC", chain: "New Delhi Municipal Council" },
  { name: "DSIIDC", dept: "DSIIDC", chain: "DSIIDC" },
  { name: "Irrigation and Flood Control", dept: "I&FC", chain: "Irrigation and Flood Control" },
  { name: "Delhi Urban Shelter Improvement Board", dept: "DUSIB", chain: "DUSIB||Engineering" },
  { name: "IPGCL-PPCL", dept: "IPGCL", chain: "IPGCL-PPCL||CS" },
  { name: "Delhi Transport Infrastructure Development Corp Ltd", dept: "DTIDC", chain: "DTIDC" },
  { name: "Delhi Transport Corporation", dept: "DTC", chain: "Delhi Transport Corporation" },
  { name: "Department of Environment", dept: "Environment", chain: "Department of Environment" },
  { name: "Dy. Conservator of Forests (West)", dept: "Forest", chain: "Dy. Conservator of Forests(West)" },
  { name: "Delhi Transco Limited", dept: "DTL", chain: "Delhi Transco Limited" },
];

const TITLES: { title: string; cat: TenderCategory; zone: DelhiZone; valueRange: [number, number] }[] = [
  { title: "Maintenance to various roads under PWD Division South Road -1 (SH- Construction of Dumping yard for malba dumping)", cat: "Roads", zone: "South", valueRange: [25_00_000, 80_00_000] },
  { title: "Rectification of deep settled and damaged sewer line in South Gamri, Bhajanpura ward", cat: "Water & Sewerage", zone: "North-East", valueRange: [15_00_000, 45_00_000] },
  { title: "Replacement of existing outlived 08 passenger lifts in Fire Safety Management Academy, Sector-14, Rohini", cat: "Electrical", zone: "North", valueRange: [40_00_000, 1_20_00_000] },
  { title: "Furnishing of the chamber of member of DCPCR, 5th Floor, ISBT Building Kashmere Gate Delhi", cat: "Buildings", zone: "Central", valueRange: [8_00_000, 25_00_000] },
  { title: "Providing and laying water proofing on the roof and white washing in CISF barracks at IP Station", cat: "Buildings", zone: "Central", valueRange: [5_00_000, 18_00_000] },
  { title: "RMO Electrical and Mechanical Services at Vikas Bhawan-II, Delhi", cat: "Electrical", zone: "Central", valueRange: [50_00_000, 1_50_00_000] },
  { title: "Repair/replacement of old and damaged water line in Gali No. 04, Shankar Marg Mandawali, Patparganj", cat: "Water & Sewerage", zone: "East", valueRange: [12_00_000, 35_00_000] },
  { title: "Engagement of an Execution Partner for Monitoring of Plantation in Central Ridge under West Forest Division", cat: "Horticulture", zone: "West", valueRange: [10_00_000, 30_00_000] },
  { title: "Annual Maintenance Contract for Chiller Units of Voltas Plant and SWAS unit at PPS-I for Two years", cat: "Mechanical", zone: "Central", valueRange: [60_00_000, 2_00_00_000] },
  { title: "Supply and installation of Street Lights under Sub Division, Dwarka, New Delhi", cat: "Electrical", zone: "South-West", valueRange: [35_00_000, 90_00_000] },
  { title: "Desilting and cleaning of storm water drains in various areas of West Zone", cat: "Water & Sewerage", zone: "West", valueRange: [40_00_000, 1_10_00_000] },
  { title: "Renovation of community centre building at Sector-9, Rohini", cat: "Buildings", zone: "North", valueRange: [70_00_000, 2_50_00_000] },
  { title: "Strengthening and resurfacing of internal roads in Janakpuri residential area", cat: "Roads", zone: "West", valueRange: [1_20_00_000, 4_00_00_000] },
  { title: "Supply of Desktop Computers and Peripherals for departmental offices", cat: "IT & Electronics", zone: "New Delhi", valueRange: [25_00_000, 75_00_000] },
  { title: "Housekeeping and Facility Management Services at NDMC buildings", cat: "Services", zone: "New Delhi", valueRange: [90_00_000, 2_80_00_000] },
  { title: "Construction of boundary wall and gate at forest nursery, Najafgarh", cat: "Civil Works", zone: "South-West", valueRange: [18_00_000, 48_00_000] },
  { title: "Repair of damaged sewer lines in Kalkaji and Okhla areas", cat: "Water & Sewerage", zone: "South-East", valueRange: [55_00_000, 1_40_00_000] },
  { title: "Installation of CCTV surveillance system at various bus terminals", cat: "IT & Electronics", zone: "Central", valueRange: [45_00_000, 1_20_00_000] },
  { title: "Widening and improvement of road from Mehrauli to Chhatarpur", cat: "Roads", zone: "South", valueRange: [3_00_00_000, 8_00_00_000] },
  { title: "AMC of elevators and escalators at ISBT Kashmere Gate", cat: "Electrical", zone: "Central", valueRange: [30_00_000, 85_00_000] },
  { title: "Providing and fixing of modular furniture in newly constructed offices", cat: "Goods", zone: "East", valueRange: [40_00_000, 1_10_00_000] },
  { title: "Desilting of major drains under Irrigation & Flood Control Department", cat: "Water & Sewerage", zone: "North", valueRange: [2_00_00_000, 6_00_00_000] },
  { title: "Construction of additional classrooms in MCD schools of Shahdara zone", cat: "Buildings", zone: "Shahdara", valueRange: [1_50_00_000, 4_50_00_000] },
  { title: "Supply of Diesel Generator sets for backup power at water treatment plants", cat: "Mechanical", zone: "West", valueRange: [80_00_000, 2_20_00_000] },
  { title: "Consultancy services for detailed project report of flyover at ITO", cat: "Consultancy", zone: "Central", valueRange: [50_00_000, 1_50_00_000] },
  { title: "Plantation and maintenance of green belts along Ring Road", cat: "Horticulture", zone: "South", valueRange: [25_00_000, 70_00_000] },
  { title: "Rehabilitation of old water supply pipelines in Civil Lines area", cat: "Water & Sewerage", zone: "North", valueRange: [1_80_00_000, 5_00_00_000] },
  { title: "Electrical rewiring and panel upgradation at Vikas Minar", cat: "Electrical", zone: "Central", valueRange: [60_00_000, 1_60_00_000] },
  { title: "Providing Project Management Consultancy Service for various civil works", cat: "Consultancy", zone: "New Delhi", valueRange: [80_00_000, 3_00_00_000] },
  { title: "Construction of Dumping yard for malba dumping under Sub Division SR-15", cat: "Civil Works", zone: "South", valueRange: [20_00_000, 55_00_000] },
];

function randomBetween(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
function addDays(date: Date, days: number) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}
function toISO(d: Date) {
  return d.toISOString();
}

export function generateSampleTenders(count = 120): Tender[] {
  const now = new Date();
  const tenders: Tender[] = [];

  for (let i = 0; i < count; i++) {
    const template = TITLES[i % TITLES.length];
    const org = ORGS[i % ORGS.length];
    const published = addDays(now, -randomBetween(1, 45));
    const closingDays = randomBetween(2, 45);
    const closing = addDays(now, closingDays);
    const opening = addDays(closing, 0);
    opening.setHours(opening.getHours() + 1);

    const value = randomBetween(template.valueRange[0], template.valueRange[1]);
    const hasCorrigendum = Math.random() < 0.18;
    const isNew = isNewTender(toISO(published), 7);
    const closingSoon = isClosingSoon(toISO(closing), 7);

    let status: Tender["status"] = "active";
    if (closingSoon) status = "closing_soon";
    if (hasCorrigendum && Math.random() < 0.4) status = "corrigendum";
    if (closingDays > 20 && Math.random() < 0.1) status = "extended";

    const tenderId = `2026_${org.dept}_${290000 + i}_${(i % 5) + 1}`;
    const refNo = `NIT No. ${10 + (i % 50)}/${org.dept}/2026-27`;
    const zone = detectZone(template.zone, template.title, org.name) || template.zone;
    const category = detectCategory(template.title) || template.cat;

    tenders.push({
      id: `tender-${i + 1}`,
      tenderId,
      referenceNo: refNo,
      title: template.title,
      organisation: org.name,
      department: org.dept,
      organisationChain: org.chain,
      closingDate: toISO(closing),
      bidOpeningDate: toISO(opening),
      publishedDate: toISO(published),
      estimatedValue: value,
      location: `${template.zone} Delhi`,
      zone,
      category,
      tenderType: Math.random() > 0.2 ? "Open Tender" : "Limited Tender",
      formOfContract: Math.random() > 0.3 ? "Works" : "Services",
      productCategory: category,
      status,
      numberOfBids: Math.random() > 0.6 ? randomBetween(1, 12) : null,
      hasCorrigendum,
      corrigendumCount: hasCorrigendum ? randomBetween(1, 3) : 0,
      detailUrl: `https://govtprocurement.delhi.gov.in/nicgep/app?page=FrontEndViewTender&service=page&tid=${tenderId}`,
      nitUrl: null,
      documents: [
        { name: "NIT.pdf", url: "#" },
        { name: "BOQ.xls", url: "#" },
        ...(hasCorrigendum ? [{ name: "Corrigendum.pdf", url: "#" }] : []),
      ],
      emdAmount: Math.round(value * 0.02),
      tenderFee: value > 50_00_000 ? 5000 : 1000,
      bidValidityDays: 90,
      description: template.title,
      isNew,
      isClosingSoon: closingSoon,
      stateCode: "DL",
      stateName: "Delhi (NCT)",
      enriched: false,
    });
  }

  return tenders.sort(
    (a, b) => new Date(a.closingDate).getTime() - new Date(b.closingDate).getTime()
  );
}

export const SAMPLE_TENDERS = generateSampleTenders(140);
