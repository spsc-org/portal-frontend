import {Fragment} from 'react';
import {Card, Chip, Typography} from "@material-tailwind/react";
import {ATTRIBUTES_HEADERS, DOCUMENTS_HEADERS, getRestrictionObject, IDENTIFIERS_HEADERS} from "./utils.jsx";
import Constraints from "./Constraints.jsx";
import EmptyMessage from "./components/EmptyMessage.jsx";
import SubjectTable from "./components/SubjectTable.jsx";

/** vocabulary — /api/voc_project (завантажує ProjectDetailsViewModel). */
const DetailsLayout = ({project, vocabulary}) => {
    const selectedCheckboxes = getRestrictionObject(project)
    return (
        <Fragment>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-24">
                <div className="space-y-4">
                    <Typography className="dark:text-gray-100" variant="h6">Загальна інформація</Typography>
                    <Card className="p-2 bg-neutral-200 dark:bg-neutral-800 grid grid-cols-3 gap-1">
                        <div className="flex flex-col gap-1">
                            <Typography
                                variant="h6"
                                className="dark:text-gray-100"
                            >
                                Тип суб'єкта:
                            </Typography>
                            <Typography
                                variant="small"
                                className={`dark:text-gray-200 ${project?.subjectTypeId === 2 ? "dark:text-yellow-600" : "dark:text-blue-600"}`}
                            >
                                {project?.subjectTypeCaption}
                            </Typography>
                        </div>
                        <div className="flex flex-col gap-1">
                            <Typography
                                variant="h6"
                                className="dark:text-gray-100"
                            >
                                Задіяні країни:
                            </Typography>
                            <div
                                className="flex flex-wrap gap-0.5"
                            >
                                {
                                    project?.countries?.length ?
                                        project?.countries?.map((c, index) => {
                                            return (
                                                <Chip className="dark:bg-blue-800 w-fit p-1 text-xs" key={index}
                                                      value={c?.name_uk}/>
                                            );
                                        })
                                        : <EmptyMessage/>
                                }
                            </div>
                        </div>
                        <div className="flex flex-col gap-1">
                            <Typography
                                variant="h6"
                                className="dark:text-gray-100"
                                title="Ідентифікатор в реєстрі санкцій"
                            >
                                <i className="text-green-600 fa-solid fa-solar-system"></i> Реєстр:
                            </Typography>
                            <Typography
                                variant="small"
                                className="dark:text-gray-200"
                            >
                                {project?.drsId || <EmptyMessage size="xs"/>}
                            </Typography>
                        </div>
                        <div className="flex flex-col gap-1">
                            <Typography
                                variant="h6"
                                className="dark:text-gray-100"
                            >
                                {
                                    project?.subjectTypeId === 2 ? "Країни реєстрації" : "Громадянство"
                                }

                            </Typography>
                            <div
                                className="flex flex-wrap gap-0.5"
                            >
                                {
                                    project?.countries?.length ?
                                        project?.countries?.map((c, index) => {
                                            return (
                                                <Chip className="dark:bg-blue-800 w-fit p-1 tex-xs" key={index}
                                                      value={c?.name_uk}/>
                                            );
                                        })
                                        : <EmptyMessage/>
                                }
                            </div>
                        </div>
                        <div className="flex flex-col gap-1">
                            <Typography
                                variant="h6"
                                className="dark:text-gray-100"
                                title="Ідентифікатор в реєстрі санкцій"
                            >
                                Стан:
                            </Typography>
                            <Typography
                                variant="small"
                                className="dark:text-gray-200"
                            >
                                {project?.state?.caption}
                            </Typography>
                        </div>
                    </Card>
                    {
                        project?.actionTypeId == 2 &&
                        <Fragment>
                            <Typography className="dark:text-gray-100" variant="h6">
                                Внесення змін
                            </Typography>
                            <Card className="p-2 bg-neutral-200 dark:bg-neutral-800 grid grid-cols-3 gap-1">
                                <div className="flex flex-col gap-1">
                                    <Typography
                                        variant="h6"
                                        className="dark:text-gray-100"
                                    >
                                        Ідентифікатор дії:
                                    </Typography>
                                    <Typography
                                        variant="small"
                                        className="dark:text-gray-200"
                                    >
                                        {project?.fix_action_id || <EmptyMessage size="xs"/>}
                                    </Typography>
                                </div>
                                <div className="flex flex-col gap-1">
                                    <Typography
                                        variant="h6"
                                        className="dark:text-gray-100"
                                    >
                                        Номер указу:
                                    </Typography>
                                    <Typography
                                        variant="small"
                                        className="dark:text-gray-200"
                                    >
                                        {project?.fix_decree || <EmptyMessage size="xs"/>}
                                    </Typography>
                                </div>
                                <div className="flex flex-col gap-1">
                                    <Typography
                                        variant="h6"
                                        className="dark:text-gray-100"
                                    >
                                        Номер додатку:
                                    </Typography>
                                    <Typography
                                        variant="small"
                                        className="dark:text-gray-200"
                                    >
                                        {project?.fix_annex || <EmptyMessage size="xs"/>}
                                    </Typography>
                                </div>
                                <div className="flex flex-col gap-1">
                                    <Typography
                                        variant="h6"
                                        className="dark:text-gray-100"
                                    >
                                        Позиція в додатку:
                                    </Typography>
                                    <Typography
                                        variant="small"
                                        className="dark:text-gray-200"
                                    >
                                        {project?.fix_index || <EmptyMessage size="xs"/>}
                                    </Typography>
                                </div>
                            </Card>
                        </Fragment>
                    }
                    {
                        project?.actionTypeId !== 3 &&
                        <Fragment>
                            <Typography className="dark:text-gray-100" variant="h6">
                                {
                                    project?.subjectTypeId === 2 ? "Перелік імен" : "Перелік назв"
                                }
                            </Typography>
                            <div className="space-y-1">
                                <Card className="p-2  bg-neutral-200 dark:bg-neutral-800">
                                    <Typography variant="small"
                                                className=" dark:text-gray-100 text-xs">{project?.nameUk ||
                                        <EmptyMessage size="xs"/>}</Typography>
                                </Card>
                                <Card className="p-2 bg-neutral-200 dark:bg-neutral-800">
                                    <Typography variant="small"
                                                className="dark:text-gray-100 text-xs">{project?.nameRu ||
                                        <EmptyMessage size="xs"/>}</Typography>
                                </Card>
                                <Card className="p-2 bg-neutral-200 dark:bg-neutral-800">
                                    <Typography variant="small"
                                                className="dark:text-gray-100 text-xs">{project?.nameEn ||
                                        <EmptyMessage size="xs"/>}</Typography>
                                </Card>
                            </div>
                            {
                                project?.subjectTypeId === 2 ?
                                    <Fragment>
                                        <Typography className="dark:text-gray-100" variant="h6">Місцезнаходження юр
                                            особи</Typography>
                                        <div className="space-y-1">
                                            <Card className="p-2 bg-neutral-200 dark:bg-neutral-800">
                                                <Typography variant="small"
                                                            className="dark:text-gray-100 text-xs">{project?.adrUk ||
                                                    <EmptyMessage/>}</Typography>
                                            </Card>
                                            <Card className="p-2 bg-neutral-200 dark:bg-neutral-800">
                                                <Typography variant="small"
                                                            className="dark:text-gray-100 text-xs">{project?.adrRu ||
                                                    <EmptyMessage/>}</Typography>
                                            </Card>
                                            <Card className="p-2 bg-neutral-200 dark:bg-neutral-800">
                                                <Typography variant="small"
                                                            className="dark:text-gray-100">{project?.adrEn ||
                                                    <EmptyMessage/>}</Typography>
                                            </Card>
                                        </div>
                                    </Fragment>
                                    :
                                    <Fragment>
                                        <Typography className="dark:text-gray-100" variant="h6">Дата
                                            народження</Typography>
                                        <Card className="p-2 w-fit bg-neutral-200 dark:bg-neutral-800">
                                            <Typography variant="small"
                                                        className="dark:text-gray-100 text-xs">{project?.birthDate ||
                                                <EmptyMessage size="xs"/>}</Typography>
                                        </Card>

                                    </Fragment>
                            }

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Typography className="dark:text-gray-100" variant="h6">Ідентифікаційні
                                        дані</Typography>
                                    <Card className="p-0.5 bg-neutral-200 dark:bg-neutral-800">
                                        <SubjectTable columns={IDENTIFIERS_HEADERS} data={project?.identifiers}/>
                                    </Card>
                                </div>
                                <div>
                                    <Typography className="dark:text-gray-100" variant="h6">Додаткова
                                        інформація</Typography>
                                    <Card className="p-0.5 bg-neutral-200 dark:bg-neutral-800">
                                        <SubjectTable columns={ATTRIBUTES_HEADERS} data={project?.attributes}/>
                                    </Card>
                                </div>
                            </div>


                        </Fragment>
                    }
                </div>

                <div className="space-y-4">
                    <Typography className="dark:text-gray-100" variant="h6">Первинна інформація</Typography>
                    <Card className="p-2 bg-neutral-200 dark:bg-neutral-800">
                        {
                            project?.sourceInfo ?
                                <Typography variant="small" className="dark:text-gray-200 ">
                                    {project?.sourceInfo}
                                </Typography>
                                :
                                <EmptyMessage/>
                        }
                    </Card>
                    <Typography className="dark:text-gray-100" variant="h6">Обгрунтування</Typography>
                    <Card className="p-2 bg-neutral-200 dark:bg-neutral-800 ">
                        {
                            project?.reasoning ?
                                <Typography variant="small" className="dark:text-gray-200 ">
                                    {project?.reasoning}
                                </Typography>
                                :
                                <EmptyMessage/>
                        }
                    </Card>

                    {
                        project?.actionTypeId !== 3 &&
                        <Fragment>
                            <Typography className="dark:text-gray-100" variant="h6">Обмеження</Typography>
                            <Card className="p-2 bg-neutral-200 dark:bg-neutral-800 ">
                                <Constraints
                                    vocabulary={vocabulary?.restriction}
                                    subjectTypeId={project?.subjectTypeId}
                                    selectedCheckboxes={selectedCheckboxes}
                                    readOnly
                                />
                            </Card>
                        </Fragment>
                    }
                </div>
                <div>
                    <Typography className="dark:text-gray-100" variant="h6">Документи</Typography>
                    <Card className="p-0.5 bg-neutral-200 dark:bg-neutral-800">
                        <SubjectTable columns={DOCUMENTS_HEADERS} data={project?.documents}/>
                    </Card>
                    <div>
                        <Typography className="dark:text-gray-100" variant="h6">Примітки та проблемні
                            питання</Typography>
                        <Card className="p-2 bg-neutral-200 dark:bg-neutral-800">
                            {
                                project?.notes ?
                                    <Typography variant="small" className="dark:text-gray-200 ">
                                        {project?.notes}
                                    </Typography>
                                    :
                                    <EmptyMessage/>
                            }
                        </Card>
                    </div>
                </div>

            </div>

            <Typography className="dark:text-gray-100" variant="h6">Додаткова інформація</Typography>
            <Card className="p-2 bg-neutral-200 dark:bg-neutral-800">
                <div className="grid grid-cols-2 gap-2">
                    {
                        project?.actionTypeId !== 3 &&
                        <div className="flex flex-col gap-1">
                            <Typography
                                variant="h6"
                                className="dark:text-gray-100"
                            >
                                Термін:
                            </Typography>
                            <Typography
                                variant="small"
                                className="dark:text-gray-200"
                            >
                                {project?.term || <EmptyMessage/>}
                            </Typography>
                        </div>
                    }

                    <div className="flex flex-col gap-1">
                        <Typography
                            variant="h6"
                            className="dark:text-gray-100"
                            title="Ідентифікатор в реєстрі санкцій"
                        >
                            Субєкт подання:
                        </Typography>
                        <Typography
                            variant="small"
                            className="dark:text-gray-200"
                        >
                            {project?.initiator || <EmptyMessage/>}
                        </Typography>
                    </div>
                    <div className="flex flex-col gap-1">
                        <Typography
                            variant="h6"
                            className="dark:text-gray-100"
                            title="Ідентифікатор в реєстрі санкцій"
                        >
                            Підстави:
                        </Typography>
                        <Typography
                            variant="small"
                            className="dark:text-gray-200"
                        >
                            {project?.reasonCaption || <EmptyMessage/>}
                        </Typography>
                    </div>
                    <div className="flex flex-col gap-1">
                        <Typography
                            variant="h6"
                            className="dark:text-gray-100"
                            title="Ідентифікатор в реєстрі санкцій"
                        >
                            Основна діяльність:
                        </Typography>
                        <div
                            className="flex flex-wrap gap-0.5"
                        >
                            {
                                project?.category1?.length ?
                                    project?.category1?.map((c, index) => {
                                        return (
                                            <Chip className="dark:bg-blue-800 w-fit p-1 text-xs" key={index}
                                                  value={c?.caption}/>
                                        );
                                    })
                                    : <EmptyMessage/>
                            }
                        </div>
                    </div>
                    <div className="flex flex-col gap-1">
                        <Typography
                            variant="h6"
                            className="dark:text-gray-100"
                            title="Ідентифікатор в реєстрі санкцій"
                        >
                            Протиправна діяльність:
                        </Typography>
                        <div
                            className="flex flex-wrap gap-0.5"
                        >
                            {
                                project?.category2?.length ?
                                    project?.category2?.map((c, index) => {
                                        return (
                                            <Chip className="dark:bg-blue-800 w-fit p-1 text-xs" key={index}
                                                  value={c?.caption}/>
                                        );
                                    })
                                    : <EmptyMessage/>
                            }
                        </div>
                    </div>
                    <div className="flex flex-col gap-1">
                        <Typography
                            variant="h6"
                            className="dark:text-gray-100"
                            title="Ідентифікатор в реєстрі санкцій"
                        >
                            Додаткові категорії:
                        </Typography>
                        <div
                            className="flex flex-wrap gap-0.5"
                        >
                            {
                                project?.category3?.length ?
                                    project?.category3?.map((c, index) => {
                                        return (
                                            <Chip className="dark:bg-blue-800 w-fit p-1 text-xs" key={index}
                                                  value={c?.caption}/>
                                        );
                                    })
                                    : <EmptyMessage/>
                            }
                        </div>
                    </div>
                    <div className="flex flex-col gap-1">
                        <Typography
                            variant="h6"
                            className="dark:text-gray-100"
                            title="Ідентифікатор в реєстрі санкцій"
                        >
                            Пакет:
                        </Typography>
                        <div
                            className="flex flex-wrap gap-0.5"
                        >
                            {
                                project?.proposal?.length ?
                                    project?.proposal?.map((c, index) => {
                                        return (
                                            <Chip className="dark:bg-blue-800 w-fit p-1 text-xs" key={index}
                                                  value={c?.caption}/>
                                        );
                                    })
                                    : <EmptyMessage/>
                            }
                        </div>
                    </div>
                    <div className="flex flex-col gap-1">
                        <Typography
                            variant="h6"
                            className="dark:text-gray-100"
                            title="Ідентифікатор в реєстрі санкцій"
                        >
                            Виконавець:
                        </Typography>
                        <Typography
                            variant="small"
                            className="dark:text-gray-200"
                        >
                            {project?.performer || <EmptyMessage/>}
                        </Typography>
                    </div>
                </div>
            </Card>
        </Fragment>
    );
};

export default DetailsLayout;
