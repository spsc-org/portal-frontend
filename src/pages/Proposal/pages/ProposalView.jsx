import {Link, usePage} from "@inertiajs/react";
import {useMutation, useQuery} from "@tanstack/react-query";
import React, {Fragment, useEffect, useMemo, useState} from "react";
import {
    Badge,
    Button,
    ButtonGroup,
    Card,
    Menu,
    MenuHandler,
    MenuItem,
    MenuList,
    Popover,
    PopoverContent,
    PopoverHandler,
    Spinner,
    Tab,
    TabPanel,
    Tabs,
    TabsBody,
    TabsHeader,
    Tooltip,
    Typography
} from "@material-tailwind/react";
import AppChip from "@/Components/AppChip";
import {closestCenter, DndContext, KeyboardSensor, PointerSensor, useSensor, useSensors,} from '@dnd-kit/core';
import {arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy} from '@dnd-kit/sortable';
import toast from "react-hot-toast";
import {compareDesc, format, parseISO} from "date-fns";
import {useDialog} from "../../../hooks/useDialog.js";
import UpdateProposalModal from "../UpdateProposalModal.jsx";
import ProjectDetails from "../../Project/ProjectDetails.jsx";
import ProjectModal from "../../Project/ProjectModal.jsx";
import {VList} from "virtua";
import Page from "../../../Components/Page.jsx";
import {DictionaryProvider} from "../../Dictionary/DictionaryContext.jsx";
import RevertStateModal from "../RevertStateModal.jsx";
import {getStateStyle, PROPOSAL_STATE_COLORS} from "../constants.js";
import ExportLinkedProjectsModal from "../components/ExportLinkedProjectsModal.jsx";
import GenerateDossiersModal from "../components/GenerateDossiersModal.jsx";
import AttachDecreeModal from "../components/AttachDecreeModal.jsx";
import SortableItem from "../components/SortableItem.jsx";
import ProjectItem from "../components/ProjectItem.jsx";
import CompleteModal from "../components/CompleteModal.jsx";

