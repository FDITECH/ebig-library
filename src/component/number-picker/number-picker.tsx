import { CSSProperties, useEffect, useRef, useState } from "react";
import styles from './number-picker.module.css'
import { Ebigicon } from "../icon/ebig-icon";

interface Props {
    id?: string,
    value?: number,
    onChange?: (ev: number) => void,
    disabled?: boolean,
    readOnly?: boolean,
    /**
     * default: size32: body-3 \
     * recommend: size40: body-2 | size24: body-3
     * */
    className?: string,
    helperText?: string,
    helperTextColor?: string,
    /** default: 1 */
    volume?: number,
    style?: CSSProperties,
    iconColor?: string,
    min?: number,
    max?: number,
    type?: "outline" | "icon-button",
    simpleStyle?: boolean,
}

export const NumberPicker = ({ type = "icon-button", volume = 1, style = {}, ...props }: Props) => {
    const [val, setValue] = useState<number>(0);
    const inputRef = useRef<HTMLInputElement>(null)

    useEffect(() => {
        if (inputRef.current) {
            setValue(props.value ?? 0)
            inputRef.current.value = `${props.value ?? 0}`
        }
    }, [props.value, inputRef])

    return <label id={props.id}
        className={`row ${props.simpleStyle ? styles['simple-number-picker'] : styles["number-picker-container"]} ${props.className ?? (props.simpleStyle ? "" : 'body-2')} ${props.helperText?.length ? styles['helper-text'] : ""}`}
        number-picker-type={type}
        helper-text={props.helperText}
        style={{ '--helper-text-color': props.helperTextColor ?? '#e14337', ...style } as CSSProperties}
    >
        <Ebigicon src={`outline/user-interface/e-delete`}
            className="icon-button light"
            style={{ padding: "0.6rem", color: props.iconColor }}
            onClick={(ev) => {
                ev.stopPropagation()
                ev.preventDefault()
                let newValue = val - volume
                if (props.min === undefined || newValue >= props.min) {
                    if (volume % 1 === 0) newValue = Math.round(newValue)
                    else newValue = parseFloat(newValue.toFixed(1))
                    setValue(newValue)
                    if (inputRef.current) inputRef.current.value = `${newValue}`
                    props.onChange?.(newValue)
                }
            }} />
        <input
            ref={inputRef}
            readOnly={props.readOnly}
            disabled={props.disabled}
            onKeyDown={(ev) => {
                switch (ev.key.toLowerCase()) {
                    case "enter":
                        ev.currentTarget.blur()
                        break;
                    default:
                        break;
                }
            }}
            onFocus={(ev) => { ev.currentTarget.select() }}
            onBlur={(ev) => {
                let newValue = volume % 1 === 0 ? parseInt(ev.target.value.trim()) : parseFloat(ev.target.value.trim())
                if (isNaN(newValue)) ev.target.value = `${val}`
                else {
                    if (volume % 1 === 0) newValue = Math.round(newValue)
                    else newValue = parseFloat(newValue.toFixed(1))
                    if (props.min !== undefined && newValue < props.min) {
                        setValue(props.min)
                        if (inputRef.current) inputRef.current.value = `${props.min}`
                        props.onChange?.(props.min)
                    } else if (props.max !== undefined && newValue > props.max) {
                        setValue(props.max)
                        if (inputRef.current) inputRef.current.value = `${props.max}`
                        props.onChange?.(props.max)
                    } else {
                        setValue(newValue)
                        if (inputRef.current) inputRef.current.value = `${newValue}`
                        props.onChange?.(newValue)
                    }
                }
            }}
        />
        <Ebigicon src={`outline/user-interface/e-add`}
            className="icon-button light"
            style={{ padding: "0.6rem", color: props.iconColor }}
            onClick={(ev) => {
                ev.stopPropagation()
                ev.preventDefault()
                let newValue = val + volume
                if (props.max === undefined || newValue <= props.max) {
                    if (volume % 1 === 0) newValue = Math.round(newValue)
                    else newValue = parseFloat(newValue.toFixed(1))
                    setValue(newValue)
                    if (inputRef.current) inputRef.current.value = `${newValue}`
                    props.onChange?.(newValue)
                }
            }} />
    </label>
}