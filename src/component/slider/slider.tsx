import ReactDOM from "react-dom";
import { CSSProperties, useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import styles from './slider.module.css';
import { Text } from "../text/text";

interface SliderProps {
    formatter?: (value: number) => string,
    style?: CSSProperties,
    className?: string,
    min?: number,
    max?: number,
    /**
     * Dual thumb mode
     * */
    range?: boolean,
    /**
     * The default value of slider. When range is false, use number, otherwise, use [number, number]
     * */
    defaultValue?: number | [number, number],
    /**
     * Reverse the component
     * */
    // reverse?: boolean,
    // vertical?: boolean,
    disabled?: boolean,
    /**
     * default value: 6px
     * */
    rangeBarWidth?: number | string,
    marks?: Array<{ value: number, label?: string }>,
    tooltip?: boolean,
    step?: number,
    onChange?: (value: number | [number, number]) => void,
    onChangeComplete?: (value: number | [number, number]) => void,
}

export function Slider({ min = 0, max = 100, formatter, className, rangeBarWidth = 6, defaultValue, disabled, marks, onChange, onChangeComplete, range, step = 1, style = {}, tooltip }: SliderProps) {
    const [value, setValue] = useState<number | [number, number]>(range ? [min, max] : (min + max) / 2);
    const sliderRef = useRef<HTMLDivElement>(null);
    const [isDragging, setIsDragging] = useState<"min" | "max" | "single" | null>(null);
    const [showTooltip, setShowTooltip] = useState<HTMLButtonElement | null>(null)
    const extendAttribute = useMemo(() => {
        if (tooltip) return {
            onFocus: (ev: any) => { setShowTooltip(ev.target) },
            onMouseOver: (ev: any) => {
                setShowTooltip(ev.target)
            },
            onMouseOut: (ev: any) => {
                if (document.activeElement !== ev.target) setShowTooltip(null)
            },
            onBlur: () => {
                if (!sliderRef.current?.contains(document.activeElement)) setShowTooltip(null)
            }
        }
        return {}
    }, [tooltip, sliderRef])
    const tooltipValue = useDeferredValue(showTooltip && value ? { message: showTooltip.getAttribute("slider-value") ?? "", position: "top" } : null)

    useEffect(() => {
        let newValue = value
        const handleMouseMove = (e: MouseEvent) => {
            if (!isDragging || !sliderRef.current) return;

            const { left, width } = sliderRef.current.getBoundingClientRect();
            newValue = ((e.clientX - left) / width) * (max - min) + min;

            // Snap to step
            newValue = Math.round(newValue / step) * step;

            if (range) {
                if (Array.isArray(value)) {
                    let newValues = [...value] as [number, number];

                    if (isDragging === "min") {
                        newValues[0] = Math.max(min, Math.min(newValue, newValues[1] - step));
                    } else if (isDragging === "max") {
                        newValues[1] = Math.min(max, Math.max(newValue, newValues[0] + step));
                    }

                    setValue(newValues);
                    onChange?.(newValues);
                } else {
                    setValue([min, max]);
                    onChange?.([min, max]);
                }
            } else if (!range && typeof value === "number") {
                newValue = Math.max(min, Math.min(max, newValue));
                setValue(newValue);
                onChange?.(newValue);
            }
        };

        const handleMouseUp = () => {
            setIsDragging(null);
            if (onChangeComplete) onChangeComplete(newValue);
            document.removeEventListener("mousemove", handleMouseMove);
            document.removeEventListener("mouseup", handleMouseUp);
        };

        if (isDragging) {
            document.addEventListener("mousemove", handleMouseMove);
            document.addEventListener("mouseup", handleMouseUp);
        }
        return () => {
            document.removeEventListener("mousemove", handleMouseMove);
            document.removeEventListener("mouseup", handleMouseUp);
        };
    }, [min, max, step, value, range, onChange, onChangeComplete, isDragging]);

    useEffect(() => {
        if (!!defaultValue) {
            if (typeof defaultValue === "number") {
                if (range) {
                    if (defaultValue > max || defaultValue < min) setValue([min, max])
                    else setValue([min, defaultValue])
                } setValue(defaultValue)
            } else {
                if (isNaN(defaultValue[0]) || isNaN(defaultValue[1]) || defaultValue[0] > max || defaultValue[0] < min || defaultValue[1] > max || defaultValue[1] < min) setValue([min, max])
                else setValue(defaultValue)
            }
        }
    }, [defaultValue])

    return <div ref={sliderRef} className={`${styles["slider-container"]} ${className ?? 'subtitle-3'} ${range ? styles["range"] : ''}`} style={{ "--range-width": typeof rangeBarWidth === "number" ? `${rangeBarWidth}px` : rangeBarWidth, ...style } as any}>
        <div className={styles["range-bar"]}>
            <div
                className={styles["value-bar"]}
                style={{ marginLeft: range ? `${((value as any)[0] - min) / (max - min) * 100}%` : "none", width: `calc(${(range ? ((value as any)[1] - (value as any)[0]) : ((value as any) - min)) / (max - min) * 100}%)` }}
            />
        </div>
        {(tooltip && tooltipValue && showTooltip) ?
            ReactDOM.createPortal(<TooltipElement rect={showTooltip.getBoundingClientRect()} tooltip={tooltipValue as any} />, document.body) : <></>}
        {marks && marks.map(m => {
            if (m.value < min || m.value > max) {
                return null
            } else {
                return <>
                    <div className={styles["mark-point"]} style={{ left: `${((m.value - min) / (max - min)) * 100}%` }} />
                    <Text className={`${styles["mark-text"]}`} style={{ left: `${((m.value - min) / (max - min)) * 100}%` }}>{m.label ?? (formatter ? formatter(m.value) : m.value)}</Text>
                </>
            }
        })}
        {range ? <>
            <button type="button" disabled={disabled} className={styles["thumb-dot"]}
                {...extendAttribute}
                slider-value={formatter ? formatter((value as any)[0]) : (value as any)[0]}
                onPointerDown={disabled ? undefined : () => { setIsDragging("min") }}
                style={{ left: `${(((value as any)[0] - min) / (max - min)) * 100}%` }}
            />
            <button type="button" disabled={disabled} className={styles["thumb-dot"]}
                {...extendAttribute}
                slider-value={formatter ? formatter((value as any)[1]) : (value as any)[1]}
                onPointerDown={disabled ? undefined : () => { setIsDragging("max") }}
                style={{ left: `${(((value as any)[1] - min) / (max - min)) * 100}%` }}
            />
        </> : <button type="button" disabled={disabled} className={styles["thumb-dot"]}
            {...extendAttribute}
            slider-value={formatter ? formatter(value as any) : value}
            onPointerDown={disabled ? undefined : () => { setIsDragging("single") }}
            style={{ left: `${(((value as any) - min) / (max - min)) * 100}%` }}
        />}
    </div>
}

export const TooltipElement = ({ rect, tooltip }: { rect: any, tooltip: { message: string, position?: "top" | "bottom" | "left" | "right" } }) => {
    const pos = useMemo(() => {
        if (!rect) return null
        let tmp = tooltip.position ?? "bottom"
        if (document.body.offsetHeight - rect.bottom < 100 && tmp === "bottom") tmp = "top"
        else if (rect.top < 100 && tmp === "top") tmp = "bottom"
        if (document.body.offsetWidth - rect.right < 100 && tmp === "right") tmp = "left"
        else if (rect.left < 100 && tmp === "left") tmp = "right"
        return tmp
    }, [rect, tooltip.position])

    switch (pos) {
        case "top":
            return <div key={tooltip.message} ref={r => {
                if (r) {
                    const _r = r.getBoundingClientRect()
                    if (_r.x < 0) {
                        r.style.left = (rect.x + rect.width / 2) + "px"
                        r.style.transform = "translateX(-1.8rem)"
                        r.style.alignItems = "start"
                    } else if (_r.right > document.body.offsetWidth) {
                        r.style.left = "unset"
                        r.style.right = (document.body.offsetWidth - rect.right - rect.width / 2) + "px"
                        r.style.transform = "translateX(-1.4rem)"
                        r.style.alignItems = "end"
                    }
                }
            }} className={`col ${styles['tooltip-container']}`} style={{ alignItems: "center", bottom: document.body.offsetHeight - rect.top - 4, left: rect.left + (rect.width / 2), transform: "translateX(-50%)" }}>
                <Text className={`body-3 ${styles['tooltip-message']}`} maxLine={2}>{tooltip.message}</Text>
                <div className="row" style={{ padding: "0 1.2rem", transform: "translateY(-0.2rem)" }}><div style={{ borderLeft: "0.6rem solid transparent", borderRight: "0.6rem solid transparent", borderTop: "0.8rem solid var(--neutral-main-reverse-background-color,light-dark(#242428, #EFEFF0))", borderRadius: 2 }} /></div>
            </div>
        case "bottom":
            return <div key={tooltip.message} ref={r => {
                if (r) {
                    const _r = r.getBoundingClientRect()
                    if (_r.x < 0) {
                        r.style.left = (rect.x + rect.width / 2) + "px"
                        r.style.transform = "translateX(-1.8rem)"
                        r.style.alignItems = "start"
                    } else if (_r.right > document.body.offsetWidth) {
                        r.style.left = "unset"
                        r.style.right = (document.body.offsetWidth - rect.right - rect.width / 2) + "px"
                        r.style.transform = "translateX(-1.4rem)"
                        r.style.alignItems = "end"
                    }
                }
            }} className={`col ${styles['tooltip-container']}`} style={{ alignItems: "center", top: rect.bottom + 4, left: rect.left + (rect.width / 2), transform: "translateX(-50%)" }}>
                <div className="row" style={{ padding: "0 1.2rem", transform: "translateY(0.2rem)" }}><div style={{ borderLeft: "0.6rem solid transparent", borderRight: "0.6rem solid transparent", borderBottom: "0.8rem solid var(--neutral-main-reverse-background-color,light-dark(#242428, #EFEFF0))", borderRadius: 2 }} /></div>
                <Text className={`body-3 ${styles['tooltip-message']}`} maxLine={2}>{tooltip.message}</Text>
            </div >
        case "left":
            return <div key={tooltip.message} ref={r => {
                if (r) {
                    const _r = r.getBoundingClientRect()
                    if (_r.y < 0) {
                        r.style.top = (rect.y + rect.height / 2) + "px"
                        r.style.transform = "translateY(-1.8rem)"
                        r.style.alignItems = "start"
                    } else if (_r.bottom > document.body.offsetHeight) {
                        r.style.top = "unset"
                        r.style.bottom = (document.body.offsetHeight - rect.bottom - rect.height / 2) + "px"
                        r.style.transform = "translateY(-1.4rem)"
                        r.style.alignItems = "end"
                    }
                }
            }} className={`row ${styles['tooltip-container']}`} style={{ top: rect.top + (rect.height / 2), right: document.body.offsetWidth - rect.left - 4, transform: "translateY(-50%)" }}>
                <Text className={`body-3 ${styles['tooltip-message']}`} maxLine={2}>{tooltip.message}</Text>
                <div className="row" style={{ padding: "1.2rem 0", transform: "translateX(-0.2rem)" }}><div style={{ borderTop: "0.6rem solid transparent", borderBottom: "0.6rem solid transparent", borderLeft: "0.8rem solid var(--neutral-main-reverse-background-color,light-dark(#242428, #EFEFF0))", borderRadius: 2 }} /></div>
            </div>
        case "right":
            return <div key={tooltip.message} ref={r => {
                if (r) {
                    const _r = r.getBoundingClientRect()
                    if (_r.y < 0) {
                        r.style.top = (rect.y + rect.height / 2) + "px"
                        r.style.transform = "translateY(-1.8rem)"
                        r.style.alignItems = "start"
                    } else if (_r.bottom > document.body.offsetHeight) {
                        r.style.top = "unset"
                        r.style.bottom = (document.body.offsetHeight - rect.bottom - rect.height / 2) + "px"
                        r.style.transform = "translateY(-1.4rem)"
                        r.style.alignItems = "end"
                    }
                }
            }} className={`row ${styles['tooltip-container']}`} style={{ top: rect.top + (rect.height / 2), left: rect.right + 4, transform: "translateY(-50%)" }}>
                <div className="row" style={{ padding: "1.2rem 0", transform: "translateX(0.2rem)" }}><div style={{ borderTop: "0.6rem solid transparent", borderBottom: "0.6rem solid transparent", borderRight: "0.8rem solid var(--neutral-main-reverse-background-color,light-dark(#242428, #EFEFF0))", borderRadius: 2 }} /></div>
                <Text className={`body-3 ${styles['tooltip-message']}`} maxLine={2}>{tooltip.message}</Text>
            </div>
        default:
            return <></>
    }
}