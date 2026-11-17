import { useVM } from '../../../shared/mvvm/viewModelHooks.js'

/**
 * Колишні Inertia props сторінок подань ({ auth, id?, users, issuers, proposalState, decrees, … })
 * — з VM сторінки (options-ендпоінт). Лише всередині observer() під ViewModelProvider.
 */
export const useProposalProps = () => useVM().props
