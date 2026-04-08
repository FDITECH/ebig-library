import React, { CSSProperties, ReactNode, useEffect, useMemo, useRef, useState } from "react";
import { Controller, FieldValues, UseFormReturn } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { Text } from "./text/text";
import { TextField } from "./text-field/text-field";
import { Ebigicon } from "./icon/ebig-icon";
import { TextArea } from "./text-area/text-area";
import { DateTimePicker } from "./date-time-picker/date-time-picker";
import { CustomCkEditor5 } from "./ck-editor/ckeditor";
import { Switch } from "./switch/switch";
import { Rating } from "./rating/rating";
import { Checkbox } from "./checkbox/checkbox";
import { RadioButton } from "./radio-button/radio-button";
import { ImportFile } from "./import-file/import-file";
import { CkEditorUploadAdapter } from "../controller/config";
import { Util } from "../controller/utils";
import { SuggestionProps, EbigEditor } from "./ebig-editor/ebig-editor";
import { IconPicker } from "./icon-picker/icon-picker";
import { Button } from "./button/button";
import { UploadFiles } from "./import-file/upload";
import { SelectDropdown } from "./dropdown/select-dropdown";

interface DateRangeProps {
    start?: Date,
    end?: Date,
    /** type: 1: daily, 2: weekly, 3: monthly */
    repeatData?: { type: 1 | 2 | 3, value: Array<string | number> }
}

interface SimpleFormProps {
    id?: string,
    label?: string,
    labelElement?: ReactNode,
    placeholder?: string,
    methods: UseFormReturn<FieldValues, any, undefined>,
    name: string,
    className?: string,
    style?: CSSProperties,
    disabled?: boolean,
    required?: boolean,
}

interface TextFieldFormProps extends SimpleFormProps {
    type?: React.HTMLInputTypeAttribute | "money",
    maxLength?: number,
    readOnly?: boolean,
    autoFocus?: boolean,
    suffix?: ReactNode,
    prefix?: ReactNode,
    onChange?: React.ChangeEventHandler<HTMLInputElement>,
    onBlur?: React.FocusEventHandler<HTMLInputElement>,
    onFocus?: React.FocusEventHandler<HTMLInputElement>,
    textFieldStyle?: CSSProperties,
    textFieldClassName?: string,
    onComplete?: React.KeyboardEventHandler<HTMLInputElement>,
}

export function TextFieldForm({ style = {}, textFieldStyle = {}, ...params }: TextFieldFormProps) {
    const { t } = useTranslation()
    const _covertErrors = useMemo(() => params.name ? convertErrors(params.methods.formState.errors, params.name) : undefined, [params.name, params.methods.formState.errors?.[params.name!]])

    return <div id={params.id} className={params.className ?? 'col'} style={{ gap: '0.8rem', overflow: 'visible', width: '100%', ...style }}>
        {params.labelElement ?? (params.label ? <div className="row" style={{ gap: '0.4rem', minWidth: "16rem" }}>
            <Text className={"label-3"}>{params.label}</Text>
            {params.required ? <Text className="label-4" style={{ color: '#E14337' }}>*</Text> : null}
        </div> : null)}
        <TextField
            className={params.textFieldClassName ?? "body-3"}
            autoFocus={params.autoFocus}
            style={{ width: '100%', flex: params.className?.includes('row') ? 1 : undefined, ...(params.type === 'money' ? { ...textFieldStyle, height: '4rem', padding: '0 0 0 1.6rem' } : textFieldStyle) }}
            placeholder={params.placeholder ? params.placeholder : params.label ? `${t("input")} ${params.label.toLowerCase()}` : ''}
            suffix={!params.suffix && params.type === 'money' ?
                <div className="row" style={{ padding: '0 1.6rem', height: '100%', background: 'var(--neutral-main-background-color,light-dark(#EFEFF0, #313135))', borderLeft: '1px solid var(--neutral-bolder-border-color,light-dark(#D7D7DB, #494950))', borderRadius: '0 0.8rem 0.8rem 0' }} >
                    <Text className="button-text-3" style={{ color: 'var(--neutral-text-subtitle-color,light-dark(#61616B, #A2A2AA))' }}>VND</Text>
                </div> : params.suffix}
            prefix={params.prefix}
            disabled={params.disabled}
            readOnly={params.readOnly}
            type={params.type === 'money' ? 'text' : params.type}
            register={params.methods.register(params.name, {
                required: params.required,
                onBlur: params.type === 'money' ? (ev) => {
                    let newPrice = ev.target.value.trim().replaceAll(',', '')
                    ev.target.type = "text"
                    if (!isNaN(parseFloat(newPrice))) {
                        ev.target.value = Util.formatCurrency(parseFloat(newPrice))
                    } else {
                        ev.target.value = ''
                    }
                } : params.onBlur,
                onChange: params.onChange,
            }) as any}
            onFocus={params.type === 'money' ? (ev: any) => {
                ev.target.value = ev.target.value.replaceAll(',', '')
                ev.target.type = "number"
            } : params.onFocus}
            maxLength={params.maxLength}
            onComplete={params.onComplete ?? ((ev: any) => { ev.target.blur() })}
            helperText={_covertErrors && (_covertErrors.message?.length ? _covertErrors.message : `${t("input")} ${(params.placeholder ? params.placeholder : params.label ? `${params.label}` : t('value')).toLowerCase()}`)}
        />
    </div>
}

