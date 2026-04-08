import styles from "./component-form.module.css";
import { CSSProperties, KeyboardEventHandler, ReactNode, useMemo, useState } from "react";
import { Controller, FieldValues, UseFormReturn } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { Checkbox, ColorPicker, DateTimePicker, ImportFile, NumberPicker, OptionsItem, RadioButton, Switch, TextArea, TextField, UploadFiles, Ebigicon, SelectDropdown } from "../../index"

interface FTextFieldProps {
    id?: string;
    placeholder?: string;
    className?: string;
    required?: boolean;
    disabled?: boolean;
    suffix?: ReactNode;
    prefix?: ReactNode;
    name?: string,
    methods: UseFormReturn<any, any, undefined>;
    onBlur?: React.FocusEventHandler<HTMLInputElement>;
    onChange?: React.ChangeEventHandler<HTMLInputElement>;
    onComplete?: KeyboardEventHandler<HTMLInputElement>
}


export function FTextField(props: FTextFieldProps) {
    const _covertErrors = useMemo(() => props.name ? convertErrors(props.methods.formState.errors, props.name) : undefined, [props.name, props.methods.formState.errors?.[props.name!]])
    const { t } = useTranslation()

    return <TextField
        {...props}
        register={props.name?.length ? (props.methods!.register(props.name, { required: props.required, onChange: props.onChange, onBlur: props.onBlur }) as any) : undefined}
        onComplete={props.onComplete ?? ((ev: any) => { ev.target.blur() })}
        helperText={_covertErrors && (_covertErrors?.message?.length ? _covertErrors?.message : `${t("input")} ${props.name} ${t("value")}`.toLowerCase())}
        simpleStyle
    />
}

export function FInputPassword(props: FTextFieldProps) {
    const _covertErrors = useMemo(() => props.name ? convertErrors(props.methods.formState.errors, props.name) : undefined, [props.name, props.methods.formState.errors?.[props.name!]])
    const { t } = useTranslation()
    const [isShowPass, setIsShowPass] = useState(false)

    return <TextField
        {...props}
        autoComplete="off"
        type={isShowPass ? "text" : "password"}
        suffix={<>
            <Ebigicon src={`outline/user interface/${isShowPass ? "view" : "hide"}`} size={"inherit"} onClick={() => setIsShowPass(!isShowPass)} />
            {props.suffix}
        </>}
        register={props.name?.length ? (props.methods!.register(props.name, { required: props.required }) as any) : undefined}
        helperText={_covertErrors && (_covertErrors?.message?.length ? _covertErrors?.message : `${t("input")} ${props.name} ${t("value")}`.toLowerCase())}
        simpleStyle
    />
}
interface FTextAreaProps {
    id?: string;
    autoHeight?: boolean;
    placeholder?: string;
    className?: string;
    required?: boolean;
    disabled?: boolean;
    suffix?: ReactNode;
    prefix?: ReactNode;
    name?: string,
    methods: UseFormReturn<FieldValues, any, undefined>;
    onBlur?: React.FocusEventHandler<HTMLTextAreaElement>;
    onChange?: React.ChangeEventHandler<HTMLTextAreaElement>;
}

export function FTextArea({ autoHeight, onChange, ...props }: FTextAreaProps) {
    const _covertErrors = useMemo(() => props.name ? convertErrors(props.methods.formState.errors, props.name) : undefined, [props.name, props.methods.formState.errors?.[props.name!]])
    const { t } = useTranslation()

    return <TextArea
        ref={autoHeight ? ((txtAreaRef) => {
            if (txtAreaRef) {
                const txtAreaElement = txtAreaRef.inputElement as HTMLTextAreaElement
                txtAreaElement.style.scrollbarWidth = `none`
                txtAreaElement.style.height = `0px`
                txtAreaElement.style.height = `${txtAreaElement.scrollHeight}px`
            }
        }) : undefined}
        {...props}
        onChange={props.name?.length ? undefined : ((ev) => {
            ev.target.style.height = `0px`
            ev.target.style.height = `${ev.target.scrollHeight}px`
            onChange?.(ev)
        })}
        register={props.name?.length ? (props.methods!.register(props.name, {
            required: props.required,
            onChange: (ev) => {
                ev.target.style.height = `0px`
                ev.target.style.height = `${ev.target.scrollHeight}px`
                onChange?.(ev)
            },
            onBlur: props.onBlur
        }) as any) : undefined}
        helperText={_covertErrors && (_covertErrors?.message?.length ? _covertErrors?.message : `${t("input")} ${props.name} ${t("value")}`).toLowerCase()}
        simpleStyle
    />
}

