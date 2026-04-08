import { CSSProperties, useEffect, useRef } from "react";
import styles from './color-picker.module.css'
import { Util } from "../../controller/utils";

interface ColorPickerProps {
    id?: string;
    value?: string;
    type?: "input" | "select";
    onChange?: (v: string) => void;
    placeholder?: string,
    disabled?: boolean,
    readOnly?: boolean,
    /** 
     * default: size40: body-3
     * recommend: size48: body-3 | size32: body-3 | size24: body-3
     *  */
    className?: string,
    helperText?: string,
    helperTextColor?: string,
    style?: CSSProperties,
    simpleStyle?: boolean
}

export const ColorPicker = ({ style = {}, type = "input", ...props }: ColorPickerProps) => {
    const containerRef = useRef<any>(null)

    useEffect(() => {
        if (props.value && containerRef.current) {
            containerRef.current.querySelector('input[type="color"]').value = props.value.slice(0, 7)
            if (type === "input") {
                containerRef.current.querySelector('input[type="text"]').value = props.value.slice(0, 7)
                containerRef.current.querySelector('input[type="number"]').value = Util.hexToPercent(props.value.slice(7))
            }
        } else if (containerRef.current) {
            containerRef.current.querySelector('input[type="color"]').value = '#000000'
            if (type === "input") {
                containerRef.current.querySelector('input[type="text"]').value = ''
                containerRef.current.querySelector('input[type="number"]').value = ''
            }
        }
    }, [props.value])

    switch (type) {
        case "input":
            return <div
                id={props.id}
                ref={containerRef}
                className={`${props.simpleStyle ? styles['simple-color-picker'] : styles['color-picker-container']} row ${props.className ?? (props.simpleStyle ? "" : 'body-3')} ${props.helperText?.length ? styles['helper-text'] : ""}`}
                helper-text={props.helperText}
                style={{ '--helper-text-color': props.helperTextColor ?? '#e14337', ...style } as CSSProperties}
            >
                <label style={{ backgroundColor: props.value ?? "#000000" }}>
                    <input
                        type='color'
                        disabled={props.disabled}
                        onChange={(ev) => {
                            const _opacityValue = containerRef.current!.querySelector('input[type="number"]');
                            const newValue = `${ev.target.value}${Util.percentToHex(parseInt(_opacityValue.value?.length ? _opacityValue.value : "100")).toLowerCase()}`
                            props.onChange?.(newValue)
                        }} />
                </label>
                <input
                    maxLength={7}
                    type='text'
                    placeholder={props.placeholder}
                    readOnly={props.readOnly}
                    disabled={props.disabled}
                    onBlur={(ev) => {
                        const newVl = ev.target.value.replace(/#/g, "").substring(0, 6);
                        const _opacityValue = containerRef.current.querySelector('input[type="number"]');
                        const newValue = `#${newVl}${Util.percentToHex(parseInt(_opacityValue.value?.length ? _opacityValue.value : "100")).toLowerCase()}`
                        props.onChange?.(newValue)
                    }}
                    onKeyDown={(ev) => {
                        switch (ev.key.toLowerCase()) {
                            case "enter":
                                ev.currentTarget.blur()
                                break;
                            default:
                                break;
                        }
                    }}
                />
                <label className="row">
                    <input
                        type='number'
                        placeholder="opacity"
                        onKeyDown={(ev: any) => ev.key.toLowerCase() === 'enter' && ev.target.blur()}
                        onFocus={(ev) => ev.target.select()}
                        disabled={props.disabled}
                        onBlur={(ev) => {
                            let _vl = parseInt(ev.target.value);
                            if (isNaN(_vl) || _vl > 100) _vl = 100;
                            else if (_vl < 0) _vl = 0;
                            const _colorValue = containerRef.current?.querySelector('input[type="color"]').value;
                            const newValue = `${_colorValue}${Util.percentToHex(_vl).toLowerCase()}`
                            props.onChange?.(newValue)
                        }} />
                    <span>%</span>
                </label>
            </div>
        default:
            return <label id={props.id}
                ref={containerRef}
                className={`${props.simpleStyle ? styles['simple-color-picker'] : styles['color-picker-container']} row ${props.className ?? (props.simpleStyle ? "" : 'body-3')} ${props.helperText?.length ? styles['helper-text'] : ""}`}
                helper-text={props.helperText}
                style={{ '--helper-text-color': props.helperTextColor ?? '#e14337', ...style, aspectRatio: "1 / 1", backgroundColor: props.value ?? "#000000" } as CSSProperties}
            >
                <input
                    type='color'
                    disabled={props.disabled}
                    onChange={(ev) => {
                        props.onChange?.(ev.target.value + "ff")
                    }} />
            </label>
    }
}