interface InputPasswordFormProps extends SimpleFormProps {
    maxLength?: number,
    readOnly?: boolean,
    autoFocus?: boolean,
    prefix?: ReactNode,
    onChange?: React.ChangeEventHandler<HTMLInputElement>,
    onBlur?: React.FocusEventHandler<HTMLInputElement>,
    onFocus?: React.FocusEventHandler<HTMLInputElement>,
    textFieldStyle?: CSSProperties,
    textFieldClassName?: string,
    onComplete?: React.KeyboardEventHandler<HTMLInputElement>,
}

export const InputPasswordForm = (params: InputPasswordFormProps) => {
    const [isShowPass, setIsShowPass] = useState<boolean>(false)

    return <TextFieldForm
        {...params}
        type={isShowPass ? "text" : "password"}
        suffix={<Ebigicon src={`outline/user-interface/${isShowPass ? "view" : "hide"}`} size={"1.4rem"} onClick={() => { setIsShowPass(!isShowPass) }} />}
    />
}

interface TextAreaFormProps extends SimpleFormProps {
    type?: React.HTMLInputTypeAttribute | "money",
    maxLength?: number,
    readOnly?: boolean,
    autoFocus?: boolean,
    suffix?: ReactNode,
    prefix?: ReactNode,
    onChange?: React.ChangeEventHandler<HTMLTextAreaElement>,
    onBlur?: React.FocusEventHandler<HTMLTextAreaElement>,
    onFocus?: React.FocusEventHandler<HTMLTextAreaElement>,
    textAreaStyle?: CSSProperties,
    textAreaClassName?: string,
}

export function TextAreaForm({ style = {}, textAreaStyle = {}, ...params }: TextAreaFormProps) {
    const { t } = useTranslation()
    const _covertErrors = useMemo(() => params.name ? convertErrors(params.methods.formState.errors, params.name) : undefined, [params.name, params.methods.formState.errors?.[params.name!]])

    return <div id={params.id} className={params.className ?? 'col'} style={{ gap: '0.8rem', overflow: 'visible', width: '100%', ...style }}>
        {params.labelElement ?? (params.label ? <div className="row" style={{ gap: '0.4rem', minWidth: "16rem" }}>
            <Text className={"label-3"}>{params.label}</Text>
            {params.required ? <Text className="label-4" style={{ color: '#E14337' }}>*</Text> : null}
        </div> : null)}
        <TextArea
            ref={(txtAreaRef) => {
                if (txtAreaRef) {
                    const txtAreaElement = txtAreaRef.inputElement as any
                    txtAreaElement.style.height = `0px`
                    txtAreaElement.style.height = `${txtAreaElement.scrollHeight}px`
                }
            }}
            {...params}
            className={params.textAreaClassName ?? "body-3"}
            register={params.methods.register(params.name, {
                required: params.required,
                onBlur: params.onBlur,
                onChange: (ev) => {
                    ev.target.style.height = `0px`
                    ev.target.style.height = `${ev.target.scrollHeight}px`
                    params.onChange?.(ev)
                },
            }) as any}
            style={{ height: "fit-content", maxHeight: "24rem", width: '100%', flex: params.className?.includes('row') ? 1 : undefined, ...textAreaStyle }}
            placeholder={params.placeholder ? params.placeholder : params.label ? `${t("input")} ${params.label.toLowerCase()}` : ''}
            helperText={_covertErrors && (_covertErrors.message?.length ? _covertErrors.message : `${t("input")} ${(params.placeholder ? params.placeholder : params.label ? `${params.label}` : t('value')).toLowerCase()}`)}
        />
    </div>
}

interface DateTimePickerFormProps extends SimpleFormProps {
    type?: "date" | "datetime",
    pickOnly?: boolean,
    autoFocus?: boolean,
    suffix?: ReactNode,
    prefix?: ReactNode,
    onChange?: (ev?: Date | DateRangeProps) => void,
    onBlur?: React.FocusEventHandler<HTMLTextAreaElement>,
    onFocus?: React.FocusEventHandler<HTMLTextAreaElement>,
}

export function DateTimePickerForm(params: DateTimePickerFormProps) {
    const _covertErrors = useMemo(() => params.name ? convertErrors(params.methods.formState.errors, params.name) : undefined, [params.name, params.methods.formState.errors?.[params.name!]])
    const { t } = useTranslation()

    return <Controller
        name={params.name}
        control={params.methods.control}
        rules={{ required: params.required }}
        render={({ field }) => {
            return <div className={params.className ?? 'col'} style={{ gap: '0.8rem', overflow: 'visible', width: '100%', ...(params.style ?? {}) }}>
                {params.labelElement ?? (params.label ? <div className="row" style={{ gap: '0.4rem', minWidth: "16rem" }}>
                    <Text className={"label-3"}>{params.label}</Text>
                    {params.required ? <Text className="label-4" style={{ color: '#E14337' }}>*</Text> : null}
                </div> : null)}
                <DateTimePicker
                    style={{ width: '100%', flex: params.className?.includes('row') ? 1 : undefined }}
                    className="body-3"
                    prefix={params.prefix}
                    suffix={params.suffix}
                    placeholder={params.placeholder ? params.placeholder : params.label ? `${t("choose")} ${params.label.toLowerCase()}` : ''}
                    value={field.value}
                    disabled={params.disabled}
                    pickerType={params.type}
                    pickOnly={params.pickOnly}
                    onChange={(date) => {
                        field.onChange(date);
                        if (params.onChange) params.onChange(date);
                    }}
                    helperText={_covertErrors && (_covertErrors?.message?.length ? _covertErrors?.message : `${(params.placeholder ? params.placeholder : params.label ? `${t("choose")} ${params.label}` : t('value')).toLowerCase()}`)}
                />
            </div>
        }}
    />
}

