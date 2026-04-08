import styles from "./date-time-picker.module.css"
import { CSSProperties, ReactNode, useEffect, useMemo, useRef, useState } from "react"
import { useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { differenceInCalendarDays } from "date-fns"
import { Text, Util, Ebigicon, Calendar, TextField, Button, Checkbox } from "../../index"

const today = new Date()
const startDate = new Date(
    today.getFullYear() - 100,
    today.getMonth(),
    today.getDate()
)
const endDate = new Date(
    today.getFullYear() + 100,
    today.getMonth(),
    today.getDate()
)

interface ValueProps {
    start?: Date,
    end?: Date,
    /** type: 1: daily, 2: weekly, 3: monthly */
    repeatData?: { type: 1 | 2 | 3, value: Array<string | number> }
}

interface DateTimePickerProps {
    id?: string,
    value?: Date,
    endValue?: Date,
    min?: Date,
    max?: Date,
    pickOnly?: boolean,
    helperText?: string,
    helperTextColor?: string,
    placeholder?: string,
    className?: string,
    style?: CSSProperties,
    disabled?: boolean,
    pickerType?: "auto" | "date" | "datetime" | "daterange" | "datetimerange",
    enableRepeat?: boolean,
    /** type: 1: daily, 2: weekly, 3: monthly */
    repeatValue?: { type: 1 | 2 | 3, value: Array<"everyday" | "last" | number> },
    prefix?: ReactNode,
    suffix?: ReactNode,
    onChange?: (ev?: Date | ValueProps) => void,
    simpleStyle?: boolean,
    readOnly?: boolean,
    /** date: dd/mm/yyyy | yyyy/mm/dd | dd/mm | mm/yyyy \n
        time: hh:mm:ss | hh:mm */
    format?: string
}

export function DateTimePicker({ style = {}, pickerType = "auto", ...props }: DateTimePickerProps) {
    const inputRef = useRef<HTMLInputElement>(null)
    const [value, setValue] = useState<Date | ValueProps>()
    const txtValue = useMemo(() => {
        if (!value) return <Text className={styles["value"]} style={{ opacity: 0.6 }}>{props.placeholder ?? ""}</Text>
        if (value instanceof Date) return <Text className={styles["value"]}>{Util.dateToString(value, props.format ?? `dd/mm/yyyy${pickerType?.includes("time") || (pickerType === "auto" && value.getSeconds() === 59) ? " hh:mm" : ""}`)}</Text>
        else {
            const tmpStart = value.start ?? new Date()
            return <>
                <span className={styles["value"]} style={{ flex: "none", width: "fit-content" }}>
                    {Util.dateToString(tmpStart, props.format ?? `dd/mm/yyyy${(pickerType.includes("time") || (pickerType === "auto" && tmpStart.getSeconds() === 1)) ? " hh:mm" : ""}`)} - {Util.dateToString(value.end ?? new Date(), props.format ?? `dd/mm/yyyy${(pickerType?.includes("time") || (pickerType === "auto" && tmpStart.getSeconds() === 1)) ? " hh:mm" : ""}`)}
                </span>
                {value.repeatData && <Ebigicon src="outline/arrows/loop-2" size={13} />}
            </>
        }
    }, [value, props.placeholder, props.format])
    const containerRef = useRef<any>(null)
    const offsetRef = useRef<{ [p: string]: any }>(null)
    const [isOpen, setIsOpen] = useState(false)

    useEffect(() => {
        if (inputRef.current) {
            if (value && value instanceof Date) inputRef.current.value = Util.dateToString(value, props.format ?? `dd/mm/yyyy`)
            else inputRef.current.value = ""
        }
    }, [value, inputRef.current])

    useEffect(() => {
        switch (pickerType) {
            case "date":
            case "datetime":
                setValue(props.value)
                break;
            case "auto":
                if (props.endValue) setValue({ start: props.value, end: props.endValue, repeatData: props.repeatValue })
                else setValue(props.value)
                break;
            default:
                setValue((!props.value || !props.endValue) ? undefined : { start: props.value, end: props.endValue })
                break;
        }
    }, [props.value, props.endValue, props.repeatValue, pickerType])

    const showCalendar = () => {
        if (isOpen) return null;
        const rect = containerRef.current.getBoundingClientRect()
        const tmp = document.createElement("div")
        tmp.style.position = "fixed"
        containerRef.current.after(tmp)
        let tmpRect = tmp.getBoundingClientRect()
        let offset: any = {}
        if (rect.bottom + 240 >= document.body.offsetHeight) offset.bottom = `calc(100dvh - ${rect.y}px + 2px)`
        else offset.top = rect.bottom + 2
        if (Math.abs(tmpRect.x - rect.x) > 2) {
            tmp.style.left = `${containerRef.current.offsetLeft}px`
            tmpRect = tmp.getBoundingClientRect()
            if (Math.abs(tmpRect.x - rect.x) > 2) {
                offset.left = rect.x
            } else offset.left = containerRef.current.offsetLeft
        }
        tmp.remove()
        if (rect.right + 16 >= document.body.offsetWidth) {
            offset.right = `calc(100dvw - ${rect.right}px)`
            delete offset.left
        }
        offsetRef.current = offset
        setTimeout(() => { setIsOpen(true) }, 100)
    }

    const returnUI = () => {
        switch (pickerType) {
            // @ts-ignore
            case "date":
                if (!props.readOnly)
                    return <label
                        id={props.id}
                        ref={containerRef}
                        className={`row ${props.simpleStyle ? styles['simple-date-time-picker'] : styles["date-time-picker"]} ${props.className ?? (props.simpleStyle ? "" : 'body-3')} ${props.helperText?.length ? styles['helper-text'] : ""}`}
                        helper-text={props.helperText}
                        style={{ '--helper-text-color': props.helperTextColor ?? '#e14337', ...style } as CSSProperties}
                        onClick={showCalendar}>
                        {props.prefix ?? <Ebigicon className={styles["prefix-icon"]} src="outline/user interface/calendar-date-2" size={11} color="var(--neutral-text-placeholder-color, #878792)" style={value ? undefined : { borderColor: "var(--neutral-text-placeholder-color, #878792)" }} />}
                        <input
                            className={styles["value"]}
                            ref={inputRef}
                            autoComplete='off'
                            disabled={props.disabled}
                            placeholder={props.placeholder}
                            readOnly={props.pickOnly}
                            onKeyDown={(ev: any) => {
                                switch (ev.key.toLowerCase()) {
                                    case "enter":
                                        ev.target.blur()
                                        break;
                                    default:
                                        break;
                                }
                            }}
                            onBlur={props.pickOnly ? undefined : (ev) => {
                                const inputValue = ev.target.value.trim()
                                let dateValue: Date | undefined = undefined
                                if (inputValue.match(/[0-9]{1,2}(\/|-)[0-9]{1,2}(\/|-)[0-9]{4}/g)) {
                                    dateValue = Util.stringToDate(inputValue, 'dd/mm/yyyy', '/')
                                    if (differenceInCalendarDays(dateValue, props.min ?? startDate) > -1 && differenceInCalendarDays(props.max ?? endDate, dateValue) > -1) {
                                    } else if (differenceInCalendarDays(props.min ?? startDate, dateValue) > -1) {
                                        dateValue = props.min ?? startDate
                                    } else if (differenceInCalendarDays(dateValue, props.min ?? endDate) > -1) {
                                        dateValue = props.max ?? endDate
                                    } else {
                                        dateValue = undefined
                                    }
                                }
                                setValue(dateValue)
                                if (props.onChange) props.onChange(dateValue)
                            }}
                        />
                        {props.suffix}
                    </label>
            default:
                return <div id={props.id}
                    ref={containerRef}
                    className={`row ${props.simpleStyle ? styles['simple-date-time-picker'] : styles["date-time-picker"]} ${props.disabled ? styles['disabled'] : ""} ${props.className ?? (props.simpleStyle ? "" : 'body-3')} ${props.helperText?.length ? styles['helper-text'] : ""}`}
                    helper-text={props.helperText}
                    style={{ '--helper-text-color': props.helperTextColor ?? '#e14337', cursor: props.disabled ? undefined : 'pointer', ...style } as CSSProperties}
                    onClick={(props.disabled || props.readOnly) ? undefined : showCalendar}>
                    {props.prefix ?? <Ebigicon className={styles["prefix-icon"]} src="outline/user interface/calendar-date-2" size={11} color="var(--neutral-text-placeholder-color, #878792)" style={value ? undefined : { borderColor: "var(--neutral-text-placeholder-color, #878792)" }} />}
                    {txtValue}
                    {props.suffix}
                </div>
        }
    }

    return <>
        {returnUI()}
        {isOpen && <PopupDateTimePicker
            max={props.max}
            min={props.min}
            onClose={() => { setTimeout(() => { setIsOpen(false) }, 150) }}
            value={value instanceof Date ? pickerType === "auto" ? undefined : value : value?.start}
            endValue={value instanceof Date ? pickerType === "auto" ? value : undefined : value?.end}
            pickerType={pickerType}
            enableRepeat={props.enableRepeat || !!(!(value instanceof Date) && value?.repeatData)}
            repeatValue={(value instanceof Date ? undefined : value?.repeatData) as any}
            style={offsetRef.current as any}
            onApply={(ev) => {
                setValue(ev)
                setIsOpen(false)
                if (props.onChange) props.onChange(ev)
            }}
        />}
    </>
}

interface PopupPickerProps {
    value?: Date,
    endValue?: Date,
    min?: Date,
    style?: CSSProperties,
    max?: Date,
    pickerType?: "auto" | "date" | "datetime" | "daterange" | "datetimerange",
    repeatValue?: { type: 1 | 2 | 3, value: Array<"everyday" | "last" | number> },
    onApply?: (ev: Date | ValueProps) => void,
    enableRepeat?: boolean,
    onClose: () => void
}

const PopupDateTimePicker = ({ value, style, endValue, repeatValue, onApply, pickerType = "auto", enableRepeat = false, min, max, onClose }: PopupPickerProps) => {
    const divRef = useRef<HTMLDivElement>(null)
    const methods = useForm({ shouldFocusError: false })
    const [selectTime, setSelectTime] = useState(false)
    const [isRepeat, setIsRepeat] = useState(false)
    const today = new Date()
    const [repeatData, setRepeatData] = useState<{ type: 1 | 2 | 3, value: Array<string | number> }>({ type: 1, value: ["everyday"] }) // 1: daily, 2: weekly, 3: monthly
    const inputStartRef = useRef<any>(null)
    const inputEndRef = useRef<any>(null)
    const { t } = useTranslation()
    const regexDate = /[0-9]{1,2}(\/|-)[0-9]{1,2}(\/|-)[0-9]{4}/g
    const regexTime = /^(?:[01]\d|2[0-3]):[0-5]\d(?:[:][0-5]\d)?$/g
    const [isOpenDropdown, setIsOpenDropdown] = useState(false)
    const dropdownContentRef = useRef<any>({
        children: <></>,
        style: {}
    })

    useEffect(() => {
        return () => onClose?.()
    }, [])

    useEffect(() => {
        if (repeatValue && enableRepeat) {
            setIsRepeat(true)
            setRepeatData(repeatValue)
        } else setIsRepeat(false)
    }, [repeatValue])

    useEffect(() => {
        if (selectTime && pickerType !== "auto" && !pickerType.includes("time")) {
            setSelectTime(false)
            methods.setValue('time-start', null)
            methods.setValue('time-end', null)
        } else if (!selectTime && pickerType.includes("time")) {
            setSelectTime(true)
        }
    }, [pickerType])

    const initStartValue = () => {
        if (value) {
            const initStart = typeof value === "number" ? (new Date(value)) : value
            methods.setValue('date-start', initStart)
            inputStartRef.current!.inputElement!.value = Util.dateToString(initStart)
            if (pickerType.includes("time") || initStart.getSeconds() === 1) {
                setSelectTime(true)
                methods.setValue('time-start', Util.dateToString(initStart, "hh:mm"))
            }
        } else inputStartRef.current!.inputElement!.value = ""
    }

    const initEndValue = () => {
        if ((pickerType?.includes("range") || pickerType === "auto") && inputEndRef.current) {
            if (endValue) {
                const initEnd = typeof endValue === "number" ? (new Date(endValue)) : endValue
                methods.setValue('date-end', initEnd)
                inputEndRef.current.inputElement!.value = Util.dateToString(initEnd)
                if (pickerType.includes("time") || initEnd.getSeconds() === 59) {
                    setSelectTime(true)
                    methods.setValue('time-end', Util.dateToString(initEnd, "hh:mm"))
                }
            } else inputEndRef.current.inputElement!.value = ""
        }
    }

    useEffect(() => {
        switch (pickerType) {
            case "date":
                if (value) methods.setValue('date-start', value)
                break;
            default:
                if (value && inputStartRef.current) initStartValue()
                break;
        }
    }, [value, inputStartRef])

    useEffect(() => {
        initEndValue()
    }, [endValue, inputEndRef, pickerType])

    useEffect(() => {
        if (divRef.current) {
            const onClickDropDown = (ev: any) => {
                if (ev.target === divRef.current || !divRef.current!.contains(ev.target)) onClose()
            }
            window.document.body.addEventListener("mousedown", onClickDropDown)
            return () => {
                window.document.body.removeEventListener("mousedown", onClickDropDown)
            }
        }
    }, [divRef.current])

    const appliable = useMemo(() => {
        switch (pickerType) {
            case "auto":
                return !!methods.watch("date-end")
            case "datetime":
                return !!methods.watch("date-start")
            default:
                return !!methods.watch("date-start") && !!methods.watch("date-end")
        }
    }, [methods.watch("date-start"), methods.watch("date-end"), pickerType])

    const convertCalendarValue = useMemo(() => {
        switch (pickerType) {
            case "date":
            case "datetime":
                return methods.watch('date-start');
            // @ts-ignore
            case "auto":
                if (!methods.watch("date-start")) return methods.watch('date-end')
            default:
                return (methods.watch('date-start') && methods.watch('date-end')) ? { sTime: methods.watch('date-start'), eTime: methods.watch('date-end') } : undefined
        }
    }, [pickerType, methods.watch("date-start"), methods.watch("date-end")])

    return <div ref={divRef} className={`col ${styles["calendar-popup"]}`} style={style}>
        <Calendar
            min={min}
            max={max}
            style={{ width: "31.2rem" }}
            range={pickerType.includes("range") || (pickerType === "auto" && !!methods.watch("date-start"))}
            value={convertCalendarValue}
            header={pickerType !== "date" && <div className={`row ${styles["header"]}`}>
                {(pickerType !== "auto" || value || methods.watch("date-start")) ? <TextField
                    ref={inputStartRef}
                    autoComplete="off"
                    className='col12 body-3 size32'
                    style={{ "--gutter": "1.2rem" } as any}
                    placeholder={pickerType.includes("range") || pickerType === "auto" ? t("start-date") : "dd/mm/yyyy"}
                    onComplete={(ev: any) => ev.target.blur()}
                    onBlur={(ev) => {
                        const inputValue = ev.target.value
                        if (regexDate.test(inputValue)) {
                            const dateValue = Util.stringToDate(inputValue, 'dd/mm/yyyy', '/')
                            if ((pickerType.includes("range") || pickerType === "auto") && differenceInCalendarDays(methods.getValues('date-end'), dateValue) < 0) {
                                methods.setValue('date-end', dateValue)
                                inputEndRef.current!.inputElement!.value = Util.dateToString(dateValue)
                            }
                            methods.setValue('date-start', dateValue)
                        } else ev.target.value = methods.getValues('date-start') ? Util.dateToString(methods.getValues('date-start')) : ""
                    }}
                /> : <Button
                    label="Start date"
                    prefix={<Ebigicon src="outline/user interface/e-add" size={14} />}
                    className='col12 label-3 size32 border'
                    style={{ "--gutter": "1.2rem" } as any}
                    onClick={() => {
                        const tmp = methods.watch('date-end') ? new Date(methods.watch('date-end')?.getTime()) : new Date()
                        tmp.setHours(1, 0, 1)
                        methods.setValue('date-start', tmp)
                        setTimeout(() => { inputStartRef.current!.inputElement!.value = Util.dateToString(tmp) }, 150)
                    }}
                />}
                {(pickerType.includes("range") || pickerType === "auto") &&
                    <TextField
                        ref={inputEndRef}
                        autoComplete="off"
                        className='col12 body-3 size32'
                        style={{ "--gutter": "1.2rem" } as any}
                        placeholder={t("end-date")}
                        onComplete={(ev: any) => ev.target.blur()}
                        onBlur={(ev) => {
                            const inputValue = ev.target.value
                            if (regexDate.test(inputValue)) {
                                const dateValue = Util.stringToDate(inputValue, 'dd/mm/yyyy', '/')
                                if (differenceInCalendarDays(dateValue, methods.getValues('date-start')) < 0) {
                                    methods.setValue('date-start', dateValue)
                                    inputStartRef.current!.inputElement!.value = Util.dateToString(dateValue)
                                }
                                methods.setValue('date-end', dateValue)
                            } else ev.target.value = methods.getValues('date-end') ? Util.dateToString(methods.getValues('date-end')) : ""
                        }}
                    />}
                {selectTime && <>
                    {(pickerType !== "auto" || methods.watch("date-start")) ? <TextField
                        autoComplete="off"
                        name='time-start'
                        style={{ "--gutter": "1.2rem" } as any}
                        onComplete={(ev: any) => { ev.target.blur() }}
                        register={methods.register("time-start", {
                            onChange: (ev) => ev.target.value = ev.target.value.trim(),
                            onBlur: (ev) => {
                                if (regexTime.test(ev.target.value)) {
                                    methods.setValue('time-start', ev.target.value)
                                } else ev.target.value = ""
                            }
                        }) as any}
                        className='col12 body-3 size32'
                        placeholder={"hh:mm"}
                        onFocus={(ev) => {
                            const rect = ev.target.closest("label")!.getBoundingClientRect()
                            dropdownContentRef.current = {
                                children: Array.from({ length: 48 }).map((_, i) => {
                                    if (i % 2 === 0) var timeValue = `${(i / 2) < 9 ? `0${i / 2}` : (i / 2)}:00`
                                    else timeValue = `${((i - 1) / 2) < 9 ? `0${(i - 1) / 2}` : ((i - 1) / 2)}:30`
                                    return <button key={"time-" + i} type="button" className="row"
                                        onClick={() => {
                                            methods.setValue("time-start", timeValue)
                                            setIsOpenDropdown(false)
                                        }}>
                                        <Text className="body-3">{timeValue}</Text>
                                    </button>
                                }),
                                style: { top: rect.bottom + 2, right: `calc(100dvw - ${rect.right}px)`, width: rect.width }
                            }
                            setIsOpenDropdown(true)
                        }}
                    /> : <Button
                        label="Start time"
                        prefix={<Ebigicon src="outline/user interface/e-add" size={14} />}
                        className='col12 label-3 size32 border'
                        style={{ "--gutter": "1.2rem" } as any}
                        onClick={() => {
                            const tmp = endValue ? new Date(endValue?.getTime()) : new Date()
                            tmp.setHours(1, 0, 1)
                            methods.setValue('date-start', tmp)
                            setTimeout(() => { inputStartRef.current!.inputElement!.value = Util.dateToString(tmp) }, 150)
                        }}
                    />}
                    {(pickerType.includes("range") || pickerType === "auto") &&
                        <TextField
                            autoComplete="off"
                            name='time-end'
                            style={{ "--gutter": "1.2rem" } as any}
                            onComplete={(ev: any) => { ev.target.blur() }}
                            register={methods.register("time-end", {
                                onChange: (ev) => ev.target.value = ev.target.value.trim(),
                                onBlur: (ev) => {
                                    if (regexTime.test(ev.target.value)) {
                                        methods.setValue('time-end', ev.target.value)
                                    } else ev.target.value = ""
                                }
                            }) as any}
                            className='col12 body-3 size32'
                            placeholder={"hh:mm"}
                            onFocus={(ev) => {
                                const rect = ev.target.closest("label")!.getBoundingClientRect()
                                dropdownContentRef.current = {
                                    children: Array.from({ length: 48 }).map((_, i) => {
                                        if (i % 2 === 0) var timeValue = `${(i / 2) < 9 ? `0${i / 2}` : (i / 2)}:00`
                                        else timeValue = `${((i - 1) / 2) < 9 ? `0${(i - 1) / 2}` : ((i - 1) / 2)}:30`
                                        return <button key={"time-" + i} type="button" className="row"
                                            onClick={() => {
                                                methods.setValue("time-end", timeValue)
                                                setIsOpenDropdown(false)
                                            }}>
                                            <Text className="body-3">{timeValue}</Text>
                                        </button>
                                    }),
                                    style: { top: rect.bottom + 2, right: `calc(100dvw - ${rect.right}px)`, width: rect.width }
                                }
                                setIsOpenDropdown(true)
                            }}
                        />}
                </>}
            </div>}
            footer={pickerType !== "date" && <>
                {isRepeat && <div className='col' style={{ borderTop: "var(--neutral-main-border,1px solid light-dark(#EAEAEC, #313135))" }}>
                    <div className='row' style={{ gap: 4, padding: "1.2rem 1.6rem" }}>
                        <Text className='heading-8' style={{ flex: 1 }}>{t("repeat")}</Text>
                        <Button
                            style={{ padding: 0 }}
                            label={(() => {
                                switch (repeatData.type) {
                                    case 1:
                                        return t("daily")
                                    case 2:
                                        return t("weekly")
                                    case 3:
                                        return t("monthly")
                                    default:
                                        return ""
                                }
                            })()}
                            suffix={<Ebigicon src='outline/arrows/down-arrow' size={14} />}
                            onClick={(ev: any) => {
                                const btn = ev.target.closest("button")
                                const rect = btn.getBoundingClientRect()
                                dropdownContentRef.current = {
                                    children: Array.from({ length: 3 }).map((_, num) => {
                                        let label = ""
                                        switch (num) {
                                            case 0:
                                                label = t("daily")
                                                break;
                                            case 1:
                                                label = t("weekly")
                                                break;
                                            case 2:
                                                label = t("monthly")
                                                break;
                                            default:
                                                break;
                                        }
                                        return <button key={"tStatus-" + num} type="button" className="row" onClick={() => {
                                            let newValue: any = ["everyday"]
                                            switch (num) {
                                                case 0:
                                                    newValue = ["everyday"]
                                                    break;
                                                case 1:
                                                    newValue = today.getDay()
                                                    break;
                                                case 2:
                                                    newValue = today.getDate()
                                                    break;
                                                default:
                                                    break;
                                            }
                                            setRepeatData({ type: (num + 1) as any, value: [newValue] })
                                            setIsOpenDropdown(false)
                                        }}>
                                            <Text className="label-3">{label}</Text>
                                        </button>
                                    }),
                                    style: { top: rect.bottom + 2, right: `calc(100dvw - ${rect.right}px)`, minWidth: rect.width }
                                }
                                setIsOpenDropdown(true)
                            }}
                        />
                    </div>
                    {(() => {
                        switch (repeatData.type) {
                            case 2:
                                return <>
                                    <Text className='heading-8' style={{ padding: "0 1.6rem" }}>{t("on") + " " + t("date").toLowerCase()}</Text>
                                    <div className='row' style={{ justifyContent: "space-between", padding: "0.4rem 1.6rem" }}>
                                        {Array.from({ length: 7 }).map((_, i) => {
                                            switch (i) {
                                                case 0:
                                                    var weekdayTitle = t("su")
                                                    break
                                                case 1:
                                                    weekdayTitle = t("mo")
                                                    break
                                                case 2:
                                                    weekdayTitle = t("tu")
                                                    break
                                                case 3:
                                                    weekdayTitle = t("we")
                                                    break
                                                case 4:
                                                    weekdayTitle = t("th")
                                                    break
                                                case 5:
                                                    weekdayTitle = t("fr")
                                                    break
                                                case 6:
                                                    weekdayTitle = t("sa")
                                                    break
                                                default:
                                                    weekdayTitle = ''
                                                    break
                                            }
                                            return <div key={"weekday-" + i} className='col' style={{ gap: 4, alignItems: "center" }}>
                                                <Checkbox size={"1.8rem"} value={repeatData.value.includes(i)} disabled={repeatData.value.includes(i) && repeatData.value.length === 1} onChange={(v) => {
                                                    if (v) setRepeatData({ type: 2, value: [...repeatData.value, i] })
                                                    else setRepeatData({ type: 2, value: repeatData.value.filter(id => id !== i) })
                                                }} />
                                                <Text className='placeholder-2'>{weekdayTitle}</Text>
                                            </div>
                                        })}
                                    </div>
                                </>
                            case 3:
                                return <div className='row' style={{ justifyContent: "space-between", padding: "0.4rem 1.6rem", gap: "1.2rem" }}>
                                    <Text className='heading-8' style={{ flex: 1 }}>{t("on") + " " + t("date").toLowerCase()}</Text>
                                    <Button
                                        style={{ padding: 0 }}
                                        label={repeatData.value[0] === "last" ? t("Last") : `${repeatData.value[0]}`}
                                        suffix={<Ebigicon src='outline/arrows/down-arrow' size={14} />}
                                        onClick={(ev: any) => {
                                            const rect = ev.target.closest("button").getBoundingClientRect()
                                            dropdownContentRef.current = {
                                                children: Array.from({ length: 29 }).map((_, num) => {
                                                    switch (num) {
                                                        case 28:
                                                            var label = t("Last")
                                                            break;
                                                        default:
                                                            label = `${num + 1}`
                                                            break;
                                                    }
                                                    return <button key={"date-" + num} type="button" className="row" onClick={() => {
                                                        setRepeatData({ type: 3, value: [num === 28 ? "last" : (num + 1)] })
                                                        setIsOpenDropdown(false)
                                                    }}>
                                                        <Text className="label-3">{label}</Text>
                                                    </button>
                                                }),
                                                style: { bottom: `calc(100dvh - ${rect.y - 1}px)`, right: `calc(100dvw - ${rect.right}px)`, width: rect.width }
                                            }
                                            setIsOpenDropdown(true)
                                        }}
                                    />
                                </div>
                            default:
                                return null
                        }
                    })()}
                </div>}
                {onApply && <div className='row' style={{ gap: "0.8rem", padding: "1.2rem 1.6rem", borderTop: "var(--neutral-main-border,1px solid light-dark(#EAEAEC, #313135))" }}>
                    {pickerType === "auto" && <div className='row' style={{ gap: 4 }}>
                        <Ebigicon
                            src='outline/user interface/time-alarm'
                            size={14}
                            style={{ padding: 5, borderRadius: "50%", backgroundColor: selectTime ? "var(--neutral-disable-background-color,light-dark(#F4F4F5, #494950))" : undefined }}
                            onClick={() => { setSelectTime(!selectTime) }}
                        />
                        {(enableRepeat || pickerType === "auto") && <Ebigicon
                            src='outline/arrows/loop-2'
                            size={14}
                            style={{ padding: 5, borderRadius: "50%", backgroundColor: isRepeat ? "var(--neutral-disable-background-color,light-dark(#F4F4F5, #494950))" : undefined }}
                            onClick={() => {
                                if (pickerType === "auto" && !methods.watch("date-start")) {
                                    const tmp = endValue ? new Date(endValue?.getTime()) : new Date()
                                    tmp.setHours(1, 0, 1)
                                    methods.setValue('date-start', tmp)
                                    setTimeout(() => { inputStartRef.current!.inputElement!.value = Util.dateToString(tmp) }, 150)
                                }
                                setIsRepeat(!isRepeat)
                            }}
                        />}
                    </div>}
                    <div style={{ flex: 1 }} />
                    <Button
                        label={t("reset")}
                        onClick={() => {
                            methods.setValue("date-start", null)
                            methods.setValue("date-end", null)
                            methods.setValue("time-start", null)
                            methods.setValue("time-end", null)
                            initStartValue()
                            initEndValue()
                        }}
                    />
                    <Button
                        label={t("apply")}
                        disabled={!appliable}
                        className={`label-3 button-primary`}
                        onClick={() => {
                            let dateStartValue = methods.getValues("date-start")
                            switch (pickerType) {
                                // @ts-ignore 
                                case "auto":
                                    if (!dateStartValue) {
                                        const dateEndValue = methods.getValues("date-end")
                                        let timeEndValue = selectTime ? (methods.getValues("time-end")?.length ? methods.getValues("time-end") : "23:59") : "23:59"
                                        dateEndValue.setHours(parseInt(timeEndValue.split(':')[0]), parseInt(timeEndValue.split(':')[1]), selectTime ? 59 : 0, 0)
                                        onApply(dateEndValue)
                                        break;
                                    }
                                default:
                                    let timeStartValue = selectTime ? (methods.getValues("time-start")?.length ? methods.getValues("time-start") : "00:00") : "00:00"
                                    dateStartValue.setHours(parseInt(timeStartValue.split(':')[0]), parseInt(timeStartValue.split(':')[1]), selectTime ? 1 : 0, 0)
                                    if (pickerType.includes("range") || pickerType === "auto") {
                                        var dateEndValue = methods.getValues("date-end")
                                        let timeEndValue = selectTime ? (methods.getValues("time-end")?.length ? methods.getValues("time-end") : "23:59") : "23:59"
                                        dateEndValue.setHours(parseInt(timeEndValue.split(':')[0]), parseInt(timeEndValue.split(':')[1]), selectTime ? 59 : 0, 0)
                                    }
                                    onApply(pickerType.includes("range") || pickerType === "auto" ? { start: dateStartValue, end: dateEndValue, repeatData: isRepeat ? repeatData : undefined } : dateStartValue)
                                    break;
                            }
                        }}
                    />
                </div>}
            </>}
            onSelect={(ev: any) => {
                if (pickerType !== "date") {
                    if (ev instanceof Date) {
                        if (pickerType === "auto" && !methods.watch("date-start")) {
                            methods.setValue('date-end', ev)
                            if (inputEndRef.current) inputEndRef.current.inputElement!.value = Util.dateToString(ev)
                        } else {
                            methods.setValue('date-start', ev)
                            if (inputStartRef.current) inputStartRef.current.inputElement!.value = Util.dateToString(ev)
                        }
                    } else {
                        methods.setValue('date-start', ev.sTime)
                        if (inputStartRef.current) inputStartRef.current.inputElement!.value = Util.dateToString(ev.sTime)
                        if (pickerType.includes("range") || pickerType === "auto") {
                            methods.setValue('date-end', ev.eTime)
                            if (inputEndRef.current) inputEndRef.current.inputElement!.value = Util.dateToString(ev.eTime)
                        }
                    }
                } else if (onApply) {
                    onApply(ev)
                }
            }}
        />
        {isOpenDropdown && <DropdownOptions
            onClose={() => { setTimeout(() => { setIsOpenDropdown(false) }, 150) }}
            style={dropdownContentRef.current.style}
        >
            {dropdownContentRef.current.children}
        </DropdownOptions>}
    </div>
}

const DropdownOptions = ({ onClose, style = {}, children }: any) => {
    const divRef = useRef<HTMLDivElement>(null)
    useEffect(() => {
        if (divRef.current) {
            const onClickDropDown = (ev: any) => {
                if (ev.target === divRef.current || !divRef.current!.contains(ev.target)) onClose()
            }
            window.document.body.addEventListener("mousedown", onClickDropDown)
            return () => {
                window.document.body.removeEventListener("mousedown", onClickDropDown)
            }
        }
    }, [divRef.current])
    useEffect(() => {
        return () => onClose?.()
    }, [])

    return <div ref={divRef} className={`col ${styles["options-dropdown"]}`} style={style}>
        {children}
    </div>
}