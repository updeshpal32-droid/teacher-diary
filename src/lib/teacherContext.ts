import { StaffDetailRecord, TeacherProfile } from '../types/academic';
import { db, DEFAULT_TEACHER } from './storage';

export const ACTIVE_INSPECTED_TEACHER_KEY = 'admin:active_inspected_teacher';

/**
 * Get currently inspected teacher record for Admin
 */
export async function getActiveInspectedTeacher(): Promise<StaffDetailRecord | null> {
  return await db.get<StaffDetailRecord>(ACTIVE_INSPECTED_TEACHER_KEY);
}

/**
 * Set active inspected teacher record for Admin and broadcast change
 */
export async function setActiveInspectedTeacher(staff: StaffDetailRecord | null): Promise<void> {
  if (staff) {
    await db.set(ACTIVE_INSPECTED_TEACHER_KEY, staff);
  } else {
    await db.remove(ACTIVE_INSPECTED_TEACHER_KEY);
  }
  broadcastActiveTeacherChange(staff);
}

/**
 * Broadcast active teacher change event
 */
export function broadcastActiveTeacherChange(staff: StaffDetailRecord | null) {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('kvs-active-teacher-changed', { detail: staff }));
  }
}

/**
 * Generate teacher-scoped storage keys
 */
export function getTeacherScopedStorageKey(baseKey: string, teacherCodeOrId?: string): string {
  if (!teacherCodeOrId || teacherCodeOrId.trim() === '') {
    return baseKey;
  }
  const cleanId = teacherCodeOrId.trim().replace(/[^a-zA-Z0-9_-]/g, '_');
  return `${baseKey}:${cleanId}`;
}

/**
 * Normalizes Indian date formats (DD/MM/YYYY, DD.MM.YYYY, DD-MM-YYYY)
 * or strings with trailing designations into ISO format (YYYY-MM-DD)
 * for HTML5 <input type="date" /> compatibility.
 */
export function parseDateToISO(dateStr?: string): string {
  if (!dateStr || typeof dateStr !== 'string') return '';
  const trimmed = dateStr.trim();
  if (!trimmed) return '';

  // Already YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return trimmed;
  }

  // Extract DD/MM/YYYY or DD.MM.YYYY or DD-MM-YYYY from text
  const match = trimmed.match(/(\d{1,2})[\/.-](\d{1,2})[\/.-](\d{4})/);
  if (match) {
    const day = match[1].padStart(2, '0');
    const month = match[2].padStart(2, '0');
    const year = match[3];
    return `${year}-${month}-${day}`;
  }

  // Extract YYYY/MM/DD or YYYY.MM.DD
  const matchYearFirst = trimmed.match(/(\d{4})[\/.-](\d{1,2})[\/.-](\d{1,2})/);
  if (matchYearFirst) {
    const year = matchYearFirst[1];
    const month = matchYearFirst[2].padStart(2, '0');
    const day = matchYearFirst[3].padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  return '';
}

/**
 * Extracts 10-character PAN number from composite PRAN/PAN strings
 */
export function extractPanNumber(pranOrPan?: string): string {
  if (!pranOrPan || typeof pranOrPan !== 'string') return '';
  const trimmed = pranOrPan.trim();
  // Valid Indian PAN: 5 uppercase letters, 4 digits, 1 uppercase letter
  const panMatch = trimmed.match(/[A-Z]{5}[0-9]{4}[A-Z]{1}/i);
  if (panMatch) {
    return panMatch[0].toUpperCase();
  }
  if (trimmed.includes('/')) {
    const after = trimmed.split('/')[1]?.trim();
    if (after && after.length >= 5 && !after.includes(' ')) {
      return after.toUpperCase();
    }
  }
  return '';
}

/**
 * Extracts PRAN number without trailing slashes
 */
export function extractPranNumber(pranOrPan?: string): string {
  if (!pranOrPan || typeof pranOrPan !== 'string') return '';
  const trimmed = pranOrPan.trim();
  if (trimmed.includes('/')) {
    return trimmed.split('/')[0]?.trim() || '';
  }
  return trimmed;
}