interface CKEditorFormProps extends SimpleFormProps {
    ckEditorUploadPlugin?: Array<any>,
    customConfig?: { [p: string]: any },
    ckEditorStyle?: CSSProperties,
}

export function CKEditorForm({ ckEditorStyle = { width: "100%", height: 400, maxHeight: 600, borderRadius: 8 }, ...params }: CKEditorFormProps) {
    const _covertErrors = useMemo(() => params.name ? convertErrors(params.methods.formState.errors, params.name) : undefined, [params.name, params.methods.formState.errors?.[params.name!]])
    const { t } = useTranslation()

    return <Controller
        name={params.name}
        control={params.methods.control}
        rules={{ required: params.required }}
        render={({ field }) => {
            return <div className={params.className ?? 'col'} style={{ gap: '0.8rem', overflow: 'visible', width: '100%', ...(params.style ?? {}) }}>
                {params.labelElement ?? (params.label ? <div className="row" style={{ gap: '0.4rem', minWidth: "16rem" }}>
                    <Text className={"label-3"}>{params.label}</Text>
                    {params.required ? <Text className="label-4" style={{ color: '#E14337' }}>*</Text> : null}
                </div> : null)}
                <CustomCkEditor5
                    style={params.className?.includes("row") ? { flex: 1, overflow: "hidden visible", ...ckEditorStyle } : ckEditorStyle}
                    value={field.value ?? null}
                    disabled={params.disabled}
                    customConfig={params.customConfig as any}
                    extraPlugins={params.ckEditorUploadPlugin ?? [
                        function (editor: any) {
                            editor.plugins.get('FileRepository').createUploadAdapter = (loader: any) => new CkEditorUploadAdapter(loader)
                        }
                    ]}
                    onBlur={(_: any, editor: any) => { field.onChange(editor.getData()) }}
                    placeholder={params.placeholder ? params.placeholder : params.label ? `${t("input")} ${params.label.toLowerCase()}` : ''}
                    helperText={_covertErrors && (_covertErrors?.message?.length ? _covertErrors?.message : `${t("input")} ${(params.placeholder ? params.placeholder : params.label ? `${params.label}` : t('value')).toLowerCase()}`)} />
            </div>;
        }}
    />
}

interface DropdownSelectFormProps extends SimpleFormProps {
    options: Array<{ id: string | number, name: string, [p: string]: any }>;
    getOptions?: (params: { length: number, search?: string, parentId?: string | number }) => Promise<{ data: Array<{ id: string | number, name: string, [p: string]: any }>, totalCount: number }>;
    onChange?: (v?: any) => void;
    multiple?: boolean;
    dropdownStyle?: CSSProperties;
    prefix?: ReactNode;
    suffix?: ReactNode;
    previewMaxLength?: number;
    showClearValueButton?: boolean;
    customPreviewValue?: ReactNode;
}

export function SelectDropdownForm({ showClearValueButton, previewMaxLength, customPreviewValue, ...params }: DropdownSelectFormProps) {
    const _covertErrors = useMemo(() => params.name ? convertErrors(params.methods.formState.errors, params.name) : undefined, [params.name, params.methods.formState.errors?.[params.name!]])
    const { t } = useTranslation()

    const suffix = !params.multiple && !params.required && ![undefined, null, ''].includes(params.methods.watch(params.name)) && !params.disabled && !params.suffix
        ? <Ebigicon src="outline/user-interface/c-remove" size={14} onClick={() => params.methods.setValue(params.name, undefined)} />
        : params.suffix;

    const customParams: any = { showClearValueButton, previewMaxLength, customPreviewValue }

    return <Controller
        name={params.name}
        control={params.methods.control}
        rules={{ required: params.required }}
        render={({ field }) => {
            return <div className={params.className ?? 'col'} style={{ gap: '0.8rem', overflow: 'visible', width: '100%', ...params.style }}>
                {params.labelElement ?? (params.label ? <div className="row" style={{ gap: '0.4rem', minWidth: "16rem" }}>
                    <Text className={"label-3"}>{params.label}</Text>
                    {params.required ? <Text className="label-4" style={{ color: '#E14337' }}>*</Text> : null}
                </div> : null)}
                <SelectDropdown
                    className="body-3"
                    multiple={params.multiple}
                    value={field.value}
                    prefix={params.prefix}
                    suffix={suffix as any}
                    {...customParams}
                    style={{ padding: params.multiple ? undefined : "0 1.6rem", height: params.multiple ? undefined : '4rem', width: '100%', borderRadius: '0.8rem', flex: params.className?.includes('row') ? 1 : undefined, ...params.dropdownStyle }}
                    placeholder={params.placeholder ? params.placeholder : params.label ? `${t("choose")} ${params.label.toLowerCase()}` : ''}
                    options={params.options}
                    getOptions={params.getOptions}
                    disabled={params.disabled}
                    onChange={(ev: any) => {
                        const value = params.multiple ? ev : ev?.id;
                        field.onChange(value);
                        if (params.onChange) params.onChange(value);
                    }}
                    helperText={_covertErrors && (_covertErrors?.message?.length ? _covertErrors?.message : `${(params.placeholder ? params.placeholder : params.label ? `${t("choose")} ${params.label}` : t('value')).toLowerCase()}`)}
                />
            </div>;
        }}
    />
}

