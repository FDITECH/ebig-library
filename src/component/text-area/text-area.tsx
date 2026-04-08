import React, { CSSProperties, forwardRef, ReactNode, useImperativeHandle, useRef } from "react";
import styles from './text-area.module.css'
import { UseFormRegister } from "react-hook-form";

interface TextAreaProps {
    id?: string,
    value?: string,
    maxLength?: number,
    defaultValue?: string,
    onChange?: React.ChangeEventHandler<HTMLTextAreaElement>,
    onBlur?: React.FocusEventHandler<HTMLTextAreaElement>,
    onFocus?: React.FocusEventHandler<HTMLTextAreaElement>,
    placeholder?: string,
    disabled?: boolean,
    readOnly?: boolean,
    autoFocus?: boolean,
    className?: string,
    helperText?: string,
    name?: string,
    helperTextColor?: string,
    style?: CSSProperties,
    register?: UseFormRegister<{}>,
    simpleStyle?: boolean,
    suffix?: ReactNode,
    prefix?: ReactNode,
}

export interface TextAreaRef {
    element?: HTMLLabelElement;
    inputElement?: HTMLTextAreaElement;
}

export const TextArea = forwardRef<TextAreaRef, TextAreaProps>(({ id, simpleStyle, prefix, suffix, className, helperText, helperTextColor = "#e14337", style = {}, register, ...props }, ref) => {
    const containerRef = useRef<HTMLLabelElement>(null)

    useImperativeHandle(ref, () => ({
        element: containerRef.current as any,
        inputElement: containerRef.current?.querySelector('textarea') as any,
    }), [containerRef.current])

    return <label
        id={id}
        ref={containerRef}
        className={`${simpleStyle ? styles['simple-text-area'] : styles['text-area-container']} row ${className ?? (simpleStyle ? "" : 'body-3')} ${helperText?.length ? styles['helper-text'] : ""}`}
        helper-text={helperText}
        style={{ '--helper-text-color': helperTextColor, ...style } as CSSProperties}
    >
        {prefix}
        {register ? <textarea {...props} {...register} /> : <textarea {...props} />}
        {suffix}
    </label>
})