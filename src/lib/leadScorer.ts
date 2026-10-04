import type { Lead } from '../data/mockData';

type LeadInput = Partial<Lead> & Record<string, unknown>;

const value = (input: LeadInput, ...keys: string[]) => {
  for (const key of keys) {
    if (input[key] !== undefined && input[key] !== '') return input[key];
  }
  return undefined;
};

export const calculateLeadScores = (input: LeadInput): Lead => {
  const visits = Math.max(1, Number(value(input, 'totalVisits', 'total_visits') ?? 1));
  const timeOnWebsite = Number(value(input, 'timeOnWebsite', 'time_on_website') ?? 2);
  const cpc = Number(value(input, 'cpc') ?? 1.25);
  const currentScore = Math.max(1, Math.min(99, Math.round(35 + visits * 7 + timeOnWebsite * 2 - cpc * 3)));
  const name = String(value(input, 'name', 'full_name') ?? 'Prospect');

  return {
    id: `L-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    name,
    email: String(value(input, 'email') ?? ''),
    phone: String(value(input, 'phone') ?? ''),
    leadSource: String(value(input, 'leadSource', 'lead_source') ?? 'Meta'),
    leadOrigin: String(value(input, 'leadOrigin', 'lead_origin') ?? 'Manual Entry'),
    placement: String(value(input, 'placement') ?? 'Reels'),
    audienceType: String(value(input, 'audienceType', 'audience_type') ?? 'Broad'),
    ctr: Number(value(input, 'ctr') ?? 2.5),
    cpc,
    creativeType: String(value(input, 'creativeType', 'creative_type') ?? 'Video'),
    totalVisits: visits,
    timeOnWebsite,
    pageViews: Number(value(input, 'pageViews', 'page_views') ?? Math.max(1, Math.round(visits * 1.5))),
    lastActivity: String(value(input, 'lastActivity', 'last_activity') ?? 'Form Submitted'),
    baseScore: currentScore,
    currentScore,
    conversionProbability: currentScore,
    hoursUncontacted: 0,
    status: currentScore >= 70 ? 'Hot' : currentScore >= 40 ? 'Warm' : 'Cold',
    confidence: visits >= 4 ? 'High' : visits >= 2 ? 'Moderate' : 'Uncertain',
    predictionLower: Math.max(1, currentScore - 8),
    predictionUpper: Math.min(99, currentScore + 8),
    submissionTime: new Date().toISOString(),
    contacted: false,
  };
};

export const parseCSVToLeads = (text: string): Lead[] => {
  const rows = text.trim().split(/\r?\n/).filter(Boolean);
  if (rows.length < 2) return [];

  const headers = rows[0].split(',').map((header) => header.trim().toLowerCase());
  return rows.slice(1).map((row) => {
    const fields = row.split(',').map((field) => field.trim().replace(/^"|"$/g, ''));
    const record = Object.fromEntries(headers.map((header, index) => [header, fields[index] ?? '']));
    return calculateLeadScores(record);
  });
};