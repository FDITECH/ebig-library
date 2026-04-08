import { CSSProperties, forwardRef, MouseEventHandler, useEffect, useImperativeHandle, useRef, useState } from "react"
import { IconLibrary } from "./iconLibrary";
import { Ebigicon } from "../icon/ebig-icon";

interface IconPickerProps {
    src?: string;
    style?: CSSProperties;
    onChange?: (src?: string) => void;
    size?: string | number;
    className?: string;
    color?: string;
    tooltip?: {
        message: string;
        position?: "top" | "bottom" | "left" | "right";
    };
}

interface IconPickerRef {
    value?: string;
    isOpen: boolean;
    setIsOpen: (isOpen: boolean) => void;
    openIconLibrary: (ev?: CSSProperties) => void
}

export const IconPicker = forwardRef<IconPickerRef, IconPickerProps>((props, ref) => {
    const divRef = useRef<HTMLDivElement>(null)
    const offsetRef = useRef<CSSProperties>(null)
    const [value, setValue] = useState<string | undefined>()
    const [isOpen, setIsOpen] = useState(false)

    useEffect(() => {
        setValue(props.src)
    }, [props.src])

    const onOpenIconLib = (offset?: CSSProperties) => {
        if (isOpen) return null;
        if (offset) {
            offsetRef.current = offset as any
        } else {
            const rect = divRef.current!.getBoundingClientRect()
            const tmp = document.createElement("div")
            tmp.style.position = "fixed"
            divRef.current!.after(tmp)
            let tmpRect = tmp.getBoundingClientRect()
            let tmpOffset: any = {}
            if (rect.bottom + 240 >= document.body.offsetHeight) tmpOffset.bottom = `calc(100dvh - ${rect.y}px + 2px)`
            else tmpOffset.top = rect.bottom + 2
            if (Math.abs(tmpRect.x - rect.x) > 2) {
                tmp.style.left = `${divRef.current!.offsetLeft}px`
                tmpRect = tmp.getBoundingClientRect()
                if (Math.abs(tmpRect.x - rect.x) > 2) {
                    tmpOffset.left = rect.x
                } else tmpOffset.left = divRef.current!.offsetLeft
            }
            tmp.remove()
            if (rect.x + 400 > document.body.offsetWidth) {
                tmpOffset.right = `calc(100dvw - ${rect.right}px)`
                delete tmpOffset.left
            }
            offsetRef.current = tmpOffset
        }
        setTimeout(() => { setIsOpen(true) }, 100)
    }

    useImperativeHandle(ref, () => ({
        value: value,
        isOpen: isOpen,
        setIsOpen: setIsOpen,
        openIconLibrary: onOpenIconLib
    }), [isOpen, value])

    return <>
        <Ebigicon ref={r => {
            if (r?.element) divRef.current = r.element as any
        }} src={(value ?? "outline/user-interface/setup-tools") as any} style={props.style} size={props.size} className={props.className} color={props.color} tooltip={props.tooltip} onClick={() => onOpenIconLib()} />
        {isOpen && <IconLibrary
            onSelect={(src) => {
                setValue(`${src.type}/${src.category}/${src.name}`)
                props.onChange?.(`${src.type}/${src.category}/${src.name}`)
                setIsOpen(false)
            }}
            style={{ position: "fixed", zIndex: 99, ...offsetRef.current }}
            onClose={() => { setIsOpen(false) }}
        />}
    </>
})