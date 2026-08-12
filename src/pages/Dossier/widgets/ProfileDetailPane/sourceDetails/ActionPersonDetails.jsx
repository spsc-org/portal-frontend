import React from "react";
import {Field, LinkValue, ListField, splitAliases} from "./fieldPrimitives.jsx";

// Шаблон подання джерела ds_uk_nsdc_action_p (код 20, санкційна дія щодо фіз. особи) —
// максимально повний набір полів цієї конкретної таблиці, включно з "скасовано/змінено"
// (affected_*), яке зʼявляється лише коли указ згодом переглянули.
// sid — id субʼєкта в ДРС (те саме значення, що й profile.drs_id) — додано 2026-07-22:
// ключове поле для звірки при конфлікті, показує на який ДРС-субʼєкт "заякорений" саме
// цей запис дії (дублікати субʼєкта в ДРС мають різні sid при тому самому tax_id/reg_id).
const ActionPersonDetails = ({data}) => (
    <div className="flex flex-col gap-2">
        <Field label="sid (ДРС subject.id)" value={data.sid}/>
        <Field label="Імʼя" value={data.name}/>
        <Field label="Тип дії" value={data.action_type}/>
        <Field label="Указ" value={data.decree}/>
        <Field label="Дата указу" value={data.decree_date}/>
        <Field label="Додаток / позиція" value={[data.decree_appendix, data.position_in_appendix].filter(Boolean).join(" · ")}/>
        <Field label="Посилання на додаток" value={<LinkValue href={data.appendix_link}/>}/>
        <Field label="Транслітерація" value={data.translit_name}/>
        <Field label="Дата народження" value={data.birthdate}/>
        <Field label="Громадянство" value={data.citizenship}/>
        <Field label="Реєстраційний номер" value={data.reg_id}/>
        <Field label="Податковий номер" value={data.tax_id}/>
        <Field label="Термін дії санкцій" value={data.sanctions_term}/>
        <Field label="Дата закінчення санкцій" value={data.sanctions_end_date}/>
        {(data.affected_decree || data.affected_decree_date) && (
            <>
                <Field label="Скасовано/змінено указом" value={data.affected_decree}/>
                <Field label="Дата скасування/зміни" value={data.affected_decree_date}/>
                {data.affected_appendix_link && (
                    <Field label="Додаток (скасування)" value={<LinkValue href={data.affected_appendix_link} label={data.affected_appendix ?? "Відкрити"}/>}/>
                )}
            </>
        )}
        <Field label="Документи" value={data.identity_docs}/>
        <Field label="Додаткова інформація" value={data.additional_info}/>
        <ListField label="Псевдоніми" items={splitAliases(data.aliases)} renderItem={(item) => item}/>
    </div>
);

export default ActionPersonDetails;
