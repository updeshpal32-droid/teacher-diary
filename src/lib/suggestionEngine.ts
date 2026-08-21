import {
  HourlyActivity,
  TeacherTask,
  PortfolioTemplate,
  PortfolioSuggestion,
  ResponsibilityFrequency
} from '../types/academic';

export const DEFAULT_PORTFOLIO_SUGGESTIONS: PortfolioSuggestion[] = [
  {
    id: 'sug-101',
    suggestedTitle: 'GeM Portal Procurement CRAC & Payment Verification',
    suggestedDescription: 'Regularly scrutinize Government e-Marketplace (GeM) purchase orders, generate Consignee Receipt and Acceptance Certificate (CRAC), and verify vendor invoices with bill registers.',
    suggestedFrequency: 'Monthly',
    suggestedPortfolioTemplateId: 'port-it',
    suggestedPortfolioName: 'IT, Website, ICT Lab & E-Governance Committee',
    evidenceCount: 6,
    sampleActivityIds: ['act-gem-1', 'act-gem-2'],
    status: 'Pending',
    createdAt: '2026-08-18T10:00:00.000Z'
  },
  {
    id: 'sug-102',
    suggestedTitle: 'Morning Gate Vigilance & Late-Comer Student Counseling',
    suggestedDescription: 'Supervise morning gate arrival between 07:30 AM and 07:55 AM, maintain student late-arrival logs, and conduct counseling for habitual late-comers.',
    suggestedFrequency: 'Daily',
    suggestedPortfolioTemplateId: 'port-safety',
    suggestedPortfolioName: 'Student Safety, POCSO, Disaster Management & First Aid',
    evidenceCount: 4,
    sampleActivityIds: ['act-gate-1', 'act-gate-2'],
    status: 'Pending',
    createdAt: '2026-08-19T08:00:00.000Z'
  },
  {
    id: 'sug-103',
    suggestedTitle: 'National Science Olympiad & Mathematics Olympiad Coordination',
    suggestedDescription: 'Coordinate student enrollment, fee collection, admit card issuance, and room invigilation for National Science Olympiad (NSO) and IMO exams.',
    suggestedFrequency: 'Annual',
    suggestedPortfolioTemplateId: 'port-science',
    suggestedPortfolioName: 'Science Exhibition, NCSC & Atal Tinkering Lab (ATL)',
    evidenceCount: 3,
    sampleActivityIds: ['act-olymp-1'],
    status: 'Pending',
    createdAt: '2026-08-20T12:00:00.000Z'
  }
];

interface ClusterPattern {
  keywords: string[];
  suggestedTitle: string;
  suggestedDescription: string;
  suggestedFrequency: ResponsibilityFrequency;
  targetPortfolioId?: string;
}