interface SwitchFormProps extends SimpleFormProps {
    onChange?: (v: boolean) => void,
    size?: string | number,
}

export function SwitchForm(params: SwitchFormProps) {
    return <Controller
        name={params.name}
        control={params.methods.control}
        render={({ field }) => <div className={params.className ?? 'row'} style={{ gap: '0.8rem', ...(params.style ?? {}) }}>
            <Switch name={params.name} value={field.value} disabled={params.disabled} size={params.size} onChange={(newValue) => {
                field.onChange(newValue)
                if (params.onChange) params.onChange(newValue)
            }} />
            {params.labelElement ?? <Text className={"label-3"} maxLine={1}>{params.label}</Text>}
        </div>}
    />
}

interface RateFormProps extends SimpleFormProps {
    onChange?: (v: number) => void,
    size?: string | number,
}

export function RateForm(params: RateFormProps) {
    return <Controller
        name={params.name}
        control={params.methods.control}
        render={({ field }) => <div className="row" style={{ gap: '0.8rem', ...(params.style ?? {}) }}>
            {params.labelElement ?? <Text className={"label-3"} maxLine={1}>{params.label}</Text>}
            <Rating value={field.value} size={params.size} onChange={(newValue: any) => {
                field.onChange(newValue)
                if (params.onChange) params.onChange(newValue)
            }} />
        </div>}
    />
}

interface CheckboxFormProps extends SimpleFormProps {
    onChange?: (v: boolean) => void,
    size?: string | number,
    radius?: string | number,
}

export function CheckboxForm(params: CheckboxFormProps) {
    return <label className="row" style={{ gap: '0.8rem', ...(params.style ?? {}) }}>
        <Checkbox value={params.methods.watch(params.name)} disabled={params.disabled} size={params.size}
            onChange={(newValue) => {
                params.methods.setValue(params.name, newValue)
                if (params.onChange) params.onChange(newValue)
            }} style={{ borderRadius: params.radius ?? '0.4rem' }} />
        {params.labelElement ?? <Text className={"label-4"} maxLine={1}>{params.label}</Text>}
    </label>
}

interface RadioButtonFormProps extends SimpleFormProps {
    onChange?: React.ChangeEventHandler<HTMLInputElement>,
    size?: string | number,
    value?: string
}

export function RadioButtonForm(params: RadioButtonFormProps) {
    return <label className={`row ${params.className ?? ""}`} style={{ gap: "0.8rem", ...(params.style ?? {}) }}>
        <Controller
            name={params.name}
            control={params.methods.control}
            render={({ field }) => <RadioButton
                value={params.value}
                disabled={params.disabled}
                size={params.size ?? '1.6rem'}
                name={params.name}
                checked={field.value === params.value}
                onChange={(ev) => {
                    field.onChange(ev.target.value)
                    if (params.onChange) params.onChange(ev)
                }}
            />}
        />
        {params.label ? <Text className="label-4" maxLine={1}>{params.label}</Text> : null}
    </label>
}

interface GroupRadioButtonFormProps extends SimpleFormProps {
    options: Array<{ id: string | number, name: string, [p: string]: any }>,
    onChange?: React.ChangeEventHandler<HTMLInputElement>,
}

export function GroupRadioButtonForm(params: GroupRadioButtonFormProps) {
    return <div className={params.className ?? "col"} style={{ gap: '0.8rem', width: '100%', ...(params.style ?? {}) }}>
        {params.labelElement ?? (params.label ? <div className="row" style={{ gap: '0.4rem', minWidth: "16rem" }}>
            <Text className={"label-3"}>{params.label}</Text>
            {params.required ? <Text className="label-4" style={{ color: '#E14337' }}>*</Text> : null}
        </div> : null)}
        <div className="row" style={{ gap: '1.6rem', flex: 1, flexWrap: 'wrap' }}>
            {params.options?.map(e => {
                return <RadioButtonForm
                    key={e.id}
                    label={e.name}
                    name={params.name}
                    value={`${e.id}`}
                    size={18}
                    onChange={params.onChange}
                    methods={params.methods}
                />
            })}
        </div>
    </div>
}

