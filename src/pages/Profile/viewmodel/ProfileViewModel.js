import toast from 'react-hot-toast'
import { makeViewModel } from '../../../shared/mvvm/makeViewModel.js'
import { apiErrorMessage } from '../../../shared/mvvm/commands.js'
import { SESSION_KEYS } from '../../../stores/SessionStore.js'
import { responsibleQueries } from '../../Staff/model/staffCommands.js'
import {
  PROFILE_KEYS,
  avatarUrl,
  deleteAvatar,
  fetchProfile,
  fieldErrors,
  nameInitials,
  updatePassword,
  updateProfile,
  uploadAvatar,
} from '../model/profileApi.js'

const EMPTY_PASSWORD = { current_password: '', password: '', password_confirmation: '' }

/**
 * /profile (порт Blade profile/edit): аватар з обрізанням, "Мої призначення",
 * ПІБ/email, зміна пароля, вихід. Імʼя та аватар дублюються в /api/me
 * (сайдбар), тож після змін — оновлюємо сесію.
 */
export class ProfileViewModel {
  // Форма "Інформація про профіль": null — ще не змінювали (показуємо дані запиту).
  info = null
  infoErrors = {}
  savingInfo = false

  password = { ...EMPTY_PASSWORD }
  passwordErrors = {}
  savingPassword = false

  // Обрізання аватара: objectURL обраного файла (null — модалка закрита).
  cropSource = null
  savingAvatar = false
  avatarError = null
  // cache-bust після завантаження (той самий шлях /files?path=… може кешуватись).
  avatarVersion = 0

  constructor({ scope, stores }) {
    this.scope = scope
    this.stores = stores
    makeViewModel(this)

    this.profileQuery = scope.query({ queryKey: PROFILE_KEYS.profile, queryFn: fetchProfile })
    // Той самий ключ, що й /staff/responsible ("Мої відповідальності") — спільний кеш.
    this.assignmentsQuery = scope.query(responsibleQueries.my)
  }

  mount() {
    return () => this.releaseCropSource()
  }

  // ---- derived ------------------------------------------------------------

  get isLoading() {
    return this.profileQuery.isLoading
  }

  get profile() {
    return this.profileQuery.data ?? null
  }

  get form() {
    return this.info ?? { name: this.profile?.name ?? '', email: this.profile?.email ?? '' }
  }

  get infoDirty() {
    return this.info != null && (this.info.name !== this.profile?.name || this.info.email !== this.profile?.email)
  }

  get initials() {
    return this.profile?.initials || nameInitials(this.profile?.name)
  }

  get avatarSrc() {
    const url = avatarUrl(this.profile?.avatar)
    return url && this.avatarVersion ? `${url}&t=${this.avatarVersion}` : url
  }

  get assignmentsLoading() {
    return this.assignmentsQuery.isLoading
  }

  get assignments() {
    return this.assignmentsQuery.data ?? []
  }

  get canSavePassword() {
    return Boolean(this.password.current_password && this.password.password && this.password.password_confirmation)
  }

  // ---- helpers ------------------------------------------------------------

  setProfile(data) {
    if (data) this.scope.queryClient.setQueryData(PROFILE_KEYS.profile, data)
  }

  /** Імʼя / аватар у сайдбарі — з /api/me; email — з /api/spa/auth. */
  refreshSession({ auth = false } = {}) {
    this.scope.invalidate(SESSION_KEYS.me)
    if (auth) this.scope.invalidate(SESSION_KEYS.auth)
  }

  releaseCropSource() {
    if (this.cropSource) URL.revokeObjectURL(this.cropSource)
    this.cropSource = null
  }

  // ---- actions: інформація ------------------------------------------------

  setInfoField(field, value) {
    this.info = { ...this.form, [field]: value }
    if (this.infoErrors[field]) this.infoErrors = { ...this.infoErrors, [field]: undefined }
  }

  async saveInfo() {
    if (this.savingInfo || !this.infoDirty) return
    this.savingInfo = true
    this.infoErrors = {}
    try {
      this.setProfile(await updateProfile(this.form))
      this.info = null
      this.refreshSession({ auth: true })
      toast.success('Збережено')
    } catch (error) {
      this.infoErrors = fieldErrors(error)
      toast.error(apiErrorMessage(error, 'Не вдалося зберегти профіль'))
    } finally {
      this.savingInfo = false
    }
  }

  resetInfo() {
    this.info = null
    this.infoErrors = {}
  }

  // ---- actions: пароль ----------------------------------------------------

  setPasswordField(field, value) {
    this.password = { ...this.password, [field]: value }
    if (this.passwordErrors[field]) this.passwordErrors = { ...this.passwordErrors, [field]: undefined }
  }

  async savePassword() {
    if (this.savingPassword || !this.canSavePassword) return
    this.savingPassword = true
    this.passwordErrors = {}
    try {
      await updatePassword(this.password)
      this.password = { ...EMPTY_PASSWORD }
      toast.success('Пароль змінено')
    } catch (error) {
      this.passwordErrors = fieldErrors(error)
      toast.error(apiErrorMessage(error, 'Не вдалося змінити пароль'))
    } finally {
      this.savingPassword = false
    }
  }

  // ---- actions: аватар ----------------------------------------------------

  pickAvatar(file) {
    if (!file) return
    this.avatarError = null
    this.releaseCropSource()
    this.cropSource = URL.createObjectURL(file)
  }

  cancelCrop() {
    this.releaseCropSource()
  }

  /** blob — обрізаний квадрат 512×512 з AvatarCropModal. */
  async saveAvatar(blob) {
    if (this.savingAvatar || !blob) return
    this.savingAvatar = true
    this.avatarError = null
    try {
      const data = await uploadAvatar(blob)
      if (this.profile) this.setProfile({ ...this.profile, avatar: data?.avatar ?? null })
      this.avatarVersion = Date.now()
      this.releaseCropSource()
      this.refreshSession()
      toast.success('Аватар оновлено')
    } catch (error) {
      this.avatarError = apiErrorMessage(error, 'Не вдалося зберегти аватар')
    } finally {
      this.savingAvatar = false
    }
  }

  async removeAvatar() {
    if (this.savingAvatar) return
    this.savingAvatar = true
    this.avatarError = null
    try {
      await deleteAvatar()
      if (this.profile) this.setProfile({ ...this.profile, avatar: null })
      this.refreshSession()
      toast.success('Аватар видалено')
    } catch (error) {
      this.avatarError = apiErrorMessage(error, 'Не вдалося видалити аватар')
    } finally {
      this.savingAvatar = false
    }
  }

  // ---- actions: вихід -----------------------------------------------------

  logout() {
    return this.stores.session.logout().catch((error) => {
      toast.error(apiErrorMessage(error, 'Не вдалося вийти'))
    })
  }
}
