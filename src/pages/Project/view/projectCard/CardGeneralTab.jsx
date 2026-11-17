import { observer } from "mobx-react-lite"
import { useVM } from "../../../../shared/mvvm/index.js"
import { Box, CardText, Flag, SectionTitle, VocField } from "./cardParts.jsx"
import AnalysisBadge from "../liveAnalysis/AnalysisBadge.jsx"

const TILE_BG = {
  green: ["bg-gray-50 dark:bg-neutral-900", "bg-green-50 dark:bg-green-900"],
  orange: [
    "bg-orange-50 dark:bg-orange-900",
    "bg-orange-200 dark:bg-orange-800",
  ],
  red: ["bg-red-50 dark:bg-red-900", "bg-red-200 dark:bg-red-800"],
}

/** Обмеження (legacy RestrictionsBlockComponent): сітка 7 колонок, колір — придатність, яскравість — обрано. */
const Restrictions = ({ items }) => {
  if (items.length === 0) return null
  return (
    <div className="mb-4 w-full overflow-x-hidden">
      <SectionTitle>Обмеження</SectionTitle>
      <div
        className="box-border grid grid-cols-7 gap-2 overflow-x-hidden text-gray-900 dark:text-gray-100"
        data-testid="card-restrictions"
      >
        {items.map((item) => {
          const border = item.checked
            ? "border-2 border-gray-500 dark:border-gray-400"
            : item.dashed
              ? "border-2 border-dashed border-gray-500 dark:border-gray-400"
              : ""
          const span =
            item.code === "25"
              ? "col-span-7"
              : item.r6Text
                ? "col-span-3"
                : "col-span-1"
          const base =
            item.code === "25"
              ? "rounded px-2 py-3 text-xs"
              : "rounded px-1 py-2 text-center text-xs"
          return (
            <div
              key={item.key}
              title={item.caption}
              data-checked={item.checked}
              className={`${base} ${TILE_BG[item.color][item.checked ? 1 : 0]} ${border} ${span}`}
            >
              <div
                className={
                  item.r6Text
                    ? "flex flex-nowrap items-center justify-center gap-1.5"
                    : ""
                }
              >
                <span className="font-medium">{item.code}</span>
                {item.r6Text && (
                  <span
                    className="inline-block rounded bg-amber-200 px-1.5 py-0.5 text-xs font-medium whitespace-nowrap text-amber-900 dark:bg-amber-700/60 dark:text-amber-100"
                    title={item.r6Text}
                  >
                    {item.r6Text.length > 20
                      ? `${item.r6Text.slice(0, 20)}…`
                      : item.r6Text}
                  </span>
                )}
                {item.text && (
                  <div className="mt-1 text-sm whitespace-pre-wrap text-gray-700 dark:text-gray-300">
                    {item.text}
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

const Avatar = ({ user, resolvedState = null, ring = false }) => {
  if (!user) return null
  const bg =
    resolvedState === null
      ? "bg-gray-100 dark:bg-gray-600"
      : resolvedState === 1
        ? "bg-green-300 dark:bg-green-700"
        : "bg-gray-200 dark:bg-neutral-700"
  return (
    <div
      title={user.caption}
      className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold text-gray-700 dark:text-gray-200 ${bg} ${ring ? "-mt-2 ring-2 ring-white dark:ring-neutral-800" : ""}`}
    >
      {user.initials}
    </div>
  )
}

const TicketButton = ({ title, icon, onClick }) => (
  <button
    type="button"
    title={title}
    onClick={onClick}
    className="rounded-full bg-white p-1 text-xs transition-colors hover:bg-gray-100 dark:bg-neutral-800 dark:hover:bg-neutral-700"
  >
    <i className={`${icon} pointer-events-none`} />
  </button>
)

/** Тікети (legacy TicketBlockComponent). */
const Tickets = observer(({ tickets }) => {
  const vm = useVM().projectCard
  return (
    <div className="mb-4">
      <SectionTitle>Тікети</SectionTitle>
      <Box>
        {tickets.length === 0 && (
          <div className="py-2 text-center text-gray-600 dark:text-gray-400">
            Тікети відсутні
          </div>
        )}
        {tickets.map((ticket) => (
          <div
            key={ticket.id}
            className={`group relative mb-1.5 rounded border border-l-4 bg-white px-2 py-1.5 text-xs shadow-sm transition-all hover:shadow-md dark:bg-neutral-900 ${
              ticket.stateId === -1
                ? "border-l-orange-400 dark:border-l-orange-600"
                : "border-l-gray-300 dark:border-l-neutral-600"
            }`}
          >
            <div className="absolute top-1 left-2 z-10 flex flex-col items-center">
              <Avatar user={vm.userOf(ticket.createdUserId)} />
              <Avatar
                user={vm.userOf(ticket.resolvedUserId)}
                resolvedState={ticket.stateId}
                ring
              />
            </div>
            <div className="pr-2 pl-8">
              <div className="mb-0.5 text-gray-900 dark:text-gray-100">
                {ticket.text}
              </div>
              <div className="text-xs text-gray-400 dark:text-gray-500">
                ticket#{ticket.id}
              </div>
            </div>
            <div className="absolute right-2 bottom-1.5 flex gap-0.5 rounded bg-white/80 p-0.5 opacity-0 backdrop-blur-sm transition-opacity group-hover:opacity-100 dark:bg-neutral-800/80">
              {vm.isEditable &&
                (ticket.stateId === -1 ? (
                  <>
                    <TicketButton
                      title="Позначити реалізованим"
                      icon="fa-solid fa-check text-gray-500 dark:text-gray-400"
                      onClick={() => vm.setTicketState(ticket.id, 0)}
                    />
                    <TicketButton
                      title="Позначити реалізованим та дуже корисним"
                      icon="fa-solid fa-check-double text-green-500 dark:text-green-400"
                      onClick={() => vm.setTicketState(ticket.id, 1)}
                    />
                    <TicketButton
                      title="Редагувати тікет"
                      icon="fa-solid fa-pen text-blue-500 dark:text-blue-400"
                      onClick={() => vm.editTicket(ticket.id)}
                    />
                    <TicketButton
                      title="Видалити тікет"
                      icon="fa-solid fa-trash text-red-500 dark:text-red-400"
                      onClick={() => vm.deleteTicket(ticket.id)}
                    />
                  </>
                ) : (
                  <TicketButton
                    title="Відмінити позначку реалізованого"
                    icon="fa-solid fa-arrow-rotate-left text-gray-500 dark:text-gray-400"
                    onClick={() => vm.setTicketState(ticket.id, -1)}
                  />
                ))}
              {ticket.attachmentName && (
                <a
                  href={`/api/ticket/${ticket.id}/attachment`}
                  target="_blank"
                  rel="noreferrer"
                  title="Переглянути вкладення"
                  className="rounded-full bg-white p-1 text-xs hover:bg-gray-100 dark:bg-neutral-800 dark:hover:bg-neutral-700"
                >
                  <i className="fa-solid fa-paperclip pointer-events-none text-gray-500 dark:text-gray-400" />
                </a>
              )}
            </div>
          </div>
        ))}
        {vm.isEditable && (
          <button
            type="button"
            title="Додати тікет"
            onClick={vm.addTicket}
            className="mt-2 h-8 w-8 cursor-pointer rounded-lg border border-gray-200 p-1 text-base hover:bg-gray-100 dark:border-neutral-700 dark:hover:bg-neutral-700"
          >
            <i className="fa-regular fa-message-plus pointer-events-none" />
          </button>
        )}
      </Box>
    </div>
  )
})

const formatSize = (bytes) => {
  const size = Number(bytes) || 0
  if (size < 1024) return `${size} Б`
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} КБ`
  return `${(size / 1024 / 1024).toFixed(1)} МБ`
}
const formatDate = (value) =>
  value
    ? new Date(String(value).replace(" ", "T")).toLocaleDateString("uk-UA")
    : ""
const filesWord = (count) => {
  const mod10 = count % 10
  const mod100 = count % 100
  if (mod10 === 1 && mod100 !== 11) return "файл"
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return "файли"
  return "файлів"
}

/** Вкладення (legacy AttachmentsBlockComponent): фото окремою групою, файли, завантаження і відкріплення. */
const Attachments = observer(({ attachments }) => {
  const vm = useVM().projectCard
  const photos = attachments.filter((item) => item.type === "photo")
  const files = attachments.filter((item) => item.type !== "photo")
  const actions = (attachment) => (
    <div className="ml-3 flex items-center gap-2">
      <button
        type="button"
        title="Завантажити"
        onClick={() => vm.download(attachment)}
        className="rounded-md p-2 text-gray-400 opacity-0 transition-all group-hover:opacity-100 hover:bg-blue-50 hover:text-blue-600 dark:text-gray-500 dark:hover:bg-blue-900/20 dark:hover:text-blue-400"
      >
        <i className="fa-solid fa-download" />
      </button>
      {vm.isEditable && (
        <button
          type="button"
          title="Видалити"
          onClick={() => vm.detach(attachment.id)}
          className="rounded-md p-2 text-gray-400 opacity-0 transition-all group-hover:opacity-100 hover:bg-red-50 hover:text-red-600 dark:text-gray-500 dark:hover:bg-red-900/20 dark:hover:text-red-400"
        >
          <i className="fa-solid fa-trash-can" />
        </button>
      )}
    </div>
  )
  return (
    <div className="mb-4 w-full">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-xs text-gray-500 dark:text-gray-400">Вкладення</h3>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {attachments.length} {filesWord(attachments.length)}
          </span>
          {vm.isEditable && (
            <button
              type="button"
              title="Додати вкладення"
              onClick={vm.toggleUpload}
              className="flex items-center gap-1 rounded bg-blue-500 px-2 py-1 text-xs text-white transition-colors hover:bg-blue-600"
            >
              <i
                className={`fa-solid ${vm.uploadOpen ? "fa-minus" : "fa-plus"} text-[0.65rem]`}
              />
            </button>
          )}
        </div>
      </div>
      {attachments.length === 0 && (
        <div className="py-6 text-center text-sm text-gray-500 dark:text-gray-400">
          <i className="fa-regular fa-folder-open mb-2 block text-2xl text-gray-300 dark:text-gray-600" />
          Немає вкладень
        </div>
      )}
      {photos.length > 0 && (
        <div className="mb-3">
          <div className="mb-1 flex items-center gap-1 text-xs font-medium text-violet-600 dark:text-violet-400">
            <i className="fa-solid fa-camera" /> Ідентифікуючі фото
          </div>
          {photos.map((photo) => (
            <div
              key={photo.id}
              className="group mb-2 flex items-center justify-between rounded-lg bg-violet-50 p-2 transition-all hover:bg-violet-100 dark:bg-violet-900/20 dark:hover:bg-violet-900/30"
            >
              <button
                type="button"
                className="flex min-w-0 flex-1 items-center gap-3 text-left"
                onClick={() => vm.openPhoto(photo)}
              >
                <img
                  src={
                    photo.fileUrl ||
                    `/public-file?path=${encodeURIComponent(photo.file_path || photo.filePath || "")}`
                  }
                  alt=""
                  className="h-12 w-10 shrink-0 rounded border border-violet-200 object-cover dark:border-violet-700"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-gray-900 dark:text-gray-100">
                    {photo.originalName || photo.filename}
                  </p>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {formatDate(photo.uploadDate)}
                  </div>
                </div>
              </button>
              {actions(photo)}
            </div>
          ))}
        </div>
      )}
      {files.map((file) => (
        <div
          key={file.id}
          className="group mb-2 flex items-center justify-between rounded-lg bg-gray-50 p-3 transition-all hover:bg-gray-100 dark:bg-neutral-900 dark:hover:bg-neutral-700"
        >
          <div className="flex min-w-0 flex-1 items-center">
            <i className="fa-regular fa-file mr-3 text-lg text-gray-400" />
            <div className="min-w-0 flex-1">
              <p
                className="truncate text-sm font-medium text-gray-900 dark:text-gray-100"
                title={file.originalName || file.filename}
              >
                {file.originalName || file.filename}
              </p>
              <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                <span>{formatSize(file.size)}</span>
                <span>•</span>
                <span>{formatDate(file.uploadDate)}</span>
              </div>
            </div>
          </div>
          {actions(file)}
        </div>
      ))}
      {vm.isEditable && vm.uploadOpen && (
        <div>
          <div className="mb-3 flex items-center gap-4 px-1 text-xs text-gray-700 dark:text-gray-300">
            <span className="shrink-0 text-gray-500 dark:text-gray-400">
              Тип:
            </span>
            {[
              ["file", "Файл"],
              ["photo", "Ідентифікуюче фото"],
            ].map(([type, title]) => (
              <label
                key={type}
                className="flex cursor-pointer items-center gap-1.5 select-none"
              >
                <input
                  type="radio"
                  name="cardAttachmentType"
                  className="cursor-pointer accent-blue-500"
                  checked={vm.attachmentType === type}
                  onChange={() => vm.setAttachmentType(type)}
                />
                {title}
              </label>
            ))}
          </div>
          <label
            onDragOver={(event) => event.preventDefault()}
            onDrop={(event) => (
              event.preventDefault(),
              vm.upload(event.dataTransfer.files)
            )}
            className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 p-4 text-xs text-gray-500 hover:border-blue-400 dark:border-neutral-600 dark:bg-neutral-900 dark:text-gray-400"
          >
            <i
              className={`fa-solid ${vm.uploading ? "fa-spinner fa-spin" : "fa-cloud-arrow-up"}`}
            />
            Перетягніть файли або{" "}
            <span className="text-blue-500 underline">оберіть</span> (до 10 МБ)
            <input
              type="file"
              multiple
              className="hidden"
              onChange={(event) => (
                vm.upload(event.target.files),
                (event.target.value = "")
              )}
            />
          </label>
        </div>
      )}
    </div>
  )
})

/** Вкладка "Загальна інформація" (modalProjectCard/tab-general.blade.php). */
const CardGeneralTab = () => {
  const vm = useVM().projectCard
  const { view, layout } = vm
  if (!view) return null
  return (
    <div
      className="flex h-full text-gray-700 dark:text-gray-300"
      data-testid="card-tab-general"
    >
      {/* Ліва колонка (3/4) */}
      <div className="w-3/4 overflow-auto px-4 py-3">
        <div className="mb-4 flex">
          <div className="flex w-4/6 flex-wrap">
            <div className="mb-2 flex w-full gap-4">
              <div className="min-w-0 flex-1">
                <VocField title="Суб'єкт" value={view.subjectType} />
              </div>
              <div className="min-w-0 flex-1">
                <VocField title="Дія" value={view.actionType} />
              </div>
              <div className="min-w-0 flex-1">
                <VocField title="Стан" value={view.state} />
              </div>
              <div className="min-w-0 flex-1">
                {/* drsId редагується завжди (legacy) */}
                <CardText
                  field="drsId"
                  title="DrsId"
                  tone="green"
                  editable
                  alwaysVisible
                />
              </div>
            </div>
            {layout.fix && (
              <div className="mb-2 flex w-full gap-4">
                {[
                  ["fixActionId", "fixAction"],
                  ["fixDecree", "fixDecree"],
                  ["fixAnnex", "fixAnnex"],
                  ["fixIndex", "fixIndex"],
                ].map(([field, title]) => (
                  <div key={field} className="min-w-0 flex-1">
                    <CardText
                      field={field}
                      title={title}
                      tone="blue"
                      alwaysVisible
                    />
                  </div>
                ))}
              </div>
            )}
            <div className="flex w-full">
              <div className="flex w-3/4 flex-col gap-4 pr-4">
                <div className="flex flex-col gap-4">
                  <SectionTitle>Назви</SectionTitle>
                  {layout.nameUk && (
                    <CardText field="nameUk" label="uk" alwaysVisible />
                  )}
                  {layout.nameRu && (
                    <CardText field="nameRu" label="ru" alwaysVisible />
                  )}
                  <CardText field="nameEn" label="en" alwaysVisible />
                </div>
                {layout.birthDate && (
                  <CardText
                    field="birthDate"
                    title="Дати народження"
                    alwaysVisible
                  />
                )}
              </div>
              <div className="w-1/4">
                {view.countries.length > 0 && (
                  <div className="mb-4">
                    <SectionTitle>Країни</SectionTitle>
                    <ul className="text-sm text-gray-900 dark:text-gray-100">
                      {view.countries.map((country) => (
                        <li key={country.id} className="flex items-center">
                          <Flag iso2={country.iso2} title={country.caption} />
                          {country.caption}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
            {layout.adr && (
              <div className="mt-4 flex w-full flex-col gap-4">
                <SectionTitle>Адреси</SectionTitle>
                <CardText field="adrUk" label="uk" alwaysVisible />
                <CardText field="adrRu" label="ru" alwaysVisible />
                <CardText field="adrEn" label="en" alwaysVisible />
              </div>
            )}
            {view.identifiers.length > 0 && (
              <div className="mt-4 mb-4 w-full">
                <SectionTitle>Ідентифікатори</SectionTitle>
                <div className="flex w-full flex-col gap-2">
                  {view.identifiers.map((item) => (
                    <div key={item.id} className="flex items-start gap-2">
                      <div
                        className="grid flex-1 gap-2"
                        style={{ gridTemplateColumns: "20% 1fr 30%" }}
                      >
                        <Box className="flex items-center">
                          <Flag iso2={item.iso2} title={item.country} />
                          {item.country}
                        </Box>
                        <Box>{item.caption}</Box>
                        <Box>{item.value}</Box>
                      </div>
                      <AnalysisBadge
                        state={vm.analysis}
                        field="identifier"
                        objectId={item.id}
                        className="mt-2"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="mx-4 w-px bg-gray-200 dark:bg-neutral-700" />

          <div className="w-2/6">
            <div className="mb-4 flex w-full gap-4">
              <div className="w-1/2">
                <VocField title="Термін" value={view.term} />
              </div>
              <div className="w-1/2">
                <VocField title="Ініціатор" value={view.issuer} />
              </div>
            </div>
            <div className="mb-4">
              <SectionTitle>Підстави</SectionTitle>
              <div className="max-h-52 space-y-2 overflow-y-auto pr-1">
                {view.reasons.length === 0 ? (
                  <Box className="text-gray-500 dark:text-gray-400">—</Box>
                ) : (
                  view.reasons.map((reason) => <Box key={reason}>{reason}</Box>)
                )}
              </div>
            </div>
            <Restrictions items={view.restrictions} />
            {view.attributes.length > 0 && (
              <div className="mb-4 w-full">
                <SectionTitle>Атрибути</SectionTitle>
                <div className="flex w-full flex-col gap-2">
                  {view.attributes.map((item) => (
                    <div key={item.id} className="flex items-start gap-2">
                      <div
                        className="grid flex-1 gap-2"
                        style={{ gridTemplateColumns: "40% 1fr" }}
                      >
                        <Box>{item.caption}</Box>
                        <Box>{item.value}</Box>
                      </div>
                      <AnalysisBadge
                        state={vm.analysis}
                        field="attribute"
                        objectId={item.id}
                        className="mt-2"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
        <div className="my-4 border-t border-gray-200 dark:border-neutral-700" />
        <div className="mb-4">
          <CardText
            field="reasoning"
            title="Обґрунтування"
            multiline
            alwaysVisible
          />
        </div>
      </div>

      <div className="border-l border-gray-200 dark:border-neutral-700" />

      {/* Права колонка (1/4) */}
      <div className="w-1/4 px-4 py-3">
        <div className="mb-4">
          <SectionTitle>Виконавець</SectionTitle>
          <Box>{view.performer ?? "—"}</Box>
        </div>
        <div className="mb-4">
          <SectionTitle>Валідатор</SectionTitle>
          <Box>{view.validator ?? "—"}</Box>
        </div>
        {view.proposals.length > 0 && (
          <div className="mb-4">
            <SectionTitle>Пропозиції</SectionTitle>
            <div className="flex w-full flex-col gap-1 text-sm text-gray-900 dark:text-gray-100">
              {view.proposals.map((proposal) => (
                <div
                  key={proposal.id}
                  className="grid w-full items-center gap-1"
                  style={{ gridTemplateColumns: "30px auto" }}
                >
                  <Box
                    className="flex items-center justify-center px-2 py-1"
                    title={proposal.stateCaption}
                  >
                    <i
                      className={`${proposal.icon} text-lg text-black dark:text-white`}
                    />
                  </Box>
                  <Box className="px-2 py-1">{proposal.caption}</Box>
                </div>
              ))}
              {view.decree && (
                <div className="mt-2 flex items-center gap-1">
                  <div
                    className={`inline-flex h-7 items-center rounded px-1.5 py-1 text-xs font-medium ${view.decree.isActive === 0 ? "bg-rose-300 dark:bg-rose-950" : "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-gray-300"}`}
                  >
                    <i
                      className={`fa-solid fa-scroll mr-1 ${view.decree.isActive === 0 ? "text-red-500" : ""}`}
                    />
                    {view.decree.isActive === 0 ? "Недіючий " : ""}
                    {view.decree.code}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
        {view.categories.length > 0 && (
          <div className="mb-4 w-full">
            <SectionTitle>Категорії</SectionTitle>
            <div className="flex w-full flex-col gap-1">
              {view.categories.map((category) => (
                <div
                  key={category.key}
                  className="grid w-full gap-2"
                  style={{ gridTemplateColumns: "30px 1fr" }}
                >
                  <Box className="flex items-center justify-center px-2 py-1">
                    <i className={`fa-solid fa-tag ${category.color}`} />
                  </Box>
                  <Box className="px-2 py-1">{category.caption}</Box>
                </div>
              ))}
            </div>
          </div>
        )}
        {view.documents.length > 0 && (
          <div className="mb-4">
            <SectionTitle>Документи</SectionTitle>
            <div className="flex flex-col gap-1">
              {view.documents.map((doc) => (
                <div
                  key={doc.id}
                  className="grid w-full items-center gap-1"
                  style={{ gridTemplateColumns: "30px auto 1fr" }}
                >
                  <Box
                    className="flex items-center justify-center px-2 py-1"
                    title={doc.typeCaption}
                  >
                    <i className={`${doc.icon} text-lg text-purple-500`} />
                  </Box>
                  <Box className="px-2 py-1 leading-tight">{doc.info}</Box>
                  <Box
                    className="truncate px-2 py-1 text-right whitespace-nowrap"
                    title={`unitId: ${doc.unitId ?? "-"}`}
                  >
                    {doc.unit}
                  </Box>
                </div>
              ))}
            </div>
          </div>
        )}
        <div className="mb-4">
          <CardText field="notes" title="Примітки" multiline alwaysVisible />
        </div>
        <div className="my-4 border-t border-gray-200 dark:border-neutral-700" />
        <Attachments attachments={view.attachments} />
        <Tickets tickets={view.tickets} />
      </div>
    </div>
  )
}

export default observer(CardGeneralTab)
