import * as XLSX from 'xlsx';
import {
  PortfolioTemplate,
  PortfolioAssignment,
  PortfolioCategory,
  ResponsibilityFrequency,
  StaffDetailRecord,
  PortfolioResponsibility
} from '../types/academic';
import { SAMPLE_50_KVS_COMMITTEES, RawCommitteeRow } from './kvs50CommitteesSample';

export interface ParsedImportResult {
  templates: PortfolioTemplate[];
  assignments: PortfolioAssignment[];
  warnings: string[];
  summary: {
    totalCommittees: number;
    inchargesAssigned: number;
    membersAssigned: number;
    totalResponsibilities: number;
  };
}

/**
 * Normalize teacher name for fuzzy matching
 */
function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .replace(/^(mr|mrs|ms|dr|smt|shri|miss)\.?\s+/i, '')
    .replace(/[^a-z0-9]/g, '')
    .trim();
}

/**
 * Find matching staff record by code or name
 */
export function findMatchingStaff(
  query: string,
  staffList: StaffDetailRecord[]
): StaffDetailRecord | null {
  if (!query || !query.trim()) return null;
  const trimmed = query.trim();

  // 1. Match by Employee Code
  const byCode = staffList.find(
    s => s.employeeCode && s.employeeCode.toLowerCase() === trimmed.toLowerCase()
  );
  if (byCode) return byCode;

  // 2. Direct exact name match
  const byExactName = staffList.find(
    s => s.name && s.name.trim().toLowerCase() === trimmed.toLowerCase()
  );
  if (byExactName) return byExactName;

  // 3. Normalized fuzzy match
  const normQuery = normalizeName(trimmed);
  if (!normQuery) return null;

  const byNorm = staffList.find(s => {
    const sNorm = normalizeName(s.name || '');
    return sNorm === normQuery || sNorm.includes(normQuery) || normQuery.includes(sNorm);
  });
  if (byNorm) return byNorm;

  return null;
}

/**
 * Parse responsibility string with frequency
 * e.g. "Prepare Exam Date-Sheet (Term)" -> { title: "Prepare Exam Date-Sheet", freq: "Term" }
 */
function parseSingleResponsibility(raw: string, idx: number): PortfolioResponsibility {
  const trimmed = raw.trim();
  let frequency: ResponsibilityFrequency = 'Monthly';
  let title = trimmed;

  const freqMatch = trimmed.match(/^(.*?)\s*\((Daily|Weekly|Monthly|Term|Annual|One-time|As-needed)\)$/i);
  if (freqMatch) {
    title = freqMatch[1].trim();
    const rawFreq = freqMatch[2].toLowerCase();
    if (rawFreq === 'daily') frequency = 'Daily';
    else if (rawFreq === 'weekly') frequency = 'Weekly';
    else if (rawFreq === 'monthly') frequency = 'Monthly';
    else if (rawFreq === 'term') frequency = 'Term';
    else if (rawFreq === 'annual') frequency = 'Annual';
    else if (rawFreq === 'one-time') frequency = 'One-time';
    else frequency = 'As-needed';
  } else {
    // Infer frequency from keywords
    const lower = trimmed.toLowerCase();
    if (lower.includes('daily') || lower.includes('morning') || lower.includes('gate')) frequency = 'Daily';
    else if (lower.includes('weekly') || lower.includes('saturday')) frequency = 'Weekly';
    else if (lower.includes('annual') || lower.includes('loc') || lower.includes('board')) frequency = 'Annual';
    else if (lower.includes('term') || lower.includes('exam') || lower.includes('half-yearly') || lower.includes('audit')) frequency = 'Term';
    else frequency = 'Monthly';
  }

  const isMandatory = title.toLowerCase().includes('mandatory') ||
    title.toLowerCase().includes('board') ||
    title.toLowerCase().includes('loc') ||
    title.toLowerCase().includes('posh') ||
    title.toLowerCase().includes('safety');

  return {
    id: `resp-imp-${Date.now()}-${idx}`,
    title: title.replace(/\*?mandatory\*?/i, '').trim(),
    description: `Official committee deliverable.`,
    frequency,
    isMandatory,
    canBeDelegated: true
  };
}

/**
 * Parse responsibilities text list separated by ;, \n, or |
 */
function parseResponsibilitiesList(raw: string): PortfolioResponsibility[] {
  if (!raw || !raw.trim()) return [];
  const parts = raw
    .split(/[;\n\r|]+/)
    .map(p => p.trim())
    .filter(p => p.length > 2);

  return parts.map((part, idx) => parseSingleResponsibility(part, idx));
}

/**
 * Validate and sanitize category
 */
