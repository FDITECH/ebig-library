import styles from "./index.module.css";
import { CSSProperties, forwardRef, ReactNode, useCallback, useEffect, useImperativeHandle, useRef, useState } from "react";
import { closePopup, showPopup, Button, NavLink, Popup, Text, TextField, Util, Ebigicon } from "../../index";
import EmojiPicker, { EmojiClickData, EmojiStyle } from "emoji-picker-react"
import { useTranslation } from "react-i18next";

export interface SuggestionProps {
    triggerPattern: string;
    render: (offset: { top: number, left: number }, match: string, handleSelectSuggest: (newElement?: HTMLElement) => void) => ReactNode | HTMLElement;
}

interface Props {
    id?: string;
    autoFocus?: boolean;
    initValue?: string;
    onChange?: (value: string, htmlElement: HTMLDivElement) => void;
    onBlur?: (value: string, htmlElement: HTMLDivElement) => void;
    style?: CSSProperties;
    className?: string;
    onSuggest?: Array<SuggestionProps>;
    placeholder?: string;
    hideToolbar?: boolean;
    disabled?: boolean;
    helperText?: string;
    helperTextColor?: string;
    /** default: ["emoji", "bold", "italic", "underline", "hyperlink", "rubytext"] */
    customToolbar?: ReactNode | Array<ReactNode | "heading" | "emoji" | "bold" | "italic" | "underline" | "hyperlink" | "rubytext">;
    simpleStyle?: boolean;
    readOnly?: boolean;
}

interface RefProps {
    isOpenEmoji: boolean;
    showEmoji: (s: CSSProperties, config?: { height?: number, emojiStyle?: EmojiStyle, searchDisabled?: boolean, emojiPickerClassName?: string }) => void;
    element: HTMLDivElement;
    inputElement: HTMLDivElement;
    focus: () => void;
}