interface ImportFileFormProps extends SimpleFormProps {
    multiple?: boolean,
    maxSize?: number,
    allowType?: Array<string>,
    onChange?: (a?: Array<File> | Array<{ [p: string]: any }>) => void,
    title?: string,
    subTitle?: string,
    direction?: 'row' | 'column'
}

export function ImportFileForm(params: ImportFileFormProps) {
    const _covertErrors = useMemo(() => params.name ? convertErrors(params.methods.formState.errors, params.name) : undefined, [params.name, params.methods.formState.errors?.[params.name!]])
    const { t } = useTranslation()

    return <Controller
        name={params.name}
        control={params.methods.control}
        rules={{ required: params.required }}
        render={({ field }) => {
            return <div className={params.className ?? 'col'} style={{ gap: '0.8rem', overflow: 'visible', width: '100%', ...(params.style ?? {}) }}>
                {params.labelElement ?? (params.label ? <div className="row" style={{ gap: '0.4rem', minWidth: "16rem" }}>
                    <Text className={"label-3"}>{params.label}</Text>
                    {params.required ? <Text className="label-4" style={{ color: '#E14337' }}>*</Text> : null}
                </div> : null)}
                <ImportFile maxSize={params.maxSize} multiple={params.multiple} label={params.title} subTitle={params.subTitle} allowType={params.allowType} value={field.value} disabled={params.disabled}
                    style={{ width: '100%', borderStyle: 'dashed', maxWidth: '100%', flex: params.className?.includes("row") ? 1 : undefined }} className={`${params.className ?? ''} ${params.direction ?? 'row'}`}
                    onChange={(ev: any) => {
                        field.onChange(ev);
                        if (params.onChange) params.onChange(ev);
                    }}
                    helperText={_covertErrors && (_covertErrors?.message?.length ? _covertErrors?.message : `${(params.label ? `${t("upload")} ${params.label}` : t('file')).toLowerCase()}`)} />
            </div>;
        }}
    />
}

interface UploadMultipleFileTypeFormProps extends SimpleFormProps {
    multiple?: boolean,
    allowType?: Array<string>,
    onChange?: (a?: Array<File> | Array<{ [p: string]: any }>) => void,
    uploadElementStyle?: CSSProperties,
    uploadElementClassName?: string,
    suffix?: ReactNode,
    prefix?: ReactNode,
}

export function UploadMultipleFileTypeForm({ style = {}, uploadElementStyle = {}, ...params }: UploadMultipleFileTypeFormProps) {
    const _covertErrors = useMemo(() => params.name ? convertErrors(params.methods.formState.errors, params.name) : undefined, [params.name, params.methods.formState.errors?.[params.name!]])
    const { t } = useTranslation()

    return <Controller
        name={params.name}
        control={params.methods.control}
        rules={{ required: params.required }}
        render={({ field }) => {
            return <div className={params.className ?? 'col'} style={{ gap: '0.8rem', overflow: 'visible', width: '100%', ...style }}>
                {params.labelElement ?? (!!params.label?.length && <div className="row" style={{ gap: '0.4rem', minWidth: "16rem" }}>
                    <Text className={"label-3"}>{params.label}</Text>
                    {params.required ? <Text className="label-4" style={{ color: '#E14337' }}>*</Text> : null}
                </div>)}
                <UploadFiles
                    prefix={params.prefix}
                    suffix={params.suffix}
                    files={field.value}
                    multiple={params.multiple}
                    placeholder={params.placeholder ? params.placeholder : params.label ? `${t("select")} ${params.label.toLowerCase()}` : ''}
                    allowType={params.allowType}
                    disabled={params.disabled}
                    style={{ width: '100%', flex: params.className?.includes("row") ? 1 : undefined, ...uploadElementStyle }}
                    className={params.uploadElementClassName}
                    onChange={(ev: any) => {
                        field.onChange(ev);
                        if (params.onChange) params.onChange(ev);
                    }}
                    helperText={_covertErrors && (_covertErrors?.message?.length ? _covertErrors?.message : `${(params.label ? `${t("upload")} ${params.label}` : t('file')).toLowerCase()}`)} />
            </div>;
        }}
    />
}

interface RangeFormProps extends SimpleFormProps {
    endName: string,
    type?: 'number' | "money" | "daterange" | "datetimerange",
    placeholderStart?: string,
    placeholderEnd?: string,
}

