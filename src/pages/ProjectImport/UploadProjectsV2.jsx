import { useSearchParams } from "react-router"
import { observer } from "mobx-react-lite"
import { Card, Menu, MenuHandler, MenuItem, MenuList, Spinner, Tooltip, Typography } from "@material-tailwind/react"
import { Modal, ModalHeader, ModalBody, ModalFooter } from "../../components/Modal/Modal.jsx"
import Button from "../../components/Buttons/Button.jsx"
import { format } from "date-fns"
import DuplicateProjectsModal from "./DuplicateProjectsModal.jsx"
import Page from "../../components/Page.jsx"
import LoadingButton from "../../components/Buttons/LoadingButton.jsx"
import ImportFile from "../../components/Modal/ImportFile.jsx"
import { useViewModel } from "../../shared/mvvm/useViewModel.js"
import PageHeader from "../../layouts/app/PageHeader.jsx"
import { ProjectImportViewModel } from "./viewmodel/ProjectImportViewModel.js"
import TableValidationV2 from "./components/TableValidationV2.jsx"
import { CATEG_CLASS, IDENT_ICONS, PROPOSAL_CLASS } from "./utils.js"

const ImportContent = observer(({ vm }) => {
  const { itemType, projectActionType, projectState, users, terms } = vm
  const {
    projects,
    errors,
    warnings,
    isModal,
    confirmImportOpen,
    selectedItemTypeId,
  } = vm
  const { importedProjectsData, isImportDetailsLoading, isFetching } = vm
  const data = vm.document
  const upload = vm.uploadCmd
  const findDuplicateMutation = vm.duplicatesCmd
  const importProjects = vm.importCmd
  const isPending = vm.layoutCmd.isPending
  const getFile = vm.downloadTemplate
  const setSelectedItemTypeId = vm.setSelectedItemTypeId
  const closeImport = vm.closeImport
  const handleAddProjects = vm.openImport
  const handleUpload = vm.upload
  const handleSubmit = vm.submit
  const handleConfirmImport = vm.confirmImport
  const handleCancelImport = vm.cancelImport
  const findDuplicates = vm.findDuplicates
  const duplicateOpen = Boolean(vm.duplicateDialog)
  const duplicateDialogProps = vm.duplicateDialog
  const handleDuplicateClose = vm.closeDuplicates
  const invalidFieldsOpen = Boolean(vm.invalidFieldsDialog)
  const invalidFieldsDialogProps = vm.invalidFieldsDialog
  const handleInvalidFieldsClose = vm.closeInvalidFields

  const itemTypeOptions = Boolean(itemType?.length) && (
    <div>
      <Typography variant="small" className="dark:text-gray-300">
        Оберіть тип суб'єкта та файл
      </Typography>
      <div className="mb-2 flex flex-wrap gap-1">
        {itemType.map((type) => (
          <label key={type.id} className="cursor-pointer">
            <input
              type="radio"
              name="itemType"
              value={type.id}
              checked={selectedItemTypeId === type.id}
              onChange={() => setSelectedItemTypeId(type.id)}
              className="peer sr-only"
            />
            <span className="flex items-center rounded-full border border-gray-200 bg-white px-2.5 py-1 text-xs text-gray-700 shadow-sm transition peer-checked:border-blue-500 peer-checked:bg-blue-50 peer-checked:text-blue-700 hover:border-blue-300 hover:bg-blue-50 sm:text-sm dark:border-neutral-700 dark:bg-neutral-800 dark:text-gray-200 dark:peer-checked:border-blue-400 dark:peer-checked:bg-blue-900/30 dark:peer-checked:text-blue-200 dark:hover:border-blue-400/70 dark:hover:bg-blue-900/20">
              {type.caption}
            </span>
          </label>
        ))}
      </div>
    </div>
  )
  const importedCount = vm.importedCount
  const renderStateIcon = (stateId) => {
    const state = projectState.find((item) => item.id === stateId)
    if (!state) return null
    return <i className={`text-xl ${state.icon} ${state.style}`}></i>
  }
  const renderSubjectType = (subjectTypeId) => {
    const subject = itemType.find((item) => item.id === subjectTypeId)
    return subject?.icon ? <i className={subject.icon}></i> : ""
  }
  const renderCountries = (parsed) => {
    if (!Array.isArray(parsed?.countries) || !parsed.countries.length)
      return <i>Відсутні країни</i>
    return parsed.countries.map((country, idx) => (
      <div key={`${country.iso}-${idx}`} className="text-xs">
        {country.iso} - {country.name}
      </div>
    ))
  }
  const renderIdentifiers = (parsed) => {
    if (!Array.isArray(parsed?.identifiers) || !parsed.identifiers.length)
      return <i>Немає ідентифікаторів</i>
    return parsed.identifiers.map((item, idx) => (
      <p key={`${item.id || idx}-${idx}`} className="text-xs">
        {IDENT_ICONS[item.group] && (
          <i className={`${IDENT_ICONS[item.group]} mr-1`}></i>
        )}
        {item.caption} {item.value} {item.country ? `[${item.country}]` : ""}
      </p>
    ))
  }
  const renderAttributes = (row, parsed) => {
    return (
      <div className="text-xs">
        {Array.isArray(parsed?.attributes) && parsed.attributes.length ? (
          parsed.attributes.map((item, idx) => (
            <p key={idx}>
              <span className="underline">{item.caption}:</span>{" "}
              {item.value || <i>Відсутнє значення</i>}
            </p>
          ))
        ) : (
          <i>Немає атрибутів</i>
        )}
        {row.notes ? (
          <p className="mt-1">
            <span className="underline">Примітки:</span> {row.notes}
          </p>
        ) : null}
      </div>
    )
  }

  const renderCategories = (parsed) => {
    if (!Array.isArray(parsed?.categories) || !parsed.categories.length)
      return <i>Немає категорій</i>
    return parsed.categories.map((item, idx) => (
      <p key={idx} className="text-xs">
        <i
          className={`fa-solid fa-tag mr-1 ${CATEG_CLASS[item.typeId] || ""}`}
        ></i>
        {item.caption}
      </p>
    ))
  }
  const renderDocuments = (row, parsed) => {
    return (
      <div className="text-xs">
        {Array.isArray(parsed?.proposals) && parsed.proposals.length ? (
          parsed.proposals.map((item) => (
            <p key={item.id}>
              <i
                className={`fa-solid fa-briefcase mr-1 ${PROPOSAL_CLASS[item.stateId] || "text-gray-600"}`}
              ></i>
              {item.caption}
            </p>
          ))
        ) : (
          <i>Відсутнє подання</i>
        )}
        <hr className="my-1" />
        {Array.isArray(parsed?.documents) && parsed.documents.length ? (
          parsed.documents.map((item, idx) => (
            <p key={`${item.regNum || idx}-${idx}`}>
              <i className="fa-regular fa-file-lines mr-1"></i>
              {[item.regNum, item.regDate, item.unitCaption]
                .filter(Boolean)
                .join(" ")}
            </p>
          ))
        ) : (
          <i>Відсутні документи</i>
        )}
      </div>
    )
  }

  return (
    <Page>
      <PageHeader
        title="Імпорт проєктів"
        breadcrumbs={
          vm.documentId ? [{ label: "Документи", href: "/document" }] : null
        }
        actions={
          <>
            <Menu placement="bottom-end">
              <MenuHandler>
                <LoadingButton
                  size="sm"
                  variant="outlined"
                  isLoading={isPending}
                  disabled={isPending}>
                  <span className="flex items-center gap-2">
                    <i className="fa-solid fa-download"></i>
                    <span>Завантажити шаблон</span>
                    <i className="fa-solid fa-chevron-down text-xs opacity-70"></i>
                  </span>
                </LoadingButton>
              </MenuHandler>
              <MenuList className="min-w-[12rem]">
                {(itemType || []).map((type) => (
                  <MenuItem
                    key={type.id}
                    onClick={() => getFile(type.id)}
                    className="flex items-center gap-2"
                  >
                    <i className="fa-regular fa-file-excel text-green-600"></i>
                    {type.caption}
                  </MenuItem>
                ))}
              </MenuList>
            </Menu>
            {Boolean(projects?.data?.length) && (
              <LoadingButton
                size="sm"
                isLoading={upload.isPending}
                onClick={handleSubmit}
                color="green"
                disabled={
                  isFetching || Boolean(errors) || Boolean(upload.isPending)
                }>
                <span className="flex items-center gap-2">
                  <i className="fa-solid fa-cloud-arrow-up"></i>
                  <span>Імпортувати</span>
                </span>
              </LoadingButton>
            )}
          </>
        }
      />
      <div
        data-i-doc="page:project-import-upload-v2"
        className="mb-2 empty:hidden"
      >
        {Boolean(data?.data) && (
          <Typography
            variant="small"
            color="gray"
            className="flex flex-wrap items-center gap-x-1.5 text-xs font-normal text-gray-600 dark:text-gray-400"
          >
            <i className="fa-regular fa-file-lines"></i>
            <span>Документ: {data?.data?.regNum}</span>
            {data?.data?.regDate && (
              <span className="text-gray-600 dark:text-gray-500">
                від {format(data?.data?.regDate, "dd.MM.yyyy")}
              </span>
            )}
          </Typography>
        )}
      </div>
      <Card className="m-0 border border-gray-100 p-2.5 shadow-lg sm:p-3 dark:border-neutral-700/60 dark:bg-neutral-700">
        <div className="flex flex-col gap-2.5">
          <div className="flex flex-col gap-2 border-b border-gray-100 pb-2.5 md:flex-row md:items-center md:justify-between dark:border-neutral-700/60">
            <div className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-300">
                <i className="fa-solid fa-folder-plus"></i>
              </span>
              <div className="space-y-0.5">
                <Typography
                  variant="h6"
                  className="leading-tight text-gray-900 dark:text-gray-100"
                >
                  Додати проєкти
                </Typography>
                <Typography
                  variant="small"
                  color="gray"
                  className="text-xs font-normal text-gray-600 dark:text-gray-400"
                >
                  Оберіть тип проєкту та завантажте файл у шаблоні.
                </Typography>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                size="sm"
                color="blue"
                disabled={!selectedItemTypeId}
                onClick={handleAddProjects}
                className="flex items-center gap-1.5 px-3 py-2 shadow-sm">
                <i className="fa-regular fa-plus"></i>
                <span className="hidden sm:inline">Додати файл</span>
                <span className="sm:hidden">Додати</span>
              </Button>
              {Boolean(projects?.data?.length) && (
                <LoadingButton
                  isLoading={findDuplicateMutation.isPending}
                  size="sm"
                  variant="outlined"
                  color="blue"
                  disabled={findDuplicateMutation.isPending}
                  onClick={findDuplicates}>
                  <span className="flex items-center gap-1.5">
                    <i className="fa-solid fa-database"></i>
                    <span className="hidden sm:inline">
                      Перевірити дублікати
                    </span>
                    <span className="sm:hidden">Дублікати</span>
                  </span>
                </LoadingButton>
              )}
            </div>
          </div>
        </div>

        <div className="mt-1">
          <TableValidationV2
            validation={errors}
            warnings={warnings}
            data={projects?.data}
            headers={projects?.headerColumns}
          />
        </div>
      </Card>
      {isModal && (
        <ImportFile
          accept="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
          open={isModal}
          extraContent={itemTypeOptions}
          handleSubmit={handleUpload}
          isLoading={upload.isPending}
          formatText="Формати: .xls, .xlsx"
          onClose={closeImport}
        />
      )}
      {importProjects.isSuccess && (
        <Modal open={importProjects.isSuccess} size="xl">
          <ModalHeader>
            Імпортовано успішно
          </ModalHeader>
          <ModalBody className="max-h-[65vh] overflow-auto pt-0">
            <Typography className="mb-2 text-sm font-medium dark:text-gray-200">
              Додано проєктів: {importedCount}
            </Typography>
            {isImportDetailsLoading && (
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                <Spinner className="h-4 w-4" />
                <span>Завантаження деталей...</span>
              </div>
            )}
            {!isImportDetailsLoading &&
              Boolean(importedProjectsData?.length) && (
                <div className="rounded-md border border-gray-200 bg-white dark:border-neutral-700 dark:bg-neutral-800">
                  <div className="overflow-auto">
                    <table className="min-w-full text-xs text-gray-700 dark:text-gray-200">
                      <thead className="bg-gray-100 text-gray-700 dark:bg-neutral-700 dark:text-gray-200">
                        <tr>
                          <th className="border border-gray-200 px-2 py-1 dark:border-neutral-700">
                            Дія
                          </th>
                          <th className="border border-gray-200 px-2 py-1 dark:border-neutral-700">
                            Стан
                          </th>
                          <th className="border border-gray-200 px-2 py-1 dark:border-neutral-700">
                            Тип
                          </th>
                          <th className="border border-gray-200 px-2 py-1 dark:border-neutral-700">
                            Назви/ДН
                          </th>
                          <th className="border border-gray-200 px-2 py-1 dark:border-neutral-700">
                            Країни
                          </th>
                          <th className="border border-gray-200 px-2 py-1 dark:border-neutral-700">
                            Ідентифікаційні дані
                          </th>
                          <th className="border border-gray-200 px-2 py-1 dark:border-neutral-700">
                            Дод.інформація
                          </th>
                          <th className="border border-gray-200 px-2 py-1 dark:border-neutral-700">
                            Термін
                          </th>
                          <th className="border border-gray-200 px-2 py-1 dark:border-neutral-700">
                            Категорії
                          </th>
                          <th className="border border-gray-200 px-2 py-1 dark:border-neutral-700">
                            Документи
                          </th>
                          <th className="border border-gray-200 px-2 py-1 dark:border-neutral-700">
                            Виконавець
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {importedProjectsData.map((row) => {
                          const parsed = row.precomputedData
                          const action = projectActionType.find(
                            (item) => item.id === row.actionType
                          )
                          const performer = users.find(
                            (u) => u.id === row.performerId
                          )
                          const termCaption =
                            terms.find((t) => t.id === row.termId)?.caption ||
                            ""

                          return (
                            <tr
                              key={row.id}
                              className="bg-white hover:bg-gray-50 dark:bg-neutral-800 dark:hover:bg-neutral-700/70"
                            >
                              <td className="border border-gray-200 px-2 py-1 align-top dark:border-neutral-700">
                                <Tooltip content={action?.caption || ""}>
                                  <span>
                                    {action?.icon ? (
                                      <i className={action.icon}></i>
                                    ) : (
                                      action?.caption || ""
                                    )}
                                  </span>
                                </Tooltip>
                              </td>
                              <td className="border border-gray-200 px-2 py-1 align-top dark:border-neutral-700">
                                {renderStateIcon(row.stateId)}
                              </td>
                              <td className="border border-gray-200 px-2 py-1 align-top dark:border-neutral-700">
                                {renderSubjectType(row.subjectTypeId)}
                              </td>
                              <td className="border border-gray-200 px-2 py-1 align-top dark:border-neutral-700">
                                {row.nameUk ? (
                                  <>
                                    <strong>
                                      <i className="fa-light fa-input-text mr-1"></i>
                                      {row.nameUk}
                                    </strong>
                                    <br />
                                  </>
                                ) : null}
                                {row.nameRu ? (
                                  <>
                                    <i className="fa-light fa-input-text mr-1"></i>
                                    {row.nameRu}
                                    <br />
                                  </>
                                ) : null}
                                {row.nameEn ? (
                                  <>
                                    <i className="fa-light fa-input-text mr-1"></i>
                                    {row.nameEn}
                                    <br />
                                  </>
                                ) : null}
                                {row.birthDate ? (
                                  <>
                                    <i className="fa-solid fa-calendar-days mr-1"></i>
                                    {row.birthDate}
                                    <br />
                                  </>
                                ) : null}
                                {row.drsId ? (
                                  <span className="text-green-500">
                                    <i className="fa-solid fa-solar-system mr-1"></i>
                                    {row.drsId}
                                  </span>
                                ) : null}
                              </td>
                              <td className="border border-gray-200 px-2 py-1 align-top dark:border-neutral-700">
                                {renderCountries(parsed)}
                              </td>
                              <td className="border border-gray-200 px-2 py-1 align-top dark:border-neutral-700">
                                {renderIdentifiers(parsed)}
                              </td>
                              <td className="border border-gray-200 px-2 py-1 align-top dark:border-neutral-700">
                                {renderAttributes(row, parsed)}
                              </td>
                              <td className="border border-gray-200 px-2 py-1 align-top dark:border-neutral-700">
                                {termCaption}
                              </td>
                              <td className="border border-gray-200 px-2 py-1 align-top dark:border-neutral-700">
                                {renderCategories(parsed)}
                              </td>
                              <td className="border border-gray-200 px-2 py-1 align-top dark:border-neutral-700">
                                {renderDocuments(row, parsed)}
                              </td>
                              <td className="border border-gray-200 px-2 py-1 align-top dark:border-neutral-700">
                                {performer?.name || ""}
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
          </ModalBody>
          <ModalFooter>
            <Button
              variant="gradient"
              color="green"
              className="w-full"
              onClick={() => {
                vm.openProjects()
              }}>
              <span>Ок</span>
            </Button>
          </ModalFooter>
        </Modal>
      )}
      {duplicateOpen && (
        <DuplicateProjectsModal
          {...duplicateDialogProps}
          dictionaries={vm.options}
          open={duplicateOpen}
          onClose={handleDuplicateClose}
        />
      )}
      {confirmImportOpen && (
        <Modal open={confirmImportOpen} size="sm" handler={handleCancelImport}>
          <ModalHeader className="flex items-center gap-2 text-amber-700 dark:text-amber-300">
            <i className="fa-regular fa-triangle-exclamation"></i>
            <span>Підтвердження імпорту</span>
          </ModalHeader>
          <ModalBody>
            Дані містять неточності, всеодно імпортувати?
          </ModalBody>
          <ModalFooter className="gap-2">
            <Button
              variant="outlined"
              color="secondary"
              onClick={handleCancelImport}
              disabled={importProjects.isPending}>
              Ні
            </Button>
            <LoadingButton
              isLoading={importProjects.isPending}
              color="green"
              onClick={handleConfirmImport}
              disabled={importProjects.isPending}>
              Так
            </LoadingButton>
          </ModalFooter>
        </Modal>
      )}
      {invalidFieldsOpen && (
        <Modal
          open={invalidFieldsOpen}
          size="lg"
          handler={handleInvalidFieldsClose}>
          <ModalHeader className="flex items-center gap-2 text-red-700 dark:text-red-300">
            <i className="fa-regular fa-triangle-exclamation"></i>
            <span>422 Невалідні дані</span>
          </ModalHeader>
          <div className="px-4 pb-2">
            <Typography className="text-sm text-gray-700 dark:text-gray-200">
              {invalidFieldsDialogProps?.message ||
                "Некоректні параметри запиту"}
            </Typography>
          </div>
          <div className="px-4 pb-1">
            <div className="max-h-[55vh] overflow-auto rounded-md border border-gray-200 bg-gray-50 p-3 dark:border-neutral-700 dark:bg-neutral-800/40">
              {(invalidFieldsDialogProps?.invalidFields || []).map(
                (item, index) => (
                  <div
                    key={index}
                    className="mb-3 rounded border border-gray-200 bg-white p-2 dark:border-neutral-700 dark:bg-neutral-700/80"
                  >
                    <Typography className="mb-1 text-xs font-semibold text-red-700 dark:text-red-300">
                      {index + 1}. Помилка
                    </Typography>
                    <Typography className="text-xs leading-5 whitespace-pre-line text-gray-700 dark:text-gray-200">
                      {String(item || "")
                        .split("; ")
                        .join(";\n")}
                    </Typography>
                  </div>
                )
              )}
            </div>
          </div>
          <ModalFooter>
            <Button color="secondary" onClick={handleInvalidFieldsClose}>
              Закрити
            </Button>
          </ModalFooter>
        </Modal>
      )}
    </Page>
  )
})

/** Маршрут /project/upload/v2?documentId=… (pageAccess). Props — /api/spa/pages/project-upload-v2/options. */
const UploadProjectsV2 = () => {
  const [searchParams] = useSearchParams()
  const documentId = searchParams.get("documentId")
  const vm = useViewModel(
    (deps) => new ProjectImportViewModel({ ...deps, documentId })
  )
  return <ImportContent vm={vm} />
}

export default observer(UploadProjectsV2)
