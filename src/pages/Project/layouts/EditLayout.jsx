import React, {Fragment, useEffect, useMemo, useState} from "react";
import {Button, Card, Typography} from "@material-tailwind/react";
import Input from "../../../Components/fields/Input.jsx";
import SingleSelect from "../../../Components/fields/SingleSelect.jsx";
import AdvancedSelect from "../../../Components/fields/AdvancedSelect.jsx";
import IdentifiersTable from "../components/IdentifiersTable.jsx";
import AdditionalTable from "../components/AdditionalTable.jsx";
import Constraints from "../Constraints.jsx";
import {getRestrictionObject} from "../utils.jsx";
import DocumentsTable from "../components/DocumentsTable.jsx";
import {useMutation} from "@tanstack/react-query";
import toast from "react-hot-toast";
import {usePage} from "@inertiajs/react";

const EditLayout = ({project, vocabulary}) => {
    const {id, auth, token} = usePage().props
    const [form, setForm] = useState({
        actionTypeId: null,
        subjectTypeId: null,
        countries: [],
        identifiers: [],
        attributes: [],
        documents: [],
        sourceInfo: "",
        reasoning: "",
    });

    const [constraints, setConstraints] = useState({});

    useEffect(() => {
        if (project && vocabulary) {
            setForm({
                actionTypeId: vocabulary?.action.find(action => action.id === project.actionTypeId),
                subjectTypeId: vocabulary?.subjectType.find(subject => subject.id === project.subjectTypeId),
                countries: vocabulary?.country.filter(item => project.country.includes(item.id))
                    .map(item => ({value: item.id, label: item.caption})),
                nameUk: project.nameUk,
                nameRu: project.nameRu,
                nameEn: project.nameEn,
                adrUk: project.adrUk,
                adrRu: project.adrRu,
                adrEn: project.adrEn,
                reasoning: project.reasoning,
                sourceInfo: project.sourceInfo,
                birthDate: project.birthDate,
                notes: project.notes,
                documents: project.documents,
                identifiers: project.identifiers,
                category1: project.category1
                    .map(item => ({value: item.id, label: item.caption})),
                category2: project.category2
                    .map(item => ({value: item.id, label: item.caption})),
                category3: project.category3
                    .map(item => ({value: item.id, label: item.caption})),
                termId: vocabulary?.term?.find(item => item.id === project.termId),
                issuer: vocabulary?.initiator?.find(item => item.id === project.issuerId),
                reason: vocabulary?.reason_array?.find(item => item.id === project.reasonId),
                attributes: project?.attributes.map((item)=> ({id: item?.attributeId, value: item?.attributeValue})),
                performerId: vocabulary?.user?.find(item => item.id === project.performerId),
                proposal: project.proposal
                    .map(item => ({value: item.id, label: item.caption})),
            });
            setConstraints(getRestrictionObject(project))
        }
    }, [project, vocabulary])

    const updateMutation = useMutation({
        mutationFn: async (body) => {
            const response = await axios.patch(`/api/project/new/${id}/update`, body, {
                headers: {
                    'Content-Type': 'application/json',
                    "X-CSRF-Token": token,
                    "userId": auth.user.id,
                }
            })
            return response?.data;
        },
        onSuccess: async () => toast.success('Успішно оновлено'),
        // onError: async () => toast.error('Помилка оновлення'),
        onError: async (error) => console.log(error),
        // onSettled: () => queryClient.invalidateQueries({queryKey: ['project', filters]}),
    })
    const [errors, setErrors] = useState(null);

    const handleChangeSelect = (key = '') => (selected) => {
        setForm(prevState => ({...prevState, [key]: selected}));
    }

    const handleInput = ({target: {name, value}}) => {
        setForm(prevState => ({...prevState, [name]: value}));
    }

    const countries = useMemo(() => {
        if (vocabulary?.country) {
            return vocabulary?.country
                .sort((a, b) => b?.order - a?.order)
                .map(c => ({id: c.id, caption: c.caption}));
        }
    }, [vocabulary]);


    const handleCheckboxChange = (checkbox = {}) => {
        setConstraints(prevConstraints => ({
            ...prevConstraints, ...checkbox
        }));
    }

    const handleConstraintInput = ({target: {name, value}}) => {
        setConstraints(prevState => ({...prevState, [name]: value}));
    }

    const handleChangeIdentifies = (newData) => {
        setForm({
            ...form,
            identifiers: newData
        })
    }

    const handleChangeAdditional = (newData) => {
        setForm({
            ...form,
            attributes: newData
        })
    }

    const handleChangeDocuments = (newData) => {
        setForm({
            ...form,
            documents: newData
        })
    }

    const selectedCountries = useMemo(() => {
        const selectedIds = form.countries.map(c => c.value);
        return form?.countries?.length ? countries.filter(sc => selectedIds.includes(sc.id)) : []
    }, [form, countries])

    const onSubmit = () => {
        const body = {
            ...form,
            ...constraints,
            actionTypeId: form.actionTypeId?.id,
            subjectTypeId: form.subjectTypeId?.id,
            termId: form.termId?.id,
            issuer: form.issuer?.id,
            reason: form.reason?.id,
            countries: form.countries.map(c => c.value),
            category1: form.category1.map(c => c.value),
            category2: form.category2.map(c => c.value),
            category3: form.category3.map(c => c.value),
            proposal: form.proposal.map(p => p.value),
            performerId: form.performerId?.id,
        }
        updateMutation.mutate(body)
    }


    return (<Fragment>
        <div className="flex justify-end mb-4">
            <Button size="sm" onClick={onSubmit} disabled>
                Редагувати
            </Button>
        </div>
        <div className="grid grid-cols-2 gap-x-24">
            <div className="space-y-4">
                <Card className="p-2 bg-neutral-200 dark:bg-gray-800 grid grid-cols-3 gap-1">
                    <SingleSelect closeMenuOnSelect options={vocabulary?.action}
                                  size="xs"
                                  label="Санкційна дія"
                                  id="actionTypeId"
                                  error={errors?.actionTypeId}
                                  value={form.actionTypeId}
                                  onChange={handleChangeSelect('actionTypeId')}/>
                    <SingleSelect closeMenuOnSelect options={vocabulary?.subjectType}
                                  size="xs"
                                  label="Тип суб'єкта"
                                  id="subjectTypeId"
                                  error={errors?.subjectTypeId}
                                  value={form.subjectTypeId}
                                  onChange={handleChangeSelect('subjectTypeId')}/>
                    <AdvancedSelect isMulti closeMenuOnSelect options={countries}
                                    size="xs"
                                    label="Задіяні країни"
                                    id="countries"
                                    error={errors?.countries}
                                    value={form.countries}
                                    onChange={handleChangeSelect('countries')}/>
                    <Input label="Реєстр:" error={errors?.drsId} value={form?.drsId}
                           name="drsId"
                           size="xs"
                           onChange={handleInput}
                    />
                </Card>
                {/*Edit  DRS DB row*/}
                {form?.actionTypeId?.id === 2 && <Fragment>
                    <Typography className="dark:text-slate-100" variant="h6">
                        Внесення змін
                    </Typography>
                    <Card className="p-2 bg-neutral-200 dark:bg-gray-800 grid grid-cols-4 gap-1">
                        <Input label="Ідентифікатор дії" error={errors?.fix_action_id} value={form?.fix_action_id}
                               name="fix_action_id"
                               onChange={handleInput}
                               size="xs"
                        />
                        <Input label="Номер указу" error={errors?.fix_decree} value={form?.fix_decree}
                               name="fix_decree"
                               onChange={handleInput}
                               size="xs"
                        />
                        <Input label="Номер додатку" error={errors?.fix_annex} value={form?.fix_annex}
                               name="fix_annex"
                               onChange={handleInput}
                               size="xs"
                        />
                        <Input label="Позиція в додатку" error={errors?.fix_index} value={form?.fix_index}
                               name="fix_index"
                               onChange={handleInput}
                               size="xs"
                        />

                    </Card>
                </Fragment>}
                {/*Add|Edit components*/}
                {form?.actionTypeId?.id !== 3 && <Fragment>
                    <Typography className="dark:text-slate-100" variant="h6">
                        {form?.subjectTypeId === 2 ? "Перелік імен" : "Перелік назв"}
                    </Typography>
                    <Card className="p-2  bg-neutral-200 dark:bg-gray-800">
                        <Input label="Українською мовою"
                               name="nameUk"
                               error={errors?.nameUk}
                               value={form?.nameUk}
                               size="xs"
                               onChange={handleInput}
                        />
                        <Input label="російською мовою"
                               name="nameRu"
                               size="xs"
                               error={errors?.nameRu}
                               value={form?.nameRu}
                               onChange={handleInput}
                        />
                        <Input label="Іноземною мовою"
                               name="nameEn"
                               size="xs"
                               error={errors?.nameEn}
                               value={form?.nameEn}
                               onChange={handleInput}
                        />
                    </Card>
                    {form?.subjectTypeId?.id === 2 ? <Fragment>
                        <Typography className="dark:text-slate-100" variant="h6">Місцезнаходження юр
                            особи</Typography>
                        <Card className="p-2  bg-neutral-200 dark:bg-gray-800">
                            <Input label="Адреса українською"
                                   name="adrUk"
                                   size="xs"
                                   error={errors?.adrUk}
                                   value={form?.adrUk}
                                   onChange={handleInput}
                            />
                            <Input label="Адреса російською"
                                   name="adrRu"
                                   size="xs"
                                   error={errors?.adrRu}
                                   value={form?.adrRu}
                                   onChange={handleInput}
                            />
                            <Input label="Адреса іноземною"
                                   name="adrEn"
                                   size="xs"
                                   error={errors?.adrEn}
                                   value={form?.adrEn}
                                   onChange={handleInput}
                            />
                        </Card>
                    </Fragment> : <Fragment>
                        <Card className="p-2 w-fit bg-neutral-200 dark:bg-gray-800">
                            <Input
                                size="xs"
                                label="Дата народження"
                                name="birthDate"
                                placeholder="ДД.ММ.РРРР"
                                error={errors?.birthDate}
                                value={form?.birthDate}
                                onChange={handleInput}
                            />
                        </Card>

                    </Fragment>}
                    <div className="space-y-4">
                        <div>
                            <Typography className="dark:text-slate-100" variant="h6">Ідентифікаційні
                                дані</Typography>
                            <Card className="p-0.5 bg-neutral-200 dark:bg-gray-800">
                                <IdentifiersTable data={form?.identifiers}
                                                  options={vocabulary?.identifierType}
                                                  onTableChange={handleChangeIdentifies}
                                                  subjectTypeId={form.subjectTypeId?.id}
                                                  countries={selectedCountries}/>
                            </Card>
                        </div>
                        <div>
                            <Typography className="dark:text-slate-100" variant="h6">Додаткова
                                інформація</Typography>
                            <Card className="p-0.5 bg-neutral-200 dark:bg-gray-800">
                                <AdditionalTable data={form?.attributes}
                                                 onTableChange={handleChangeAdditional}
                                                 subjectTypeId={form.subjectTypeId?.id}
                                                 options={vocabulary?.attributeType}
                                />
                            </Card>
                        </div>
                    </div>
                </Fragment>}
            </div>
            <div className="space-y-4">
                <Card className="p-2 bg-neutral-200 dark:bg-gray-800">
                    <Input label="Первинна інформація" tag="textarea" value={form?.sourceInfo} name="sourceInfo"
                           onChange={handleInput}/>
                </Card>
                <Card className="p-2 bg-neutral-200 dark:bg-gray-800">
                    <Input label="Обгрунтування" tag="textarea" value={form?.reasoning} name="reasoning"
                           onChange={handleInput}/>
                </Card>

                {form?.actionTypeId?.id !== 3 && <Fragment>
                    <Typography className="dark:text-slate-100" variant="h6">Обмеження</Typography>
                    <Card className="p-2 bg-neutral-200 dark:bg-gray-800 ">
                        <Constraints
                            presentCountries={form.countries}
                            vocabulary={vocabulary?.restriction}
                            subjectTypeId={project?.subjectTypeId}
                            selectedCheckboxes={constraints}
                            onCheckboxHandler={handleCheckboxChange}
                            onInputConstraintChange={handleConstraintInput}
                        />
                    </Card>
                </Fragment>}
            </div>
            <div className="space-y-4">
                <Typography className="dark:text-slate-100" variant="h6">Документи</Typography>
                <Card className="p-0.5 bg-neutral-200 dark:bg-gray-800">
                    <DocumentsTable data={form?.documents}
                                    subjectTypeId={form.subjectTypeId?.id}
                                    options={vocabulary?.documentType}
                                    onTableChange={handleChangeDocuments}
                                    initiators={vocabulary?.initiator}
                    />
                </Card>
                <div>
                    <Card className="p-2 bg-neutral-200 dark:bg-gray-800">
                        <Input label="Примітки та проблемні питання" tag="textarea" value={form?.notes}
                               name="notes"
                               onChange={handleInput}/>
                    </Card>
                </div>
                <Typography className="dark:text-slate-100" variant="h6">Додаткова інформація</Typography>
                <Card className="p-2 bg-neutral-200 dark:bg-gray-800">
                    <div className="grid grid-cols-3 gap-4">
                        {form?.actionTypeId?.id !== 3 && <div className="flex flex-col gap-1">
                            <SingleSelect closeMenuOnSelect options={vocabulary?.term}
                                          size="xs"
                                          label="Термін"
                                          id="term"
                                          error={errors?.term}
                                          value={form.termId}
                                          onChange={handleChangeSelect('term')}/>
                        </div>}
                        <SingleSelect closeMenuOnSelect options={vocabulary?.initiator}
                                      size="xs"
                                      label="Субєкт подання"
                                      id="term"
                                      error={errors?.issuer}
                                      value={form.issuer}
                                      onChange={handleChangeSelect('issuer')}/>
                        <SingleSelect closeMenuOnSelect options={vocabulary?.reason_array}
                                      size="xs"
                                      label="Підстави"
                                      id="term"
                                      error={errors?.reason}
                                      value={form.reason}
                                      onChange={handleChangeSelect('reason')}/>
                        <AdvancedSelect isMulti closeMenuOnSelect
                                        options={vocabulary?.category1}
                                        size="xs"
                                        label="Основна діяльність"
                                        id="category1"
                                        error={errors?.category1}
                                        value={form.category1}
                                        onChange={handleChangeSelect('category1')}/>

                        <AdvancedSelect isMulti closeMenuOnSelect
                                        options={vocabulary?.category2}
                                        size="xs"
                                        label="Протиправна діяльність"
                                        id="category2"
                                        error={errors?.category2}
                                        value={form.category2}
                                        onChange={handleChangeSelect('category2')}/>
                        <AdvancedSelect isMulti closeMenuOnSelect
                                        options={vocabulary?.category3}
                                        size="xs"
                                        label="Додаткові категорії"
                                        id="category3"
                                        error={errors?.category3}
                                        value={form.category3}
                                        onChange={handleChangeSelect('category3')}/>

                        <AdvancedSelect isMulti closeMenuOnSelect
                                        options={vocabulary?.proposal}
                                        size="xs"
                                        label="Пакет"
                                        id="category3"
                                        error={errors?.proposal}
                                        value={form.proposal}
                                        onChange={handleChangeSelect('proposal')}/>
                        <SingleSelect closeMenuOnSelect options={vocabulary?.user}
                                      size="xs"
                                      label="Виконавець"
                                      id="performer"
                                      error={errors?.performerId}
                                      value={form.performerId}
                                      onChange={handleChangeSelect('performerId')}/>
                    </div>
                </Card>
            </div>
        </div>
    </Fragment>);
};

export default EditLayout;