function normalizeCategory(cat: string): PortfolioCategory {
  if (!cat) return 'Academic & Administration';
  const lower = cat.toLowerCase();
  if (lower.includes('academic') || lower.includes('exam') || lower.includes('time') || lower.includes('admission')) {
    return 'Academic & Administration';
  }
  if (lower.includes('welfare') || lower.includes('safety') || lower.includes('pocso') || lower.includes('discipline') || lower.includes('counsel')) {
    return 'Student Welfare & Safety';
  }
  if (lower.includes('sport') || lower.includes('club') || lower.includes('cca') || lower.includes('scout') || lower.includes('kala') || lower.includes('cultural') || lower.includes('science')) {
    return 'Activities, Clubs & Student Development';
  }
  if (lower.includes('infra') || lower.includes('maintenance') || lower.includes('build') || lower.includes('clean') || lower.includes('sanitation') || lower.includes('water') || lower.includes('solar') || lower.includes('furniture')) {
    return 'Maintenance & Infrastructure';
  }
  if (lower.includes('office') || lower.includes('admin') || lower.includes('finance') || lower.includes('gem') || lower.includes('rti') || lower.includes('welfare') || lower.includes('purchase')) {
    return 'Office / Administrative';
  }
  return 'Other';
}

/**
 * Process Raw Table rows into structured Templates and Assignments
 */
export function processRawCommitteeRows(
  rows: any[],
  staffList: StaffDetailRecord[],
  assignedBy: string = 'Principal'
): ParsedImportResult {
  const templates: PortfolioTemplate[] = [];
  const assignments: PortfolioAssignment[] = [];
  const warnings: string[] = [];

  let inchargesCount = 0;
  let membersCount = 0;
  let totalRespCount = 0;

  rows.forEach((row, idx) => {
    // Flexible column headers matching
    const name = (
      row['Committee Name'] ||
      row['Committee'] ||
      row['Portfolio Name'] ||
      row['Portfolio'] ||
      row['Role'] ||
      row['name'] ||
      row['Name'] ||
      ''
    ).toString().trim();

    if (!name) return; // Skip empty rows

    const rawCategory = (
      row['Category'] ||
      row['Portfolio Category'] ||
      row['Type'] ||
      row['Section'] ||
      row['category'] ||
      ''
    ).toString();
    const category = normalizeCategory(rawCategory);

    const description = (
      row['Description'] ||
      row['Scope'] ||
      row['Mandate'] ||
      row['description'] ||
      `Official institutional committee for ${name}.`
    ).toString().trim();

    const inchargeStr = (
      row['In-charge Name'] ||
      row['In-charge'] ||
      row['Incharge'] ||
      row['Incharge Name'] ||
      row['Incharge Code'] ||
      row['Lead'] ||
      row['inchargeName'] ||
      row['incharge'] ||
      ''
    ).toString().trim();

    const inchargeCode = (
      row['In-charge Code'] ||
      row['Incharge Code'] ||
      row['Employee Code'] ||
      row['inchargeCode'] ||
      ''
    ).toString().trim();

    const membersStr = (
      row['Committee Members'] ||
      row['Members'] ||
      row['Member Names'] ||
      row['members'] ||
      row['Team'] ||
      ''
    ).toString().trim();

    const respStr = (
      row['Responsibilities'] ||
      row['Duties'] ||
      row['Tasks'] ||
      row['responsibilities'] ||
      ''
    ).toString().trim();

    const portId = `port-imp-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 5)}`;

    let responsibilities = parseResponsibilitiesList(respStr);
    if (responsibilities.length === 0) {
      responsibilities = [
        {
          id: `resp-${Date.now()}-1`,
          title: `Primary coordination and execution of ${name}`,
          description: 'Official committee mandate.',
          frequency: 'Monthly',
          isMandatory: true,
          canBeDelegated: true
        }
      ];
    }
    totalRespCount += responsibilities.length;

    const template: PortfolioTemplate = {
      id: portId,
      name,
      category,
      description,
      isCommittee: true,
      createdBy: assignedBy,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isActive: true,
      responsibilities
    };

    templates.push(template);

    // 1. Process In-charge Assignment
    if (inchargeStr || inchargeCode) {
      const match = inchargeCode
        ? findMatchingStaff(inchargeCode, staffList)
        : findMatchingStaff(inchargeStr, staffList);

      const resolvedName = match ? match.name : inchargeStr;
      const resolvedCode = match ? match.employeeCode : inchargeCode || `EMP-${Date.now().toString().slice(-4)}`;

      assignments.push({
        id: `asgn-inc-${Date.now()}-${idx}`,
        portfolioTemplateId: portId,
        role: 'In-charge',
        teacherEmployeeCode: resolvedCode,
        teacherName: resolvedName,
        assignedBy,
        assignedAt: new Date().toISOString(),
        status: 'Active',
        notes: 'Assigned via Bulk Importer.'
      });
      inchargesCount++;

      if (!match) {
        warnings.push(`In-charge "${inchargeStr}" for "${name}" was not found in registered staff roll; created placeholder.`);
      }
    }

    // 2. Process Members Assignment
    if (membersStr) {
      const memberNames = membersStr
        .split(/[,;\n\r|]+/)
        .map(m => m.trim())
        .filter(m => m.length > 1);

      memberNames.forEach((mStr, mIdx) => {
        const match = findMatchingStaff(mStr, staffList);
        const resolvedName = match ? match.name : mStr;
        const resolvedCode = match ? match.employeeCode : `EMP-M-${Date.now().toString().slice(-3)}-${mIdx}`;

        // Prevent duplicate member
        const alreadyAssigned = assignments.some(
          a => a.portfolioTemplateId === portId && (a.teacherEmployeeCode === resolvedCode || a.teacherName.toLowerCase() === resolvedName.toLowerCase())
        );

        if (!alreadyAssigned) {
          assignments.push({
            id: `asgn-mem-${Date.now()}-${idx}-${mIdx}`,
            portfolioTemplateId: portId,
            role: 'Member',
            teacherEmployeeCode: resolvedCode,
            teacherName: resolvedName,
            assignedBy,
            assignedAt: new Date().toISOString(),
            status: 'Active',
            notes: 'Assigned via Bulk Importer.'
          });
          membersCount++;
        }
      });
    }
  });

  return {
    templates,
    assignments,
    warnings,
    summary: {
      totalCommittees: templates.length,
      inchargesAssigned: inchargesCount,
      membersAssigned: membersCount,
      totalResponsibilities: totalRespCount
    }
  };
}

