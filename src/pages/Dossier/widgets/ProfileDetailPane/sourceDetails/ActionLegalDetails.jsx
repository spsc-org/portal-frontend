import {Field, LinkValue, ListField, splitAliases} from "./fieldPrimitives.jsx";

// Шаблон подання джерела ds_uk_nsdc_action_l (код 21, санкційна дія щодо юр. особи).
// sid — id субʼєкта в ДРС (те саме значення, що й profile.drs_id) — див. коментар
// у ActionPersonDetails.jsx.
const ActionLegalDetails = ({data}) => (
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
        <Field label="Додаткова інформація" value={data.additional_info}/>
        <ListField label="Псевдоніми" items={splitAliases(data.aliases)} renderItem={(item) => item}/>
    </div>
);

export default ActionLegalDetails;
