import { observer } from "mobx-react-lite";
import { useViewModel } from "../../../shared/mvvm/useViewModel.js";
import { ViewModelProvider } from "../../../shared/mvvm/ViewModelContext.jsx";
import { ProposalViewViewModel } from "../viewmodel/ProposalViewModels.js";
import {Link} from "react-router";
import {useEffect, useMemo, useState} from "react";
import {useParams} from "react-router";
import { Badge, ButtonGroup, Card, Menu, MenuHandler, MenuItem, MenuList, Popover, PopoverContent, PopoverHandler, Spinner, Tab, TabPanel, Tabs, TabsBody, TabsHeader, Tooltip, Typography } from "@material-tailwind/react"
import Button from "../../../components/Buttons/Button.jsx"
import AppChip from "../../../components/AppChip.jsx";
import {closestCenter, DndContext, KeyboardSensor, PointerSensor, useSensor, useSensors,} from '@dnd-kit/core';
import {arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy} from '@dnd-kit/sortable';
import {format} from "date-fns";
import UpdateProposalModal from "../UpdateProposalModal.jsx";
import ProjectDetails from "../../../widgets/project/ProjectDetails.jsx";
import {VList} from "virtua";
import Page from "../../../components/Page.jsx";
import RevertStateModal from "../RevertStateModal.jsx";
import {getStateStyle, PROPOSAL_STATE_COLORS} from "../constants.js";
import ExportLinkedProjectsModal from "../components/ExportLinkedProjectsModal.jsx";
import GenerateDossiersModal from "../components/GenerateDossiersModal.jsx";
import AttachDecreeModal from "../components/AttachDecreeModal.jsx";
import SortableItem from "../components/SortableItem.jsx";
import ProjectItem from "../components/ProjectItem.jsx";
import CompleteModal from "../components/CompleteModal.jsx";
import PageHeader from "../../../layouts/app/PageHeader.jsx";
import { HeaderButton } from "../../../layouts/app/HeaderButtons.jsx";