/**
 * Download Sample 50 Committees Template in Excel (.xlsx)
 */
export function downloadSampleCommitteesExcel() {
  const exportData = SAMPLE_50_KVS_COMMITTEES.map((item, idx) => ({
    'S.No': idx + 1,
    'Committee Name': item.name,
    'Category': item.category,
    'Description': item.description,
    'In-charge Name': item.inchargeName,
    'In-charge Code': item.inchargeCode || '',
    'Committee Members': item.members,
    'Responsibilities / Duties': item.responsibilities
  }));

  const worksheet = XLSX.utils.json_to_sheet(exportData);

  // Set column widths
  worksheet['!cols'] = [
    { wch: 6 },  // S.No
    { wch: 45 }, // Committee Name
    { wch: 30 }, // Category
    { wch: 55 }, // Description
    { wch: 25 }, // In-charge Name
    { wch: 15 }, // In-charge Code
    { wch: 45 }, // Members
    { wch: 70 }  // Responsibilities
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'KVS_Committees_2026-27');
  XLSX.writeFile(workbook, 'KVS_50_Committees_Master_Template_2026-27.xlsx');
}

/**
 * Download Sample 50 Committees Template in CSV (.csv)
 */
export function downloadSampleCommitteesCSV() {
  const exportData = SAMPLE_50_KVS_COMMITTEES.map((item, idx) => ({
    'S.No': idx + 1,
    'Committee Name': item.name,
    'Category': item.category,
    'Description': item.description,
    'In-charge Name': item.inchargeName,
    'In-charge Code': item.inchargeCode || '',
    'Committee Members': item.members,
    'Responsibilities / Duties': item.responsibilities
  }));

  const worksheet = XLSX.utils.json_to_sheet(exportData);
  const csv = XLSX.utils.sheet_to_csv(worksheet);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', 'KVS_50_Committees_Master_Template_2026-27.csv');
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Export current active committees matrix to Excel (.xlsx)
 */
export function exportActiveCommitteesToExcel(
  templates: PortfolioTemplate[],
  assignments: PortfolioAssignment[]
) {
  const rows = templates.map((t, idx) => {
    const incharge = assignments.find(
      a => a.portfolioTemplateId === t.id && a.role === 'In-charge' && a.status === 'Active'
    );
    const members = assignments.filter(
      a => a.portfolioTemplateId === t.id && a.role === 'Member' && a.status === 'Active'
    );

    const respText = t.responsibilities
      .map(r => `${r.title} (${r.frequency})${r.isMandatory ? ' *MANDATORY' : ''}`)
      .join('; ');

    const membersText = members.map(m => m.teacherName).join(', ');

    return {
      'S.No': idx + 1,
      'Committee Name': t.name,
      'Category': t.category,
      'Description': t.description,
      'In-charge Name': incharge ? incharge.teacherName : 'Unassigned',
      'In-charge Code': incharge ? incharge.teacherEmployeeCode : '',
      'Committee Members': membersText,
      'Responsibilities / Duties': respText
    };
  });

  const worksheet = XLSX.utils.json_to_sheet(rows);
  worksheet['!cols'] = [
    { wch: 6 },
    { wch: 45 },
    { wch: 30 },
    { wch: 55 },
    { wch: 25 },
    { wch: 15 },
    { wch: 45 },
    { wch: 70 }
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Active_Committees');
  XLSX.writeFile(workbook, `Vidyalaya_Committees_Export_${new Date().toISOString().split('T')[0]}.xlsx`);
}