interface FRadioButtonProps {
    id?: string;
    label?: string;
    labelPosition?: "left" | "right";
    onChange?: React.ChangeEventHandler<HTMLInputElement>;
    value?: string | number | readonly string[];
    cheked?: boolean;
    disabled?: boolean;
    style?: CSSProperties;
    size?: number | string;
    name?: string;
    activeColor?: string;
    offColor?: string;
    className?: string;
    methods: UseFormReturn<FieldValues, any, undefined>;
}

export const FRadioButton = ({ labelPosition = "right", ...props }: FRadioButtonProps) => {
    return <label id={props.id} className={`row ${styles["f-radio-button"]} ${props.className ?? ""}`} style={props.style}>
        {!!props.label && labelPosition === "left" && <span>{props.label}</span>}
        {props.name ? <Controller
            name={props.name}
            control={props.methods.control}
            render={({ field }) => <RadioButton
                name={props.name}
                onChange={(ev) => {
                    field.onChange(props.value)
                    props.onChange?.(ev)
                }}
                size={props.size}
                disabled={props.disabled}
                value={props.value}
                activeColor={props.activeColor}
                offColor={props.offColor}
                checked={field.value === props.value}
            />}
        /> : <RadioButton
            name={props.name}
            onChange={props.onChange}
            size={props.size}
            disabled={props.disabled}
            value={props.value}
            activeColor={props.activeColor}
            offColor={props.offColor}
            checked={props.cheked}
        />}
        {!!props.label && labelPosition === "right" && <span>{props.label}</span>}
    </label>
}

interface FCheckboxProps {
    id?: string;
    label?: string;
    labelPosition?: "left" | "right";
    checkColor?: string;
    activeColor?: string;
    shape?: "rectangle" | "circle";
    disabled?: boolean;
    style?: CSSProperties;
    size?: number | string;
    name?: string;
    className?: string;
    methods: UseFormReturn<FieldValues, any, undefined>;
}

interface FCheckbox1Props extends FCheckboxProps {
    value?: boolean;
    onChange?: (value: boolean, target: HTMLInputElement) => void;
}

export const FCheckbox = ({ labelPosition = "right", shape = "rectangle", ...props }: FCheckbox1Props) => {
    return <label id={props.id} className={`row ${styles["f-checkbox"]} ${props.className ?? ""}`} style={props.style}>
        {!!props.label && labelPosition === "left" && <span>{props.label}</span>}
        {props.name ? <Controller
            name={props.name}
            control={props.methods.control}
            render={({ field }) => <Checkbox
                size={props.size}
                disabled={props.disabled}
                onChange={(ev, target) => {
                    field.onChange(ev)
                    props.onChange?.(ev, target)
                }}
                value={field.value}
                checkColor={props.checkColor}
                style={{ borderRadius: shape === "circle" ? "50%" : "0.4rem", color: props.activeColor }}
            />}
        /> : <Checkbox
            size={props.size}
            disabled={props.disabled}
            onChange={props.onChange}
            value={props.value}
            checkColor={props.checkColor}
            style={{ borderRadius: shape === "circle" ? "50%" : "0.4rem", color: props.activeColor }}
        />}
        {!!props.label && labelPosition === "right" && <span>{props.label}</span>}
    </label>
}

interface FSwitchProps {
    id?: string;
    label?: string;
    labelPosition?: "left" | "right";
    onChange?: (value: boolean) => void;
    value?: boolean;
    dotColor?: string;
    onBackground?: string;
    disabled?: boolean;
    style?: CSSProperties;
    size?: number | string;
    name?: string;
    className?: string;
    methods: UseFormReturn<FieldValues, any, undefined>;
}

export const FSwitch = ({ labelPosition = "right", ...props }: FSwitchProps) => {
    return <label id={props.id} className={`row ${styles["f-switch"]} ${props.className ?? ""}`} style={props.style}>
        {!!props.label && labelPosition === "left" && <span>{props.label}</span>}
        {props.name ? <Controller
            name={props.name}
            control={props.methods.control}
            render={({ field }) => <Switch
                size={props.size}
                disabled={props.disabled}
                onChange={(ev) => {
                    field.onChange(ev)
                    props.onChange?.(ev)
                }}
                value={field.value}
                dotColor={props.dotColor}
                onBackground={props.onBackground}
            />}
        /> : <Switch
            size={props.size}
            disabled={props.disabled}
            onChange={props.onChange}
            value={props.value}
            dotColor={props.dotColor}
            onBackground={props.onBackground}
        />}
        {!!props.label && labelPosition === "right" && <span>{props.label}</span>}
    </label>
}