export const EbigEditor = forwardRef<RefProps, Props>(({ id, onChange, onBlur, disabled, readOnly, placeholder, style = {}, className, onSuggest, autoFocus, initValue, hideToolbar, helperText, helperTextColor, customToolbar, simpleStyle }, ref) => {
    const inputContentRef = useRef<HTMLDivElement>(null)
    const savedRange = useRef<any>(null)
    const popupRef = useRef<any>(null)
    const emojiOffsetRef = useRef<CSSProperties>(null)
    const insertLinkOffsetRef = useRef<CSSProperties>(null)
    const rubyTextOffsetRef = useRef<CSSProperties>(null)
    const [isOpenEmoji, setIsOpenEmoji] = useState<{ height?: number, emojiStyle?: EmojiStyle, searchDisabled?: boolean, emojiPickerClassName?: string }>()
    const [showLinkPrompt, setShowLinkPrompt] = useState(false);
    const [showLinkDetails, setShowLinkDetails] = useState<HTMLAnchorElement | null>(null);
    const [showRubyPrompt, setShowRubyPrompt] = useState(false);

    const onSaveRange = (ev?: any) => {
        if (ev?.target.innerHTML === "<br>") ev.target.innerHTML = ""
        const selection = window.getSelection();
        if (selection && (inputContentRef.current?.contains(selection.focusNode) || (selection.focusNode?.nodeName !== "#text" && (selection.focusNode as any)?.closest(`div[class*="ebig-editor-input"]`)))) {
            savedRange.current = selection.getRangeAt(0)
        } else if (selection && !savedRange.current) {
            const range = document.createRange();
            range.selectNodeContents(inputContentRef.current!);
            selection.removeAllRanges();
            selection.addRange(range);
            savedRange.current = range
        }
    }

    const httpsUrlRegex = /^https:\/\/([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}(?::\d+)?(\/[^\s?#]*)?(\?[^\s#]*)?(#[^\s]*)?$/;
    const onRestoreRange = (content?: string | HTMLElement) => {
        const selection = window.getSelection();
        if (selection) {
            if (content) {
                if (typeof content === "string") {
                    if (httpsUrlRegex.test(content)) {
                        var emoji: any = document.createElement("a")
                        emoji.href = content;
                        emoji.target = "_blank"
                        emoji.textContent = content
                    } else {
                        emoji = document.createTextNode(content);
                    }
                    savedRange.current.deleteContents();
                    savedRange.current.insertNode(emoji);
                    savedRange.current.setStartAfter(emoji);
                    savedRange.current.setEndAfter(emoji);
                } else {
                    savedRange.current.insertNode(content);
                    savedRange.current.setStartAfter(content);
                    savedRange.current.collapse(true);
                    selection.removeAllRanges();
                    selection.addRange(savedRange.current);
                }
            } else {
                selection.removeAllRanges();
                selection.addRange(savedRange.current);
            }
        }
    }

    const onInput = (ev: any) => {
        if (ev.target.innerHTML === "<br>") ev.target.innerHTML = ""
        const sel = window.getSelection();
        if (sel) {
            const range = sel.getRangeAt(0);
            if (!sel.rangeCount || !range.collapsed || !onSuggest?.length) {
                savedRange.current = range
                onChange?.(inputContentRef.current!.innerHTML, inputContentRef.current!)
                return savedRange.current.collapse()
            }

            const node = sel.anchorNode;
            const offset = sel.anchorOffset;

            // Get text content from the node up to the caret
            const text = node!.textContent!.slice(0, offset);
            let match: RegExpMatchArray | null = null;
            let suggestionItem: SuggestionProps | null = null;
            for (const sgt of onSuggest) {
                match = text.match(sgt.triggerPattern);
                if (match) {
                    suggestionItem = sgt
                    break;
                }
            }

            if (!match || !suggestionItem) {
                if (document.querySelector(".people-suggestion")) closePopup(popupRef)
                savedRange.current = range; // No word starting with @
                onChange?.(inputContentRef.current!.innerHTML, inputContentRef.current!)
                return savedRange.current.collapse()
            }
            // Insert a marker at caret
            const marker = document.createElement("span");
            marker.appendChild(document.createTextNode("\u200b"));
            range.insertNode(marker);

            // Restore caret after the marker
            range.setStartAfter(marker);
            // range.collapse(true);
            sel.removeAllRanges();
            sel.addRange(range);

            const rect = marker.getBoundingClientRect();

            marker.remove();
            showPopup({
                ref: popupRef,
                hideOverlay: true,
                content: suggestionItem.render(
                    { top: rect.bottom + window.scrollY + 2, left: rect.left + window.scrollX },
                    match[0],
                    (ev) => {
                        closePopup(popupRef)
                        if (ev) {
                            node!.textContent = node!.textContent!.slice(0, offset).replace(match[0], "");
                            const range = sel.getRangeAt(0);
                            range.deleteContents();
                            range.insertNode(ev)
                            range.insertNode(document.createTextNode(String.fromCharCode(0x200b)));
                            onChange?.(inputContentRef.current!.innerHTML, inputContentRef.current!)
                            sel.removeAllRanges();
                            sel.addRange(range)
                            range.collapse()
                        }
                    }
                )
            })
        }
    }

    const showEmoji = (s: CSSProperties, config?: { height?: number, emojiStyle?: EmojiStyle, searchDisabled?: boolean, emojiPickerClassName?: string }) => {
        onSaveRange()
        emojiOffsetRef.current = s
        setIsOpenEmoji(config ?? {})
    }

    const handleFocus = () => {
        setTimeout(() => {
            if (!inputContentRef.current) return
            inputContentRef.current.focus()
            const range = document.createRange();
            range.selectNodeContents(inputContentRef.current!);
            range.collapse(false); // Move caret to end
            const sel = window.getSelection();
            sel!.removeAllRanges();
            sel!.addRange(range);
        }, 150)
    }

    useImperativeHandle(ref, () => ({
        isOpenEmoji: !!isOpenEmoji,
        showEmoji: showEmoji,
        element: inputContentRef.current!.parentElement as HTMLDivElement,
        inputElement: inputContentRef.current as HTMLDivElement,
        focus: handleFocus,
    }), [isOpenEmoji]);

    useEffect(() => {
        if (autoFocus && inputContentRef.current) handleFocus()
    }, [autoFocus])

    useEffect(() => {
        if (initValue && inputContentRef.current && inputContentRef.current.innerHTML.trim() !== initValue.trim()) {
            const tmp = document.createElement("div")
            tmp.innerHTML = initValue
            tmp.querySelectorAll("*").forEach((el: any) => {
                if (el.style) {
                    el.style.fontFamily = ""
                    el.style.fontSize = ""
                    el.style.lineHeight = ""
                    el.style.color = ""
                    el.style.backgroundColor = ""
                    el.style.font = ""
                }
            })
            tmp.remove()
            inputContentRef.current!.innerHTML = tmp.innerHTML
        }
    }, [!initValue?.length])

    const [activeStyles, setActiveStyles] = useState({
        bold: false,
        italic: false,
        underline: false,
        heading: false,
    });

    const handleFormat = useCallback((command: "bold" | "italic" | "underline") => {
        document.execCommand(command, false);
        inputContentRef.current?.focus();
        updateActiveStyles();
    }, []);

    const handleHeading = useCallback(() => {
        const isH3 = document.queryCommandValue('formatBlock') === 'h3';
        document.execCommand('formatBlock', false, isH3 ? 'div' : 'h3');
        inputContentRef.current?.focus();
        updateActiveStyles();
    }, []);

    const handleLink = () => {
        const selection = window.getSelection();
        if (selection && selection.rangeCount > 0) {
            document.execCommand('createLink', false, "https://");
            savedRange.current = selection.getRangeAt(0);
            let selectedLink = savedRange.current.startContainer;
            if (selectedLink.nodeType === Node.TEXT_NODE) selectedLink = selectedLink.parentElement.closest("a")
            selectedLink.onmousedown = (ev: any) => {
                ev.preventDefault();
            }
            selectedLink.onclick = () => {
                const rectLink = selectedLink.getBoundingClientRect();
                insertLinkOffsetRef.current = { top: rectLink.bottom + 2 }
                setShowLinkDetails(selectedLink)
            }
            const rect = savedRange.current.getBoundingClientRect();
            insertLinkOffsetRef.current = { top: rect.bottom + 2 }
            setShowLinkPrompt(true);
        }
    };

    const applyLinkToATag = (url?: string) => {
        if (url) showLinkDetails!.href = url
        setShowLinkDetails(null)
    }

    const applyLink = (url?: string) => {
        setShowLinkPrompt(false);
        let selectedLink = savedRange.current.startContainer;
        if (selectedLink.nodeType === Node.TEXT_NODE) selectedLink = selectedLink.parentElement.closest("a")
        const selection = window.getSelection();
        selection?.removeAllRanges();
        selection?.addRange(savedRange.current);
        if (!url) {
            document.execCommand('unLink', false, "https://");
            return;
        }
        selectedLink.href = url
        updateActiveStyles();
    };

    const handleRubyText = () => {
        const selection = window.getSelection();
        if (selection && selection.rangeCount > 0 && !selection.isCollapsed) {
            savedRange.current = selection.getRangeAt(0);
            const rect = savedRange.current.getBoundingClientRect();
            rubyTextOffsetRef.current = { top: rect.bottom + 2 };
            setShowRubyPrompt(true);
        }
    };

    const applyRubyText = (annotation?: string) => {
        setShowRubyPrompt(false);
        if (!annotation?.trim() || !savedRange.current) return;

        const ruby = document.createElement("ruby");
        const fragment = savedRange.current.cloneContents();
        ruby.appendChild(fragment);
        const rt = document.createElement("rt");
        rt.textContent = annotation.trim();
        ruby.appendChild(rt);

        savedRange.current.deleteContents();
        savedRange.current.insertNode(ruby);
        savedRange.current.setStartAfter(ruby);
        savedRange.current.collapse(true);

        const sel = window.getSelection();
        sel?.removeAllRanges();
        sel?.addRange(savedRange.current);

        onChange?.(inputContentRef.current!.innerHTML, inputContentRef.current!);
    };

    const updateActiveStyles = useCallback(() => {
        setActiveStyles({
            bold: document.queryCommandState('bold'),
            italic: document.queryCommandState('italic'),
            underline: document.queryCommandState('underline'),
            heading: document.queryCommandValue('formatBlock') === 'h3',
        });
    }, []);

    useEffect(() => {
        const editor = inputContentRef.current;
        if (!editor) return;

        const events = ['mouseup', 'keyup', 'focus'];

        const handleStyleUpdate = () => {
            setTimeout(updateActiveStyles, 0);
        };

        events.forEach(event => {
            editor.addEventListener(event, handleStyleUpdate);
        });

        // Dọn dẹp các trình lắng nghe khi component bị hủy
        return () => {
            events.forEach(event => {
                editor.removeEventListener(event, handleStyleUpdate);
            });
        };
    }, [updateActiveStyles]);

    const returnEmoji = (k?: string) => {
        return <Ebigicon
            key={k}
            src='outline/emoticons/smile' size={16}
            onMouseDown={(ev) => { ev.preventDefault() }}
            onClick={(disabled || readOnly) ? undefined : ((ev: any) => {
                if (isOpenEmoji) return null;
                const rect = ev.target.closest("div").getBoundingClientRect()
                const tmp = document.createElement("div")
                tmp.style.position = "fixed"
                ev.currentTarget.after(tmp)
                let tmpRect = tmp.getBoundingClientRect()
                let offset: any = { left: rect.x, top: rect.bottom + 1 }
                if (offset.left + 268 >= document.body.offsetWidth) {
                    delete offset.left
                    offset.right = `calc(100dvw - ${rect.right}px)`
                }
                if (offset.top + 268 >= document.body.offsetHeight) {
                    delete offset.top
                    offset.bottom = `calc(100dvh - ${rect.bottom}px)`
                }
                showEmoji(offset)
            })} />
    }

    const returnHeading = (k?: string) => {
        return <Ebigicon
            key={k}
            src='outline/text/heading-1'
            className="icon-button size24 light"
            size={16}
            color={activeStyles.heading ? "var(--primary-main-color)" : undefined}
            style={activeStyles.heading ? { backgroundColor: "var(--primary-background)" } : undefined}
            onMouseDown={(ev) => { ev.preventDefault() }}
            onClick={(disabled || readOnly) ? undefined : handleHeading}
        />
    }

    const returnBold = (k?: string) => {
        return <Ebigicon
            key={k}
            src='outline/text/bold'
            className="icon-button size24 light"
            size={13}
            color={activeStyles.bold ? "var(--primary-main-color)" : undefined}
            style={activeStyles.bold ? { backgroundColor: "var(--primary-background)" } : undefined}
            onMouseDown={(ev) => { ev.preventDefault() }}
            onClick={(disabled || readOnly) ? undefined : (() => { handleFormat("bold") })}
        />
    }

    const returnItalic = (k?: string) => {
        return <Ebigicon
            key={k}
            src='outline/editing/text-italic'
            className="icon-button size24 light"
            size={14}
            color={activeStyles.italic ? "var(--primary-main-color)" : undefined}
            style={activeStyles.italic ? { backgroundColor: "var(--primary-background)" } : undefined}
            onMouseDown={(ev) => { ev.preventDefault() }}
            onClick={(disabled || readOnly) ? undefined : (() => { handleFormat("italic") })}
        />
    }

    const returnUnderline = (k?: string) => {
        return <Ebigicon
            key={k}
            src='outline/text/underline'
            className="icon-button size24 light"
            size={14}
            color={activeStyles.underline ? "var(--primary-main-color)" : undefined}
            style={activeStyles.underline ? { backgroundColor: "var(--primary-background)" } : undefined}
            onMouseDown={(ev) => { ev.preventDefault() }}
            onClick={(disabled || readOnly) ? undefined : (() => { handleFormat("underline") })}
        />
    }

    const returnHyperlink = (k?: string) => {
        return <Ebigicon
            key={k}
            src='outline/user-interface/hyperlink'
            className='icon-button size24 light'
            size={16}
            onMouseDown={(ev) => { ev.preventDefault() }}
            onClick={(disabled || readOnly) ? undefined : handleLink}
        />
    }

    const returnRubyText = (k?: string) => {
        return <Ebigicon
            key={k}
            src='outline/text/superscript'
            className='icon-button size24 light'
            size={14}
            onMouseDown={(ev) => { ev.preventDefault() }}
            onClick={(disabled || readOnly) ? undefined : handleRubyText}
        />
    }

    return <div
        id={id}
        className={`col ${simpleStyle ? styles["ebig-editor-simple-style"] : styles["ebig-editor-container"]} ${disabled ? styles["disabled"] : ""} ${className ?? "body-3"} ${helperText?.length ? styles['helper-text'] : ""}`}
        style={{ '--helper-text-color': helperTextColor ?? '#e14337', ...style } as CSSProperties}
        helper-text={helperText}
    >
        <div ref={inputContentRef}
            className={`${styles["ebig-editor-input"]}`}
            suppressContentEditableWarning
            contentEditable={!disabled && !readOnly}
            onFocus={(disabled || readOnly) ? undefined : onSaveRange}
            onInput={(disabled || readOnly) ? undefined : onInput}
            onPaste={(disabled || readOnly) ? undefined : ((ev) => {
                ev.preventDefault()
                const text = ev.clipboardData.getData("text/plain")
                onRestoreRange(text)
                onChange?.(inputContentRef.current!.innerHTML, inputContentRef.current!)
            })}
            onBlur={(disabled || readOnly) ? undefined : (() => { onBlur?.(inputContentRef.current!.innerHTML, inputContentRef.current!) })}
            {...(placeholder ? { placeholder: placeholder } : {})}
        />
        <Popup ref={popupRef} />
        {showLinkDetails && <PopupLinkDetails
            element={showLinkDetails}
            onClose={() => {
                setTimeout(applyLinkToATag, 150)
            }}
            onRemove={() => {
                showLinkDetails.replaceWith(...showLinkDetails.childNodes)
            }}
            onApply={applyLinkToATag}
            style={insertLinkOffsetRef.current as any}
        />}
        {showLinkPrompt && <PopupLinkPrompt
            onClose={() => {
                setTimeout(() => {
                    setShowLinkPrompt(false)
                    applyLink()
                }, 150)
            }}
            onApply={applyLink}
            style={insertLinkOffsetRef.current as any}
        />}
        {showRubyPrompt && <PopupRubyTextPrompt
            onClose={() => { setTimeout(() => applyRubyText(), 150) }}
            onApply={applyRubyText}
            style={rubyTextOffsetRef.current as any}
        />}
        {!hideToolbar && ((!customToolbar || Array.isArray(customToolbar)) ? <div className='row' style={{ gap: 4 }}>
            {Array.isArray(customToolbar) ? customToolbar.map((tb, i) => {
                switch (tb) {
                    case "heading":
                        return returnHeading(`${tb}-${i}`)
                    case "emoji":
                        return returnEmoji(`${tb}-${i}`)
                    case "bold":
                        return returnBold(`${tb}-${i}`)
                    case "italic":
                        return returnItalic(`${tb}-${i}`)
                    case "underline":
                        return returnUnderline(`${tb}-${i}`)
                    case "hyperlink":
                        return returnHyperlink(`${tb}-${i}`)
                    case "rubytext":
                        return returnRubyText(`${tb}-${i}`)
                    default:
                        return tb
                }
            }) :
                <>
                    {returnHeading()}
                    {returnEmoji()}
                    {returnBold()}
                    {returnItalic()}
                    {returnUnderline()}
                    {returnHyperlink()}
                    {returnRubyText()}
                </>}
        </div> : customToolbar)}
        {isOpenEmoji && <PopupEmojiPicker
            onClose={() => { setTimeout(() => { setIsOpenEmoji(undefined) }, 150) }}
            style={emojiOffsetRef.current as any}
            {...isOpenEmoji}
            width={260}
            height={260}
            onSelect={(em) => {
                const img = document.createElement("img")
                img.src = em.imageUrl
                img.alt = em.emoji
                img.className = styles["emoji"]
                onRestoreRange(img)
                onChange?.(inputContentRef.current!.innerHTML, inputContentRef.current!)
            }}
        />}
    </div>
})


const PopupEmojiPicker = ({ height = 400, width = 300, ...props }: { style: CSSProperties, emojiPickerClassName?: string, searchDisabled?: boolean, height?: number, width?: number, emojiStyle?: EmojiStyle, onClose: () => void, onSelect: (emoji: EmojiClickData) => void }) => {
    const divRef = useRef<HTMLDivElement>(null)
    const { t } = useTranslation()

    useEffect(() => {
        if (divRef.current) {
            const onClickDropDown = (ev: any) => {
                if (ev.target === divRef.current || !divRef.current!.contains(ev.target)) props.onClose()
            }
            window.document.body.addEventListener("mousedown", onClickDropDown)
            return () => {
                window.document.body.removeEventListener("mousedown", onClickDropDown)
            }
        }
    }, [divRef.current])

    return <div ref={divRef} className={`col ${styles["dropdown"]}`} style={props.style}>
        <EmojiPicker
            lazyLoadEmojis
            className={props.emojiPickerClassName}
            theme={Util.getStorage("theme") as any}
            skinTonesDisabled
            emojiStyle={props.emojiStyle ?? EmojiStyle.APPLE}
            height={height}
            width={width}
            style={{ "--epr-emoji-size": "20px", "--epr-category-navigation-button-size": "22px", "--epr-category-label-height": "32px", "--epr-header-padding": "0.8rem 1.2rem", "--epr-search-input-height": "32px" } as any}
            previewConfig={{ showPreview: false }}
            searchPlaceHolder={t("search")}
            onEmojiClick={props.onSelect}
            searchDisabled={props.searchDisabled}
            autoFocusSearch={false}
        />
    </div>
}

const PopupRubyTextPrompt = (props: { style: CSSProperties, onClose: () => void, onApply: (vl: string) => void }) => {
    const divRef = useRef<HTMLDivElement>(null)
    const { t } = useTranslation()
    const [value, setValue] = useState("")

    useEffect(() => {
        if (divRef.current) {
            const onClickDropDown = (ev: any) => {
                if (ev.target === divRef.current || !divRef.current!.contains(ev.target)) props.onClose()
            }
            window.document.body.addEventListener("mousedown", onClickDropDown)
            return () => {
                window.document.body.removeEventListener("mousedown", onClickDropDown)
            }
        }
    }, [divRef.current])

    return <div ref={divRef} className={`row ${styles["dropdown"]} ${styles["link-prompt"]}`} style={props.style}>
        <TextField
            autoFocus
            placeholder="Ruby annotation..."
            className="body-3 size32"
            style={{ width: "20rem" }}
            onChange={(ev) => { setValue(ev.target.value) }}
            onComplete={(ev) => {
                if (value.trim()) props.onApply(value)
                else ev.currentTarget.blur()
            }}
        />
        <Button
            label={t("apply")}
            className="label-3 size32 button-primary"
            style={{ borderRadius: "10rem" }}
            disabled={!value.trim()}
            onClick={() => { if (value.trim()) props.onApply(value) }}
        />
    </div>
}

const PopupLinkPrompt = (props: { style: CSSProperties, onClose: () => void, onApply: (vl: string) => void }) => {
    const divRef = useRef<HTMLDivElement>(null)
    const { t } = useTranslation()
    const urlRegex = /https?:\/\/[^\s/$.?#].[^\s]*/g
    const [value, setValue] = useState("")

    useEffect(() => {
        if (divRef.current) {
            const onClickDropDown = (ev: any) => {
                if (ev.target === divRef.current || !divRef.current!.contains(ev.target)) props.onClose()
            }
            window.document.body.addEventListener("mousedown", onClickDropDown)
            return () => {
                window.document.body.removeEventListener("mousedown", onClickDropDown)
            }
        }
    }, [divRef.current])

    return <div ref={divRef} className={`row ${styles["dropdown"]} ${styles["link-prompt"]}`} style={props.style}>
        <TextField
            autoFocus
            placeholder="Insert link..."
            className="body-3 size32"
            style={{ width: "28rem" }}
            onChange={(ev) => {
                setValue(ev.target.value)
            }}
            onComplete={(ev) => { ev.currentTarget.blur() }}
        />
        <Button
            label={t("apply")}
            className="label-3 size32 button-primary"
            style={{ borderRadius: "10rem" }}
            disabled={!urlRegex.test(value) || urlRegex.test(value)}
            onClick={() => { props.onApply(value) }}
        />
    </div>
}

const PopupLinkDetails = (props: { style: CSSProperties, onClose: () => void, element: HTMLAnchorElement, onRemove: () => void, onApply: (vl: string) => void }) => {
    const divRef = useRef<HTMLDivElement>(null)
    const [tab, setTab] = useState(0)
    const { t } = useTranslation()
    const urlRegex = /https?:\/\/[^\s/$.?#].[^\s]*/g
    const [value, setValue] = useState("")

    useEffect(() => {
        if (divRef.current) {
            const onClickDropDown = (ev: any) => {
                if (ev.target === divRef.current || !divRef.current!.contains(ev.target)) props.onClose()
            }
            window.document.body.addEventListener("mousedown", onClickDropDown)
            return () => {
                window.document.body.removeEventListener("mousedown", onClickDropDown)
            }
        }
    }, [divRef.current])

    return <div ref={divRef} className={`row ${styles["dropdown"]} ${styles["link-prompt"]}`} style={{ ...props.style, gap: 4 }}>
        {tab ? <>
            <TextField
                autoFocus
                placeholder="Insert link..."
                className="body-3 size32"
                style={{ width: "28rem" }}
                onChange={(ev) => {
                    setValue(ev.target.value)
                }}
                onComplete={(ev) => { ev.currentTarget.blur() }}
            />
            <Button
                label={t("apply")}
                className="label-3 size32 button-primary"
                style={{ borderRadius: "10rem" }}
                disabled={!urlRegex.test(value) || urlRegex.test(value)}
                onClick={() => { props.onApply(value) }}
            />
        </> : <>
            <Text>Go to: </Text>
            <NavLink target="_blank" to={props.element.href}>
                <Text className="button-text-3" style={{ maxWidth: "24rem" }} maxLine={1}>{props.element.href}</Text>
            </NavLink>
            <div style={{ background: "var(--neutral-bolder-border-color)", height: "1.4rem", width: 1, margin: "0 0.4rem" }} />
            <Text onClick={() => setTab(1)} className="button-text-3">Change</Text>
            <div style={{ background: "var(--neutral-bolder-border-color)", height: "1.4rem", width: 1, margin: "0 0.4rem" }} />
            <Text onClick={props.onRemove} className="button-text-3">Remove</Text>
        </>}
    </div>
}