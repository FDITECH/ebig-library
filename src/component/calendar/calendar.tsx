import React, { CSSProperties, ReactNode, useEffect, useMemo, useRef } from "react"
import styles from './calendar.module.css'
import { differenceInDays } from "date-fns"
import { useTranslation } from 'react-i18next';
import { Ebigicon } from "../icon/ebig-icon";

export const today = new Date()
export const startDate = new Date(
    today.getFullYear() - 100,
    today.getMonth(),
    today.getDate()
)
export const endDate = new Date(
    today.getFullYear() + 100,
    today.getMonth(),
    today.getDate()
)

export const inRangeTime = (date: Date, startDate: Date, endDate: Date) => (differenceInDays(date, startDate) > -1 && differenceInDays(endDate, date) > -1)

enum CalendarTab {
    DATE = 0,
    MONTH = 1,
    YEAR = 2,
}

interface CalendarProps {
    id?: string,
    value?: Date | { sTime: Date, eTime: Date },
    range?: boolean,
    min?: Date,
    max?: Date,
    onSelect?: (props: Date | { sTime: Date, eTime: Date }) => void,
    disabled?: boolean,
    className?: string,
    style?: CSSProperties,
    header?: ReactNode,
    footer?: ReactNode,
}

const stateValue = (minDate: Date, maxDate: Date, value?: Date | { sTime: Date, eTime: Date }, range?: boolean) => {
    let defaultValue: Date | { sTime: Date, eTime: Date }
    if (value) {
        if (range) {
            if (value instanceof Date) defaultValue = { sTime: value, eTime: value }
            else defaultValue = value
            if (defaultValue.sTime.getTime() < minDate.getTime()) defaultValue.sTime = minDate
            if (defaultValue.eTime.getTime() > maxDate.getTime()) defaultValue.eTime = maxDate
        } else {
            if (value instanceof Date) defaultValue = value
            else defaultValue = value.sTime
            if (defaultValue.getTime() < minDate.getTime()) defaultValue = minDate
            if (defaultValue.getTime() > maxDate.getTime()) defaultValue = maxDate
        }
    } else {
        defaultValue = range ? { sTime: today, eTime: today } : today
    }
    const defaultMonth = defaultValue instanceof Date ? defaultValue.getMonth() : defaultValue.sTime.getMonth()
    const defaultYear = defaultValue instanceof Date ? defaultValue.getFullYear() : defaultValue.sTime.getFullYear()
    return {
        value: value ? defaultValue : undefined,
        selectMonth: defaultMonth,
        selectYear: defaultYear,
        tab: CalendarTab.DATE,
    }
}