interface FDropdownSelectProps {
    id?: string;
    name?: string;
    methods: UseFormReturn<FieldValues, any, undefined>;
    value?: any;
    required?: boolean;
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

export function FSelectDropdownForm({ methods, ...props }: FDropdownSelectProps) {
    const _covertErrors = useMemo(() => props.name ? convertErrors(methods.formState.errors, props.name) : undefined, [props.name, methods.formState.errors])
    const { t } = useTranslation()

    const customprops: any = { ...props, simpleStyle: true }

    return props.name ? <Controller
        name={props.name}
        control={methods.control}
        rules={{ required: props.required }}
        render={({ field }) => {
            return <SelectDropdown
                {...customprops}
                value={field.value ?? methods.watch(props.name!)}
                onChange={(ev: any) => {
                    const value = props.multiple ? ev : ev?.id;
                    field.onChange(value);
                    if (props.onChange) props.onChange(value);
                }}
                helperText={_covertErrors && (_covertErrors?.message?.length ? _covertErrors?.message : `${t("choose")} ${props.name} ${t("value")}`.toLowerCase())}
            />
        }}
    /> : <SelectDropdown {...customprops} />
}

interface FGroupRadioButtonProps extends FRadioButtonProps {
    options: Array<{ id: string, name: string }>
}

export const FGroupRadioButton = (props: FGroupRadioButtonProps) => {
    return props.options.map((e, i) => {
        return <FRadioButton key={`${e.id} - ${i}`} {...props} value={e.id} label={props.label ? e.name : ""} />
    })
}

interface FGroupCheckboxProps extends FCheckboxProps {
    value?: string;
    options: Array<{ id: string, name: string }>,
    onChange?: (value?: string) => void
}

export const FGroupCheckbox = ({ labelPosition = "right", shape = "rectangle", ...props }: FGroupCheckboxProps) => {
    return props.name ? <Controller
        name={props.name}
        control={props.methods.control}
        render={({ field }) => <>
            {props.options.map((e, i) => <FCheckbox
                key={`${e.id} - ${i}`}
                {...props}
                name={undefined}
                value={(field.value?.split(',') ?? []).includes(e.id)}
                label={props.label ? e.name : ""}
                onChange={(vl) => {
                    let listValue = field.value?.split(',') ?? []
                    if (vl) listValue.push(e.id)
                    else listValue = listValue.filter((el: any) => el !== e.id)
                    listValue = listValue.join(',')
                    field.onChange(listValue)
                    if (props.onChange) props.onChange(listValue)
                }}
            />)}
        </>}
    /> : props.options.map((e, i) => <FCheckbox
        key={`${e.id} - ${i}`}
        {...props}
        value={(props.value?.split(',') ?? []).includes(e.id)}
        onChange={(vl) => {
            let listValue = props.value?.split(',') ?? []
            if (vl) listValue.push(e.id)
            else listValue = listValue.filter((el: any) => el !== e.id)
            if (props.onChange) props.onChange(listValue.join(','))
        }}
    />)
}

interface FColorPickerProps {
    id?: string;
    placeholder?: string;
    disabled?: boolean;
    readOnly?: boolean;
    className?: string;
    style?: CSSProperties;
    value?: string;
    onChange?: (v: string) => void;
    name?: string;
    required?: boolean;
    methods: UseFormReturn<FieldValues, any, undefined>;
}

export const FColorPicker = ({ methods, ...props }: FColorPickerProps) => {
    const _covertErrors = useMemo(() => props.name ? convertErrors(methods.formState.errors, props.name) : undefined, [props.name, methods.formState.errors?.[props.name!]])
    const { t } = useTranslation()

    return props.name ? <Controller
        name={props.name}
        control={methods.control}
        rules={{ required: props.required }}
        render={({ field }) => {
            return <ColorPicker
                {...props}
                type="select"
                value={field.value}
                onChange={(ev) => {
                    field.onChange(ev)
                    props.onChange?.(ev)
                }}
                helperText={_covertErrors && (_covertErrors?.message?.length ? _covertErrors?.message : `${t("input")} ${props.name} ${t("value")}`.toLowerCase())}
                simpleStyle
            />
        }}
    /> : <ColorPicker {...props} type="select" simpleStyle />
}

interface FNumberPickerProps {
    id?: string;
    value?: number;
    onChange?: (ev: number) => void;
    disabled?: boolean;
    readOnly?: boolean;
    className?: string;
    helperText?: string;
    helperTextColor?: string;
    volume?: number;
    style?: CSSProperties;
    min?: number;
    max?: number;
    type?: "outline" | "icon-button";
    name?: string;
    required?: boolean;
    methods: UseFormReturn<FieldValues, any, undefined>;
}

export const FNumberPicker = ({ type = "outline", methods, ...props }: FNumberPickerProps) => {
    const { t } = useTranslation()

    return props.name ? <Controller
        name={props.name}
        control={methods.control}
        rules={{ required: props.required }}
        render={({ field }) => {
            const _covertErrors = convertErrors(methods.formState.errors, props.name!)
            return <NumberPicker
                {...props}
                value={field.value}
                onChange={(ev) => {
                    field.onChange(ev)
                    props.onChange?.(ev)
                }}
                type={type}
                simpleStyle
                helperText={_covertErrors && (_covertErrors?.message?.length ? _covertErrors?.message : `${(`${t("input")} ${props.name} ${t("value")}`).toLowerCase()}`)}
            />
        }}
    /> : <NumberPicker {...props} type={type} simpleStyle />
}

interface FDateTimePickerProps {
    id?: string;
    value?: Date;
    endValue?: Date;
    min?: Date;
    max?: Date;
    pickOnly?: boolean;
    placeholder?: string;
    className?: string;
    style?: CSSProperties;
    disabled?: boolean;
    pickerType?: "date" | "datetime";
    prefix?: ReactNode;
    suffix?: ReactNode;
    onChange?: (ev?: Date | { [p: string]: any }) => void;
    name?: string;
    methods: UseFormReturn<FieldValues, any, undefined>;
}

export const FDateTimePicker = ({ methods, prefix, ...props }: FDateTimePickerProps) => {
    const { t } = useTranslation()

    return props.name ? <Controller
        name={props.name}
        control={methods.control}
        render={({ field }) => {
            const _covertErrors = convertErrors(methods.formState.errors, props.name!)
            return <DateTimePicker
                {...props}
                value={field.value}
                onChange={(ev) => {
                    field.onChange(ev)
                    props.onChange?.(ev)
                }}
                helperText={_covertErrors && (_covertErrors?.message?.length ? _covertErrors?.message : `${(props.placeholder ? props.placeholder : `${t("choose")} ${props.name} ${t("value")}`).toLowerCase()}`)}
                simpleStyle
                prefix={prefix ?? <></>}
            />
        }}
    /> : <DateTimePicker {...props} simpleStyle prefix={prefix ?? <></>} />
}

interface FUploadFileProps {
    id?: string;
    value?: File | Array<File> | {
        [k: string]: any;
    } | Array<{
        [k: string]: any;
    }>;
    buttonOnly?: boolean;
    onChange?: (a?: Array<File> | Array<{ [k: string]: any }>) => void;
    label?: string;
    className?: string;
    style?: CSSProperties;
    allowType?: Array<string>;
    subTitle?: string;
    multiple?: boolean;
    disabled?: boolean;
    fileTagStyle?: CSSProperties;
    maxSize?: number;
    name?: string;
    required?: boolean;
    methods: UseFormReturn<FieldValues, any, undefined>;
}

export const FUploadFile = ({ methods, ...props }: FUploadFileProps) => {
    const { t } = useTranslation()

    return props.name ? <Controller
        name={props.name}
        control={methods.control}
        rules={{ required: props.required }}
        render={({ field }) => {
            const _covertErrors = convertErrors(methods.formState.errors, props.name!)
            return <ImportFile
                {...props}
                value={field.value}
                onChange={(ev) => {
                    field.onChange(ev)
                    props.onChange?.(ev)
                }}
                helperText={_covertErrors && (_covertErrors?.message?.length ? _covertErrors?.message : `${(`${t("upload")} ${props.name} file${props.multiple ? "s" : ""}`).toLowerCase()}`)}
                simpleStyle
            />
        }}
    /> : <ImportFile {...props} simpleStyle />
}

interface FUploadMultipleFileTypeFormProps {
    methods: UseFormReturn<FieldValues, any, undefined>;
    name?: string;
    className?: string;
    style?: CSSProperties;
    placeholder?: string;
    multiple?: boolean;
    allowType?: string[];
    onChange?: (a?: Array<File> | Array<{ [p: string]: any }>) => void;
    uploadElementStyle?: CSSProperties;
    uploadElementClassName?: string;
    suffix?: ReactNode;
    prefix?: ReactNode;
    label?: string;
    disabled?: boolean;
    readOnly?: boolean;
}

export const FUploadMultipleFileType = ({ methods, ...params }: FUploadMultipleFileTypeFormProps) => {
    const { t } = useTranslation()

    return params.name ? <Controller
        name={params.name}
        control={methods.control}
        render={({ field }) => {
            const _covertErrors = convertErrors(methods.formState.errors, params.name!)
            return <UploadFiles
                {...params}
                files={field.value}
                onChange={(ev: any) => {
                    field.onChange(ev);
                    if (params.onChange) params.onChange(ev);
                }}
                helperText={_covertErrors && (_covertErrors?.message?.length ? _covertErrors?.message : `${(params.placeholder ? params.placeholder : `${t("upload")} ${t('file')}`).toLowerCase()}`)}
                simpleStyle
            />
        }}
    /> : <UploadFiles {...params} simpleStyle />
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