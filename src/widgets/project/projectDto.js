/**
 * GET /api/project/{id}/dto (той самий DTO, що читає legacy projectCardManager) → форма,
 * яку відмальовує DetailsLayout. Колишній ресурс /api/project/new/{id} бекенд вимкнув
 * (ProjectsController::getProjectResource кидає NotImplementedException).
 * Підписи — зі словників /api/voc_project (id у DTO).
 */
const list = (value) => (Array.isArray(value) ? value : [])
const find = (items, id) => (id == null ? undefined : list(items).find((item) => String(item.id) === String(id)))
const caption = (items, id) => find(items, id)?.caption ?? ''

export function projectFromDto(dto, voc = {}) {
  if (!dto) return null
  const countries = list(voc.country)
  const restrictions = {}
  for (const [key, value] of Object.entries(dto)) {
    // r1_1 → "r1-1" (ключі Constraints/getRestrictionObject)
    // Прапорці → 1 (Constraints порівнює `=== 1`); r25 може бути текстом обмеження 25
    if (/^r\d+(_\d+)?$/.test(key)) {
      const flag = value === true || value === 1 || value === '1'
      restrictions[key.replace('_', '-')] = flag ? 1 : key === 'r25' ? value ?? '' : null
    }
  }
  restrictions.r6Text = dto.r6Text ?? ''
  const subjectTypeId = Number(dto.subjectTypeId)
  return {
    ...restrictions,
    id: dto.id,
    subjectTypeId,
    subjectTypeCaption: caption(voc.subjectType, subjectTypeId),
    actionTypeId: Number(dto.actionType),
    actionType: caption(voc.action, dto.actionType),
    state: find(voc.state, dto.stateId) ?? null,
    drsId: dto.drsId,
    fix_action_id: caption(voc.action, dto.fixActionId) || dto.fixActionId,
    fix_decree: dto.fixDecree,
    fix_annex: dto.fixAnnex,
    fix_index: dto.fixIndex,
    nameUk: dto.nameUk,
    nameRu: dto.nameRu,
    nameEn: dto.nameEn,
    adrUk: dto.adrUk,
    adrRu: dto.adrRu,
    adrEn: dto.adrEn,
    birthDate: dto.birthDate,
    reasoning: dto.reasoning,
    notes: dto.notes,
    sourceInfo: dto.sourceInfo,
    countries: list(dto.countries).map((country) => ({
      ...country,
      name_uk: find(countries, country.id)?.caption ?? country.caption,
    })),
    identifiers: list(dto.identifiers).map((item) => ({
      identifierCountryId: caption(countries, item.countryId) || item.countryId,
      identifierId: caption(voc.identifierType, item.identifierId) || item.identifierId,
      identifierValue: item.value,
    })),
    attributes: list(dto.attributes).map((item) => ({
      type: caption(voc.attributeType, item.typeId ?? item.attributeId ?? item.type) || item.type,
      value: item.value,
    })),
    documents: list(dto.documents).map((doc) => ({
      ...doc,
      typeId: caption(voc.documentType, doc.typeId) || doc.typeId,
      regData: doc.regDate,
      unitId: caption(voc.initiator, doc.unitId) || doc.unitId,
      caption: doc.notes ?? doc.caption,
    })),
    term: caption(voc.term, dto.termId),
    initiator: caption(voc.issuer, dto.issuerId),
    reasonCaption: list(dto.reasons).map((reason) => reason.caption).join('; ') || caption(voc.reason, dto.reasonId),
    category1: list(dto.categories1),
    category2: list(dto.categories2),
    category3: list(dto.categories3),
    proposal: list(dto.proposals),
    performer: caption(voc.user, dto.performerId),
  }
}