/** type: number | date | date-time | money */
export function RangeForm(params: RangeFormProps) {
    const { t } = useTranslation()

    return <div className={`input-range-container ${params.className ?? 'col'}`} style={{ gap: '0.8rem', width: '100%', ...(params.style ?? {}) }} >
        {params.labelElement ?? (params.label ? <div className="row" style={{ gap: '0.4rem', minWidth: "16rem" }}>
            <Text className={"label-3"}>{params.label}</Text>
            {params.required ? <Text className="label-4" style={{ color: '#E14337' }}>*</Text> : null}
        </div> : null)}
        <div className="row" style={{ gap: '0.8rem', width: '100%', flex: params.className?.includes('row') ? 1 : undefined }}>
            {
                params.type === 'number' || params.type === 'money' ? <>
                    <TextField
                        style={{ width: '100%', flex: 1, ...(params.type === 'money' ? { height: '4rem', padding: '0 0 0 1.6rem' } : {}) }}
                        placeholder={params.placeholderStart ?? t('from')}
                        disabled={params.disabled}
                        type={params.type === 'number' ? 'number' : 'text'}
                        name={params.name}
                        suffix={params.type === 'money' ?
                            <div className="row" style={{ padding: '0 1.6rem', height: '100%', background: 'var(--neutral-main-background-color,light-dark(#EFEFF0, #313135))', borderLeft: '1px solid var(--neutral-bolder-border-color,light-dark(#D7D7DB, #494950))', borderRadius: '0 0.8rem 0.8rem 0' }} >
                                <Text className="button-text-3" style={{ color: 'var(--neutral-text-subtitle-color,light-dark(#61616B, #A2A2AA))' }}>VND</Text>
                            </div> : undefined}
                        onFocus={params.type === 'money' ? (ev) => {
                            ev.target.value = ev.target.value.replaceAll(',', '')
                            ev.target.type = "number"
                        } : undefined}
                        register={params.methods.register(params.name, {
                            onBlur: (ev) => {
                                const newValue = parseFloat(ev.target.value)
                                ev.target.type = "text"
                                if (!isNaN(newValue)) {
                                    if (params.methods.getValues(params.endName)?.length) {
                                        const endValue = parseFloat(params.methods.getValues(params.endName).replace(/,/g, ''))
                                        if (endValue < newValue) {
                                            params.methods.setError(params.name, { message: 'From value must be less than To value' })
                                        }
                                    }
                                    if (params.type === 'money') ev.target.value = Util.formatCurrency(newValue)
                                } else {
                                    ev.target.value = ""
                                }
                            },
                        }) as any}
                        helperText={(convertErrors(params.methods.formState.errors, params.name) || convertErrors(params.methods.formState.errors, params.endName)) && (convertErrors(params.methods.formState.errors, params.name)?.message?.length ? convertErrors(params.methods.formState.errors, params.name)?.message : `Please input ${params.label?.toLowerCase() ?? 'value'}`)}
                    />
                    <Ebigicon src={"fill/arrows/arrow-right"} size={"1.6rem"} />
                    <TextField
                        style={{ width: '100%', flex: 1, ...(params.type === 'money' ? { height: '4rem', padding: '0 0 0 1.6rem' } : {}) }}
                        placeholder={params.placeholderEnd ?? t('to')}
                        disabled={params.disabled}
                        type={params.type === 'number' ? 'number' : 'text'}
                        name={params.endName}
                        suffix={params.type === 'money' ?
                            <div className="row" style={{ padding: '0 1.6rem', height: '100%', background: 'var(--neutral-main-background-color,light-dark(#EFEFF0, #313135))', borderLeft: '1px solid var(--neutral-bolder-border-color,light-dark(#D7D7DB, #494950))', borderRadius: '0 0.8rem 0.8rem 0' }} >
                                <Text className="button-text-3" style={{ color: 'var(--neutral-text-subtitle-color,light-dark(#61616B, #A2A2AA))' }}>VND</Text>
                            </div> : undefined}
                        onFocus={params.type === 'money' ? (ev) => {
                            ev.target.value = ev.target.value.replace(/,/g, '')
                            ev.target.type = "number"
                        } : undefined}
                        register={params.methods.register(params.endName, {
                            onBlur: (ev) => {
                                const newValue = parseFloat(ev.target.value)
                                ev.target.type = "text"
                                if (!isNaN(newValue)) {
                                    if (params.methods.getValues(params.name)?.length) {
                                        const startValue = parseFloat(params.methods.getValues(params.name).replace(/,/g, ''))
                                        if (startValue > newValue) {
                                            params.methods.setError(params.name, { message: 'From value must be less than To value' })
                                        }
                                    }
                                    if (params.type === 'money') ev.target.value = Util.formatCurrency(newValue)
                                } else {
                                    ev.target.value = ""
                                }
                            },
                        }) as any}
                    />
                </> : <DateTimePicker
                    style={{ width: '100%', flex: params.className?.includes('row') ? 1 : undefined }}
                    className="body-3"
                    placeholder={params.placeholder ? params.placeholder : params.label ? `${t("choose")} ${params.label.toLowerCase()}` : ''}
                    value={params.methods.watch(params.name)}
                    endValue={params.methods.watch(params.endName)}
                    disabled={params.disabled}
                    pickerType={params.type}
                    onChange={(date: any) => {
                        params.methods.setValue(params.name, date?.start)
                        params.methods.setValue(params.endName, date?.end)
                    }}
                />
            }
        </div>
    </div>
}

interface GroupCheckboxFormFrops extends SimpleFormProps {
    dataType: 'string' | 'list',
    options: Array<{ id: string | number, name: string, [p: string]: any }>,
    onChange?: (v: Array<{ id: string | number, name: string, [p: string]: any }>) => void
}

