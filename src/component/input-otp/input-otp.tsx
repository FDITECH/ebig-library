import React, { createRef, CSSProperties, ReactNode } from "react";
import styles from './input-otp.module.css'

interface Props {
    id?: string,
    onChange?: (value: string, target: HTMLDivElement) => void
    disabled?: boolean,
    value?: string,
    length?: number,
    inputStyle?: CSSProperties,
    style?: CSSProperties,
    className?: string,
    helperText?: string,
    helperTextColor?: string,
    autoFocus?: boolean
}

export class InputOtp extends React.Component<Props> {
    private containerRef = createRef<HTMLDivElement>()
    constructor(props: Props | Readonly<Props>) {
        super(props);
        this.getValue = this.getValue.bind(this)
    }

    getValue = () => {
        if (this.containerRef.current)
            return [...(this.containerRef.current.querySelectorAll("input") as any)].map(v => v.value).join("")
        else return this.props.value ?? ""
    }

    componentDidUpdate(prevProps: Readonly<Props>): void {
        if (prevProps.value !== this.props.value && this.containerRef.current) {
            const inputList = [...(this.containerRef.current.querySelectorAll("input") as any)]
            if (this.props.value?.length) {
                for (let i = 0; i < inputList.length; i++)   inputList[i].value = this.props.value[i]
            } else {
                for (let i = 0; i < inputList.length; i++)   inputList[i].value = ""
            }
        }
    }

    render(): ReactNode {
        return <div
            id={this.props.id}
            ref={this.containerRef}
            helper-text={this.props.helperText}
            style={this.props.style ? { ...({ '--helper-text-color': this.props.helperTextColor ?? '#e14337' } as CSSProperties), ...this.props.style } : ({ '--helper-text-color': this.props.helperTextColor ?? '#e14337' } as CSSProperties)}
            className={`row body-1 ${styles['input-opt-container']} ${this.props.helperText?.length && 'helper-text'} ${this.props.className ?? ''}`}
            onMouseDown={(ev: any) => {
                ev.stopPropagation()
                ev.preventDefault()
                const inputList: any = [...ev.target.closest("div").childNodes]
                for (const [index, input] of inputList.entries()) {
                    if (!input.value.length || index === (inputList.length - 1)) {
                        input.focus()
                        break;
                    }
                    continue;
                }
            }}
        >
            {Array.from({ length: this.props.length ?? 6 }).map((_, i) => <input
                key={"opt-" + i}
                autoFocus={i === 0 && this.props.autoFocus}
                disabled={this.props.disabled}
                style={this.props.inputStyle}
                onKeyDown={(ev: any) => {
                    const key = ev.key.toLowerCase()
                    switch (key) {
                        case "backspace":
                            if (ev.target.value.length) ev.target.value = ""
                            else if (ev.target.previousSibling?.localName === "input") ev.target.previousSibling.focus()
                            else ev.target.blur()
                            break;
                        case "delete":
                            ev.target.value = ""
                            break;
                        default:
                            ev.preventDefault()
                            ev.stopPropagation()
                            if (key === "v" && ev.ctrlKey) {
                                return navigator.clipboard.readText().then(text => {
                                    const otpRegex = /^\d{6}$/g
                                    if (otpRegex.test(text)) {
                                        const inputList: any = [...ev.target.closest("div").childNodes]
                                        inputList.forEach((input: any, i: number) => {
                                            input.value = text[i]
                                            input.focus()
                                        })
                                    }
                                })
                            } else {
                                const numberCheck = /[0-9]/g
                                if (numberCheck.test(key) && !key.startsWith("f")) {
                                    if (!ev.target.value.length) ev.target.value = key
                                    if (ev.target.nextSibling?.localName === "input" && !ev.target.nextSibling.value.length) ev.target.nextSibling.focus()
                                    else ev.target.blur()
                                }
                            }
                            break;
                    }
                }}
                onBlur={() => {
                    if (this.props.onChange) this.props.onChange(this.getValue(), this.containerRef.current!)
                }}
            />)}
        </div>
    }
}

