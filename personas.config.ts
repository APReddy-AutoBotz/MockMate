import React from 'react';
import { TalentAcquisitionIcon, BriefcaseIcon, DevLeadIcon, DataScientistIcon, DomainExpertIcon, ProjectManagerIcon, ExecutiveSponsorIcon, ClinicalSupervisorIcon, MarketingLeadIcon } from './components/icons/personaIcons';

export type PersonaDomain = 'General' | 'Tech' | 'Business' | 'Healthcare' | 'Creative';

export type Persona = {
  id: string;
  name: string;
  title: string;
  focus: string;
  domain: PersonaDomain[];
  color: string;
  icon: React.FC<React.SVGProps<SVGSVGElement>>;
  blurb: string;
};

// This is the single source of truth for persona details.
export const PERSONAS_CONFIG: Persona[] = [
  // General & HR
  { 
    id: 'p1', 
    name: "Asha", 
    title: "Talent Acq. Manager",
    focus: "Culture, Communication, STAR Method",
    domain: ['General'],
    color: 'alert-coral', 
    icon: TalentAcquisitionIcon, 
    blurb: 'Assesses culture fit and communication.' 
  },
  {
    id: 's1',
    name: 'Eleanor',
    title: 'HR Director',
    focus: 'Compensation, Team Dynamics, Retention',
    domain: ['General', 'Business'],
    color: 'alert-coral',
    icon: BriefcaseIcon,
    blurb: 'Focuses on senior-level HR topics and organizational strategy.'
  },
  // Technical
  { 
    id: 'p2', 
    name: "Vikram", 
    title: "Dev Lead",
    focus: "Code, Systems Design, Tool Rigor",
    domain: ['Tech'], 
    color: 'action-teal', 
    icon: DevLeadIcon, 
    blurb: 'Validates technical execution and tool knowledge.' 
  },
   {
    id: 's2',
    name: 'Kenji',
    title: 'Data Scientist',
    focus: 'Modeling, Statistics, Bias Detection',
    domain: ['Tech'],
    color: 'info-blue',
    icon: DataScientistIcon,
    blurb: 'Analyzes statistical rigor and modeling choices.'
  },
  // Business & Project Management
  { 
    id: 'p3', 
    name: "Maya", 
    title: "Project/Ops Manager",
    focus: "Risk, Timeline, Stakeholder Mgmt",
    domain: ['Business', 'Tech'], 
    color: 'accent-amber', 
    icon: ProjectManagerIcon, 
    blurb: 'Evaluates project ownership and business ROI.' 
  },
  {
    id: 's4',
    name: 'Marcus',
    title: 'Executive Sponsor',
    focus: 'Strategic Alignment, Vision, Budget',
    domain: ['Business'],
    color: 'info-blue',
    icon: ExecutiveSponsorIcon,
    blurb: 'Connects responses to high-level business vision. Typically for senior/lead roles.'
  },
   {
    id: 's6',
    name: 'Chloe',
    title: 'Marketing Lead',
    focus: 'Go-to-Market, Brand, User Acquisition',
    domain: ['Business', 'Creative'],
    color: 'alert-coral',
    icon: MarketingLeadIcon,
    blurb: 'Evaluates market awareness and growth mindset.'
  },
  // Specialist & Domain Experts
  {
    id: 's3',
    name: 'Isabelle',
    title: 'Domain Expert',
    focus: 'Compliance, Regulation, Subject Matter Depth',
    domain: ['General'], // Applicable to many fields like law, finance
    color: 'accent-amber',
    icon: DomainExpertIcon,
    blurb: 'Ensures deep subject matter expertise.'
  },
  {
    id: 's5',
    name: 'Dr. Ben Carter',
    title: 'Clinical Supervisor',
    focus: 'Patient Care, Medical Ethics, Clinical Protocols',
    domain: ['Healthcare'],
    color: 'info-blue',
    icon: ClinicalSupervisorIcon,
    blurb: 'Assesses clinical knowledge and patient empathy.'
  }
];