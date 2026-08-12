import React from "react";
import {Field, LinkValue, ListField, splitAliases} from "./fieldPrimitives.jsx";

// reg_id тут — "сирий" комбінований рядок на кшталт "(IMO): 123 (MMSI): 456" (те саме
// джерело, з якого NsdcSanctionFieldsProvider::identifiers() парсить imo/mmsi для
// sanction_profile_identifiers) — тож розбираємо тим самим патерном, щоб показати
// значення так само, як вони збережені в ідентифікаторах досьє.
const extractPattern = (raw, pattern) => (typeof raw === "string" ? raw.match(pattern)?.[1] ?? null : null);

// Шаблон подання джерела ds_uk_nsdc_action_vessel (код 22, санкційна дія щодо судна).
// sid — id субʼєкта в ДРС (те саме значення, що й profile.drs_id) — див. коментар
// у ActionPersonDetails.jsx.
const ActionVesselDetails = ({data}) => (
    <div className="flex flex-col gap-2">
        <Field label="sid (ДРС subject.id)" value={data.sid}/>
        <Field label="Назва" value={data.name}/>
        <Field label="Тип дії" value={data.action_type}/>
        <Field label="Указ" value={data.decree}/>
        <Field label="Дата указу" value={data.decree_date}/>
        <Field label="Додаток / позиція" value={[data.decree_appendix, data.position_in_appendix].filter(Boolean).join(" · ")}/>
        <Field label="Посилання на додаток" value={<LinkValue href={data.appendix_link}/>}/>
        <Field label="Транслітерація" value={data.translit_name}/>
        <Field label="Країна" value={data.country}/>
        <Field label="IMO" value={extractPattern(data.reg_id, /\(IMO\):\s*(\d+)/u)}/>
        <Field label="MMSI" value={extractPattern(data.reg_id, /\(MMSI\):\s*(\d+)/u)}/>
        <Field label="Реєстраційний номер (сирий)" value={data.reg_id}/>
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
        <Field label="Додаткова інформація" value={data.additional_info}/>
        <ListField label="Псевдоніми" items={splitAliases(data.aliases)} renderItem={(item) => item}/>
    </div>
);

export default ActionVesselDetails;
