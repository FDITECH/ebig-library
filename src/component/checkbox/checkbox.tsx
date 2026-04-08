import React, { CSSProperties, useEffect, useMemo, useRef, useState } from 'react';
import styles from './checkbox.module.css';

interface CheckboxProps {
    id?: string,
    name?: string,
    onChange?: (value: boolean, target: HTMLInputElement) => void,
    value?: boolean | null,
    checkColor?: string,
    disabled?: boolean,
    className?: string,
    /** color is active color */
    style?: CSSProperties,
    /** default 2.4rem **/
    size?: number | string,
    onClick?: React.MouseEventHandler<HTMLLabelElement>
}

export const Checkbox = (props: CheckboxProps) => {
    const [checked, setChecked] = useState(props.value)
    const inputRef = useRef<HTMLInputElement>(null)
    const convertStyle: CSSProperties = useMemo(() => {
        let tmp: any = {
            width: props.size ?? '2.4rem',
            height: props.size ?? '2.4rem',
        }
        if (props.style) {
            delete props.style.width
            delete props.style.minWidth
            delete props.style.maxWidth
            delete props.style.height
            delete props.style.minHeight
            delete props.style.maxHeight
            delete props.style.backgroundColor
            tmp = {
                ...props.style,
                ...tmp,
            }
        }
        return tmp
    }, [props.size, props.style])

    useEffect(() => {
        if (props.value !== checked) setChecked(props.value)
    }, [props.value])

    return <label id={props.id} onClick={props.onClick} className={`${styles['checkbox-container']} row ${props.className ?? ''}`} style={convertStyle} is-null-value={`${props.value === null}`}>
        <input
            name={props.name}
            ref={inputRef}
            type="checkbox"
            checked={!!checked}
            hidden
            disabled={props.disabled}
            onChange={(ev) => {
                setChecked(ev.target.checked)
                if (props.onChange) props.onChange(ev.target.checked, ev.target)
            }}
        />
        <svg width="100%" height="100%" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ color: props.checkColor }}>
            <path fillRule="evenodd" clipRule="evenodd" d="M4.79199 9.95298C4.79199 9.69148 5.00398 9.47949 5.26548 9.47949H14.7352C14.9967 9.47949 15.2087 9.69148 15.2087 9.95298C15.2087 10.2145 14.9967 10.4265 14.7352 10.4265H5.26548C5.00398 10.4265 4.79199 10.2145 4.79199 9.95298Z" />
            <path fillRule="evenodd" clipRule="evenodd" d="M15.07 6.49317C15.2549 6.67808 15.2549 6.97787 15.07 7.16278L8.91467 13.3181C8.72977 13.503 8.42997 13.503 8.24507 13.3181L4.93067 10.0037C4.74577 9.81878 4.74577 9.51899 4.93067 9.33408C5.11558 9.14917 5.41537 9.14917 5.60028 9.33408L8.57987 12.3137L14.4004 6.49317C14.5853 6.30827 14.8851 6.30827 15.07 6.49317Z" />
        </svg>
    </label>
}



