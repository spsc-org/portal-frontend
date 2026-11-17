import { makeViewModel } from '../../../shared/mvvm/makeViewModel.js'
import { createCommands } from '../../../shared/mvvm/commands.js'
import {
  createReasonRule,
  deleteReasonRule,
  fetchCountryOptions,
  fetchReasonRules,
  updateReasonRule,
} from '../entities/reasonRules/api.js'

const RULES_KEY = ['reason-rules-admin']
const NONE = []

// Помилки показує сторінка (поле форми / toast з власним текстом) — error: false.
const COMMANDS = {
  create: { mutationFn: createReasonRule, invalidate: () => [RULES_KEY], error: false },
  update: { mutationFn: ({ id, payload }) => updateReasonRule(id, payload), invalidate: () => [RULES_KEY], error: false },
  remove: { mutationFn: deleteReasonRule, invalidate: () => [RULES_KEY], error: false },
}

/** /project/reasonRules — системні правила обґрунтувань (/api/reason-rules/admin). */
export class ReasonRulesViewModel {
  constructor({ scope, stores }) {
    this.scope = scope
    this.stores = stores
    makeViewModel(this)
    this.rulesQuery = scope.query({ queryKey: RULES_KEY, queryFn: fetchReasonRules })
    this.countriesQuery = scope.query({ queryKey: ['reason-rules-country-options'], queryFn: fetchCountryOptions, staleTime: Infinity })
    this.cmd = createCommands(scope, COMMANDS)
  }

  get rules() {
    return this.rulesQuery.data ?? NONE
  }
  get isLoading() {
    return this.rulesQuery.isLoading
  }
  get countries() {
    return this.countriesQuery.data ?? NONE
  }
}

export const reasonRuleErrorMessage = (error, fallback) => error?.response?.data?.message || fallback
