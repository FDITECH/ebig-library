import React, { CSSProperties, ReactNode, useEffect, useRef } from 'react'
import './popup.css'

/** Renders a raw HTMLElement (from document.createElement) inside React */
function HtmlElementWrapper({ element }: { element: HTMLElement }) {
    const ref = useRef<HTMLDivElement>(null)
    useEffect(() => {
        if (ref.current) {
            ref.current.innerHTML = ''
            ref.current.appendChild(element.cloneNode(true))
        }
    }, [element])
    return <div ref={ref} style={{ display: 'contents' }} />
}

interface PopupState {
    readonly open?: boolean,
    heading?: ReactNode,
    body?: ReactNode,
    content?: ReactNode | HTMLElement,
    footer?: ReactNode,
    clickOverlayClosePopup?: boolean,
    style?: CSSProperties,
    className?: string,
    hideOverlay?: boolean,
}

export const showPopup = (props: {
    ref: React.RefObject<Popup | undefined>,
    heading?: ReactNode,
    content?: ReactNode | HTMLElement,
    body?: ReactNode,
    footer?: ReactNode,
    clickOverlayClosePopup?: boolean,
    style?: CSSProperties,
    className?: string,
    hideOverlay?: boolean,
}) => {
    props.ref?.current?.onOpen({
        heading: props.heading,
        content: props.content,
        body: props.body,
        footer: props.footer,
        clickOverlayClosePopup: props.clickOverlayClosePopup,
        style: props.style,
        className: props.className,
        hideOverlay: props.hideOverlay
    })
}

export const closePopup = (ref: React.RefObject<Popup>) => {
    ref.current.onClose()
}

export class Popup extends React.Component<Object, PopupState> {
    constructor(props: Object | Readonly<Object>) {
        super(props);
    }
    state: Readonly<PopupState> = {
        open: false,
    }

    onOpen(data: PopupState) {
        this.setState({ open: true, ...data })
    }

    onClose() {
        this.setState({ open: false })
    }

    render() {
        return (
            <>
                {this.state.open &&
                    <PopupOverlay className={this.state.hideOverlay ? 'hidden-overlay' : ''} onClose={(this.state.hideOverlay || this.state.clickOverlayClosePopup) ? () => { this.onClose() } : undefined}>
                        {this.state.content ?? <div className={`popup-container col ${this.state.className ?? ""}`} onClick={e => e.stopPropagation()} style={this.state.style} >
                            {this.state.heading}
                            {this.state.body}
                            {this.state.footer}
                        </div>}
                    </PopupOverlay>}
            </>
        )
    }
}

export function PopupOverlay({ children, onClose, className, style, onOpen }: { children?: ReactNode | HTMLElement, className?: string, onClose?: (ev: MouseEvent) => void, style?: CSSProperties, onOpen?: (ev: HTMLDivElement) => void }) {
    const overlayRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        if (overlayRef.current) {
            const parentElement = overlayRef.current.parentElement
            if (parentElement) {
                const parentRect = parentElement.getBoundingClientRect()
                overlayRef.current.style.setProperty("--originX", `-${Math.round(parentRect.x)}px`)
                overlayRef.current.style.setProperty("--originY", `-${Math.round(parentRect.y)}px`)
            }
            if (onClose) {
                const onClickDropDown = (ev: any) => {
                    if ((ev.target === overlayRef.current || !overlayRef.current!.contains(ev.target)) && !ev.target.closest(`div[class*="_dialog-overlay"]`) && !ev.target.closest(`div[class*="ck-fullscreen__main-wrapper"]`) && !ev.target.closest(`.Toastify__toast-container`) && !ev.target.closest(`.ck-body-wrapper`)) {
                        const firstChild = overlayRef.current?.firstChild as HTMLElement
                        if (firstChild) {
                            if (firstChild.classList.contains("right-drawer")) {
                                firstChild.classList.add("right-drawer-collapse")
                                firstChild.classList.remove("right-drawer")
                                return setTimeout(() => { onClose(ev) }, 500)
                            } else if (firstChild.classList.contains("left-drawer")) {
                                firstChild.classList.add("left-drawer-collapse")
                                firstChild.classList.remove("left-drawer")
                                return setTimeout(() => { onClose(ev) }, 500)
                            }
                        }
                        onClose(ev)
                    }
                }
                window.document.body.addEventListener("mousedown", onClickDropDown)
                return () => {
                    window.document.body.removeEventListener("mousedown", onClickDropDown)
                }
            }
        }
    }, [overlayRef.current])

    useEffect(() => {
        if (overlayRef.current && onOpen) onOpen(overlayRef.current)
    }, [overlayRef.current, onOpen])

    useEffect(() => {
        if (overlayRef.current && overlayRef.current.firstChild && !onOpen) {
            const popupContent = overlayRef.current!.firstChild as HTMLElement
            if (!popupContent.classList.contains("right-drawer") && !popupContent.classList.contains("left-drawer")) {
                const timer = setTimeout(() => {
                    const rect = popupContent.getBoundingClientRect()
                    if (rect.x < 0) {
                        popupContent.style.left = "0px"
                        popupContent.style.right = "unset"
                    } else if (rect.x > document.body.offsetWidth) {
                        popupContent.style.transform = "translateX(var(--originX))"
                    } else if (rect.right > document.body.offsetWidth) {
                        popupContent.style.right = "0px"
                        popupContent.style.left = "unset"
                    }
                    if (rect.y < 0) {
                        popupContent.style.top = "0px"
                        popupContent.style.bottom = "unset"
                    } else if (rect.y > document.body.offsetHeight) {
                        if (popupContent.style.transform) popupContent.style.transform = "translate(var(--originX),var(--originY))"
                        else popupContent.style.transform = "translateY(var(--originY))"
                    } else if (rect.bottom > document.body.offsetHeight) {
                        popupContent.style.bottom = "0px"
                        popupContent.style.top = "unset"
                    }
                }, 250)
                return () => { clearTimeout(timer) }
            }
        }
    }, [overlayRef])

    return <div
        ref={overlayRef}
        className={`popup-overlay ${className ?? ""}`}
        style={style}
    >{children instanceof HTMLElement ? <HtmlElementWrapper element={children} /> : children}</div>
}