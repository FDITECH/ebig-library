import styles from './iconLibrary.module.css'
import { CSSProperties, useDeferredValue, useEffect, useRef, useState } from "react";
import { useTranslation } from 'react-i18next';
import { BaseDA, TextField, Ebigicon, Button, Text } from '../../index';

interface IconLibraryProps {
    onSelect: (src: { [p: string]: any }) => void;
    style?: CSSProperties;
    onClose?: () => void;
    className?: string;
}

export function IconLibrary({ onSelect, style = {}, onClose, className }: IconLibraryProps) {
    const divRef = useRef<HTMLDivElement>(null)
    const [filter, setFilter] = useState<undefined | string>();
    const [searchValue, setSearchValue] = useState<string>("");
    const search = useDeferredValue(searchValue, "")
    const [showFilter, setOpenFilter] = useState(false);
    const [categories, setCategories] = useState<string[]>([]);
    const [data, setData] = useState<{ data: any[], totalCount?: number }>({ data: [], totalCount: undefined });
    const [staticPreview, setStaticPreview] = useState<{ [p: string]: any } | null>(null);
    const [preview, setPreview] = useState<{ [p: string]: any } | null>(null);
    const inputRef = useRef<any>(null)
    const { t } = useTranslation()

    useEffect(() => {
        if (onClose) {
            if (divRef.current) {
                const onClickDropDown = (ev: any) => {
                    if (ev.target === divRef.current || !divRef.current!.contains(ev.target)) onClose()
                }
                window.document.body.addEventListener("mousedown", onClickDropDown)
                return () => {
                    window.document.body.removeEventListener("mousedown", onClickDropDown)
                }
            }
            return () => onClose()
        }
    }, [onClose])

    const getIcons = async (page?: number) => {
        let query = filter ? `type=${filter}` : ""
        if (search.length) query += `${query.length ? "&" : ""}search=${search}`
        if (page) query += `${query.length ? "&" : ""}page=${page}`
        const response = await BaseDA.get(`https://api.ebig.co/api/file/icon-library?${query}`)
        if (response.code === 200) {
            setData({ data: page && page > 1 ? [...data.data, ...response.data] : response.data, totalCount: response.totalCount })
            if (page && page > 1) {
                const newCate = response.category.filter((c: string) => !categories.includes(c))
                if (newCate.length) setCategories([...categories, ...newCate])
            } else setCategories(response.category ?? [])
        }
    }

    useEffect(() => {
        getIcons()
    }, [filter, search])

    return <div
        ref={divRef}
        className={`col ${styles['icon-library-container']} ${className ?? ""}`} style={style}
        onScroll={(ev) => {
            let scrollElement = ev.target as HTMLDivElement
            if (Math.round(scrollElement.offsetHeight + scrollElement.scrollTop) >= (scrollElement.scrollHeight - 1) && data.totalCount && data.data.length < data.totalCount!) getIcons(Math.floor(data.data.length / 20) + 1)
        }}
    >
        <div className={`row ${styles['search-container']}`}>
            <TextField
                ref={inputRef}
                autoFocus
                placeholder={t("search")}
                className={`body-3 size32 ${styles['search-input']}`}
                prefix={<Ebigicon src="outline/user-interface/zoom" size={14} />}
                onChange={(ev) => { setSearchValue(ev.target.value.trim()) }}
                onComplete={(ev: any) => ev.target.blur()}
            />
            <Button
                prefix={<Ebigicon src='outline/user-interface/setup-tools' color={filter ? "var(--primary-main-color)" : undefined} size={14} />}
                className='button-text-3 size32'
                label={`${filter ?? t("filter")}`}
                style={{ width: "10rem", padding: "0.4rem", backgroundColor: filter ? "var(--primary-background)" : undefined, color: filter ? "var(--primary-main-color)" : undefined }}
                suffix={filter ? <Ebigicon src={"outline/user-interface/e-remove"} size={14} className="icon-button light" onClick={(ev: any) => {
                    ev.preventDefault()
                    ev.stopPropagation()
                    setFilter(undefined)
                }} /> : undefined}
                onClick={() => { setOpenFilter(!showFilter) }}
            />
            {showFilter && <FilterDropdown
                selected={filter}
                onClose={() => { setTimeout(() => { setOpenFilter(false) }, 150) }}
                onSelect={(value: string) => {
                    setFilter(value)
                    setOpenFilter(false)
                }}
            />}
        </div>
        {categories.map((cate) => {
            return <div key={cate} className='col' style={{ gap: "0.8rem", padding: "0.8rem" }}>
                <Text className='label-1'>{cate.slice(0, 1).toUpperCase() + cate.slice(1)}</Text>
                <div className='row' style={{ flexWrap: "wrap", gap: "0.8rem", padding: "0.8 1.6rem", alignItems: "stretch" }}>
                    {data.data.filter(e => e.category === cate).map((src: any, i: number) => <div key={src.name + src.id + i} className={`col col6 ${styles['icon-item']} ${staticPreview?.id === src.id ? styles['selected'] : ""}`}
                        onDoubleClick={() => { onSelect(src) }}
                        onClick={() => { setStaticPreview(src) }}
                        onMouseOver={() => { setPreview(src) }}
                    >
                        <Ebigicon src={`${src.type}/${src.category}/${src.name}` as any} size={"2rem"} />
                        <div className='label-5' style={{ width: "100%", wordBreak: "break-all" }}>{src.name}</div>
                    </div>)}
                </div>
            </div>
        })}
        {!categories.length && <div style={{ flex: 1 }} />}
        {(preview || staticPreview) && <div className={`row ${styles["preview-container"]}`}>
            <Ebigicon src={`${(staticPreview ?? preview!).type}/${(staticPreview ?? preview!).category}/${(staticPreview ?? preview!).name}` as any} size={"3.2rem"} />
            <div className='label-3' style={{ width: "100%", wordBreak: "break-all" }}>{`${(staticPreview ?? preview!).type}/${(staticPreview ?? preview!).category}/${(staticPreview ?? preview!).name}`}</div>
        </div>}
    </div>
}

const FilterDropdown = (props: { onClose: () => void, selected?: string, onSelect: (value: string) => void }) => {
    const divRef = useRef<HTMLDivElement>(null)
    useEffect(() => {
        return () => props.onClose()
    }, [])

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
    }, [])
    return <div ref={divRef} className={`col ${styles["filter-options"]}`}>
        <button type="button" className={`${styles['option']} ${props.selected === "color" ? styles['selected'] : ""} label-3`} onClick={() => { props.onSelect("color") }}>color</button>
        <button type="button" className={`${styles['option']} ${props.selected === "fill" ? styles['selected'] : ""} label-3`} onClick={() => { props.onSelect("fill") }}>fill</button>
        <button type="button" className={`${styles['option']} ${props.selected === "outline" ? styles['selected'] : ""} label-3`} onClick={() => { props.onSelect("outline") }}>outline</button>
    </div>
}