const ProposalViewContent = observer(({ vm }) => {
  const { id, auth, projectState = [], proposalState = [], decrees = [], issuers = [], users = [], identifierTypes = [], attributeTypes = [] } = vm.props;
  // Модалки: назва → props (VM); [open, handleOpen(props), handleClose, props].
  const dialog = (name) => [Boolean(vm.dialogs[name]), (props) => vm.openDialog(name, props), () => vm.closeDialog(name), vm.dialogs[name]];
  const [open, handleOpen, handleClose, dialogProps] = dialog("complete");
  const [openExport, handleOpenExport, handleCloseExport, exportDialogProps] = dialog("export");
  const [openGenerateDossiers, handleOpenGenerateDossiers, handleCloseGenerateDossiers, generateDossiersDialogProps] = dialog("generateDossiers");
  const [openDecreeAttach, handleOpenAttachDecree, handleCloseAttachDecree, attachDecreeProps] = dialog("attachDecree");
  const [openViewProject, handleViewOpen, handleViewClose, viewProps] = dialog("viewProject");
  const [editOpen, handleEditOpen, handleEditClose, editDialogProps] = dialog("edit");
  const [revertStateOpen, handleRevertStateOpen, handleRevertStateClose, revertStateDialogProps] = dialog("revertState");

  // Мінімізований вигляд — лише для визначених користувачів (як в Inertia-версії).
  const canShowMinify = () => [5, 29, 30, 31, 35].includes(auth?.user?.id);

  const proposal = vm.proposal;
  const isLinkedProjectsLoading = vm.isLinkedProjectsLoading;
  const isFixed = vm.isFixed;
  const { sortType, headers, activeTab, currentItems, allItems, nonReadyItems, countStates, countReady, countNonReady } = vm;
  const setActiveTab = vm.setActiveTab;
  const updateOrder = vm.orderCmd;

  // Висота вікна — для віртуалізованого списку (DOM — у View).
  const [windowHeight, setWindowHeight] = useState(window.innerHeight);
  useEffect(() => {
    const handleResize = () => setWindowHeight(window.innerHeight);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const sensors = useSensors(
    useSensor(PointerSensor, {activationConstraint: {distance: 10}}),
    useSensor(KeyboardSensor, {coordinateGetter: sortableKeyboardCoordinates})
  );
  const handleDragEnd = (event) => {
    const {active, over} = event;
    if (active.id !== over.id) {
      const oldIndex = currentItems.findIndex(item => item.id === active.id);
      const newIndex = currentItems.findIndex(item => item.id === over.id);
      vm.setTabItems(arrayMove(currentItems, oldIndex, newIndex));
    }
  };
  const handleSort = (type = null) => () => vm.sort(type);
  const onSubmit = vm.saveOrder;
  const handleExport = (value) => () => {
    const [actionId, typeId] = value.split('-');
    handleOpenExport({actionId, typeId, id});
  };
  const handleGenerateDossiers = (value) => () => {
    const [actionId, typeId] = value.split('-');
    handleOpenGenerateDossiers({actionId, typeId, id});
  };
  const handleComplete = () => handleOpen({
    outgoingDate: proposal?.outgoingDate,
    outgoingNumber: proposal?.outgoingNumber,
    projectIds: allItems,
  });
  const handleEdit = () => handleEditOpen({selectedId: proposal.id});
  const scrollToSection = (sectionId) => {
    document.getElementById(sectionId)?.scrollIntoView({behavior: 'smooth'});
  };

  const proposalStateCaption = proposal?.stateId
    ? proposalState.find((s) => s.id === proposal.stateId)?.caption
    : null;

  const proposalBadgeStyle = useMemo(() => {
    if (!proposalStateCaption) return null;
    return getStateStyle(proposalStateCaption, PROPOSAL_STATE_COLORS);
  }, [proposalStateCaption]);

  const PROPOSAL_STATE_MT_COLOR = {
    "Проєкт": "blue",
    "Готово": "blue",
    "Проголосовано": "green",
    "Направлено": "green",
    "Реалізовано": "green",
    "Не актуально": "amber",
    "Повернуто": "amber",
  };

  const proposalChipColor = proposalStateCaption
    ? (PROPOSAL_STATE_MT_COLOR[proposalStateCaption] ?? "gray")
    : "gray";


  const handleViewProject = (projectId) => {
    handleViewOpen({
      id: projectId,
      tab: activeTab
    });
  }

  const handleAttachDecree = () => {
    handleOpenAttachDecree({
      data: allItems
    })
  }

  return (
      <Page>
        <PageHeader
          documentTitle={proposal?.caption ? `Подання: ${proposal.caption}` : "Подання"}
          title={
          <span className="inline-flex min-w-0 items-center gap-x-1.5">
            {isFixed && (
              <Tooltip content="Зафіксований">
                            <span style={{color: "#4f8ef7", display: "flex", alignItems: "center"}}>
                              <i className="text-sm fa-solid fa-lock"></i>
                            </span>
              </Tooltip>
            )}
            <span className="truncate">{proposal?.caption || "Завантаження..."}</span>
            {proposalBadgeStyle && proposalStateCaption && (
              <AppChip
                value={proposalStateCaption}
                color={proposalChipColor}
                variant="filled"
                size="sm"
                className="rounded-full text-[10.5px] font-semibold tracking-[0.3px] py-1 px-[9px]"
              />
            )}
          </span>
          }
          actions={
          <>
              {canShowMinify() && (
                  <HeaderButton tone="default" icon="fa-solid fa-clipboard-list" to={`/proposal/${id}/minify`}>
                      Спрощений вид
                  </HeaderButton>
              )}

          {/*Action buttons — md+*/}
          <div className="hidden md:flex flex-wrap gap-x-1">
            {Boolean(auth?.user?.permissions?.pages?.proposal?.update) && !proposal?.deletedAt && !isFixed && (
              <Button color="blue" size="sm" onClick={handleComplete}>
                <i className="fa-solid fa-check"></i> <span style={{textTransform: "none"}}>Зафіксувати стан</span>
              </Button>
            )}
            {Boolean(auth?.user?.permissions?.pages?.proposal?.update) && !proposal?.deletedAt && (
              <Button color="yellow" variant="filled" size="sm" onClick={handleEdit}>
                <i className="fa-regular fa-pen-to-square"></i> <span
                style={{textTransform: "none"}}>Внести зміни</span>
              </Button>
            )}
            {Boolean(auth?.user?.permissions?.pages?.proposal?.update) && !proposal?.deletedAt && Boolean(isFixed) && (
              <Button color="blue" size="sm" onClick={handleAttachDecree}>
                <i className="fa-solid fa-file-signature"></i> <span style={{textTransform: "none"}}>Додати указ</span>
              </Button>
            )}

            {Boolean(auth?.user?.permissions?.pages?.proposal?.revertState) && (proposal?.stateId !== 1 && proposal?.stateId !== 2) && !proposal?.deletedAt && (
              <Button color="blue" size="sm" onClick={() => handleRevertStateOpen({selectedId: proposal?.id})}>
                <i className="fa-solid fa-unlock"></i>
                <span style={{textTransform: "none"}}>Зняти фіксацію</span>
              </Button>
            )}
          </div>

          {/*Action buttons — sm/xs (Menu)*/}
          <div className="flex md:hidden">
            <Menu placement="bottom-end">
              <MenuHandler>
                <Button color="blue" size="xs">
                  Дії <i className="fa-regular fa-chevron-down ml-1"></i>
                </Button>
              </MenuHandler>
              <MenuList>
                {canShowMinify() && (
                  <MenuItem>
                      <Link to={`/proposal/${id}/minify`}>
                        <span className="flex items-center gap-2">
                          <i className="fa-solid fa-clipboard-list w-4"></i> Спрощений вид
                        </span>
                      </Link>
                  </MenuItem>
                )}
                {Boolean(auth?.user?.permissions?.pages?.proposal?.update) && !proposal?.deletedAt && !isFixed && (
                  <MenuItem onClick={handleComplete} className="flex items-center gap-2">
                    <i className="fa-solid fa-check w-4"></i> Зафіксувати стан
                  </MenuItem>
                )}
                {Boolean(auth?.user?.permissions?.pages?.proposal?.update) && !proposal?.deletedAt && Boolean(isFixed) && (
                  <MenuItem onClick={handleAttachDecree} className="flex items-center gap-2">
                    <i className="fa-solid fa-file-signature w-4"></i> Додати указ
                  </MenuItem>
                )}
                {Boolean(auth?.user?.permissions?.pages?.proposal?.update) && !proposal?.deletedAt && (
                  <MenuItem onClick={handleEdit} className="flex items-center gap-2">
                    <i className="fa-regular fa-pen-to-square w-4"></i> Редагувати інформацію
                  </MenuItem>
                )}
                {Boolean(auth?.user?.permissions?.pages?.proposal?.revertState) && (proposal?.stateId !== 1 && proposal?.stateId !== 2) && !proposal?.deletedAt && (
                  <MenuItem onClick={() => handleRevertStateOpen({selectedId: proposal?.id})}
                            className="flex items-center gap-2">
                    <i className="fa-solid fa-unlock w-4"></i> Зняти фіксацію
                  </MenuItem>
                )}
              </MenuList>
            </Menu>
          </div>
          </>
          }
        />
        <span data-i-doc="page:proposal-view" hidden />

        <div className="grid md:grid-cols-[2fr_0.4fr] sm:grid-cols-1 grid-rows-1 gap-0">
          <div className="flex-grow flex-shrink flex-auto order-0 self-auto ">
            {
              isLinkedProjectsLoading ?
                <div className="flex justify-center">
                  <Spinner size="xl"/>
                </div>
                :
                activeTab ?
                  <Tabs value={activeTab}>
                    <TabsHeader
                      className="pb-2 overflow-x-auto !flex-nowrap m-0 gap-3  px-2 rounded-none bg-white dark:bg-[rgb(22,27,39)] border border-gray-200 dark:border-[rgba(255,255,255,0.07)]"
                      indicatorProps={{
                        className: "bg-transparent border-b border-gray-700 dark:border-white text-left rounded-none shadow-none max-w-xs"
                      }}>
                      {headers.map(({count, value, content}) => (
                        <Tab onClick={() => setActiveTab(value)}
                             className="p-0 m-0.5 hover:bg-gray-200 dark:hover:bg-neutral-500 transition max-w-xs shrink-0"
                             key={value}
                             value={value}>
                          <div className="text-gray-700 dark:text-gray-300 text-left ">
                            <span dangerouslySetInnerHTML={{__html: content}}></span>
                            <span>{count}</span>
                          </div>
                        </Tab>
                      ))}
                    </TabsHeader>
                    <TabsBody>
                      <>{(headers).map((tab) => {
                        return (
                          <TabPanel className="p-0" key={tab.value} value={tab.value}>
                            {
                              isFixed ?
                                <div className="p-2">
                                  <div
                                    className="mb-1 flex-1 w-full flex justify-end gap-x-2">

                                      <Button color="blue"
                                                  size="sm"
                                                  className="dark:text-neutral-200"
                                                  onClick={handleExport(tab.value)}
                                                  disabled={!countReady}>
                                        <i className="fa-regular text-sm fa-download"></i>
                                          Експорт в Excel
                                      </Button>
                                      <Button color="blue"
                                                  size="sm"
                                                  className="dark:text-neutral-200"
                                                  onClick={handleGenerateDossiers(tab.value)}
                                                  disabled={!countReady}>
                                        <i className="fa-regular text-sm fa-file-lines"></i>
                                          Згенерувати досьє
                                      </Button>
                                  </div>
                                  <div className="space-y-2 overflow-y-auto">
                                    <VList
                                      style={{height: windowHeight - 300}}
                                      vertical>
                                      {currentItems.length ? currentItems.map((item) => (
                                          <ProjectItem key={item.id}
                                                       onShowClick={handleViewProject}
                                                       caption={proposal?.caption}
                                                       states={projectState}
                                                       decrees={decrees}
                                                       {...item}/>
                                        ))
                                        : <div
                                          className="text-center dark:text-neutral-200 space-x-1">
                                          <span>Список порожній.</span>
                                        </div>
                                      }
                                    </VList>

                                  </div>
                                  <Typography
                                    id="NonReady"
                                    className="dark:text-gray-400"
                                    variant="h5"> <i
                                    className="fa-regular fa-circle-exclamation text-red-600 mr-1"></i>
                                    Проєкти, які не потрапили в реліз (Стан "Готово"
                                    або "Є
                                    питання")
                                  </Typography>
                                  <div className="space-y-2">
                                    {
                                      nonReadyItems.length ? nonReadyItems.map((item) => (
                                          <ProjectItem
                                            onShowClick={handleViewProject}
                                            key={item.id}
                                            caption={proposal?.caption}
                                            decrees={decrees}
                                            states={projectState} {...item}/>
                                        ))
                                        : <div
                                          className="text-center dark:text-neutral-200 space-x-1">
                                          <span>Список порожній.</span>
                                        </div>
                                    }

                                  </div>
                                </div>

                                :
                                <>
                                  <div
                                    className="flex px-1 py-2 items-center gap-5 mb-2 border-b border-gray-200 dark:border-[rgba(255,255,255,0.07)]">
                                    <Popover placement="bottom-start">
                                      <Badge content={countNonReady}
                                             invisible={!countNonReady}>
                                        <PopoverHandler>
                                          <Button size="sm">
                                            Кількість: {countReady} <i
                                            className="fa-regular fa-chevron-down"></i>
                                          </Button>
                                        </PopoverHandler>
                                      </Badge>
                                      <PopoverContent className="p-2">
                                        <div
                                          className="flex flex-col divide-y gap-1">
                                          {
                                            countStates.map((state, index) => {
                                              return <div
                                                className="flex justify-between gap-2  text-sm"
                                                key={index}>
                                                <span className="font-medium">{state.caption}</span>
                                                <span>{state.count}</span>
                                              </div>
                                            })
                                          }
                                          {
                                            Boolean(countNonReady) &&
                                            <Button variant="text"
                                                    onClick={() => scrollToSection("NonReady")}
                                                    size="sm">Не увійдуть в
                                              реліз: {countNonReady} <i
                                                className="fa-regular fa-chevron-down"></i>
                                            </Button>
                                          }
                                        </div>
                                      </PopoverContent>
                                    </Popover>
                                    <ButtonGroup size="sm" variant="outlined"
                                                 color="blue">
                                      <Button size="sm"
                                              title="Сортувати по алфавіту"
                                              disabled={!currentItems.length}
                                              onClick={handleSort("alphabetical")}>
                                        <i className="fa-regular fa-arrow-down-a-z"></i>
                                      </Button>
                                      <Button size="sm"
                                              title="Сортувати по країнам"
                                              disabled={!currentItems.length}
                                              onClick={handleSort("countries")}>
                                        <i className="fa-regular fa-earth-americas"></i>
                                      </Button>
                                      <Button size="sm"
                                              title="Сортувати по даті додавання"
                                              onClick={handleSort("newFirst")}
                                              disabled={!currentItems.length}>
                                        <i className="fa-regular fa-arrow-down-wide-short"></i>
                                      </Button>
                                      <Button size="sm"
                                              disabled={sortType === null || !currentItems.length}
                                              className="border-red-500"
                                              title="Скинути сортування"
                                              onClick={handleSort(null)}>
                                        <i className="fa-regular text-red-500 fa-filter-circle-xmark"></i>
                                      </Button>
                                    </ButtonGroup>

                                    <Tooltip content="Зберегти порядок">
                                      <Button size="sm" onClick={onSubmit}
                                              disabled={updateOrder.isPending || !currentItems.length}>
                                        {
                                          updateOrder.isPending ?
                                            <i className="fa-regular fa-spinner animate-spin"></i>
                                            :
                                            <i className="fa-regular fa-floppy-disk"></i>
                                        }
                                      </Button>
                                    </Tooltip>

                                    <div
                                      className="flex-1 w-full flex justify-end gap-x-2">
                                        <Button
                                          size="sm"
                                          color="blue"
                                          className="dark:text-neutral-200"
                                          onClick={handleExport(tab.value)}
                                          disabled={!countReady}>
                                          <i className="fa-regular text-sm fa-download"></i> Експорт в Excel
                                        </Button>
                                        <Button
                                          size="sm"
                                          color="blue"
                                          className="dark:text-neutral-200"
                                          onClick={handleGenerateDossiers(tab.value)}
                                          disabled={!countReady}>
                                          <i className="fa-regular text-sm fa-file-lines"></i> Згенерувати досьє
                                        </Button>
                                    </div>
                                  </div>
                                  <div className="px-2">
                                    <DndContext
                                      sensors={sensors}
                                      collisionDetection={closestCenter}
                                      onDragEnd={handleDragEnd}

                                    >
                                      <SortableContext
                                        items={currentItems.map(item => item.id)}
                                        strategy={verticalListSortingStrategy}
                                      >
                                        <div className="space-y-2">
                                          <VList
                                            style={{height: windowHeight - 300}}
                                            vertical>
                                            {currentItems.filter(item => item.stateId === 7 || item.stateId === 2).map((item, index) => (
                                              <SortableItem
                                                caption={proposal?.caption}
                                                key={item.id || index + 1}
                                                onShowClick={handleViewProject}
                                                proposalStates={proposalState}
                                                projectStates={projectState}
                                                decrees={decrees}
                                                index={index + 1}
                                                id={item.id}
                                                item={item}/>
                                            ))}
                                          </VList>
                                        </div>
                                      </SortableContext>
                                    </DndContext>
                                  </div>
                                  <div className="mt-2">
                                    {
                                      Boolean(countNonReady) &&
                                      <Typography
                                        id="NonReady"
                                        className="dark:text-gray-400"
                                        variant="h5"> <i
                                        className="fa-regular fa-circle-exclamation text-red-600 mr-1"></i>
                                        Проєкти, які не увійдуть в реліз (Стан
                                        "Готово" або "Є
                                        питання")
                                      </Typography>
                                    }

                                    <div className="p-2 mt-2">
                                      {nonReadyItems.map((item, index) => (
                                        <SortableItem
                                          caption={proposal?.caption}
                                          disabledDrag
                                          key={item.id || index + 1}
                                          onShowClick={handleViewProject}
                                          proposalStates={proposalState}
                                          projectStates={projectState}
                                          decrees={decrees}
                                          index={index + 1}
                                          id={item.id} item={item}/>
                                      ))}
                                    </div>
                                  </div>
                                </>

                            }
                          </TabPanel>
                        );
                      })}</>
                    </TabsBody>
                  </Tabs>
                  :
                  null
            }

            {
              !headers.length && !isLinkedProjectsLoading &&
              <div className="text-center dark:text-neutral-200 space-x-1">
                <span>Список порожній.</span>
                {
                  !proposal?.deletedAt &&
                  <a href="/project" className="underline text-blue-600">Додати
                    проєкти</a>
                }
              </div>
            }

          </div>
          <div
            className="flex-shrink flex-auto self-auto px-1.5 bg-white dark:bg-[rgb(22,27,39)] border-l border border-gray-200 dark:border-[rgba(255,255,255,0.07)]">
            <Typography variant="h6" className="mt-4 dark:text-gray-200">
              Детальна інформація
            </Typography>
            <Card className="text-sm mt-2 p-2 dark:bg-neutral-600">
              <div className="grid grid-cols-1 gap-y-2">
                <div className="inline-flex gap-x-2">
                  <p className="font-bold dark:text-gray-50">Реєстраційний номер:</p>
                  <p className="font-normal dark:text-gray-400">{proposal?.outgoingNumber}</p>

                </div>
                <div className="inline-flex gap-x-2">
                  <p className="font-bold dark:text-gray-50">Реєстраційна дата:</p>
                  <p
                    className="font-normal dark:text-gray-400">{proposal?.outgoingDate ? format(proposal?.outgoingDate, "dd.MM.yyyy") : "---"}</p>
                </div>
                <div className="inline-flex gap-x-2">
                  <p className="font-bold dark:text-gray-50">Суб'єкт подання:</p>
                  <p
                    className="font-normal dark:text-gray-400">{proposal?.issuerId ? issuers.find(i => i.id === proposal?.issuerId)?.caption : "---"}</p>
                </div>
                <div className="inline-flex gap-x-2">
                  <p className="font-bold dark:text-gray-50">Стан:</p>
                  <p
                    className="font-normal dark:text-gray-400">{proposal?.stateId ? proposalState.find(s => s.id === proposal?.stateId)?.caption : "---"}</p>
                </div>
                <div className="inline-flex gap-x-2">
                  <p className="font-bold dark:text-gray-50">К-сть юридичних:</p>
                  <p className="font-normal dark:text-gray-400">{proposal?.calcLegal}</p>
                </div>
                <div className="inline-flex gap-x-2">
                  <p className="font-bold dark:text-gray-50">К-сть фізичних:</p>
                  <p className="font-normal dark:text-gray-400">{proposal?.calcPerson}</p>
                </div>
                <div className="inline-flex gap-x-2">
                  <p className="font-bold dark:text-gray-50">Дата створення:</p>
                  <p
                    className="font-normal dark:text-gray-400">{proposal?.createdAt ? format(proposal?.createdAt, "dd.MM.yyyy") : "---"}</p>
                </div>
                <div className="inline-flex gap-x-2">
                  <p className="font-bold dark:text-gray-50">Створив:</p>
                  <p
                    className="font-normal dark:text-gray-400">{proposal?.createdUserId ? users.find(s => s.id === proposal?.createdUserId)?.name : "---"}</p>
                </div>
                <div className="inline-flex gap-x-2">
                  <p className="font-bold dark:text-gray-50">Дата оновлення:</p>
                  <p
                    className="font-normal dark:text-gray-400">{proposal?.updatedAt ? format(proposal?.updatedAt, "dd.MM.yyyy") : "---"}</p>
                </div>

                <div className="inline-flex gap-x-2">
                  <p className="font-bold dark:text-gray-50">Оновив:</p>
                  <p
                    className="font-normal dark:text-gray-400">{proposal?.updatedUserId ? users.find(s => s.id === proposal?.updatedUserId)?.name : "---"}</p>
                </div>
                <div className="inline-flex gap-x-2">
                  <p className="font-bold dark:text-gray-50">Дата видалення:</p>
                  <p
                    className="font-normal dark:text-gray-400">{proposal?.deletedAt ? format(proposal?.deletedAt, "dd.MM.yyyy") : "---"}</p>
                </div>
              </div>
            </Card>
            <Card className="text-sm mt-2 p-2 dark:bg-neutral-600">
              <div className="flex flex-col gap-x-2">
                <p className="font-bold dark:text-gray-50">Summary:</p>
                <p className="font-normal dark:text-gray-400">{proposal?.calcSummary ?
                  <div dangerouslySetInnerHTML={{__html: proposal?.calcSummary}}></div> : null}</p>
              </div>
            </Card>
            <Card className="text-sm mt-2 p-2 dark:bg-neutral-600">
              <div className="flex flex-col gap-x-2 max-h-44 overflow-auto">
                <p className="font-bold dark:text-gray-50">Опис:</p>
                <p className="font-normal dark:text-gray-400">{proposal?.description}</p>
              </div>
            </Card>
            <Card className="text-sm mt-2 p-2 dark:bg-neutral-600">
              <div className="flex flex-col gap-x-2 max-h-44 overflow-auto">
                <p className="font-bold dark:text-gray-50">Коментар:</p>
                <p className="font-normal dark:text-gray-400">{proposal?.comments}</p>
              </div>
            </Card>
          </div>
        </div>
        {
          editOpen && <UpdateProposalModal open={editOpen} {...editDialogProps} onClose={handleEditClose}/>
        }
        {
          openViewProject && <ProjectDetails
            open={openViewProject}
            {...viewProps} onClose={handleViewClose}/>
        }
        {
          open && <CompleteModal
            open={open}
            {...dialogProps}
            onClose={handleClose}/>
        }
        {
          openExport && <ExportLinkedProjectsModal
            open={openExport}
            {...exportDialogProps}
            identifierTypes={identifierTypes}
            attributeTypes={attributeTypes}
            onClose={handleCloseExport}/>
        }
        {
          openGenerateDossiers && <GenerateDossiersModal
            open={openGenerateDossiers}
            {...generateDossiersDialogProps}
            onClose={handleCloseGenerateDossiers}/>
        }

        {
          openDecreeAttach && <AttachDecreeModal
            open={openDecreeAttach}
            {...attachDecreeProps}
            onClose={handleCloseAttachDecree}
          />
        }
        {
          revertStateOpen &&
          <RevertStateModal open={revertStateOpen} onClose={handleRevertStateClose} {...revertStateDialogProps}/>
        }
      </Page>
  );
});

/** Маршрут /proposal/:id (pageAccess). Props — /api/spa/pages/proposal-view/{id}/options. */
const ProposalView = () => {
  const { id } = useParams();
  const vm = useViewModel((deps) => new ProposalViewViewModel({ ...deps, id }));
  return (
    <ViewModelProvider value={vm}>
      <ProposalViewContent vm={vm}/>
    </ViewModelProvider>
  );
};

/** Новий VM на кожне подання (перехід /proposal/1 → /proposal/2). */
const ProposalViewRoute = () => {
  const { id } = useParams();
  return <ProposalView key={id}/>;
};

export default ProposalViewRoute;
