import { CSSProperties, Dispatch, forwardRef, ReactNode, SetStateAction, useCallback, useDeferredValue, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react'
import styles from './select-dropdown.module.css'
import { useTranslation } from 'react-i18next'
import { Checkbox, Tag, TextField, Util, Ebigicon } from '../../index'

// ─── Types ───────────────────────────────────────────────────────────────────

export interface OptionsItem {
    prefix?: ReactNode | string
    color?: string
    id: string | number
    parentId?: string | number
    name: string | ReactNode
    disabled?: boolean
    totalChild?: number
}

type GetOptionsFn = (params: { length: number, search?: string, parentId?: string | number }) => Promise<{ data: OptionsItem[], totalCount: number }>

// ─── Props ───────────────────────────────────────────────────────────────────

interface BaseProps {
    id?: string
    options: Required<OptionsItem[]>
    getOptions?: GetOptionsFn
    placeholder?: string
    disabled?: boolean
    readOnly?: boolean
    /** default: size40: body-3 · recommend: size48 | size32 | size24 */
    className?: string
    helperText?: string
    helperTextColor?: string
    style?: CSSProperties
    prefix?: ReactNode
    suffix?: ReactNode
    simpleStyle?: boolean
    customOptionsList?: ReactNode
    dropdownClassName?: string
    dropdownStyle?: CSSProperties
    hiddenSearchOptions?: boolean
}

interface SingleProps extends BaseProps {
    multiple?: false
    value?: string | number
    onChange?: (v?: OptionsItem) => void
    optionStyle?: 'default' | 'solid' | 'ghost'
    hideAutoSuffix?: boolean
    showClearValueButton?: never
    previewMaxLength?: never
    customPreviewValue?: never
}

interface MultipleProps extends BaseProps {
    multiple: true
    value?: Array<string | number>
    onChange?: (value?: Array<string | number>) => void
    showClearValueButton?: boolean
    previewMaxLength?: number
    customPreviewValue?: ReactNode
    optionStyle?: never
    hideAutoSuffix?: never
}

export type SelectDropdownProps = SingleProps | MultipleProps

export interface SelectDropdownRef {
    element: HTMLDivElement
    isOpen: boolean
    setIsOpen: Dispatch<SetStateAction<boolean>>
    options: OptionsItem[]
    setOptions: Dispatch<SetStateAction<OptionsItem[]>>
    onOpenOptions: () => void
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function computeDropdownOffset(el: HTMLElement) {
    const rect = el.getBoundingClientRect()
    const tmp = document.createElement('div')
    tmp.style.position = 'fixed'
    el.after(tmp)
    let tmpRect = tmp.getBoundingClientRect()
    const offset: any = { width: rect.width }
    if (rect.bottom + 240 >= document.body.offsetHeight) offset.bottom = `calc(100dvh - ${rect.y}px + 2px)`
    else offset.top = rect.bottom + 2
    if (Math.abs(tmpRect.x - rect.x) > 2) {
        tmp.style.left = `${el.offsetLeft}px`
        tmpRect = tmp.getBoundingClientRect()
        offset.left = Math.abs(tmpRect.x - rect.x) > 2 ? rect.x : el.offsetLeft
    }
    tmp.remove()
    if (rect.right + 16 >= document.body.offsetWidth) {
        offset.right = `calc(100dvw - ${rect.right}px)`
        delete offset.left
    }
    return offset
}

function defaultLocalSearch(options: OptionsItem[]): GetOptionsFn {
    return async ({ search }) => {
        if (!search?.length) return { data: options, totalCount: options.length }
        const s = search.toLowerCase()
        const slug = Util.toSlug(s)
        const filter = options.filter(e => {
            const idStr = `${e.id}`.toLowerCase()
            const idSlug = Util.toSlug(idStr)
            if (slug.includes(idSlug) || idSlug.includes(slug) || s.includes(idStr) || idStr.includes(s)) return true
            if (typeof e.name === 'string') {
                const nameStr = e.name.toLowerCase()
                const nameSlug = Util.toSlug(nameStr)
                if (slug.includes(nameSlug) || nameSlug.includes(slug) || s.includes(nameStr) || nameStr.includes(s)) return true
            }
            return false
        })
        return { data: filter, totalCount: filter.length }
    }
}

/** Render prefix icon or node for an option */
function renderOptionPrefix(prefix?: ReactNode | string, fallback?: ReactNode, iconSize = 14) {
    if (!prefix) return fallback ?? null
    return typeof prefix === 'string' && prefix.length ? <Ebigicon src={prefix as any} size={iconSize} /> : prefix
}

// ─── Shared hook: child options with lazy load ───────────────────────────────

function useChildOptions(children?: OptionsItem[], parentId?: string | number, getOptions?: GetOptionsFn) {
    const [isOpen, setIsOpen] = useState(false)
    const [options, setOptions] = useState<{ data: OptionsItem[], totalCount: number }>({ data: [], totalCount: 0 })

    useEffect(() => {
        if (children && !options.totalCount) setOptions({ data: children, totalCount: children.length })
    }, [children])

    useEffect(() => {
        if (isOpen && !options.totalCount) getOptions?.({ length: 0, parentId }).then(setOptions)
    }, [isOpen])

    const loadMore = () => getOptions?.({ length: options.data.length, parentId }).then(setOptions)

    return { isOpen, setIsOpen, options, loadMore }
}

// ─── Shared: OptionDropListBase (data fetch, search, scroll, click-outside) ──

interface DropListBaseProps {
    divRef: React.RefObject<HTMLDivElement | null>
    style: CSSProperties
    className?: string
    getOptions: GetOptionsFn
    hiddenSearchOptions?: boolean
    onClose: (ev: any) => void
    renderOptions: (data: OptionsItem[], searchValue: string) => ReactNode
}

function useDropListData(getOptions: GetOptionsFn, searchValue: string) {
    const initTotal = useRef<number>(null)
    const [options, setOptions] = useState<{ data: OptionsItem[], totalCount?: number }>({ data: [], totalCount: undefined })

    const getData = useCallback(async (length?: number) => {
        const res = await getOptions({ length: length ?? 0, search: searchValue })
        if (initTotal.current === null) initTotal.current = res.totalCount
        setOptions(length ? prev => ({ data: [...prev.data, ...res.data], totalCount: res.totalCount }) : res)
    }, [getOptions, searchValue])

    useEffect(() => { getData() }, [searchValue])

    return { options, initTotal: initTotal.current, loadMore: () => getData(options.data.length) }
}

function OptionDropListShell({ divRef, style, className, getOptions, hiddenSearchOptions, onClose, renderOptions }: DropListBaseProps) {
    const [searchInput, setSearchInput] = useState('')
    const searchValue = useDeferredValue(searchInput)
    const { t } = useTranslation()
    const { options, initTotal, loadMore } = useDropListData(getOptions, searchValue)

    // Click outside → close
    useEffect(() => {
        if (!divRef.current) return
        const handler = (ev: any) => {
            if (ev.target === divRef.current || !divRef.current!.contains(ev.target)) onClose(ev)
        }
        document.body.addEventListener('mousedown', handler)
        return () => { document.body.removeEventListener('mousedown', handler) }
    }, [divRef.current])

    const emptyState = <div className='col' style={{ alignItems: 'center' }}>
        <Ebigicon src='color/files/archive-file' size={28} />
        <h6 className='heading-7' style={{ margin: '0.8rem' }}>{t('noResultFound')}</h6>
    </div>

    return <div
        ref={divRef}
        onScroll={(ev) => {
            const el = ev.target as HTMLDivElement
            if (Math.round(el.offsetHeight + el.scrollTop) >= el.scrollHeight - 1 && options.totalCount && options.data.length < options.totalCount) loadMore()
        }}
        className={`col ${styles['select-popup']} ${className ?? ''}`}
        style={style}
    >
        {options.totalCount === 0 && !initTotal ? emptyState : <>
            {!hiddenSearchOptions && initTotal && initTotal > 10 && <div className={`col ${styles['search-options']}`}>
                <TextField
                    ref={r => {
                        if (r) {
                            r.inputElement?.focus({ preventScroll: true })
                            setTimeout(() => divRef.current?.scrollTo({ top: 0 }), 100)
                        }
                    }}
                    className={`body-3 ${divRef.current!.offsetWidth > 88 ? 'size32' : 'size24'}`}
                    placeholder={t('search')}
                    prefix={<Ebigicon src='outline/development/zoom' size={14} />}
                    onChange={ev => setSearchInput(ev.target.value.trim())}
                    onComplete={(ev: any) => ev.target.blur()}
                />
            </div>}
            {options.totalCount === 0 ? emptyState : renderOptions(options.data, searchValue)}
        </>}
    </div>
}

// ═════════════════════════════════════════════════════════════════════════════
// SelectDropdown
// ═════════════════════════════════════════════════════════════════════════════

export const SelectDropdown = forwardRef<SelectDropdownRef, SelectDropdownProps>(({ style = {}, multiple = false, ...props }, ref) => {
    const containerRef = useRef<any>(null)
    const offsetRef = useRef<{ [p: string]: any }>(null)
    const [options, setOptions] = useState<OptionsItem[]>([])
    const [isOpen, setIsOpen] = useState(false)

    // Single state
    const [singleValue, setSingleValue] = useState<string | number | undefined>(undefined)
    const singleItem = useMemo(() => options.find(e => e.id === singleValue), [options.length, singleValue])

    // Multi state
    const previewMaxLength = (multiple ? (props as MultipleProps).previewMaxLength : 2) ?? 2
    const [multiValue, setMultiValue] = useState<Array<string | number>>([])

    // Sync props
    useEffect(() => {
        if (multiple) setMultiValue((props as MultipleProps).value ?? [])
        else setSingleValue((props as SingleProps).value)
    }, [props.value])
    useEffect(() => { setOptions(props.options ?? []) }, [props.options])

    // Open
    const onOpenOptions = useCallback(() => {
        if (isOpen) return
        offsetRef.current = computeDropdownOffset(containerRef.current)
        setTimeout(() => setIsOpen(true), 100)
    }, [isOpen])

    // Keyboard (single only)
    const handleKeyDown = useCallback((ev: React.KeyboardEvent) => {
        if (multiple || props.disabled || props.readOnly) return
        if (['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(ev.key)) {
            ev.preventDefault()
            if (!isOpen) onOpenOptions()
        }
        if (ev.key === 'Escape' && isOpen) { ev.preventDefault(); setIsOpen(false) }
    }, [multiple, props.disabled, props.readOnly, isOpen, onOpenOptions])

    // Imperative ref
    useImperativeHandle(ref, () => ({
        element: containerRef.current, isOpen, setIsOpen, options, setOptions, onOpenOptions
    }), [isOpen, options, containerRef])

    const getOptionsFn = props.getOptions ?? defaultLocalSearch(options)
    const dropdownOffset = { ...offsetRef.current!, ...props.dropdownStyle }
    const interactive = !props.disabled && !props.readOnly

    // ═══ SINGLE ═══
    if (!multiple) {
        const p = props as SingleProps
        return <>
            <div
                id={p.id}
                ref={containerRef}
                tabIndex={interactive ? 0 : undefined}
                className={`${p.simpleStyle ? styles['select-simple-style'] : styles['select-container']} ${isOpen ? styles['focus'] : ''} row ${p.helperText?.length ? styles['helper-text'] : ''} ${p.disabled ? styles['disabled'] : ''} ${p.className ?? (p.simpleStyle ? '' : 'body-3')}`}
                helper-text={p.helperText}
                style={{ '--helper-text-color': p.helperTextColor ?? '#e14337', ...style } as CSSProperties}
                onClick={interactive ? onOpenOptions : undefined}
                onKeyDown={handleKeyDown}
            >
                <SinglePreview item={singleItem} optionStyle={p.optionStyle} prefix={p.prefix} placeholder={p.placeholder} />
                {p.suffix ?? (!p.hideAutoSuffix && <Ebigicon ref={iconRef => {
                    if (iconRef?.element?.parentElement && iconRef.element.parentElement.getBoundingClientRect().width < 88) iconRef.element.style.display = 'none'
                }} src={`fill/arrows/${isOpen ? 'up' : 'down'}-arrow`} size={12} />)}
            </div>
            {isOpen && (p.customOptionsList ?? <SingleDropList
                onClose={() => setTimeout(() => setIsOpen(false), 150)}
                getOptions={getOptionsFn}
                selected={singleValue}
                style={dropdownOffset}
                optionStyle={p.optionStyle}
                className={p.dropdownClassName}
                hiddenSearchOptions={p.hiddenSearchOptions}
                onSelect={e => {
                    if (options.every(o => o.id !== e.id)) setOptions([e])
                    setSingleValue(e.id)
                    p.onChange?.(e)
                    setIsOpen(false)
                }}
            />)}
        </>
    }

    // ═══ MULTIPLE ═══
    const mp = props as MultipleProps
    return <>
        <div
            id={mp.id}
            ref={containerRef}
            className={`${mp.simpleStyle ? styles['select-simple-style'] : styles['select-multi-container']} ${isOpen ? styles['focus'] : ''} row ${mp.helperText?.length ? styles['helper-text'] : ''} ${mp.disabled ? styles['disabled'] : ''} ${mp.className ?? (mp.simpleStyle ? '' : 'body-3')}`}
            helper-text={mp.helperText}
            style={{ '--helper-text-color': mp.helperTextColor ?? '#e14337', ...style } as CSSProperties}
            onClick={interactive ? onOpenOptions : undefined}
        >
            {mp.prefix}
            <div className={`row ${styles['preview-container']}`}>
                {!multiValue.length && <span style={{ opacity: 0.5, font: 'inherit' }}>{mp.placeholder}</span>}
                {mp.customPreviewValue ?? <>
                    {multiValue.slice(0, previewMaxLength).map(id => {
                        const opt = options.find(e => e.id === id)
                        return <div key={id} className={`row ${styles['selected-item-value']}`}>
                            <span>{opt?.name}</span>
                            <Ebigicon src='outline/user-interface/e-remove' size={12} onClick={opt?.disabled ? undefined : ev => {
                                ev.stopPropagation()
                                const nv = multiValue.filter(v => v !== id)
                                setMultiValue(nv)
                                mp.onChange?.(nv)
                            }} />
                        </div>
                    })}
                    {multiValue.length > previewMaxLength && <div className={`row ${styles['selected-item-value']}`}>
                        <span>+{multiValue.length - previewMaxLength}</span>
                    </div>}
                </>}
            </div>
            {mp.suffix || (
                mp.showClearValueButton && multiValue.length
                    ? <Ebigicon src='outline/user-interface/c-remove' size={14} onClick={ev => { ev.stopPropagation(); setMultiValue([]); mp.onChange?.([]) }} />
                    : <div ref={r => { if (r?.parentElement && r.parentElement.getBoundingClientRect().width < 88) r.style.display = 'none' }} className='row'>
                        <Ebigicon src={`fill/arrows/${isOpen ? 'up' : 'down'}-arrow`} size={12} />
                    </div>
            )}
        </div>
        {isOpen && (mp.customOptionsList ?? <MultiDropList
            onClose={ev => {
                const removeBtn = ev.target.closest?.(`div[class*="selected-item-value"] > div:last-child`)
                if (removeBtn) removeBtn.click()
                else setTimeout(() => setIsOpen(false), 150)
            }}
            getOptions={getOptionsFn}
            selected={options.filter(e => multiValue.includes(e.id))}
            style={dropdownOffset}
            className={mp.dropdownClassName}
            hiddenSearchOptions={mp.hiddenSearchOptions}
            onChange={(checked, optList) => {
                const newOpts = optList.filter(n => options.every(o => o.id !== n.id))
                if (newOpts.length) setOptions(prev => [...prev, ...newOpts])
                const tmp = multiValue.filter(s => !optList.some(c => s === c.id))
                if (checked) tmp.push(...optList.filter((e, _, arr) => arr.every(c => e.id !== c.parentId)).map(e => e.id))
                setMultiValue(tmp)
                mp.onChange?.(tmp)
            }}
        />)}
    </>
})

// ─── SinglePreview ───────────────────────────────────────────────────────────

function SinglePreview({ item, optionStyle, prefix, placeholder }: { item?: OptionsItem, optionStyle?: string, prefix?: ReactNode, placeholder?: string }) {
    if (!item) return <>
        {prefix}
        <span style={{ flex: 1, textOverflow: 'ellipsis', whiteSpace: 'nowrap', overflow: 'hidden', opacity: 0.5 }}>{placeholder}</span>
    </>
    if (typeof item.name === 'object') return <>{renderOptionPrefix(item.prefix, prefix)}{item.name}</>
    switch (optionStyle) {
        case 'ghost':
            return <>
                {item.prefix ? (typeof item.prefix === 'string' && item.prefix.length ? <Ebigicon src={item.prefix as any} color={item.color} size={13} style={{ width: 24, height: 24, border: `1px dashed ${item.color}`, borderRadius: '50%' }} /> : item.prefix) : prefix}
                <span style={{ flex: 1, textOverflow: 'ellipsis', whiteSpace: 'nowrap', overflow: 'hidden', color: item.color }}>{item.name}</span>
            </>
        case 'solid':
            return <Tag
                title={item.name as any}
                className={`size24 ${styles['option-ghost']}`}
                style={{ borderRadius: 8, lineHeight: 'normal', backgroundColor: `hsl(from ${item.color} h s calc(l + 30))`, gap: 8, font: 'inherit', fontFamily: 'inherit', fontSize: 'inherit', fontWeight: 'inherit', color: '#000' }}
                prefix={item.prefix ? (typeof item.prefix === 'string' && item.prefix.length ? <Ebigicon src={item.prefix as any} color='#000' size={12} style={{ padding: 0 }} /> : item.prefix) : prefix}
            />
        default:
            return <>{renderOptionPrefix(item.prefix, prefix)}<span style={{ flex: 1, textOverflow: 'ellipsis', whiteSpace: 'nowrap', overflow: 'hidden' }}>{item.name}</span></>
    }
}

// ═════════════════════════════════════════════════════════════════════════════
// SingleDropList — with keyboard navigation
// ═════════════════════════════════════════════════════════════════════════════

function SingleDropList(props: {
    onClose: () => void, style: CSSProperties, className?: string,
    selected?: string | number, onSelect: (e: OptionsItem) => void,
    getOptions: GetOptionsFn, hiddenSearchOptions?: boolean,
    optionStyle?: 'default' | 'solid' | 'ghost'
}) {
    const divRef = useRef<HTMLDivElement>(null)
    const [highlightedIndex, setHighlightedIndex] = useState(-1)

    // Build flat list for keyboard nav from rendered options
    const flatRef = useRef<OptionsItem[]>([])

    // Keyboard
    useEffect(() => {
        const onKeyDown = (ev: KeyboardEvent) => {
            const flat = flatRef.current
            if (!flat.length) return
            switch (ev.key) {
                case 'ArrowDown': {
                    ev.preventDefault()
                    setHighlightedIndex(prev => {
                        let n = prev + 1
                        while (n < flat.length && flat[n].disabled) n++
                        return n < flat.length ? n : prev
                    })
                    break
                }
                case 'ArrowUp': {
                    ev.preventDefault()
                    setHighlightedIndex(prev => {
                        let n = prev - 1
                        while (n >= 0 && flat[n].disabled) n--
                        return n >= 0 ? n : prev
                    })
                    break
                }
                case 'Enter': {
                    ev.preventDefault()
                    const item = flat[highlightedIndex]
                    if (item && !item.disabled) props.onSelect(item)
                    break
                }
                case 'Escape': {
                    ev.preventDefault()
                    props.onClose()
                    break
                }
            }
        }
        window.addEventListener('keydown', onKeyDown)
        return () => window.removeEventListener('keydown', onKeyDown)
    }, [highlightedIndex])

    // Scroll highlighted into view
    useEffect(() => {
        if (highlightedIndex < 0 || !divRef.current) return
        const tile = divRef.current.querySelectorAll('[data-option-index]')[highlightedIndex] as HTMLElement | undefined
        tile?.scrollIntoView({ block: 'nearest' })
    }, [highlightedIndex])

    return <OptionDropListShell
        divRef={divRef}
        style={props.style}
        className={props.className}
        getOptions={props.getOptions}
        hiddenSearchOptions={props.hiddenSearchOptions}
        onClose={props.onClose}
        renderOptions={(data, searchValue) => {
            // Build flat list
            const flat: OptionsItem[] = []
            const roots = data.filter(e => !e.parentId)
            roots.forEach(opt => { if (!opt.totalChild) flat.push(opt) })
            flatRef.current = flat

            // Sync highlighted to selected
            if (props.selected !== undefined && highlightedIndex < 0) {
                const idx = flat.findIndex(o => o.id === props.selected)
                if (idx >= 0) setTimeout(() => setHighlightedIndex(idx), 0)
            }

            let flatIdx = 0
            return roots.map((opt, i) => {
                const curIdx = !opt.totalChild ? flatIdx++ : -1
                return <SingleTile
                    key={opt.id + '-' + i}
                    item={opt}
                    selected={opt.id === props.selected}
                    highlighted={curIdx === highlightedIndex}
                    flatIndex={curIdx}
                    children={data.filter(e => e.parentId === opt.id)}
                    onClick={props.onSelect}
                    optionStyle={props.optionStyle}
                    getOptions={p => props.getOptions({ ...p, search: searchValue })}
                />
            })
        }}
    />
}

// ─── SingleTile ──────────────────────────────────────────────────────────────

function SingleTile({ item, children, selected, highlighted, flatIndex, onClick, getOptions, optionStyle = 'default' }: {
    item: OptionsItem, children?: OptionsItem[], selected?: boolean, highlighted?: boolean, flatIndex: number,
    onClick: (e: OptionsItem) => void, optionStyle?: 'default' | 'solid' | 'ghost', getOptions?: GetOptionsFn
}) {
    const { isOpen, setIsOpen, options, loadMore } = useChildOptions(children, item.id, getOptions)
    const { t } = useTranslation()

    const renderByStyle = (opt: OptionsItem) => {
        switch (optionStyle) {
            case 'ghost':
                return <>
                    {opt.prefix ? (typeof opt.prefix === 'string' && opt.prefix.length ? <Ebigicon src={opt.prefix as any} color={opt.color} size={13} style={{ width: 24, height: 24, border: `1px dashed ${opt.color}`, borderRadius: '50%' }} /> : opt.prefix) : null}
                    <span style={{ color: opt.color }}>{opt.name}</span>
                </>
            case 'solid':
                return <Tag title={opt.name as any} className={`size24 label-4 ${styles['option-ghost']}`}
                    style={{ borderRadius: 8, lineHeight: 'normal', backgroundColor: `hsl(from ${opt.color} h s calc(l + 30))`, color: '#000', gap: 8 }}
                    prefix={opt.prefix ? (typeof opt.prefix === 'string' && opt.prefix.length ? <Ebigicon src={opt.prefix as any} color='#000' size={12} style={{ padding: 0 }} /> : opt.prefix) : null} />
            default:
                return <>{renderOptionPrefix(opt.prefix)}<span>{opt.name}</span></>
        }
    }

    return <>
        <button type='button' disabled={item.disabled}
            data-option-index={flatIndex >= 0 ? flatIndex : undefined}
            className={`row label-4 ${styles['select-tile']} ${item.disabled ? styles['disabled'] : ''} ${selected ? styles['selected'] : ''} ${highlighted ? styles['highlighted'] : ''}`}
            onClick={() => item.totalChild ? setIsOpen(!isOpen) : onClick(item)}>
            {typeof item.name === 'object' ? item.name : ((item.totalChild == null) && optionStyle !== 'default' ? renderByStyle(item) : <>
                {item.totalChild != null && <Ebigicon src={`fill/arrows/triangle-${isOpen ? 'down' : 'right'}`} size={12} />}
                {renderOptionPrefix(item.prefix)}
                <span>{item.name}</span>
            </>)}
        </button>
        {isOpen && <>
            {options.data.map((child, i) => <button key={child.id + '-' + i} type='button'
                style={{ paddingLeft: 'calc(max(0.8rem, 5px) + max(0.8rem, 5px) + 16px)' }}
                className={`row label-4 ${styles['select-tile']} ${child.disabled ? styles['disabled'] : ''} ${selected ? styles['selected'] : ''}`}
                onClick={() => onClick(child)}>
                {typeof child.name === 'object' ? child.name : renderByStyle(child)}
            </button>)}
            {options.data.length < options.totalCount && <div className={`button-text-5 ${styles['see-more']}`} onClick={loadMore}>{t('seemore')}</div>}
        </>}
    </>
}

// ═════════════════════════════════════════════════════════════════════════════
// MultiDropList
// ═════════════════════════════════════════════════════════════════════════════

function MultiDropList(props: {
    onClose: (ev: any) => void, style: CSSProperties, className?: string,
    selected: OptionsItem[], onChange: (checked: boolean, opts: OptionsItem[]) => void,
    getOptions: GetOptionsFn, hiddenSearchOptions?: boolean
}) {
    const divRef = useRef<HTMLDivElement>(null)
    return <OptionDropListShell
        divRef={divRef}
        style={props.style}
        className={props.className}
        getOptions={props.getOptions}
        hiddenSearchOptions={props.hiddenSearchOptions}
        onClose={props.onClose}
        renderOptions={(data, searchValue) =>
            data.filter(e => !e.parentId).map((opt, i) => <MultiTile
                key={opt.id + '-' + i}
                item={opt}
                selected={props.selected}
                children={data.filter(e => e.parentId === opt.id)}
                getOptions={p => props.getOptions({ ...p, search: searchValue })}
                onChange={props.onChange}
            />)
        }
    />
}

// ─── MultiTile ───────────────────────────────────────────────────────────────

function MultiTile({ item, children, selected, onChange, getOptions }: {
    item: OptionsItem, children?: OptionsItem[], selected: OptionsItem[],
    onChange: (checked: boolean, opts: OptionsItem[]) => void, getOptions?: GetOptionsFn
}) {
    const { isOpen, setIsOpen, options, loadMore } = useChildOptions(children, item.id, getOptions)
    const { t } = useTranslation()

    const renderLabel = (opt: OptionsItem) => typeof opt.name === 'object' ? opt.name : <>{renderOptionPrefix(opt.prefix)}<span>{opt.name}</span></>

    if (item.totalChild) {
        const allChecked = selected?.some(s => s.id === item.id) || (!!options.data.length && options.data.every(c => selected?.some(s => s.id === c.id)))
        const someChecked = [...selected.filter(s => s.parentId === item.id), ...options.data].some(c => selected?.some(s => s.id === c.id))
        return <>
            <div className={`row label-4 ${styles['select-tile']} ${item.disabled ? styles['disabled'] : ''}`} onClick={() => setIsOpen(!isOpen)}>
                <div className='row' style={{ padding: 2 }}>
                    <Checkbox size={16} disabled={item.disabled} value={allChecked ? true : someChecked ? null : false}
                        onChange={ev => onChange(ev, [item, ...options.data])} />
                </div>
                {typeof item.name === 'object' ? item.name : <>
                    {item.totalChild != null && <Ebigicon src={`fill/arrows/triangle-${isOpen ? 'down' : 'right'}`} size={12} />}
                    {item.prefix}<span>{item.name}</span>
                </>}
            </div>
            {isOpen && <>
                {options.data.map((child, i) => <label key={child.id + '-' + i}
                    style={{ paddingLeft: 'calc(max(0.8rem, 5px) + max(0.8rem, 5px) + 20px)' }}
                    className={`row label-4 ${styles['select-tile']} ${child.disabled ? styles['disabled'] : ''}`}>
                    <div className='row' style={{ padding: 2 }}>
                        <Checkbox size={16} disabled={child.disabled} value={selected?.some(s => s.id === child.id)} onChange={ev => onChange(ev, [child])} />
                    </div>
                    {renderLabel(child)}
                </label>)}
                {options.data.length < options.totalCount && <div className={`button-text-5 ${styles['see-more']}`} onClick={loadMore}>{t('seemore')}</div>}
            </>}
        </>
    }

    return <label className={`row label-4 ${styles['select-tile']} ${item.disabled ? styles['disabled'] : ''}`}>
        <div className='row' style={{ padding: 2 }}>
            <Checkbox size={16} disabled={item.disabled} value={selected?.some(s => s.id === item.id)} onChange={ev => onChange(ev, [item])} />
        </div>
        {renderLabel(item)}
    </label>
}