/** dataType: string | list */
export function GroupCheckboxForm(params: GroupCheckboxFormFrops) {
    return <Controller
        name={params.name}
        control={params.methods.control}
        render={({ field }) => <div className={params.className ?? 'col'} style={{ gap: '0.8rem', width: '100%', alignItems: 'start', ...(params.style ?? {}) }}>
            {params.labelElement ?? (params.label ? <div className="row" style={{ gap: '0.4rem', minWidth: "16rem" }}>
                <Text className={"label-3"}>{params.label}</Text>
                {params.required ? <Text className="label-4" style={{ color: '#E14337' }}>*</Text> : null}
            </div> : null)}
            <div className="row" style={{ gap: '1.6rem', flex: 1, flexWrap: 'wrap' }}>
                {params.options.map(e => {
                    return <label key={e.id} className="row" style={{ gap: '0.8rem' }}>
                        <Checkbox
                            disabled={params.disabled}
                            size={'1.6rem'}
                            value={(params.dataType === 'string' ? (field.value?.split(',') ?? []) : field.value).includes(e.id)}
                            onChange={(vl) => {
                                let listValue = params.dataType === 'string' ? (field.value?.split(',') ?? []) : field.value
                                if (vl) listValue.push(e.id)
                                else listValue = listValue.filter((el: any) => el !== e.id)
                                listValue = params.dataType === 'string' ? listValue.join(',') : listValue
                                field.onChange(listValue)
                                if (params.onChange) params.onChange(listValue)
                            }}
                        />
                        <Text className="label-4" maxLine={1}>{e.name}</Text>
                    </label>
                })}
            </div>
        </div>}
    />
}

interface ColorPickerForm extends SimpleFormProps {
    onChange?: (v: string) => void,
    textFieldStyle?: CSSProperties
}

