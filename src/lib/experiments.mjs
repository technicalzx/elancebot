import { fail } from './security.mjs';

export const metrics = ['inquiry-rate', 'click-rate', 'order-rate'];
function string(value, name, max, optional = false) {
  if (optional && (value === undefined || value === '')) return '';
  if (typeof value !== 'string' || !value.trim() || value.trim().length > max)
    fail(400, 'invalid_experiment', `${name} must be text of 1–${max} characters.`);
  return value.trim();
}
export function experimentPlan(body) {
  if (!metrics.includes(body.metric)) fail(400, 'invalid_experiment', 'Choose a supported outcome metric.');
  if (!Number.isInteger(body.periodDays) || body.periodDays < 7 || body.periodDays > 90)
    fail(400, 'invalid_experiment', 'Each observation period must be 7–90 whole days.');
  return { schemaVersion:'experiment-1.0', offer:string(body.offer,'Offer',160),
    evidence:string(body.evidence,'Evidence',2000), change:string(body.change,'Change',2000),
    metric:body.metric, periodDays:body.periodDays, source:string(body.source,'Authorized source',300),
    confounders:string(body.confounders,'Other influences',2000,true), provenance:'user-supplied-unverified' };
}
function period(value, days, today) {
  if (value === null || value === undefined) return null;
  if (typeof value !== 'object' || Array.isArray(value)) fail(400,'invalid_observation','Provide an observation object.');
  const dates = ['start','end'].map(key => {
    const date=value[key];
    if (typeof date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(date) || !Number.isFinite(Date.parse(date)) || new Date(date).toISOString().slice(0,10)!==date)
      fail(400,'invalid_observation','Use valid ISO dates (YYYY-MM-DD).');
    return date;
  });
  if ((Date.parse(dates[1])-Date.parse(dates[0]))/86400000+1!==days || dates[1]>=today)
    fail(400,'invalid_observation',`Use a complete ${days}-day inclusive period ending before today (UTC).`);
  for (const key of ['outcomes','denominator']) if (!Number.isSafeInteger(value[key]) || value[key]<0 || value[key]>1_000_000_000)
    fail(400,'invalid_observation','Counts must be whole numbers from 0 to 1,000,000,000.');
  // These metrics measure unique converting opportunities, not repeat events.
  if(value.outcomes>value.denominator) fail(400,'invalid_observation','Count unique conversions; outcomes cannot exceed opportunities.');
  return {start:dates[0],end:dates[1],outcomes:value.outcomes,denominator:value.denominator,
    source:string(value.source,'Observation source',300),notes:string(value.notes,'Observation notes',2000,true),provenance:'user-supplied-unverified'};
}
export function experimentObservations(body, plan, today = new Date().toISOString().slice(0,10)) {
  const baseline=period(body.baseline,plan.periodDays,today),followUp=period(body.followUp,plan.periodDays,today);
  if(followUp && (!baseline || followUp.start<=baseline.end)) fail(400,'invalid_observation','Follow-up requires an earlier, non-overlapping baseline.');
  return {baseline,followUp};
}
export function experimentComparison(observations) {
  const {baseline,followUp}=observations;
  const rate=p=>p && p.denominator>0 ? p.outcomes/p.denominator*100 : null;
  const baselinePercent=rate(baseline),followUpPercent=rate(followUp);
  const comparable=baselinePercent!==null && followUpPercent!==null;
  return {baselinePercent,followUpPercent,percentagePointChange:comparable?followUpPercent-baselinePercent:null,
    relativeChangePercent:comparable && baselinePercent>0?(followUpPercent/baselinePercent-1)*100:null,
    status:followUp?'observed':baseline?'baseline-recorded':'planned',
    warnings:['Counts are manually supplied and unverified. Compare the same population and source.',
      'Before/after differences do not establish causation, significance, marketplace rank or future earnings.',
      ...(!comparable?['A comparison requires both periods and positive denominators.']:[]),
      ...(baseline && followUp && baseline.source!==followUp.source?['Source descriptions differ; verify comparability before interpreting.']:[])]};
}
