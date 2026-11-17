import toast from 'react-hot-toast'
import { makeViewModel } from '../../../shared/mvvm/makeViewModel.js'
import {
  createUserGroup,
  fetchUserGroupOptions,
  syncUserGroupMembers,
  updateUserGroup,
} from '../../../entities/userGroup/api.js'
import { USER_GROUP_KEYS, userGroupErrorMessage } from '../../../entities/userGroup/userGroupKeys.js'

/** Форма створення/редагування групи (назва + склад). */
export class GroupFormViewModel {
  name = ''
  memberIds = []
  errors = null

  constructor({ scope, group, onDone }) {
    this.scope = scope
    this.group = group ?? null
    this.onDone = onDone
    this.name = group?.name ?? ''
    this.memberIds = (group?.members ?? []).map((member) => member.id)
    makeViewModel(this, { group: false, onDone: false })

    this.optionsQuery = scope.query({
      queryKey: USER_GROUP_KEYS.options,
      queryFn: fetchUserGroupOptions,
      staleTime: Infinity,
    })

    const invalidateQueries = { queryKey: USER_GROUP_KEYS.list }
    this.createMutation = scope.mutation({ mutationFn: createUserGroup, invalidateQueries })
    this.renameMutation = scope.mutation({ mutationFn: ({ id, name }) => updateUserGroup(id, name), invalidateQueries })
    this.syncMembersMutation = scope.mutation({
      mutationFn: ({ id, memberIds }) => syncUserGroupMembers(id, memberIds),
      invalidateQueries,
    })
  }

  get isEdit() {
    return Boolean(this.group)
  }

  get userOptions() {
    return this.optionsQuery.data?.users ?? []
  }

  get selectedMembers() {
    return this.userOptions.filter((user) => this.memberIds.includes(user.id))
  }

  get isSaving() {
    return this.createMutation.isPending || this.renameMutation.isPending || this.syncMembersMutation.isPending
  }

  get canSubmit() {
    return !this.isSaving && Boolean(this.name.trim())
  }

  setName(value) {
    this.name = value
  }

  setMembers(selected) {
    this.memberIds = (selected ?? []).map((user) => user.id)
  }

  async submit() {
    this.errors = null
    let step = 'create'

    try {
      if (this.isEdit) {
        step = 'rename'
        if (this.name !== this.group.name) await this.renameMutation.mutate({ id: this.group.id, name: this.name })
        step = 'members'
        await this.syncMembersMutation.mutate({ id: this.group.id, memberIds: this.memberIds })
      } else {
        await this.createMutation.mutate({ name: this.name, memberIds: this.memberIds })
        toast.success('Групу створено')
      }
      this.onDone()
    } catch (error) {
      if (error?.response?.status === 422) this.errors = error.response.data?.errors ?? null
      const fallback = {
        create: 'Не вдалося створити групу',
        rename: 'Не вдалося перейменувати групу',
        members: 'Не вдалося оновити склад групи',
      }[step]
      toast.error(userGroupErrorMessage(error, fallback))
    }
  }
}
