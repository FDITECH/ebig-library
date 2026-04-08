import React, { CSSProperties, useEffect, useMemo, useRef } from 'react';
import styles from './radio-button.module.css';

interface RadioButtonProps {
    id?: string,
    onChange?: React.ChangeEventHandler<HTMLInputElement>,
    value?: string | number | readonly string[],
    disabled?: boolean,
    style?: CSSProperties,
    size?: number | string,
    checked?: boolean,
    name?: string,
    activeColor?: string,
    offColor?: string,
    className?: string,
}


export const RadioButton = (props: RadioButtonProps) => {
    const inputRef = useRef<HTMLInputElement>(null)
    const convertStyle: CSSProperties = useMemo(() => {
        let tmp: any = { '--size': props.size ? (typeof props.size === 'number') ? `${props.size}px` : props.size : '20px' }
        if (props.offColor) tmp['--off-color'] = props.offColor
        if (props.offColor) tmp['--active-color'] = props.activeColor
        if (props.style) {
            delete props.style.width
            delete props.style.minWidth
            delete props.style.maxWidth
            delete props.style.height
            delete props.style.minHeight
            delete props.style.maxHeight
            tmp = {
                ...props.style,
                ...tmp,
            }
        }
        return tmp
    }, [props.style, props.offColor, props.activeColor, props.size])

    return <label id={props.id} className={`row ${styles['radio-btn-container']} ${props.className ?? ''}`} style={convertStyle} >
        <input
            ref={inputRef}
            type="radio"
            checked={props.checked}
            name={props.name}
            value={props.value}
            disabled={props.disabled}
            onChange={props.onChange}
        />
        <span className={styles['checkmark']}></span>
    </label>
}