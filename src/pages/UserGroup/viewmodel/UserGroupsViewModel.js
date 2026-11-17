import { observable } from 'mobx'
import toast from 'react-hot-toast'
import { makeViewModel } from '../../../shared/mvvm/makeViewModel.js'
import { deleteUserGroup, fetchUserGroups } from '../../../entities/userGroup/api.js'
import { USER_GROUP_KEYS, userGroupErrorMessage } from '../../../entities/userGroup/userGroupKeys.js'

/** /admin-groups: список груп, пошук, створення/редагування (модалка), видалення. */
export class UserGroupsViewModel {
  search = ''
  // undefined — модалка закрита, null — створення, об'єкт — редагування
  modalGroup = undefined
  deleteTarget = null

  constructor({ scope }) {
    this.scope = scope
    // Об'єкти з кешу запитів — за посиланням, без глибокого клонування в observable.
    makeViewModel(this, { modalGroup: observable.ref, deleteTarget: observable.ref })

    this.groupsQuery = scope.query({
      queryKey: USER_GROUP_KEYS.list,
      queryFn: fetchUserGroups,
    })

    this.deleteMutation = scope.mutation({
      mutationFn: deleteUserGroup,
      invalidateQueries: { queryKey: USER_GROUP_KEYS.list },
    })
  }

  get groups() {
    return this.groupsQuery.data ?? []
  }

  get isLoading() {
    return this.groupsQuery.isLoading
  }

  get filteredGroups() {
    const q = this.search.trim().toLowerCase()
    return q ? this.groups.filter((group) => group.name.toLowerCase().includes(q)) : this.groups
  }

  get emptyText() {
    return this.groups.length ? 'Нічого не знайдено' : 'Груп ще немає'
  }

  get isModalOpen() {
    return this.modalGroup !== undefined
  }

  setSearch(value) {
    this.search = value || ''
  }

  openCreate() {
    this.modalGroup = null
  }

  openEdit(group) {
    this.modalGroup = group
  }

  closeModal() {
    this.modalGroup = undefined
  }

  askDelete(group) {
    this.deleteTarget = group
  }

  cancelDelete() {
    this.deleteTarget = null
  }

  async confirmDelete() {
    try {
      await this.deleteMutation.mutate(this.deleteTarget.id)
      toast.success('Групу видалено')
      this.deleteTarget = null
    } catch (error) {
      toast.error(userGroupErrorMessage(error, 'Не вдалося видалити групу'))
    }
  }
}