/**
 * Synthesize a full TeacherProfile from a 20-column StaffDetailRecord
 */
export function getTeacherProfileFromStaff(
  staff: StaffDetailRecord,
  existingProfile?: TeacherProfile | null
): TeacherProfile {
  const parsedDob = parseDateToISO(staff.dob) || parseDateToISO(existingProfile?.dob) || '1990-01-01';
  const parsedJoiningKVS = parseDateToISO(staff.joiningDateKVSWithDesignation) || parseDateToISO(existingProfile?.joiningDateKVS) || '2020-04-01';
  const parsedJoiningPresentKV = parseDateToISO(staff.joiningDatePresentKVWithDesignation) || parseDateToISO(existingProfile?.joiningDatePresentKV) || '2023-04-01';
  const cleanPran = extractPranNumber(staff.pranOrPanNo) || existingProfile?.gpfCpfPranNo || '';
  const cleanPan = extractPanNumber(staff.pranOrPanNo) || existingProfile?.panNo || '';

  // Parse Class Teacher and Co-Class Teacher from principalRemarks if present
  let derivedCT = existingProfile?.classTeacherRole || '';
  let derivedCoCT = existingProfile?.coClassTeacherRole || '';

  if (staff.principalRemarks) {
    const coMatch = staff.principalRemarks.match(/Co[- ]Class\s*Teacher:\s*([^;.\n]+)/i) || staff.principalRemarks.match(/Co[- ]CT:\s*([^;.\n]+)/i);
    if (coMatch && coMatch[1]) {
      derivedCoCT = `Co-Class Teacher ${coMatch[1].trim()}`;
    }
    const ctMatch = staff.principalRemarks.match(/(?<!Co[- ])Class\s*Teacher:\s*([^;.\n]+)/i) || staff.principalRemarks.match(/(?<!Co[- ])\bCT:\s*([^;.\n]+)/i);
    if (ctMatch && ctMatch[1]) {
      derivedCT = `Class Teacher ${ctMatch[1].trim()}`;
    }
  }

  if (existingProfile && existingProfile.name === staff.name) {
    return {
      ...existingProfile,
      name: staff.name,
      employeeCode: staff.employeeCode || existingProfile.employeeCode,
      designation: staff.designation || existingProfile.designation,
      qualifications: staff.highestAcademicAndProfessionalQual || existingProfile.qualifications,
      dob: parsedDob,
      seniorityNo: staff.seniorityNumber || existingProfile.seniorityNo,
      gpfCpfPranNo: cleanPran || existingProfile.gpfCpfPranNo,
      panNo: cleanPan || existingProfile.panNo,
      aadharNo: staff.aadharNo || existingProfile.aadharNo,
      residentialAddress: staff.permanentPostalAddress || existingProfile.residentialAddress,
      email: staff.email || existingProfile.email,
      phoneNo: staff.phoneCalls || staff.phoneWhatsapp || existingProfile.phoneNo,
      joiningDateKVS: parsedJoiningKVS,
      joiningDatePresentKV: parsedJoiningPresentKV,
      classTeacherRole: derivedCT || existingProfile.classTeacherRole,
      coClassTeacherRole: derivedCoCT || existingProfile.coClassTeacherRole
    };
  }

  // Parse subject from designation (e.g. "TGT (Art Education)", "PGT (Mathematics)", "PRT MUSIC")
  let derivedSubject = 'General';
  const desig = staff.designation || '';
  if (desig.includes('(') && desig.includes(')')) {
    const match = desig.match(/\((.*?)\)/);
    if (match && match[1]) derivedSubject = match[1];
  } else if (desig.toUpperCase().includes('HINDI')) {
    derivedSubject = 'Hindi';
  } else if (desig.toUpperCase().includes('ENGLISH')) {
    derivedSubject = 'English';
  } else if (desig.toUpperCase().includes('SANSKRIT')) {
    derivedSubject = 'Sanskrit';
  } else if (desig.toUpperCase().includes('SCIENCE')) {
    derivedSubject = 'Science';
  } else if (desig.toUpperCase().includes('MATH')) {
    derivedSubject = 'Mathematics';
  } else if (desig.toUpperCase().includes('MUSIC')) {
    derivedSubject = 'Music';
  } else if (desig.toUpperCase().includes('ART')) {
    derivedSubject = 'Art Education';
  } else if (desig.toUpperCase().includes('W.E') || desig.toUpperCase().includes('WE')) {
    derivedSubject = 'Work Education (W.E.)';
  } else if (desig.toUpperCase().includes('P&HE') || desig.toUpperCase().includes('PHYSICAL')) {
    derivedSubject = 'Physical & Health Education';
  } else if (desig.toUpperCase().includes('COMPUTER') || desig.toUpperCase().includes('ICT')) {
    derivedSubject = 'Computer Science / AI';
  } else if (desig.toUpperCase().includes('LIBRARIAN')) {
    derivedSubject = 'Library Science';
  }

  return {
    name: staff.name,
    designation: staff.designation || 'Teacher',
    qualifications: staff.highestAcademicAndProfessionalQual || 'Graduation & Professional Degree',
    seniorityNo: staff.seniorityNumber || `KVS-${staff.employeeCode}`,
    employeeCode: staff.employeeCode || `EMP-${Date.now()}`,
    dob: parsedDob,
    joiningDateKVS: parsedJoiningKVS,
    joiningDatePresentKV: parsedJoiningPresentKV,
    nccScoutingQualification: 'Active Guide / Scout Master / NCC Incharge',
    gpfCpfPranNo: cleanPran || '110000000000',
    panNo: cleanPan,
    bloodGroup: 'B+ (Positive)',
    aadharNo: staff.aadharNo || '',
    residentialAddress: staff.permanentPostalAddress || 'Permanent Address on File',
    phoneNo: staff.phoneCalls || staff.phoneWhatsapp || '+91 98765 43210',
    email: staff.email || `${staff.name.toLowerCase().replace(/[^a-z0-9]/g, '')}@kvs.gov.in`,
    awardsWon: 'Regional Teaching Excellence & Merit Certificate',
    classesAndSubjectsTaught: `${derivedSubject} (Classes VI to XII)`,
    classTeacherRole: derivedCT || 'Subject Incharge',
    coClassTeacherRole: derivedCoCT || '',
    academicTargets: [
      {
        id: 'at-1',
        subjectCodeName: derivedSubject,
        classSection: 'Class X-A',
        passPercentage: 100,
        targetA1Count: 15
      },
      {
        id: 'at-2',
        subjectCodeName: derivedSubject,
        classSection: 'Class IX-A',
        passPercentage: 100,
        targetA1Count: 12
      }
    ],
    teachingPhilosophy: `Dedicated to fostering competency-based, learner-centered education in ${derivedSubject} as envisioned under NEP 2020. Emphasizing 100% conceptual clarity, joyful experiential engagement, and continuous diagnostic remediation.`,
    academicResponsibilities: [
      {
        id: 'cr-1',
        dutyName: `${derivedSubject} Curriculum & Department Incharge`,
        role: 'In-Charge',
        levelOrClass: 'Secondary & Sr. Secondary (VI-XII)',
        academicYear: '2026-2027',
        keyOutcomes: `Coordinated subject enrichment activities and 100% syllabus milestone tracking.`
      },
      {
        id: 'cr-2',
        dutyName: 'Vidyalaya Level Examination & Assessment Committee',
        role: 'Member',
        levelOrClass: 'Middle & Secondary (VI-X)',
        academicYear: '2026-2027',
        keyOutcomes: 'Conducted periodic diagnostic assessments and moderation of question paper blueprints.'
      }
    ],
    kvsFlagshipContributions: [
      {
        id: 'kfc-1',
        programName: 'Ek Bharat Shreshtha Bharat (EBSB) & Art Integrated Learning',
        role: 'Nodal Teacher / Activity Coordinator',
        targetGroup: 'Classes VI-X (450 Students)',
        actionsTaken: 'Organized multidisciplinary paired-state cultural exhibitions and interactive projects.',
        measurableImpact: '100% student participation; recognized for outstanding aesthetic presentation.'
      }
    ]
  };
}
