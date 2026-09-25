export interface PortalConfig {
  code: string;
  name: string;
  shortName: string;
  baseUrl: string;
  region: string;
}

/** Major GePNIC e-procurement portals (same NIC stack). */
export const PORTALS: PortalConfig[] = [
  {
    code: "DL",
    name: "Delhi (NCT)",
    shortName: "Delhi",
    baseUrl: "https://govtprocurement.delhi.gov.in/nicgep/app",
    region: "Delhi",
  },
  {
    code: "KL",
    name: "Kerala",
    shortName: "Kerala",
    baseUrl: "https://etenders.kerala.gov.in/nicgep/app",
    region: "South",
  },
  {
    code: "RJ",
    name: "Rajasthan",
    shortName: "Rajasthan",
    baseUrl: "https://eproc.rajasthan.gov.in/nicgep/app",
    region: "West",
  },
  {
    code: "UP",
    name: "Uttar Pradesh",
    shortName: "UP",
    baseUrl: "https://etender.up.nic.in/nicgep/app",
    region: "North",
  },
  {
    code: "HR",
    name: "Haryana",
    shortName: "Haryana",
    baseUrl: "https://etenders.hry.nic.in/nicgep/app",
    region: "North",
  },
  {
    code: "WB",
    name: "West Bengal",
    shortName: "West Bengal",
    baseUrl: "https://wbtenders.gov.in/nicgep/app",
    region: "East",
  },
];

export function getPortal(code: string): PortalConfig | undefined {
  return PORTALS.find((p) => p.code === code);
}
