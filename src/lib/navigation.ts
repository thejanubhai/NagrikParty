// Nagrik Party Central Navigation Structure
// Single source of truth for header navigation, footer, and human-readable sitemap.

export interface NavLink {
  label: string;
  href: string;
  description?: string;
  external?: boolean;
}

export interface NavSection {
  title: string;
  items: NavLink[];
}

// Logged out public primary navigation
export const publicNavLinks: NavLink[] = [
  { label: "Explore", href: "/explore", description: "Civic data, verified crime tracker, aur topic monitors" },
  { label: "Kyun Nagrik", href: "/why-nagrik", description: "Nagrik Party banane ki kahani aur siddhant" },
  { label: "Formation", href: "/formation-progress", description: "Phase 1 formation roadmap aur progress" },
  { label: "Constitution", href: "/legal/constitution", description: "Hamare foundational democratic by-laws" },
  { label: "Hisaab", href: "/transparency", description: "Cashless formation ledger aur audit reports" },
];

// Logged in authenticated primary navigation
export const memberNavLinks: NavLink[] = [
  { label: "Explore", href: "/explore", description: "Civic data aur crime monitors" },
  { label: "Participate", href: "/build-with-us", description: "Skill-based participation tasks" },
  { label: "Issues", href: "/issues", description: "Local issues report aur monitor karein" },
  { label: "Formation", href: "/formation-progress", description: "Phase 1 progress aur statutory status" },
  { label: "Hisaab", href: "/transparency", description: "Verified financial disclosures" },
];

// Streamlined Public Footer
export const footerSections: NavSection[] = [
  {
    title: "Join",
    items: [
      { label: "Become a Member", href: "/membership" },
      { label: "Yogdaan Karein", href: "/contribute" },
      { label: "Become a Volunteer", href: "/volunteer" },
      { label: "Build With Us", href: "/build-with-us" },
      { label: "Member Dashboard", href: "/member" },
    ],
  },
  {
    title: "Explore",
    items: [
      { label: "Explore Hub", href: "/explore" },
      { label: "Civic Issues", href: "/issues" },
      { label: "Crime Tracker", href: "/crime" },
    ],
  },
  {
    title: "Transparency",
    items: [
      { label: "Constitution", href: "/legal/constitution" },
      { label: "Financial Transparency", href: "/transparency" },
      { label: "Formation Roadmap", href: "/formation-progress" },
      { label: "Public Documents", href: "/documents" },
    ],
  },
  {
    title: "About",
    items: [
      { label: "Why Nagrik", href: "/why-nagrik" },
      { label: "Founder", href: "/founder" },
      { label: "Sitemap", href: "/sitemap" },
    ],
  },
];

// Complete Site Registry for human-readable /sitemap
export const sitemapStructure: NavSection[] = [
  {
    title: "Home",
    items: [
      { label: "Founding Nagrik Party", href: "/", description: "Homepage: A political party is being built." },
    ],
  },
  {
    title: "Join",
    items: [
      { label: "Become a Member", href: "/membership", description: "Formal founding membership induction under Section 29A RPA 1951" },
      { label: "Yogdaan (Contribute)", href: "/contribute", description: "Formation Phase yogdaan, printable A4/A5 poster aur UPI QR" },
      { label: "Become a Volunteer", href: "/volunteer", description: "Contribute time, ground organizing, or skills" },
      { label: "Build With Us", href: "/build-with-us", description: "Skill-based participation tasks" },
    ],
  },
  {
    title: "Explore",
    items: [
      { label: "Civic Explorer", href: "/explore", description: "Public data explorer and topic monitors" },
      { label: "Verified Crime Tracker", href: "/crime", description: "Publicly documented offenses verified against news reports" },
      { label: "Civic Issues & Grievances", href: "/issues", description: "Citizen grievance reporting and verification" },
      { label: "Topic Tracker: Air Pollution", href: "/explore/topics/air-pollution", description: "Indexed mentions and air quality reports" },
      { label: "Topic Tracker: Garbage & Waste", href: "/explore/topics/garbage", description: "Solid waste remediation tracking" },
      { label: "Topic Tracker: Roads & Potholes", href: "/explore/topics/roads", description: "Road infrastructure records" },
      { label: "Topic Tracker: Water Supply", href: "/explore/topics/water", description: "Water availability and pipeline tracking" },
      { label: "Topic Tracker: Public Healthcare", href: "/explore/topics/healthcare", description: "Healthcare access and clinic monitoring" },
    ],
  },
  {
    title: "Formation",
    items: [
      { label: "Roadmap & Progress", href: "/formation-progress", description: "Weighted 9-stage legal and organizational progress" },
      { label: "Founding Story & Why Nagrik", href: "/why-nagrik", description: "Lived public service experience and organizational rationale" },
    ],
  },
  {
    title: "Transparency",
    items: [
      { label: "Financial Transparency", href: "/transparency", description: "Zero-cash formation accounts, receipts, and disclosures" },
      { label: "Public Document Vault", href: "/documents", description: "Foundational charters and compliance documents" },
      { label: "Draft Constitution", href: "/legal/constitution", description: "Inner-party democracy and constitutional pledge" },
    ],
  },
  {
    title: "Policies & Charters",
    items: [
      { label: "Code of Ethics", href: "/legal/ethics", description: "Conduct and anti-corruption standards" },
      { label: "Digital Governance & Privacy", href: "/legal/digital-governance", description: "Citizen data protection principles" },
      { label: "Rulebook & Governance", href: "/legal/rulebook", description: "Internal procedures and reviews" },
      { label: "Candidate Selection Policy", href: "/legal/candidate-selection", description: "Standards for potential candidates" },
      { label: "Internal Democracy", href: "/legal/internal-democracy", description: "Consultation and voting rules" },
      { label: "Privacy Notice", href: "/legal/privacy", description: "Pre-registration data notice" },
    ],
  },
  {
    title: "About",
    items: [
      { label: "Founder: Sheikh Arsalanullah Chishti", href: "/founder", description: "Founding Convener profile and biographical record" },
      { label: "About Nagrik Party", href: "/about", description: "Overview of the party under formation" },
    ],
  },
  {
    title: "Account",
    items: [
      { label: "Member Portal", href: "/member", description: "Member dashboard and induction status" },
      { label: "Sign In", href: "/login", description: "Access your membership or volunteer profile" },
      { label: "Membership Card", href: "/member/membership-card", description: "View or download your digital organizational card" },
    ],
  },
];