const ProposalView = () => {
  const {
    id,
    auth,
    token,
    // projects = null,
    projectState = [],
    proposalState = [],
    decrees = [],
    issuers = [],
    users = [],
    identifierTypes = [],
   attributeTypes = [],
  } = usePage().props;

  const {open, handleOpen, handleClose, dialogProps} = useDialog();


  const canShowMinify = () => {
    switch (auth.user.id) {
      case 5:
      case 29:
      case 30:
      case 31:
      case 35:
        return true;
      default:
        return false;
    }
  }

  const {
    open: openExport,
    handleOpen: handleOpenExport,
    handleClose: handleCloseExport,
    dialogProps: exportDialogProps
  } = useDialog();
  const {
    open: openGenerateDossiers,
    handleOpen: handleOpenGenerateDossiers,
    handleClose: handleCloseGenerateDossiers,
    dialogProps: generateDossiersDialogProps
  } = useDialog();
  const {
    open: openDecreeAttach,
    handleOpen: handleOpenAttachDecree,
    handleClose: handleCloseAttachDecree,
    dialogProps: attachDecreeProps
  } = useDialog();


  const {
    open: openViewProject,
    handleOpen: handleViewOpen,
    handleClose: handleViewClose,
    dialogProps: viewProps
  } = useDialog();
  const {
    open: openEditProject,
    handleOpen: handleProjectEditOpen,
    handleClose: handleProjectEditClose,
    dialogProps: editProps
  } = useDialog();
  const {
    open: editOpen,
    handleOpen: handleEditOpen,
    handleClose: handleEditClose,
    dialogProps: editDialogProps
  } = useDialog();
  const {
    open: revertStateOpen,
    handleOpen: handleRevertStateOpen,
    handleClose: handleRevertStateClose,
    dialogProps: revertStateDialogProps
  } = useDialog();

  const {data = {data: null}} = useQuery({
    queryKey: ['proposal-show', id],
    queryFn: async () => {
      const response = await axios.get(`/api/proposal/new/${id}`, {
        headers: {"userId": auth?.user?.id}
      });
      return response.data;
    }
  });

  const {data: projects, isFetching: isLinkedProjectsLoading} = useQuery({
    queryKey: ['proposal-show-lined-projects', id],
    queryFn: async () => {
      const response = await axios.get(`/api/proposal/new/${id}/linked-projects`, {
        headers: {"userId": auth?.user?.id}
      });
      return response.data?.data;
    }
  });

  const proposal = /** @type {any} */ (data?.data);
  const isFixed = data?.data?.stateId
    ? proposalState.find(ps => ps.id === data.data.stateId)?.isFixed
    : false;

  const [sortType, setSortType] = useState(null);
  const [windowHeight, setWindowHeight] = useState(window.innerHeight);

  useEffect(() => {
    const handleResize = () => {
      setWindowHeight(window.innerHeight);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);


  const updateOrder = useMutation({
    mutationFn: async (body) => {
      const response = await axios.post(`/api/proposal/new/${id}/updateOrder`,
        body,
        {
          headers: {
            'Content-Type': 'application/json',
            "X-CSRF-Token": token,
            "userId": auth.user.id,
          }
        }
      );
      return response.data;
    },
    onSuccess: async () => {
      toast.success("Порядок змінено успішно", {
        style: {
          background: 'dark:dark:bg-slate-800',
          color: 'text-slate-400',
        },
      });
      updateOrder.reset();
    },
    onError: async () => toast.error('Помилка зміна порядку'),
  })
  const headers = useMemo(() => {
    if (projects?.data || projects?.labels) {
      return Object.entries(projects?.labels)
        .flatMap(([outerKey, innerObj]) => Object.entries(innerObj)
          .filter(([_, value]) => value[0] > 0 || value[1] > 0)
          .map(([innerKey, value]) => ({
            content: value[2],
            label: `${outerKey}.${innerKey}`,
            value: `${outerKey}-${innerKey}`,
            count: `${value[0] || 0}/${value[1] || 0}`,
            subjectTypeId: outerKey,
            actionTypeId: innerKey,
          })));
    } else {
      return [];
    }
  }, [projects]);
  const [activeTab, setActiveTab] = useState(headers.length > 0 ? headers[0]?.value : null);

  useEffect(() => {
    if (headers.length > 0 && !activeTab) {
      setActiveTab(headers[0]?.value);
    }
  }, [headers, activeTab]);
  const [items, setItems] = useState({});
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 10,
      }
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const currentItems = useMemo(() => {
    if (!activeTab) return [];
    const [outerKey, innerKey] = activeTab.split('-');
    return items[activeTab] || projects?.data?.[outerKey]?.[innerKey]?.filter(project => project.stateId === 2 || project.stateId === 7) || [];
  }, [projects?.data, activeTab, items]);

  const allItems = useMemo(() => {
    if (!projects?.data) return [];
    return Object.values(projects.data)
      .flatMap(group =>
        Object.values(group)
          .flatMap(arr => arr)
      )
      .filter(item => item.stateId === 2 || item.stateId === 7);
  }, [projects?.data])


  const nonReadyItems = useMemo(() => {
    if (!activeTab) return [];
    const [outerKey, innerKey] = activeTab.split('-');

    return projects?.data?.[outerKey]?.[innerKey]?.filter(project => project.stateId !== 2 && project.stateId !== 7) || []
  }, [projects?.data, activeTab]);


  const countStates = useMemo(() => {
    return projectState.reduce((acc, curr) => {
      const count = currentItems.filter(item => item?.stateId === curr.id).length;
      return [...acc, {id: curr.id, caption: curr.caption, count}];
    }, []);
  }, [currentItems]);

  const countReady = useMemo(() => {
    if (countStates.length === 0) return 0;
    return countStates.filter(s => s.id === 2 || s.id === 7)
      .reduce((acc, curr) => {
        return acc + curr.count;
      }, 0)
  }, [countStates])

  const countNonReady = useMemo(() => {
    if (countStates.length === 0) return 0;
    return nonReadyItems.length
  }, [nonReadyItems])

  const handleDragEnd = (event) => {
    const {active, over} = event;
    if (active.id !== over.id) {
      const oldIndex = currentItems.findIndex(item => item.id === active.id);
      const newIndex = currentItems.findIndex(item => item.id === over.id);

      const newItems = arrayMove(currentItems, oldIndex, newIndex);
      setItems({
        ...items,
        [activeTab]: newItems
      });
    }
  };

  const handleSort = (type = null) => () => {
    let result;
    switch (type) {
      case "alphabetical":
        result = currentItems.sort((a, b) => a.nameUk.localeCompare(b.nameUk));
        break
      case "countries":
        result = currentItems.sort((a, b) => {
          const countryA = JSON.parse(a?.precomputedData)?.countries?.[0]?.name || "";
          const countryB = JSON.parse(b?.precomputedData)?.countries?.[0]?.name || "";
          return countryB.localeCompare(countryA);
        });
        break;
      case "newFirst":
        result = currentItems.sort((a, b) => compareDesc(parseISO(a.createdAt), parseISO(b.createdAt)));
        break
      default:
        result = currentItems.sort((a, b) => a.order - b.order);
    }
    setSortType(type)
    return setItems({
      ...items,
      [activeTab]: result
    });
  }


  const onSubmit = () => {
    if (updateOrder.isPending) {
      return;
    }
    const request = Object.entries(items[activeTab] || currentItems)
      .filter(([_, project]) => project.stateId === 2 || project.stateId === 7)
      .map(([order, project]) => ([project.id, Number(order) + 1]));
    updateOrder.mutateAsync(request)
      .then(response => {
        setItems({
          ...items,
          [activeTab]: response?.data
        });
      })
      .catch(() => {
        setItems({
          ...items,
          [activeTab]: currentItems
        });
      })
  }

  const handleExport = (value) => (e) => {
    const [actionId, typeId] = value.split('-');
    handleOpenExport({actionId, typeId, id})
  }

  const handleGenerateDossiers = (value) => (e) => {
    const [actionId, typeId] = value.split('-');
    handleOpenGenerateDossiers({actionId, typeId, id})
  }

  const handleComplete = () => {
    handleOpen({
      outgoingDate: proposal?.outgoingDate,
      outgoingNumber: proposal?.outgoingNumber,
      projectIds: allItems
    })
  }

  const handleEdit = () => {
    handleEditOpen({
      selectedId: proposal.id,
    })
  }

  const scrollToSection = (id) => {
    const section = document.getElementById(id);
    if (section) {
      section.scrollIntoView({behavior: 'smooth'});
    }
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
    <DictionaryProvider>
      <Page>
        <div data-i-doc="page:proposal-view"
          className="flex items-center gap-3 py-[12px] px-[20px] bg-white dark:bg-[rgb(22,27,39)] border-b border border-gray-200 dark:border-[rgba(255,255,255,0.07)]">
          <div className="inline-flex flex-1 gap-x-1">
            {isFixed && (
              <Tooltip content="Зафіксований">
                            <span style={{color: "#4f8ef7", display: "flex", alignItems: "center"}}>
                              <i className="text-sm fa-solid fa-lock"></i>
                            </span>
              </Tooltip>
            )}
            <span className="text-gray-900 dark:!text-[#e8eaf0]" style={{fontWeight: 700, fontSize: 16}}>
                        {proposal?.caption || "Звантаження..."}
                    </span>
            {proposalBadgeStyle && proposalStateCaption && (
              <AppChip
                value={proposalStateCaption}
                color={proposalChipColor}
                variant="filled"
                size="sm"
                className="rounded-full text-[10.5px] font-semibold tracking-[0.3px] py-1 px-[9px]"
              />
            )}
              {canShowMinify() && (
                  <Link href={`/proposal/${id}/minify`}>
                      <Button color="blue" variant="text" size="sm">
                          <i className="fa-solid fa-clipboard-list"></i>
                          <span style={{textTransform: "none"}}>Спрощений вид</span>
                      </Button>
                  </Link>

              )}
          </div>

          {/*Action buttons — md+*/}
          <div className="hidden md:flex flex-wrap gap-x-1">
            {Boolean(auth?.user?.permissions?.pages?.proposal?.update) && !Boolean(proposal?.deletedAt) && !Boolean(isFixed) && (
              <Button color="blue" size="sm" onClick={handleComplete}>
                <i className="fa-solid fa-check"></i> <span style={{textTransform: "none"}}>Зафіксувати стан</span>
              </Button>
            )}
            {Boolean(auth?.user?.permissions?.pages?.proposal?.update) && !Boolean(proposal?.deletedAt) && (
              <Button color="yellow" variant="filled" size="sm" onClick={handleEdit}>
                <i className="fa-regular fa-pen-to-square"></i> <span
                style={{textTransform: "none"}}>Внести зміни</span>
              </Button>
            )}
            {Boolean(auth?.user?.permissions?.pages?.proposal?.update) && !Boolean(proposal?.deletedAt) && Boolean(isFixed) && (
              <Button color="blue" size="sm" onClick={handleAttachDecree}>
                <i className="fa-solid fa-file-signature"></i> <span style={{textTransform: "none"}}>Додати указ</span>
              </Button>
            )}

            {Boolean(auth?.user?.permissions?.pages?.proposal?.revertState) && (proposal?.stateId !== 1 && proposal?.stateId !== 2) && !Boolean(proposal?.deletedAt) && (
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
                      <Link href={`/proposal/${id}/minify`}>
                        <span className="flex items-center gap-2">
                          <i className="fa-solid fa-clipboard-list w-4"></i> Спрощений вид
                        </span>
                      </Link>
                  </MenuItem>
                )}
                {Boolean(auth?.user?.permissions?.pages?.proposal?.update) && !Boolean(proposal?.deletedAt) && !Boolean(isFixed) && (
                  <MenuItem onClick={handleComplete} className="flex items-center gap-2">
                    <i className="fa-solid fa-check w-4"></i> Зафіксувати стан
                  </MenuItem>
                )}
                {Boolean(auth?.user?.permissions?.pages?.proposal?.update) && !Boolean(proposal?.deletedAt) && Boolean(isFixed) && (
                  <MenuItem onClick={handleAttachDecree} className="flex items-center gap-2">
                    <i className="fa-solid fa-file-signature w-4"></i> Додати указ
                  </MenuItem>
                )}
                {Boolean(auth?.user?.permissions?.pages?.proposal?.update) && !Boolean(proposal?.deletedAt) && (
                  <MenuItem onClick={handleEdit} className="flex items-center gap-2">
                    <i className="fa-regular fa-pen-to-square w-4"></i> Редагувати інформацію
                  </MenuItem>
                )}
                {Boolean(auth?.user?.permissions?.pages?.proposal?.revertState) && (proposal?.stateId !== 1 && proposal?.stateId !== 2) && !Boolean(proposal?.deletedAt) && (
                  <MenuItem onClick={() => handleRevertStateOpen({selectedId: proposal?.id})}
                            className="flex items-center gap-2">
                    <i className="fa-solid fa-unlock w-4"></i> Зняти фіксацію
                  </MenuItem>
                )}
              </MenuList>
            </Menu>
          </div>

        </div>

        <div className="grid md:grid-cols-[2fr_0.4fr] sm:grid-cols-1 grid-rows-1 gap-0">
          <div className="flex-grow flex-shrink flex-auto order-0 self-auto ">
            {
              isLinkedProjectsLoading ?
                <div className="flex justify-center">
                  <Spinner size="xl"/>
                </div>
                :
                Boolean(activeTab) ?
                  <Tabs value={activeTab}>
                    <TabsHeader
                      className="pb-2 overflow-x-auto !flex-nowrap m-0 gap-3  px-2 rounded-none bg-white dark:bg-[rgb(22,27,39)] border border-gray-200 dark:border-[rgba(255,255,255,0.07)]"
                      indicatorProps={{
                        className: "bg-transparent border-b border-gray-700 dark:border-white text-left rounded-none shadow-none max-w-xs"
                      }}>
                      {headers.map(({count, value, content}) => (
                        <Tab onClick={() => setActiveTab(value)}
                             className="p-0 m-0.5 hover:bg-gray-200 dark:hover:bg-gray-600 transition max-w-xs shrink-0"
                             key={value}
                             value={value}>
                          <div className="text-gray-700 dark:text-slate-300 text-left ">
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
                              Boolean(isFixed) ?
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
                                    className="dark:text-slate-400"
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
                                             invisible={!Boolean(countNonReady)}>
                                        <PopoverHandler>
                                          <Button size="sm">
                                            Кількість: {countReady} <i
                                            className="fa-regular fa-chevron-down"></i>
                                          </Button>
                                        </PopoverHandler>
                                      </Badge>
                                      <PopoverContent className="z-[100] p-2">
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
                                        className="dark:text-slate-400"
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
              !Boolean(headers.length) && !isLinkedProjectsLoading &&
              <div className="text-center dark:text-neutral-200 space-x-1">
                <span>Список порожній.</span>
                {
                  !Boolean(proposal?.deletedAt) &&
                  <a href="/project" className="underline text-blue-600">Додати
                    проєкти</a>
                }
              </div>
            }

          </div>
          <div
            className="flex-shrink flex-auto self-auto px-1.5 bg-white dark:bg-[rgb(22,27,39)] border-l border border-gray-200 dark:border-[rgba(255,255,255,0.07)]">
            <Typography variant="h6" className="mt-4 dark:text-slate-200">
              Детальна інформація
            </Typography>
            <Card className="text-sm mt-2 p-2 dark:bg-gray-700">
              <div className="grid grid-cols-1 gap-y-2">
                <div className="inline-flex gap-x-2">
                  <p className="font-bold dark:text-gray-50">Реєстраційний номер:</p>
                  <p className="font-normal dark:text-slate-400">{proposal?.outgoingNumber}</p>

                </div>
                <div className="inline-flex gap-x-2">
                  <p className="font-bold dark:text-gray-50">Реєстраційна дата:</p>
                  <p
                    className="font-normal dark:text-slate-400">{proposal?.outgoingDate ? format(proposal?.outgoingDate, "dd.MM.yyyy") : "---"}</p>
                </div>
                <div className="inline-flex gap-x-2">
                  <p className="font-bold dark:text-gray-50">Суб'єкт подання:</p>
                  <p
                    className="font-normal dark:text-slate-400">{proposal?.issuerId ? issuers.find(i => i.id === proposal?.issuerId)?.caption : "---"}</p>
                </div>
                <div className="inline-flex gap-x-2">
                  <p className="font-bold dark:text-gray-50">Стан:</p>
                  <p
                    className="font-normal dark:text-slate-400">{proposal?.stateId ? proposalState.find(s => s.id === proposal?.stateId)?.caption : "---"}</p>
                </div>
                <div className="inline-flex gap-x-2">
                  <p className="font-bold dark:text-gray-50">К-сть юридичних:</p>
                  <p className="font-normal dark:text-slate-400">{proposal?.calcLegal}</p>
                </div>
                <div className="inline-flex gap-x-2">
                  <p className="font-bold dark:text-gray-50">К-сть фізичних:</p>
                  <p className="font-normal dark:text-slate-400">{proposal?.calcPerson}</p>
                </div>
                <div className="inline-flex gap-x-2">
                  <p className="font-bold dark:text-gray-50">Дата створення:</p>
                  <p
                    className="font-normal dark:text-slate-400">{proposal?.createdAt ? format(proposal?.createdAt, "dd.MM.yyyy") : "---"}</p>
                </div>
                <div className="inline-flex gap-x-2">
                  <p className="font-bold dark:text-gray-50">Створив:</p>
                  <p
                    className="font-normal dark:text-slate-400">{proposal?.createdUserId ? users.find(s => s.id === proposal?.createdUserId)?.name : "---"}</p>
                </div>
                <div className="inline-flex gap-x-2">
                  <p className="font-bold dark:text-gray-50">Дата оновлення:</p>
                  <p
                    className="font-normal dark:text-slate-400">{proposal?.updatedAt ? format(proposal?.updatedAt, "dd.MM.yyyy") : "---"}</p>
                </div>

                <div className="inline-flex gap-x-2">
                  <p className="font-bold dark:text-gray-50">Оновив:</p>
                  <p
                    className="font-normal dark:text-slate-400">{proposal?.updatedUserId ? users.find(s => s.id === proposal?.updatedUserId)?.name : "---"}</p>
                </div>
                <div className="inline-flex gap-x-2">
                  <p className="font-bold dark:text-gray-50">Дата видалення:</p>
                  <p
                    className="font-normal dark:text-slate-400">{proposal?.deletedAt ? format(proposal?.deletedAt, "dd.MM.yyyy") : "---"}</p>
                </div>
              </div>
            </Card>
            <Card className="text-sm mt-2 p-2 dark:bg-gray-700">
              <div className="flex flex-col gap-x-2">
                <p className="font-bold dark:text-gray-50">Summary:</p>
                <p className="font-normal dark:text-slate-400">{proposal?.calcSummary ?
                  <div dangerouslySetInnerHTML={{__html: proposal?.calcSummary}}></div> : null}</p>
              </div>
            </Card>
            <Card className="text-sm mt-2 p-2 dark:bg-gray-700">
              <div className="flex flex-col gap-x-2 max-h-44 overflow-auto">
                <p className="font-bold dark:text-gray-50">Опис:</p>
                <p className="font-normal dark:text-slate-400">{proposal?.description}</p>
              </div>
            </Card>
            <Card className="text-sm mt-2 p-2 dark:bg-gray-700">
              <div className="flex flex-col gap-x-2 max-h-44 overflow-auto">
                <p className="font-bold dark:text-gray-50">Коментар:</p>
                <p className="font-normal dark:text-slate-400">{proposal?.comments}</p>
              </div>
            </Card>
          </div>
        </div>
        {
          openEditProject && <ProjectModal
            open={openEditProject}
            {...editProps} onClose={handleProjectEditClose}
          />
        }
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
    </DictionaryProvider>
  );
};

// noinspection JSUnusedGlobalSymbols
export default ProposalView;
