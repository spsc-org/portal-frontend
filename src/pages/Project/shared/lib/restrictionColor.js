/**
 * Єдине джерело правди для кольору підсвітки коду обмеження (порт origin
 * pages/components/project/restrictionColor.js). Використовується і карткою, і формою.
 *
 * Базове правило (довідник nsdc_restrictions_dict): subjectTypeId/isSpecial.
 * Override-правила (nsdc_restriction_color_overrides, voc.restriction[].overrides) —
 * налаштовуються адміністратором у /dictionary для конкретного типу суб'єкта та/або
 * країни проєкту; мають пріоритет над базовим правилом (зокрема колишнє жорстке
 * "громадянин UA → червоний" тепер живе саме тут, як override з countryCode 'UA').
 */

function computeBaseColor(vocItem, subjectTypeId) {
  const prohibited = vocItem?.subjectTypeId === null || (vocItem?.subjectTypeId !== 0 && vocItem?.subjectTypeId !== subjectTypeId)
  if (prohibited) return 'red'
  if (vocItem?.isSpecial === 1) return 'orange'
  return 'green'
}

const specificity = (override) => (override.subjectTypeId !== null ? 1 : 0) + (override.countryCode !== null ? 1 : 0)

function findOverride(vocItem, subjectTypeId, countryCodes) {
  const candidates = (vocItem?.overrides ?? []).filter(
    (o) => (o.subjectTypeId === null || o.subjectTypeId === subjectTypeId) && (o.countryCode === null || countryCodes.includes(o.countryCode)),
  )
  if (candidates.length === 0) return null
  return candidates.reduce((best, current) => (specificity(current) > specificity(best) ? current : best))
}

/**
 * @param {object} vocItem — рядок voc.restriction (code, subjectTypeId, isSpecial, overrides)
 * @param {number} subjectTypeId — тип суб'єкта проєкту (1/2/5/6)
 * @param {string[]} countryCodes — коди країн проєкту (напр. ['UA'])
 * @returns {'green'|'orange'|'red'}
 */
export function resolveRestrictionColor(vocItem, subjectTypeId, countryCodes = []) {
  const override = findOverride(vocItem, subjectTypeId, countryCodes)
  if (override) return override.color
  return computeBaseColor(vocItem, subjectTypeId)
}