export const Calendar = (props: CalendarProps) => {
    const [selectYear, setSelectYear] = React.useState<number>(today.getFullYear())
    const [selectMonth, setSelectMonth] = React.useState<number>(today.getMonth())
    const [tab, setTab] = React.useState<CalendarTab>(CalendarTab.DATE)
    const [value, setValue] = React.useState<Date | { sTime: Date, eTime: Date } | undefined>(undefined)
    const { t, i18n } = useTranslation()
    const minDate = useRef(!props.min || props.min.getTime() < startDate.getTime() ? startDate : props.min).current
    const maxDate = useRef(!props.max || props.max.getTime() > endDate.getTime() ? endDate : props.max).current

    useEffect(() => {
        const getState = stateValue(minDate, maxDate, props.value, props.range)
        setValue(getState.value)
        setSelectMonth(getState.selectMonth)
        setSelectYear(getState.selectYear)
        setTab(getState.tab)
    }, [props.value, props.range]);

    const showDateInMonth = () => {
        let firstDayOfMonth = new Date(selectYear, selectMonth, 1)
        return <>
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
                return <div key={'dtwk-' + i} className={`${styles['date-picker-circle']} date-picker-circle`}><span className="label-4 row">{weekdayTitle}</span></div>
            })}
            {Array.from({ length: 42 }).map((_, i) => {
                let dateNumber = (i % 7) + (Math.floor(i / 7) * 7) - firstDayOfMonth.getDay()
                const timeValue = new Date(selectYear, selectMonth, dateNumber + 1)
                let className = `${styles['date-picker-circle']} date-picker-circle`
                let typoClassName = "body-3"
                if (dateNumber + 1 === today.getDate() && selectMonth === today.getMonth() && selectYear === today.getFullYear()) {
                    className += ` ${styles['today']}`
                }
                let style: CSSProperties | undefined;
                if (!inRangeTime(timeValue, minDate, maxDate)) {
                    className += ` ${styles['invalid']}`
                } else if (value instanceof Date) {
                    if (value.getDate() === timeValue.getDate() && differenceInDays(timeValue, value) === 0) className += ` ${styles['selected']}`
                } else if ((value?.sTime.getDate() === timeValue.getDate() && (Math.abs(differenceInDays(timeValue, value.sTime))) < 1) || (value?.eTime.getDate() === timeValue.getDate() && (Math.abs(differenceInDays(timeValue, value.eTime))) < 1)) {
                    className += ` ${styles['selected']} ${styles[`${value?.sTime.getDate() === timeValue.getDate() && (Math.abs(differenceInDays(timeValue, value.sTime))) < 1 ? "start" : "end"}-range`]}`
                } else if (value && inRangeTime(timeValue, value.sTime, value.eTime)) {
                    className += ` ${styles['in-range']}`
                }
                if (timeValue.getMonth() !== selectMonth) {
                    typoClassName = "placeholder-2"
                }
                return <div key={timeValue.toString()} className={className} style={style}>
                    <button type="button" className={`${typoClassName} row`}
                        onClick={() => {
                            const currentValue = value as any
                            if (props.range) {
                                const newValue = (!currentValue || timeValue.getTime() < currentValue.sTime.getTime()) ? { sTime: timeValue, eTime: timeValue } : { sTime: currentValue.sTime, eTime: timeValue }
                                setValue(newValue)
                                if (props.onSelect) props.onSelect(newValue)
                            } else {
                                setValue(timeValue)
                                if (props.onSelect) props.onSelect(timeValue)
                            }
                        }} >
                        {timeValue.getDate()}
                    </button>
                </div>
            })}
        </>
    }

    const showMonthInYear = () => {
        return Array.from({ length: 12 }).map((_, i) => {
            switch (i) {
                case 0:
                    var monthTitle = i18n.language === "en" ? "Jan" : t('january')
                    break
                case 1:
                    monthTitle = i18n.language === "en" ? "Feb" : t('february')
                    break
                case 2:
                    monthTitle = i18n.language === "en" ? "Mar" : t('march')
                    break
                case 3:
                    monthTitle = i18n.language === "en" ? "Apr" : t('april')
                    break
                case 4:
                    monthTitle = i18n.language === "en" ? "May" : t('may')
                    break
                case 5:
                    monthTitle = i18n.language === "en" ? "Jun" : t('june')
                    break
                case 6:
                    monthTitle = i18n.language === "en" ? "Jul" : t('july')
                    break
                case 7:
                    monthTitle = i18n.language === "en" ? "Aug" : t('august')
                    break
                case 8:
                    monthTitle = i18n.language === "en" ? "Sep" : t('september')
                    break
                case 9:
                    monthTitle = i18n.language === "en" ? "Oct" : t('october')
                    break
                case 10:
                    monthTitle = i18n.language === "en" ? "Nov" : t('november')
                    break
                case 11:
                    monthTitle = i18n.language === "en" ? "Dec" : t('december')
                    break
                default:
                    monthTitle = ''
                    break
            }
            const timeValue = new Date(selectYear, i)
            let className = `${styles['month-picker-circle']} month-picker-circle`
            if (selectYear === today.getFullYear() && today.getMonth() === i) {
                className += ` ${styles['today']}`
            }
            if (!inRangeTime(timeValue, minDate, maxDate)) {
                className += ` ${styles['invalid']}`
            } else if (value instanceof Date) {
                if (selectYear === value.getFullYear() && i === value.getMonth()) className += ` ${styles['selected']}`
            } else if (value && ((i === value.sTime.getMonth() && value.sTime.getFullYear() === selectYear) || (i === value.eTime.getMonth() && value.eTime.getFullYear() === selectYear))) {
                className += ` ${styles['selected']} ${styles[`${i === value.sTime.getMonth() && value.sTime.getFullYear() === selectYear ? "start" : "end"}-range`]}`
            } else if (value && inRangeTime(timeValue, value.sTime, value.eTime)) {
                className += ` ${styles['in-range']}`
            }
            return <div key={timeValue.toString()} className={className}>
                <button type="button" className="body-3 row" onClick={() => {
                    setSelectMonth(i)
                    setTab(CalendarTab.DATE)
                }}>
                    {monthTitle}
                </button>
            </div>
        })
    }

    const showYearInRange = () => {
        return Array.from({ length: 12 }).map((_, i) => {
            let firstYearInTable = selectYear - ((selectYear - startDate.getFullYear()) % 12)
            let yearNumber = i + firstYearInTable
            let className = `${styles['year-picker-circle']} year-picker-circle`
            if (yearNumber === today.getFullYear()) {
                className += ` ${styles['today']}`
            }
            if (yearNumber < minDate.getFullYear() || yearNumber > maxDate.getFullYear()) {
                className += ` ${styles['invalid']}`
            } else if (value instanceof Date) {
                if (yearNumber === value.getFullYear()) className += ` ${styles['selected']}`
            } else if (yearNumber === value?.sTime.getFullYear() || yearNumber === value?.eTime.getFullYear()) {
                className += ` ${styles['selected']} ${styles[`${yearNumber === value?.sTime.getFullYear() ? "start" : "end"}-range`]}`
            } else if (value && yearNumber > value.sTime.getFullYear() && yearNumber < value.eTime.getFullYear()) {
                className += ` ${styles['in-range']}`
            }
            return <div key={yearNumber.toString()} className={className}>
                <button type="button" className="body-3 row" onClick={() => {
                    setSelectYear(yearNumber)
                    setTab(CalendarTab.MONTH)
                }}>
                    {yearNumber}
                </button>
            </div>
        })
    }

    const getTitle = useMemo(() => {
        switch (tab) {
            case CalendarTab.YEAR:
                let firstYearInTable = selectYear - ((selectYear - startDate.getFullYear()) % 12)
                return `${firstYearInTable}-${firstYearInTable + 11}`
            case CalendarTab.MONTH:
                return selectYear
            default:
                switch (selectMonth) {
                    case 0:
                        var monthName = t('january')
                        break
                    case 1:
                        monthName = t('february')
                        break
                    case 2:
                        monthName = t('march')
                        break
                    case 3:
                        monthName = t('april')
                        break
                    case 4:
                        monthName = t('may')
                        break
                    case 5:
                        monthName = t('june')
                        break
                    case 6:
                        monthName = t('july')
                        break
                    case 7:
                        monthName = t('august')
                        break
                    case 8:
                        monthName = t('september')
                        break
                    case 9:
                        monthName = t('october')
                        break
                    case 10:
                        monthName = t('november')
                        break
                    case 11:
                        monthName = t('december')
                        break
                    default:
                        monthName = ''
                        break
                }
                return `${monthName}${i18n.language === 'en' ? ' ' : '/'}${selectYear}`
        }
    }, [i18n.language, selectMonth, selectYear, tab])

    return <div className={`${styles['calendar-container']} col ${props.className ?? ""}`} style={props.style}>
        {props.header}
        <div className={`${styles['picker-date-header']} row`}>
            <button type='button'
                onClick={() => {
                    switch (tab) {
                        case CalendarTab.YEAR:
                            if (selectYear - 10 < startDate.getFullYear()) {
                                setSelectYear(startDate.getFullYear())
                            } else {
                                setSelectYear(selectYear - 10)
                            }
                            break
                        case CalendarTab.MONTH:
                            const newTime = new Date(selectYear, selectMonth - 1)
                            if (newTime.getTime() >= startDate.getTime()) {
                                setSelectYear(selectYear - 1)
                            }
                            break
                        default:
                            const newDataVl = new Date(selectYear, selectMonth - 1)
                            if (newDataVl.getTime() >= startDate.getTime()) {
                                setSelectYear(newDataVl.getFullYear())
                                setSelectMonth(newDataVl.getMonth())
                            }
                            break
                    }
                }}
            >
                <Ebigicon src={"fill/arrows/left-arrow"} size={14} />
            </button>
            <span className="heading-7" onClick={() => {
                if (tab !== CalendarTab.YEAR)
                    setTab(prev => prev === CalendarTab.DATE ? CalendarTab.MONTH : CalendarTab.YEAR)
            }}>
                {getTitle}
            </span>
            <button type='button'
                onClick={() => {
                    switch (tab) {
                        case CalendarTab.YEAR:
                            if (selectYear + 10 > endDate.getFullYear()) {
                                setSelectYear(endDate.getFullYear())
                            } else {
                                setSelectYear(selectYear + 10)
                            }
                            break
                        case CalendarTab.MONTH:
                            const newTime = new Date(selectYear, selectMonth + 1)
                            if (newTime.getTime() <= endDate.getTime()) {
                                setSelectYear(selectYear + 1)
                            }
                            break
                        default:
                            const newDataVl = new Date(selectYear, selectMonth + 1)
                            if (newDataVl.getTime() <= endDate.getTime()) {
                                setSelectYear(newDataVl.getFullYear())
                                setSelectMonth(newDataVl.getMonth())
                            }
                            break
                    }
                }}
            >
                <Ebigicon src={"fill/arrows/right-arrow"} size={14} />
            </button>
        </div>
        <div className={`${styles['picker-date-body']} row`}>
            {tab === CalendarTab.YEAR ? showYearInRange() : tab === CalendarTab.MONTH ? showMonthInYear() : showDateInMonth()}
        </div>
        {props.footer}
    </div>
}