export const ColorPickerForm = (props: ColorPickerForm) => {
    const _covertErrors = useMemo(() => props.name ? convertErrors(props.methods.formState.errors, props.name) : undefined, [props.name, props.methods.formState.errors?.[props.name!]])
    const colorPickerRef = useRef<any>(null)
    const { t } = useTranslation()

    useEffect(() => {
        const propsValue = props.methods.watch(props.name)
        if (propsValue && colorPickerRef.current) {
            colorPickerRef.current.querySelector('input[type="color"]').value = propsValue.slice(0, 7)
            colorPickerRef.current.querySelector('input[type="text"]').value = propsValue.slice(0, 7)
            colorPickerRef.current.querySelector('input[type="number"]').value = Util.hexToPercent(propsValue.slice(7))
        } else if (colorPickerRef.current) {
            colorPickerRef.current.querySelector('input[type="color"]').value = '#000000'
            colorPickerRef.current.querySelector('input[type="text"]').value = ''
            colorPickerRef.current.querySelector('input[type="number"]').value = ''
        }
    }, [props.methods.watch(props.name)])

    return <Controller
        name={props.name}
        control={props.methods.control}
        render={({ field }) => {
            return <div ref={colorPickerRef} className={props.className ?? 'col'} style={{ gap: '0.8rem', overflow: 'visible', width: '100%', ...(props.style ?? {}) }}>
                {props.labelElement ?? (props.label ? <div className="row" style={{ gap: '0.4rem', minWidth: "16rem" }}>
                    <Text className={"label-3"}>{props.label}</Text>
                    {props.required ? <Text className="label-4" style={{ color: '#E14337' }}>*</Text> : null}
                </div> : null)}
                <TextField
                    className="body-3"
                    placeholder={props.placeholder ? props.placeholder : props.label ? `${t("input")} ${props.label.toLowerCase()}` : ''}
                    onComplete={(ev: any) => ev.target.blur()}
                    onFocus={(ev) => ev.target.select()}
                    disabled={props.disabled}
                    onBlur={(ev) => {
                        const newVl = ev.target.value.replace(/#/g, "").substring(0, 6);
                        const _opacityValue = colorPickerRef.current.querySelector('input[type="number"]');
                        const newValue = `#${newVl}${Util.percentToHex(parseInt(_opacityValue.value?.length ? _opacityValue.value : "100")).toLowerCase()}`
                        field.onChange(newValue);
                        if (props.onChange) props.onChange(newValue)
                    }}
                    style={{ flex: props.className?.includes('row') ? 1 : undefined, width: "100%", ...(props.textFieldStyle ?? {}) }}
                    maxLength={7}
                    prefix={<label style={{ backgroundColor: props.methods.watch(props.name), borderRadius: "0.6rem", width: "2.2rem", height: "2.2rem", border: "1px solid var(--neutral-lighter-border-color,light-dark(#F4F4F5, #242428))" }}>
                        <input
                            type='color'
                            disabled={props.disabled}
                            style={{ visibility: 'hidden' }}
                            onChange={(ev) => {
                                const _opacityValue = colorPickerRef.current.querySelector('input[type="number"]');
                                const newValue = `${ev.target.value}${Util.percentToHex(parseInt(_opacityValue.value?.length ? _opacityValue.value : "100")).toLowerCase()}`
                                field.onChange(newValue);
                                if (props.onChange) props.onChange(newValue)
                            }} />
                    </label>}
                    suffix={<>
                        <input
                            type='number'
                            placeholder="opacity"
                            style={{ borderLeft: "1px solid var(--neutral-bolder-border-color,light-dark(#D7D7DB, #494950))", width: "10%", flex: "none", paddingLeft: "0.8rem", minWidth: "3.6rem" }}
                            onKeyDown={(ev: any) => ev.key.toLowerCase() === 'enter' && ev.target.blur()}
                            onFocus={(ev) => ev.target.select()}
                            disabled={props.disabled}
                            onBlur={(ev) => {
                                let _vl = parseInt(ev.target.value);
                                if (isNaN(_vl) || _vl > 100) _vl = 100;
                                else if (_vl < 0) _vl = 0;
                                const _colorValue = colorPickerRef.current?.querySelector('input[type="color"]').value;
                                const newValue = `${_colorValue}${Util.percentToHex(_vl).toLowerCase()}`
                                field.onChange(newValue);
                                if (props.onChange) props.onChange(newValue)
                            }} />
                        <Text className='regular1'>%</Text>
                    </>}
                    helperText={_covertErrors && (_covertErrors?.message?.length ? _covertErrors?.message : `${t("input")} ${(props.placeholder ? props.placeholder : props.label ? `${props.label}` : t("value")).toLowerCase()}`)} />
            </div>;
        }}
    />
}

interface EbigEditorFormProps extends SimpleFormProps {
    onChange?: (v: string) => void;
    hideToolbar?: boolean;
    autoFocus?: boolean;
    editorClassName?: string;
    editorStyle?: CSSProperties;
    onSuggest?: Array<SuggestionProps>
}

export const EbigEditorForm = (params: EbigEditorFormProps) => {
    const { t } = useTranslation()
    const _covertErrors = useMemo(() => params.name ? convertErrors(params.methods.formState.errors, params.name) : undefined, [params.name, params.methods.formState.errors?.[params.name!]])

    return <Controller
        name={params.name}
        control={params.methods.control}
        rules={{ required: params.required }}
        render={({ field }) => {
            return <div className={params.className ?? 'col'} style={{ gap: '0.8rem', overflow: 'visible', width: '100%', ...(params.style ?? {}) }}>
                {params.labelElement ?? (params.label ? <div className="row" style={{ gap: '0.4rem', minWidth: "16rem" }}>
                    <Text className={"label-3"}>{params.label}</Text>
                    {params.required ? <Text className="label-4" style={{ color: '#E14337' }}>*</Text> : null}
                </div> : null)}
                <EbigEditor
                    initValue={field.value}
                    onBlur={(value) => {
                        field.onChange(value);
                        if (params.onChange) params.onChange(value)
                    }}
                    hideToolbar={params.hideToolbar}
                    autoFocus={params.autoFocus}
                    className={params.editorClassName}
                    style={{ width: '100%', flex: params.className?.includes('row') ? 1 : undefined, ...(params.editorStyle ?? {}) }}
                    disabled={params.disabled}
                    placeholder={params.placeholder ? params.placeholder : params.label ? `${t("input")} ${params.label.toLowerCase()}` : ''}
                    onSuggest={params.onSuggest}
                    helperText={_covertErrors && (_covertErrors.message?.length ? _covertErrors.message : `${t("input")} ${(params.placeholder ? params.placeholder : params.label ? `${params.label}` : t('value')).toLowerCase()}`)}
                />
            </div>;
        }}
    />
}

interface IconPickerFormProps extends SimpleFormProps {
    onChange?: (v?: string) => void;
}

export const IconPickerForm = ({ style, ...params }: IconPickerFormProps) => {
    const iconPickerRef = useRef<any>(null)
    const { t } = useTranslation()

    return <Controller
        name={params.name}
        control={params.methods.control}
        rules={{ required: params.required }}
        render={({ field }) => {
            return <div className={params.className ?? 'col'} style={{ gap: '0.8rem', overflow: 'visible', ...style }}>
                {params.labelElement ?? (params.label ? <div className="row" style={{ gap: '0.4rem', minWidth: "16rem" }}>
                    <Text className={"label-3"}>{params.label}</Text>
                    {params.required ? <Text className="label-4" style={{ color: '#E14337' }}>*</Text> : null}
                </div> : null)}
                <IconPicker
                    ref={iconPickerRef}
                    size={14}
                    style={{ display: "none" }}
                    onChange={(src) => {
                        field.onChange(src)
                        params.onChange?.(src)
                    }}
                />
                {field.value ? <Button
                    disabled={params.disabled}
                    prefix={<Ebigicon src={field.value} size={"1.6rem"} />}
                    label={t("remove") + " icon"}
                    className="button-text-3 button-grey"
                    onClick={() => {
                        field.onChange(null)
                        params.onChange?.()
                    }}
                /> : <Button
                    disabled={params.disabled}
                    label={t("add") + " icon"}
                    className="button-text-3 button-grey"
                    onClick={(ev) => {
                        const rect = ev.currentTarget.getBoundingClientRect()
                        if (iconPickerRef.current) iconPickerRef.current.openIconLibrary({ top: rect.bottom + 1 })
                    }}
                />}
            </div>
        }}
    />
}

const convertErrors = (errors: any, name: string) => {
    if (errors && Object.keys(errors).length) {
        const props = name.split(/[.\[\]]/).filter(e => e?.length > 0)
        var value = errors
        for (let p of props) {
            if (value)
                value = value[p]
        }
        return value
    }
    return undefined
}