const KNOWN_PATTERNS: ClusterPattern[] = [
  {
    keywords: ['gem', 'crac', 'procurement', 'vendor', 'invoice', 'purchase order', 'gem portal'],
    suggestedTitle: 'GeM Portal Procurement CRAC & Payment Verification',
    suggestedDescription: 'Scrutinize Government e-Marketplace (GeM) purchase orders, generate CRAC receipts, and verify vendor bills.',
    suggestedFrequency: 'Monthly',
    targetPortfolioId: 'port-it'
  },
  {
    keywords: ['gate', 'late', 'vigilance', 'corridor', 'late comer', 'punctuality'],
    suggestedTitle: 'Morning Gate Vigilance & Late-Comer Student Counseling',
    suggestedDescription: 'Supervise campus gate arrivals, record student late registers, and coordinate morning punctuality counseling.',
    suggestedFrequency: 'Daily',
    targetPortfolioId: 'port-safety'
  },
  {
    keywords: ['sound', 'mic', 'amplifier', 'audio', 'prayer speech', 'assembly mic'],
    suggestedTitle: 'Morning Assembly Audio-Visual & Mic Setup In-charge',
    suggestedDescription: 'Ensure audio amplifier, microphones, battery backup, and prayer bell sound system readiness before 07:45 AM assembly.',
    suggestedFrequency: 'Daily',
    targetPortfolioId: 'port-cca'
  },
  {
    keywords: ['wifs', 'iron folic', 'deworming', 'health check', 'medical checkup', 'first aid kit'],
    suggestedTitle: 'WIFS Iron-Folic Acid & Student Health Card Maintenance',
    suggestedDescription: 'Coordinate weekly Iron Folic Acid tablet distribution and maintain Class health profile inspection logs.',
    suggestedFrequency: 'Weekly',
    targetPortfolioId: 'port-safety'
  },
  {
    keywords: ['olympiad', 'imo', 'nso', 'talent search', 'ntse', 'scholarship exam'],
    suggestedTitle: 'National Science & Math Olympiad Coordination',
    suggestedDescription: 'Enroll students, distribute test papers, and verify result certificates for national Olympiad competitions.',
    suggestedFrequency: 'Annual',
    targetPortfolioId: 'port-science'
  },
  {
    keywords: ['pm evidya', 'smart board', 'interactive panel', 'touch display', 'projector'],
    suggestedTitle: 'PM e-Vidya Smart Interactive Classroom Maintenance',
    suggestedDescription: 'Audit interactive touch flat panels (IFPD), DTH educational channels, and smart classroom digital equipment.',
    suggestedFrequency: 'Monthly',
    targetPortfolioId: 'port-it'
  },
  {
    keywords: ['alumni', 'old student', 'farewell', 'alumni meet'],
    suggestedTitle: 'Alumni Network & Former Student Engagement',
    suggestedDescription: 'Maintain alumni directory and organize mentorship sessions with distinguished ex-students.',
    suggestedFrequency: 'Annual',
    targetPortfolioId: 'port-cca'
  }
];

export function detectPortfolioSuggestions(
  activities: HourlyActivity[],
  tasks: TeacherTask[],
  templates: PortfolioTemplate[],
  existingSuggestions: PortfolioSuggestion[]
): PortfolioSuggestion[] {
  const existingMap = new Map<string, PortfolioSuggestion>();
  existingSuggestions.forEach(s => existingMap.set(s.suggestedTitle.toLowerCase(), s));

  const untaggedActivities = activities.filter(a => !a.responsibilityId || !a.portfolioTemplateId);
  const untaggedTasks = tasks.filter(t => !t.tags.some(tag => tag.toLowerCase().includes('committee')));

  const combinedItems = [
    ...untaggedActivities.map(a => ({ id: a.id, text: `${a.title} ${a.description} ${a.category}` })),
    ...untaggedTasks.map(t => ({ id: t.id, text: `${t.title} ${t.description || ''} ${t.category}` }))
  ];

  const results = [...existingSuggestions];

  KNOWN_PATTERNS.forEach((pattern, pIdx) => {
    const matchedItems = combinedItems.filter(item => {
      const lower = item.text.toLowerCase();
      return pattern.keywords.some(kw => lower.includes(kw));
    });

    if (matchedItems.length >= 1) {
      const existing = existingMap.get(pattern.suggestedTitle.toLowerCase());
      const targetTemplate = templates.find(t => t.id === pattern.targetPortfolioId);

      if (existing) {
        // Update occurrence evidence count
        existing.evidenceCount = Math.max(existing.evidenceCount, matchedItems.length);
        existing.sampleActivityIds = Array.from(new Set([...existing.sampleActivityIds, ...matchedItems.map(m => m.id)]));
      } else {
        const newSuggestion: PortfolioSuggestion = {
          id: `sug-${Date.now()}-${pIdx}`,
          suggestedTitle: pattern.suggestedTitle,
          suggestedDescription: pattern.suggestedDescription,
          suggestedFrequency: pattern.suggestedFrequency,
          suggestedPortfolioTemplateId: pattern.targetPortfolioId,
          suggestedPortfolioName: targetTemplate?.name || 'Academic & Administration',
          evidenceCount: matchedItems.length,
          sampleActivityIds: matchedItems.map(m => m.id),
          status: 'Pending',
          createdAt: new Date().toISOString()
        };

        results.unshift(newSuggestion);
        existingMap.set(pattern.suggestedTitle.toLowerCase(), newSuggestion);
      }
    }
  });

  return results;
}
