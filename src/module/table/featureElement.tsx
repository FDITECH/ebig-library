import { CSSProperties, forwardRef, MouseEventHandler, useDeferredValue, useEffect, useMemo, useRef, useState } from "react"
import styles from "./table.module.css";
import { useTranslation } from "react-i18next"
import { Button, Checkbox, closePopup, DateTimePicker, InfiniteScroll, Popup, RadioButton, showPopup, Slider, Switch, Tag, Text, TextField, Util, Ebigicon, showDialog, DialogAlignment, DataController } from "../../index"
import { handleGoogleSheetFetch } from "./exportXlsx"
import { DataTable } from "./tableById"
import { ColDataType, ColDataTypeIcon, FEDataType } from "../da";
import { CustomerAvatar } from "./config";
import { specialCharsRegex } from "../../controller/config";

// #region search & filter
interface SearchFilterDataProps {
    columns: Array<{ [p: string]: any }>
    fields: Array<{ [p: string]: any }>
    searchData?: { name: string, value: any }[]
    onChange?: (searchData: { name: string, value: any }[]) => void
    initFilterList?: Array<string>
    onChangeFilterData?: (filterList: Array<string>) => void,
    type?: "search" | "filter" | "both"
}

export const SearchFilterData = ({ columns = [], fields = [], searchData = [], onChange, initFilterList = [], onChangeFilterData, type = "both" }: SearchFilterDataProps) => {
    const inputRef = useRef<any>(null)
    const popupRef = useRef<Popup>(null)
    const { t } = useTranslation()
    const searchinColumns = useMemo<{ [p: string]: any }[]>(() => {
        return columns.filter(c => {
            if (c.Name.split(".").length > 1) return false;
            const tmp = fields.find(f => f.Name === c.Name);
            return (tmp?.DataType === FEDataType.STRING || tmp?.DataType === FEDataType.UNIQUE) && !tmp?.Form?.Options?.length;
        });
    }, [columns.length, fields.length])
    const filterColumns = useMemo<{ [p: string]: any }[]>(() => {
        return columns.filter(c => {
            if (c.Name.split(".").length > 1) return false;
            const tmp = fields.find(f => f.Name === c.Name);
            return tmp?.Form?.Options?.length || [FEDataType.NUMBER, FEDataType.DATE, FEDataType.DATETIME, FEDataType.MONEY, FEDataType.BOOLEAN].includes(tmp?.DataType);
        });
    }, [columns.length, fields.length])
    const relativeCols = useMemo(() => columns.filter(e => e.Name.split(".").length > 1), [columns.length])
    const [data, setData] = useState<{ searchValue: string, nameFields: string[] }>({ searchValue: "", nameFields: [] })
    const [filterData, setFilterData] = useState<{ name: string, value: any }[]>(initFilterList.map(f => ({ name: f, value: undefined })))


    useEffect(() => {
        if (searchData.length) {
            const searchNames = searchData.map(c => c.name)
            const nFields = searchinColumns.filter(sin => searchNames.includes(sin.Name)).map(s => s.Name)
            setData({
                searchValue: nFields.length ? searchData.find(s => s.name === nFields[0])?.value ?? "" : "",
                nameFields: nFields
            })
        } else setData({ searchValue: "", nameFields: [] })
    }, [searchData, searchinColumns.length])

    useEffect(() => {
        if (searchData.length) {
            setFilterData(prev => prev.map(f => ({ name: f.name, value: searchData.find(s => s.name === f.name)?.value })))
        } else if (filterData) setFilterData(prev => prev.map(f => ({ name: f.name, value: undefined })))
    }, [searchData, filterColumns.length])

    useEffect(() => {
        if (inputRef.current && inputRef.current.inputElement!.value !== data.searchValue && data.nameFields.length) inputRef.current.inputElement!.value = data.searchValue
    }, [data.searchValue])

    const _onChange = (searchValue: string, nameFields: string[]) => {
        const searchInNames = searchinColumns.map(c => c.Name)
        let currentSearch = searchData.filter(s => !searchInNames.includes(s.name))
        onChange?.(currentSearch.concat(nameFields.map(n => ({ name: n, value: searchValue }))))
    }

    const _onChangeFilter = (fList: any[] = []) => {
        const filterNames = filterColumns.map(c => c.Name)
        let currentSearch = searchData.filter(s => !filterNames.includes(s.name) && relativeCols.every(rc => rc.Name.split(".")[0] !== s.name))
        onChange?.(currentSearch.concat(fList))
    }

    const activeFilter = filterData?.filter(f => !!f.value)

    return <>
        <Popup ref={popupRef} />
        {(type === "both" || type === "search") && <TextField
            ref={inputRef}
            placeholder={t("search")}
            prefix={<Ebigicon src={"fill/development/zoom"} size={14} />}
            style={{ flex: 1, maxWidth: searchinColumns.length > 1 ? "26.8rem" : "24rem" }}
            className="body-3 size32"
            suffix={searchinColumns.length > 1 && <Ebigicon src={"fill/arrows/down-arrow"} size={12} onClick={(ev: any) => {
                const inputContainer = ev.target.closest("label")
                if (inputContainer.onOpen) return closePopup(popupRef as any)
                const rect = inputContainer.getBoundingClientRect()
                inputContainer.onOpen = true
                showPopup({
                    ref: popupRef as any,
                    hideOverlay: true,
                    content: <SearchinDropdown
                        columns={searchinColumns}
                        nameFields={data.nameFields}
                        onChange={(vl) => {
                            if (data.searchValue.length) _onChange(data.searchValue, vl)
                            setData({ ...data, nameFields: vl })
                        }}
                        style={{ top: rect.bottom + 2, right: `calc(100dvw - ${rect.right}px)`, width: rect.width }}
                        onClose={() => { setTimeout(() => { inputContainer.onOpen = false }, 150) }}
                    />
                })
            }} />}
            onComplete={(ev: any) => {
                ev.target.value = ev.target.value.trim()
                setData(prev => ({ ...prev, searchValue: ev.target.value }))
                _onChange(ev.target.value, data.nameFields.length ? data.nameFields : searchinColumns.length ? searchinColumns.map(c => c.Name) : [])
                ev.target.blur()
            }}
        />}
        {(type === "both" || type === "filter") && filterColumns.length > 1 && <Button
            prefix={<Ebigicon src='outline/user interface/setup-tools' size={14} color={activeFilter?.length ? "var(--primary-main-color)" : undefined} />}
            label={`${t("filter")}${activeFilter?.length ? `: ${activeFilter.length}` : ""}`}
            style={activeFilter?.length ? { backgroundColor: "var(--primary-background)", color: "var(--primary-main-color)" } : undefined}
            suffix={activeFilter?.length ? <Ebigicon src={"outline/user interface/e-remove"} size={14} className="icon-button light" onClick={(ev: any) => {
                ev.preventDefault()
                ev.stopPropagation()
                const btn = ev.target.closest("button")
                if (btn.onOpen) return closePopup(popupRef as any)
                _onChangeFilter(filterData.map(f => ({ name: f.name, value: undefined })))
                setFilterData(filterData.map(f => ({ name: f.name, value: undefined })))
                onChangeFilterData?.(filterData.map(f => f.name))
            }} /> : undefined}
            onClick={(ev: any) => {
                const btn = ev.target.closest("button")
                if (btn.onOpen) return closePopup(popupRef as any)
                const rect = btn.getBoundingClientRect()
                btn.onOpen = true
                showPopup({
                    ref: popupRef as any,
                    hideOverlay: true,
                    content: <FilterDropdown
                        fields={fields}
                        enableEdit={!!onChangeFilterData}
                        filterData={filterData}
                        columns={filterColumns}
                        relativeCols={relativeCols}
                        onChange={(vl) => {
                            _onChangeFilter(vl)
                            setFilterData(vl)
                            onChangeFilterData?.(vl?.map(f => f.name) ?? [])
                        }}
                        style={{ top: rect.bottom + 2, right: `calc(100dvw - ${rect.right}px)` }}
                        onClose={() => { setTimeout(() => { btn.onOpen = false }, 150) }}
                    />
                })
            }}
        />}
    </>
}

interface SearchinDropdownProps {
    style?: CSSProperties;
    columns: { [key: string]: any }[];
    nameFields: string[]
    onChange: (vl: string[]) => void;
    onClose?: () => void
}
const SearchinDropdown = ({ style = {}, columns = [], onClose, onChange, nameFields = [] }: SearchinDropdownProps) => {
    const [nFields, setNameFields] = useState(nameFields)

    useEffect(() => {
        return () => { if (onClose) onClose() }
    }, [])

    useEffect(() => {
        if (!nFields.length && columns.length) setNameFields(columns.map(e => e.Name))
    }, [columns])

    return <div className="col dropdown-popup" style={{ gap: 2, ...style }}>
        {columns.map((c) => {
            return <label key={c.Id} className="row default-hover popup-actions" style={{ gap: "1.2rem", padding: "0.8rem", borderRadius: "0.8rem", cursor: "pointer" }}>
                <Text className="label-3" style={{ flex: 1 }} maxLine={1}>{c.Title}</Text>
                <Switch value={nFields.includes(c.Name)} onChange={(ev) => {
                    if (ev) {
                        onChange([...nFields, c.Name])
                        setNameFields([...nFields, c.Name])
                    } else {
                        onChange(nFields.filter(e => e !== c.Name))
                        setNameFields(nFields.filter(e => e !== c.Name))
                    }
                }} />
            </label>
        })}
    </div>
}

// #region Filter element
interface FilterDropdownProps {
    filterData: { name: string, value: any }[];
    style?: CSSProperties;
    columns: { [key: string]: any }[];
    relativeCols: { [key: string]: any }[];
    onChange: (vl: { name: string, value: any }[]) => void;
    fields: { [key: string]: any }[];
    enableEdit?: boolean;
    onClose?: () => void
}

const FilterDropdown = ({ filterData, style = {}, onClose, columns = [], relativeCols = [], onChange, fields = [], enableEdit = false }: FilterDropdownProps) => {
    const [fList, setFList] = useState<{ name: string, value: any }[]>([])
    const { t } = useTranslation()
    const popupRef = useRef<Popup>(null)

    useEffect(() => {
        return () => onClose?.()
    }, [])

    useEffect(() => {
        if (filterData?.length) {
            setFList(filterData)
        } else {
            const initList = [...columns, ...relativeCols].sort(() => Math.random() - Math.random()).slice(0, 3).map((c) => ({ name: c.Name.split(".").length > 1 ? c.Name.split(".")[0] : c.Name, value: undefined }))
            setFList(initList)
            onChange(initList)
        }
    }, [])

    const showOptions = (ev: any, replaceF?: { name: string, value: any }) => {
        const btn = ev.target.closest("button")
        if (btn.onOpen) return closePopup(popupRef as any)
        const rect = btn.getBoundingClientRect()
        btn.onOpen = true
        showPopup({
            ref: popupRef as any,
            hideOverlay: true,
            content: <FilterOptionsDropdown
                onClose={() => { setTimeout(() => { btn.onOpen = false }, 150) }}
                style={{ top: rect.bottom + 2, left: rect.x }}
                columns={columns}
                fields={fields}
                data={[...columns, ...relativeCols].map((c) => ({ name: c.Name.split(".").length > 1 ? c.Name.split(".")[0] : c.Name, value: undefined })).filter((e => fList.every(f => f.name !== e.name)))}
                onSelect={(op: { name: string, value: any }) => {
                    const tmp = replaceF ? fList.map(ef => ef.name === replaceF.name ? op : ef) : [...fList, op] as any
                    setFList(tmp)
                    onChange(tmp)
                    closePopup(popupRef as any)
                }}
            />
        })
    }

    return <div className="col dropdown-popup" style={{ maxHeight: "40rem", width: "64rem", padding: 0, ...style }}>
        <Popup ref={popupRef} />
        <div className="row popup-header" style={{ gap: "0.8rem" }}>
            <Ebigicon src='outline/user interface/setup-tools' />
            <Text className="heading-7" style={{ flex: 1 }}>{t("filter")}</Text>
            <Button
                label={t("clearall")}
                className="button-text-5 button-grey size24"
                onClick={() => {
                    setFList(prev => prev.map(f => ({ name: f.name, value: undefined })))
                    onChange(fList.map(f => ({ name: f.name, value: undefined })))
                }}
            />
        </div>
        <div className="col" style={{ flex: 1, overflow: "hidden auto", padding: "1.6rem 2.4rem", gap: "0.8rem" }}>
            {fList.map((f, i, arr) => <FilterTile
                key={f.name + " - " + i}
                enableEdit={enableEdit}
                onScroll={i + 1 === arr.length}
                filterItem={f}
                columns={columns}
                fields={fields}
                showOptions={(ev) => showOptions(ev, f)}
                onChange={(f) => {
                    if (f) {
                        const tmp = fList.map(ef => ef.name === f.name ? f : ef) as any
                        setFList(tmp)
                        onChange(tmp)
                    }
                }}
                onRemove={() => {
                    setFList(prev => prev.filter(e => e.name !== f.name))
                    onChange(fList.filter(e => e.name !== f.name))
                }}
            />)}
            {enableEdit && <Button
                label={t("add")}
                className="button-text-5 button-infor size24 dashed"
                prefix={<Ebigicon src={"outline/user interface/e-add"} size={"1.2rem"} />}
                onClick={showOptions}
            />}
        </div>
    </div>
}

interface FilterTileProps {
    filterItem: { name: string, value: any };
    onScroll?: boolean;
    onRemove?: MouseEventHandler<HTMLDivElement>;
    columns: { [key: string]: any }[];
    fields: { [key: string]: any }[];
    onChange: (f: { name: string, value: any }) => void
    showOptions: MouseEventHandler<HTMLButtonElement>;
    enableEdit?: boolean
}

const FilterTile = ({ filterItem, onScroll, onRemove, columns = [], fields = [], onChange, showOptions, enableEdit = false }: FilterTileProps) => {
    const tmp = fields.find(e => (e.Column ?? e.Name) === filterItem.name)
    if (!tmp) return null
    const { t } = useTranslation()
    const colData = columns.find(e => e.Name === filterItem.name)
    const iconType = colData?.Type ?? (["CustomerId", "UserId"].includes(filterItem.name) ? ColDataType.people : ColDataType.text)

    return <>
        <div ref={r => {
            if (r && onScroll) r.parentElement!.scrollTo({ top: r.offsetTop, behavior: "smooth" })
        }} className="row" style={{ gap: "0.8rem" }}>
            <button type="button" className={`row ${styles["dropdown-select-btn"]}`} disabled={!enableEdit} onClick={showOptions}>
                {(ColDataTypeIcon as any)[iconType]}
                <Text style={{ flex: 1 }} className="body-3" maxLine={1}>{colData?.Title ?? tmp.Form.Label ?? filterItem.name}</Text>
                <Ebigicon src="outline/arrows/down-arrow" size={12} />
            </button>
            <div className="row" style={{ flex: 1, overflow: "visible" }}>
                {tmp && <InputValueTile fieldItem={tmp} filterItem={filterItem} colData={colData} onChange={onChange} />}
            </div>
            {enableEdit && <Ebigicon src="outline/user interface/trash-can" className="icon-button light" tooltip={{ message: t("remove") }} onClick={onRemove} />}
        </div>
    </>
}

interface InputValueTileProps {
    fieldItem: { [key: string]: any };
    filterItem: { name: string, value: any };
    colData?: { [key: string]: any };
    onChange: (f: { name: string, value: any }) => void
}

const InputValueTile = ({ fieldItem, filterItem, colData, onChange }: InputValueTileProps) => {
    const popupRef = useRef(null)
    const [relativeValue, setRelativeValue] = useState([])
    const [data, setData] = useState(filterItem)
    const { t } = useTranslation()

    useEffect(() => {
        if (fieldItem.TablePK) {
            const ids = (data.value?.split(",") ?? []).slice(0, 3)
            if (ids.length) {
                const controller = new DataController(fieldItem.TablePK)
                controller.getListSimple({ page: 1, size: ids.length, query: `@Id:{${ids.join(" | ")}}` }).then(res => { if (res.code === 200) setRelativeValue(res.data) })
            }
        }
    }, [data.value])

    useEffect(() => {
        setData(filterItem)
    }, [filterItem])

    const onChangeData = (vl?: string) => {
        if (vl !== undefined) {
            onChange({ ...data, value: vl })
            setData({ ...data, value: vl })
        } else {
            onChange({ ...data, value: undefined })
            setData({ ...data, value: undefined })
        }
    }

    switch (fieldItem.DataType) {
        case FEDataType.UNIQUE:
            const tmpDataValue = Array.isArray(data.value) ? data.value : data.value?.split(",") ?? []
            let label = fieldItem.Form.Options.filter((e: any) => tmpDataValue.includes(e.id))
            if (label.length) label = label.map((e: any) => e.name).join(", ")
            else label = undefined
            return <>
                <Popup ref={popupRef} />
                <button type="button" className={`row ${styles["button-filter"]}`}
                    onClick={(ev: any) => {
                        const btn = ev.target.closest("button")
                        if (btn.isOpen) return closePopup(popupRef as any)
                        btn.isOpen = true
                        const rect = btn.getBoundingClientRect()
                        showPopup({
                            ref: popupRef as any,
                            hideOverlay: true,
                            content: <FilterValueOptionsDropdown
                                onClose={() => { setTimeout(() => { btn.isOpen = false; }, 150); }}
                                style={{ top: rect.bottom + 2, left: rect.x, width: rect.width }}
                                initData={fieldItem.Form.Options}
                                selected={tmpDataValue.join(",")}
                                isMulti
                                onSelect={onChangeData} />
                        })
                    }}
                >
                    <Text className={label ? "body-3" : "placeholder-2"}>{label ?? `${t("select")} ${(colData?.Title ?? fieldItem.Form.Label ?? data.name).toLowerCase()}`}</Text>
                </button>
            </>
        case FEDataType.NUMBER:
        case FEDataType.MONEY:
            if (fieldItem.Form.Options?.length) {
                let label = fieldItem.Form.Options.filter((e: any) => data.value?.split(",").map((vl: string) => Number(vl)).includes(e.id))
                if (label.length) label = label.map((e: any) => e.name).join(", ")
                else label = undefined
                return <>
                    <Popup ref={popupRef} />
                    <button type="button" className={`row ${styles["button-filter"]}`}
                        onClick={(ev: any) => {
                            const btn = ev.target.closest("button")
                            if (btn.isOpen) return closePopup(popupRef as any)
                            btn.isOpen = true
                            const rect = btn.getBoundingClientRect()
                            showPopup({
                                ref: popupRef as any,
                                hideOverlay: true,
                                content: <FilterValueOptionsDropdown
                                    onClose={() => { setTimeout(() => { btn.isOpen = false }, 150) }}
                                    style={{ top: rect.bottom + 2, left: rect.x, width: rect.width }}
                                    initData={fieldItem.Form.Options}
                                    selected={data.value}
                                    isMulti
                                    onSelect={onChangeData} />
                            })
                        }}
                    >
                        <Text className={label ? "body-3" : "placeholder-2"}>{label ?? `${t("select")} ${(colData?.Title ?? fieldItem.Form.Label ?? data.name).toLowerCase()}`}</Text>
                    </button>
                </>
            } else {
                return <>
                    <Popup ref={popupRef} />
                    <button type="button" className={`row ${styles["button-filter"]}`} onClick={(ev: any) => {
                        const btn = ev.target.closest("button")
                        if (btn.isOpen) return closePopup(popupRef as any)
                        btn.isOpen = true
                        const rect = btn.getBoundingClientRect()
                        showPopup({
                            ref: popupRef as any,
                            hideOverlay: true,
                            content: <FilterRangeDropdown
                                fieldItem={fieldItem}
                                filterItem={data}
                                onClose={() => { setTimeout(() => { btn.isOpen = false }, 150) }}
                                style={{ top: rect.bottom + 2, left: rect.x, width: rect.width }}
                                onApply={(vl) => {
                                    closePopup(popupRef as any)
                                    onChangeData(vl)
                                }}
                            />
                        })
                    }}>
                        <Text className={data.value ? "body-3" : "placeholder-2"}>{data.value ?
                            fieldItem.DataType === FEDataType.MONEY ?
                                data.value.split(",").map((e: any) => Util.formatCurrency(e)).join(" - ") :
                                data.value.split(",").join(" - ") :
                            `${t("select")} ${(colData?.Title ?? fieldItem.Form.Label ?? data.name).toLowerCase()}`
                        }</Text>
                    </button>
                </>
            }
        case FEDataType.DATE:
        case FEDataType.DATETIME:
            const tmpValues = data.value?.split(",") ?? []
            return <DateTimePicker
                className={"body-3"}
                pickerType={fieldItem.DataType === FEDataType.DATE ? "daterange" : "datetimerange"}
                placeholder={`${t("select")} ${(colData?.Title ?? fieldItem.Form.Label ?? data.name).toLowerCase()}`}
                style={{ width: "100%", padding: "0 1.2rem", height: "3.2rem", border: "var(--neutral-main-border)" }}
                prefix={<Ebigicon src="outline/user interface/calendar-date-2" style={{ marginRight: "0.4rem" }} size={"1.2rem"} />}
                value={tmpValues[0] ? new Date(Number(tmpValues[0])) : undefined}
                endValue={tmpValues[1] ? new Date(Number(tmpValues[1])) : undefined}
                onChange={({ start, end }: any) => {
                    onChangeData(`${start.getTime()},${end.getTime()}`)
                }}
            />
        case FEDataType.BOOLEAN:
            return <div className="row" style={{ gap: '1.2rem 1.6rem', flex: 1, flexWrap: 'wrap' }}>
                <label className="row" style={{ gap: "0.8rem", cursor: "pointer" }}>
                    <RadioButton
                        value={"undefined"}
                        size={'1.6rem'}
                        name={filterItem.name}
                        checked={filterItem.value === undefined}
                        onChange={() => onChangeData(undefined)}
                    />
                    <Text className="label-4" maxLine={1}>{t("all")}</Text>
                </label>
                {(fieldItem.Form.Options?.length ? fieldItem.Form.Options : [{ id: "true", name: t("true") }, { id: "false", name: t("false") }]).map((e: { id: string, name: string }) => {
                    return <label key={e.id} className="row" style={{ gap: "0.8rem", cursor: "pointer" }}>
                        <RadioButton
                            value={e.id}
                            size={'1.6rem'}
                            name={filterItem.name}
                            checked={filterItem.value === e.id}
                            onChange={() => onChangeData(e.id)}
                        />
                        <Text className="label-4" maxLine={1}>{e.name}</Text>
                    </label>
                })}
            </div>
        default:
            if (fieldItem.Column) {
                const labels = data.value?.split(",").map((id: string) => relativeValue.find((f: any) => f.Id === id)).filter(Boolean) ?? []
                return <>
                    <Popup ref={popupRef} />
                    <button type="button" className={`row ${styles["button-filter"]}`}
                        onClick={(ev: any) => {
                            const btn = ev.target.closest("button")
                            if (btn.isOpen) return closePopup(popupRef as any)
                            btn.isOpen = true
                            const rect = btn.getBoundingClientRect()
                            showPopup({
                                ref: popupRef as any,
                                hideOverlay: true,
                                content: <FilterValueOptionsDropdown
                                    onClose={() => { setTimeout(() => { btn.isOpen = false }, 150) }}
                                    style={{ top: rect.bottom + 2, left: rect.x, width: rect.width }}
                                    selected={data.value}
                                    controlName={fieldItem.TablePK}
                                    isMulti
                                    searchRaw={fieldItem.Query?.length ? fieldItem.Query : undefined}
                                    onSelect={onChangeData}
                                />
                            })
                        }}
                    >
                        {!!labels.length ? <>
                            {labels.slice(0, 2).map(((el: any) => <Tag key={el.Id} title={el.Name}
                                className="size24 button-text-6 tag-grey"
                                suffix={<Ebigicon src="outline/user interface/e-remove" size={12} onClick={(ev) => {
                                    ev.stopPropagation()
                                    const tmpValue = data.value?.split(",").filter((id: string) => id !== el.Id).join(",")
                                    onChangeData(tmpValue.length ? tmpValue : undefined)
                                }} />}
                            />))}
                            {!!labels.length && data.value.split(",").length > 2 && <Tag title={`+${data.value.split(",").length - 2}`} className="size24 button-text-6 tag-grey" />}
                        </> : <Text className="placeholder-2">{`${t("select")} ${(colData?.Title ?? fieldItem.Form.Label ?? data.name).toLowerCase()}`}</Text>}
                    </button>
                </>
            }
            return null
    }
}

interface FilterRangeDropdownProps {
    onClose?: () => void;
    style?: CSSProperties;
    onApply?: (vl: any) => void;
    fieldItem: { [key: string]: any };
    filterItem: { name: string, value: any };
}

const FilterRangeDropdown = ({ onClose, style = {}, onApply, fieldItem, filterItem }: FilterRangeDropdownProps) => {
    const minInputRef = useRef<any>(null)
    const maxInputRef = useRef<any>(null)
    const [minMax, setMinMax] = useState({ min: 0, max: 0 })
    const [value, setValue] = useState(filterItem.value)
    const { t } = useTranslation()

    useEffect(() => {
        return () => { if (onClose) onClose() }
    }, [])

    useEffect(() => {
        const controller = new DataController(fieldItem.TableName)
        Promise.all([
            controller.group({
                searchRaw: "*",
                reducers: `FILTER "exists(@${fieldItem.Name})" GROUPBY 0 REDUCE MIN 1 @${fieldItem.Name} AS min`
            }),
            controller.group({
                searchRaw: "*",
                reducers: `FILTER "exists(@${fieldItem.Name})" GROUPBY 0 REDUCE MAX 1 @${fieldItem.Name} AS max`
            }),
        ]).then(res => {
            if (res.every(r => r.code === 200)) setMinMax({ min: parseInt(res[0].data[0]?.min ?? 0), max: parseInt(res[1].data[0]?.max ?? 0) })
        })
    }, [])

    useEffect(() => {
        if (minInputRef.current && maxInputRef.current) {
            minInputRef.current.inputElement!.value = value ? fieldItem.DataType === FEDataType.MONEY ? Util.formatCurrency(value.split(",")[0]) : value.split(",")[0] : ""
            maxInputRef.current.inputElement!.value = value ? fieldItem.DataType === FEDataType.MONEY ? Util.formatCurrency(value.split(",")[1]) : value.split(",")[1] : ""
        }
    }, [value, minInputRef.current, maxInputRef.current])

    return <div className="col dropdown-popup popup-actions" style={{ minWidth: "30rem", maxWidth: "36rem", padding: "1.6rem", gap: "1.6rem", alignItems: "center", maxHeight: "fit-content", ...style }}>
        {(minMax.min === 0 && minMax.max === 0) ? <div className="col" style={{ gap: "0.8rem", alignItems: "inherit" }}>
            <Ebigicon src="color/files/archive-doc" size={"2.8rem"} />
            <Text className="heading-7">No data</Text>
        </div> : <>
            <div className="row" style={{ gap: "1.6rem", width: "100%" }}>
                <div className="col" style={{ gap: "0.8rem", flex: 1 }}>
                    <Text className="label-3">{t("min")}</Text>
                    <TextField
                        ref={minInputRef}
                        className="body-3 size32"
                        placeholder={t("min")}
                        defaultValue={value?.length ? fieldItem.DataType === FEDataType.MONEY ? Util.formatCurrency(value.split(",")[0]) : value.split(",")[0] : ""}
                        onFocus={(ev) => {
                            if (fieldItem.DataType === FEDataType.MONEY) ev.target.value = ev.target.value.replace(/,/g, "")
                            ev.target.select()
                        }}
                        onBlur={(ev: any) => {
                            ev.target.value = ev.target.value.trim()
                            if (isNaN(parseInt(ev.target.value))) ev.target.value = value?.split(",")[0]
                            else if (value?.split(",")[1] && parseInt(ev.target.value) > parseInt(value?.split(",")[1])) ev.target.value = value?.split(",")[1]
                            else if (parseInt(ev.target.value) < minMax.min) ev.target.value = minMax.min
                            setValue(`${ev.target.value},${value?.split(",")[1]}`)
                        }}
                    />
                </div>
                <div className="col" style={{ gap: "0.8rem", flex: 1 }}>
                    <Text className="label-3">{t("max")}</Text>
                    <TextField
                        ref={maxInputRef}
                        className="body-3 size32"
                        placeholder={t("max")}
                        defaultValue={value?.length ? fieldItem.DataType === FEDataType.MONEY ? Util.formatCurrency(value.split(",")[1]) : value.split(",")[1] : ""}
                        onFocus={(ev) => {
                            if (fieldItem.DataType === FEDataType.MONEY) ev.target.value = ev.target.value.replace(/,/g, "")
                            ev.target.select()
                        }}
                        onBlur={(ev: any) => {
                            ev.target.value = ev.target.value.trim()
                            if (isNaN(parseInt(ev.target.value))) ev.target.value = value?.split(",")[1]
                            else if (value?.split(",")[0] && parseInt(ev.target.value) < parseInt(value?.split(",")[0])) ev.target.value = value?.split(",")[0]
                            else if (parseInt(ev.target.value) > minMax.max) ev.target.value = minMax.max
                            setValue(`${value?.split(",")[0]},${ev.target.value}`)
                        }}
                    />
                </div>
            </div>
            <Slider
                formatter={(fieldItem.DataType === FEDataType.MONEY ? Util.formatCurrency : undefined) as any}
                style={{ width: "calc(100% - 2.4rem)", height: "1.6rem" }}
                range
                tooltip
                step={Number(((minMax.max - minMax.min) / 100).toFixed(2))}
                min={minMax.min} max={minMax.max}
                defaultValue={value?.length ? value.split(",").map((v: any) => parseInt(v)) : [minMax.min, minMax.max]}
                onChangeComplete={(vl: any) => {
                    setValue(`${vl[0]},${vl[1]}`);
                }} />
            <div className="col" style={{ gap: 2, width: "100%" }}>
                {Array.from({ length: 5 }).map((_, i) => {
                    const part = fieldItem.DataType === FEDataType.MONEY ? Math.round((minMax.max - minMax.min) / 5000) * 1000 : Math.round((minMax.max - minMax.min) / 5)
                    const num = minMax.min + part * i
                    const numMax = i === 4 ? minMax.max : Math.ceil(num + part)
                    return <label key={i} className="row default-hover" style={{ gap: "1rem", width: "100%", padding: "0.5rem", cursor: "pointer", borderRadius: "0.8rem" }}>
                        <RadioButton name="range" size={"1.6rem"} value={`${num},${numMax}`} checked={value === `${num},${numMax}`} onChange={() => setValue(`${num},${numMax}`)} />
                        <Text className="label-4" style={{ flex: 1 }}>{fieldItem.DataType === FEDataType.MONEY ?
                            Util.formatCurrency(Math.floor(num)) : Math.floor(num)} - {fieldItem.DataType === FEDataType.MONEY ?
                                Util.formatCurrency(numMax) : numMax}</Text>
                    </label>
                })}
            </div>
            <div className="row" style={{ justifyContent: "end", gap: "0.8rem", width: "100%" }}>
                <Button
                    className="button-text-5 size24 button-grey"
                    label={t("reset")}
                    onClick={() => {
                        setValue(filterItem.value)
                    }}
                />
                <Button
                    className="button-text-5 size24 button-primary"
                    label={t("apply")}
                    onClick={() => { onApply?.(value) }}
                />
            </div>
        </>}
    </div>
}

interface FilterValueOptionsDropdownProps {
    onClose?: () => void,
    onSelect: (value?: string) => void,
    style?: any,
    selected?: any,
    initData?: any[],
    controlName?: string,
    searchRaw?: string,
    isMulti?: boolean
}

const FilterValueOptionsDropdown = ({ onClose, onSelect, style = {}, selected, initData = [], controlName, searchRaw = "*", isMulti = false }: FilterValueOptionsDropdownProps) => {
    const [options, setOptions] = useState<{ data: { [p: string]: any }[], totalCount?: number }>({ data: [], totalCount: undefined })
    const [value, setValue] = useState<string | undefined>(selected)
    const [search, setSearch] = useState("")
    const searchDefer = useDeferredValue(search)
    const { t } = useTranslation()
    const totalCountAll = useRef<number>(undefined)

    useEffect(() => {
        return () => { if (onClose) onClose() }
    }, [])

    const getData = async (page?: number) => {
        const controller = new DataController(controlName!)
        const returns: Array<string> = ["Id", "Name"]
        if (controlName === "User" || controlName === "Customer") returns.push("AvatarUrl")
        let querySearch = searchRaw;
        if (searchDefer.length) {
            querySearch = querySearch === "*" ?
                `(@Name:("${searchDefer}")${controlName === "User" || controlName === "Customer" ? ` | @Email:{*${searchDefer.replace(specialCharsRegex, (m: string) => `\\${m}`)}*} | @Mobile:{*${searchDefer.replace(specialCharsRegex, (m: string) => `\\${m}`)}*}` : ""})` :
                `${querySearch} (@Name:("${searchDefer}")${controlName === "User" || controlName === "Customer" ? ` | @Email:{*${searchDefer.replace(specialCharsRegex, (m: string) => `\\${m}`)}*} | @Mobile:{*${searchDefer.replace(specialCharsRegex, (m: string) => `\\${m}`)}*}` : ""})`
        }
        const res = await controller.aggregateList({ page: page ?? 1, size: 20, searchRaw: querySearch, returns: returns })
        if (res.code === 200) {
            setOptions({ data: page ? [...options.data, ...res.data] : res.data, totalCount: res.totalCount })
            if (!searchDefer.length) totalCountAll.current = res.totalCount
        }
    }

    useEffect(() => {
        if (initData.length) setOptions({ data: initData, totalCount: initData.length })
        else if (controlName) getData()
    }, [searchDefer])


    return <InfiniteScroll
        handleScroll={async (onLoadMore) => {
            if (onLoadMore && options.totalCount && options.data.length < options.totalCount) await getData(Math.floor(options.data.length / 20) + 1)
        }}
        className="col dropdown-popup popup-actions" style={{ maxHeight: "32rem", overflow: "hidden auto", ...style }}>
        {!!totalCountAll.current && totalCountAll.current > 20 && <div className="row" style={{ padding: 4, backgroundColor: "var(--neutral-absolute-background-color, #fff)", position: "sticky", top: 0, zIndex: 2, transform: "translateY(-4px)" }}>
            <TextField
                autoFocus
                placeholder={t("search")}
                className="body-3 size24"
                style={{ flex: 1, backgroundColor: "var(--neutral-main-background-color, #EFEFF0)" }}
                prefix={<Ebigicon src="outline/user interface/search" size={12} />}
                onChange={(ev) => { setSearch(ev.target.value.trim()) }}
                onComplete={(ev) => {
                    switch (ev.key.toLowerCase()) {
                        case "enter":
                            (ev.target as any).blur()
                            break;
                        default:
                            break;
                    }
                }}
            />
        </div>}
        {totalCountAll.current === 0 && <div className="col" style={{ gap: "0.8rem", alignItems: "center" }}>
            <Ebigicon src="color/files/archive-doc" size={"2.8rem"} />
            <Text className="heading-7">No data</Text>
        </div>}
        {options.totalCount === 0 && !!totalCountAll.current && <div className="col" style={{ gap: "0.8rem", alignItems: "center" }}>
            <Ebigicon src="color/files/archive-doc" size={"2.8rem"} />
            <Text className="heading-7">No result</Text>
        </div>}
        {isMulti ? options.data.map((op) => {
            const checked = `${value}` === `${op.Id ?? op.id}` || (typeof value === "string" && value?.includes(op.Id ?? op.id))
            return <label key={op.Id ?? op.id} className="row default-hover" style={{ gap: "0.8rem", padding: "5px 0.8rem", borderRadius: 8, cursor: "pointer" }} >
                <Checkbox onChange={(ev) => {
                    let tmp = value?.split(",") ?? []
                    if (ev) tmp.push(`${op.Id ?? op.id}`)
                    else tmp = tmp.filter((e: any) => e !== `${op.Id ?? op.id}`)
                    onSelect(tmp.length ? tmp.join(",") : undefined)
                    setValue(tmp.length ? tmp.join(",") : undefined)
                }} value={checked} size={"1.8rem"} />
                {(controlName === "User" || controlName === "Customer") && <CustomerAvatar data={op} style={{ width: "2.8rem" }} />}
                <Text style={{ flex: 1 }} className="label-3" maxLine={1}>{op.Name ?? op.name}</Text>
            </label>
        }) : options.data.map((op) => {
            const checked = `${value}` === `${op.Id ?? op.id}` || (typeof value === "string" && value.includes(op.Id ?? op.id))
            return <button key={op.Id ?? op.id} type="button" className="row"
                style={{ gap: 8, padding: "5px 0.8rem", borderRadius: 8, backgroundColor: checked ? "var(--neutral-selected-background-color)" : undefined }}
                onClick={() => {
                    onSelect(op.Id);
                    setValue(op.Id);
                }}>
                {(controlName === "User" || controlName === "Customer") && <CustomerAvatar data={op} style={{ width: "2.8rem" }} />}
                <Text style={{ flex: 1 }} className="label-3" maxLine={1}>{op.Name ?? op.name}</Text>
            </button>
        })}
    </InfiniteScroll>
}

interface FilterOptionsDropdownProps {
    onClose?: () => void
    onSelect: (data: { name: string, value: any }) => void
    data: { name: string, value: any }[]
    style?: CSSProperties
    fields?: { [key: string]: any }[]
    columns?: { [key: string]: any }[]
}

const FilterOptionsDropdown = ({ onClose, onSelect, data = [], style, fields = [], columns = [] }: FilterOptionsDropdownProps) => {
    useEffect(() => {
        return () => { if (onClose) onClose() }
    }, [])
    return <div className="col dropdown-popup popup-actions" style={{ maxHeight: "24rem", overflow: "hidden auto", maxWidth: 200, minWidth: 160, ...style }}>
        {data.map((op, i) => {
            const tmp = fields.find(e => (e.Column ?? e.Name) === op.name) as any
            const colData = columns.find(e => e.Name === op.name)
            const iconType = colData?.Type ?? (["CustomerId", "UserId"].includes(op.name) ? ColDataType.people : ColDataType.text)
            return <button key={op.name + " -  " + i} type="button" className="row" onClick={() => { onSelect(op) }}>
                {(ColDataTypeIcon as any)[iconType]}
                <Text style={{ flex: 1 }} className="button-text-3" maxLine={1}>{colData?.Title ?? tmp.Form.Label ?? op.name}</Text>
            </button>
        })}
    </div>
}

// #region button import
export const ButtonImportData = ({ onImport }: { onImport?: (result: { [key: string]: any }[]) => void }) => {
    const popupRef = useRef(null)
    const { t } = useTranslation()

    const handleImport = async (by: any) => {
        if (by) {
            if (by instanceof File) {

            } else if (typeof by === "string") {
                const res = await handleGoogleSheetFetch(by) as any
                if (!res?.length) return []
                return res
            }
        }
    }

    return <>
        <Popup ref={popupRef as any} />
        <Button
            prefix={<Ebigicon src='outline/user interface/data-upload' />}
            label={t("import")}
            onClick={(ev: any) => {
                const rect = ev.target.closest("button").getBoundingClientRect()
                showPopup({
                    ref: popupRef as any,
                    hideOverlay: true,
                    content: <div className='col popup-actions dropdown-popup' style={{ width: "16rem", top: rect.bottom + 2, right: `calc(100dvw - ${rect.right}px)` }}>
                        <button type='button' className='row' onClick={() => {
                            showPopup({
                                ref: popupRef as any,
                                clickOverlayClosePopup: true,
                                content: <div className="col">
                                    <Text className="heading-8" style={{ padding: "0.8rem 1.6rem", borderBottom: "1px solid var(--neutral-border-color-main)" }}>Gắn link google sheets</Text>
                                    <div className="col" style={{ padding: "0.8rem 1.6rem", alignItems: "end", gap: "1.6rem" }}>
                                        <TextField
                                            style={{ width: "40rem" }}
                                            placeholder="Nhập link google sheets"
                                            className="body-3 size32"
                                        />
                                        <Button
                                            className="button-primary button-text-3"
                                            onClick={async (ev: any) => {
                                                const input = ev.target.closest(".col").querySelector("input")
                                                const sheetUrl = input.value
                                                const result = await handleImport(sheetUrl)
                                                onImport?.(result ?? [])
                                                closePopup(popupRef as any)
                                            }}
                                            label={t("save")}
                                        />
                                    </div>
                                </div>
                            })
                        }}>
                            <Text className='button-text-3'>Google sheets</Text>
                        </button>
                        <button type='button' className='row'>
                            <Text className='button-text-3'>Tệp xlsx</Text>
                        </button>
                    </div>
                })
            }}
        />
    </>
}

// #region actions
interface ActionOptionsDropdownProps {
    onClose?: () => void;
    actions?: { [p: string]: any }[];
    onChangeActions?: (params: { [p: string]: any }[]) => void;
    onEditActionColumn?: (params: { [p: string]: any }, actionItem: { [p: string]: any }) => void;
    style?: CSSProperties;
    onEdit?: () => void;
    onDuplicate?: () => void;
    onDelete?: () => void;
    item: { [p: string]: any };
    tbName: string;
}

export const ActionOptionsDropdown = forwardRef(({ onClose, actions = [], onChangeActions, onEditActionColumn, style, onEdit, onDuplicate, onDelete, item, tbName }: ActionOptionsDropdownProps, ref: any) => {
    const controller = new DataController(tbName)
    const [data, setData] = useState()
    const { t } = useTranslation()

    useEffect(() => {
        if (actions.length) {
            const pattern: any = {
                returns: ["Id"]
            }
            actions.forEach(e => {
                pattern[e.TableFK] = {
                    searchRaw: `@${tbName}Id:{*${item.Id}*}`,
                    reducers: `GROUPBY 1 @${tbName}Id REDUCE COUNT 0 AS total${e.TableFK}`
                }
            })
            controller.patternList({
                page: 1, size: 1, searchRaw: `@Id:{${item.Id}}`,
                pattern: pattern,
            }).then(res => {
                setData(res.data[0])
            })
        }
        return () => { if (onClose) onClose() }
    }, [])

    return <div className="col dropdown-popup popup-actions" style={style}>
        {onEdit && <button type="button" className="row" onClick={() => {
            closePopup(ref)
            onEdit()
        }}>
            <Ebigicon src={"outline/user interface/edit"} size={14} />
            <Text className='label-3'>{t("edit")}</Text>
        </button>}
        {onDuplicate && <button type='button' className='row' onClick={onDuplicate}>
            <Ebigicon src={"outline/layout/copy-2"} size={14} />
            <Text className='label-3'>{t("duplicate")}</Text>
        </button>}
        {actions.map(e => {
            return <button key={e.Id} type='button' className='row' onClick={() => {
                console.log(e)
                showPopup({
                    ref: ref,
                    content: <FKTable
                        onClose={() => closePopup(ref)}
                        item={item}
                        fkItem={e}
                        tbName={tbName}
                        actions={actions}
                        onChangeActions={onChangeActions}
                        onEditActionColumn={onEditActionColumn}
                        enableEdit={!!onEdit}
                    />
                })
            }}>
                {e.Prefix ? <Ebigicon src={e.Prefix} size={14} /> : <div style={{ width: "1.8rem" }} />}
                <Text className='label-3' maxLine={1}>{e.Name} ({data?.[`total${e.TableFK}`] ?? 0})</Text>
            </button>
        })}
        {onDelete && <button type="button" className="row" onClick={() => {
            closePopup(ref)
            showDialog({
                alignment: DialogAlignment.center,
                title: `${t("confirm")} ${t("delete").toLowerCase()}`,
                content: t("areYouSure", { act: t("delete").toLowerCase(), name: tbName.toLowerCase() }),
                submitTitle: t("delete"),
                onSubmit: onDelete
            })
        }}>
            <Ebigicon src={"outline/user interface/trash-can"} size={14} />
            <Text className='label-3'>{t("delete")}</Text>
        </button>}
    </div>
})

interface FKTableProps {
    fkItem: { [p: string]: any };
    item: { [p: string]: any };
    tbName: string;
    actions?: { [p: string]: any }[];
    onChangeActions?: (params: { [p: string]: any }[]) => void;
    onEditActionColumn?: (params: { [p: string]: any }, actionItem: { [p: string]: any }) => void;
    enableEdit?: boolean;
    onClose?: () => void;
}

const FKTable = ({ fkItem, item, tbName, actions, onChangeActions, onEditActionColumn, enableEdit, onClose }: FKTableProps) => {
    const [filterData, setFilterData] = useState({ searchRaw: "*", sortby: [] })
    const [isExpand, setExpand] = useState(false)
    const props: any = {}
    props[`${tbName}Id`] = item.Id

    return <div className="col" style={{ transition: "max-width, max-height, width, height 0.6s", width: isExpand ? "100dvw" : "calc(100dvw - 4.8rem)", height: isExpand ? "100dvh" : "calc(100dvh - 4.8rem)", maxWidth: isExpand ? "100dvw" : 1320, maxHeight: isExpand ? "100dvh" : 800 }}>
        <div className='row popup-header'>
            <Text className='heading-7' style={{ flex: 1 }} maxLine={2}>{fkItem.Name}</Text>
            <Ebigicon
                src={isExpand ? "fill/arrows/centralize" : "fill/multimedia/fullscreen"}
                size={14} className="icon-button size24"
                onClick={() => { setExpand(!isExpand) }}
            />
            <Ebigicon src={"fill/user interface/e-remove"} className="icon-button size24" onClick={onClose} />
        </div>
        <div className="col" style={{ flex: 1 }}>
            <DataTable
                showIndex
                staticSearch={`@${tbName}Id:{*${item.Id}*}`}
                enableEdit={enableEdit}
                tbName={fkItem.TableFK}
                title={fkItem.Name}
                columns={fkItem.Columns}
                onChangeFilterData={setFilterData}
                filterData={filterData}
                onEditColumn={onChangeActions ? ((_col) => { onEditActionColumn?.(_col, fkItem) }) : undefined}
                onChangeConfigData={onChangeActions ? ((ev) => {
                    const tmp = { ...fkItem, Columns: ev }
                    onChangeActions(actions!.map(a => a.Id === fkItem.Id ? tmp : a))
                }) : undefined}
                filterList={fkItem.Filter ?? []}
                onChangeFilterList={onChangeActions ? ((ev) => {
                    if (JSON.stringify(ev) !== JSON.stringify(fkItem.Filter)) {
                        const tmp = { ...fkItem, Filter: ev }
                        onChangeActions(actions!.map(a => a.Id === fkItem.Id ? tmp : a))
                    }
                }) : undefined}
                onSelectCustomForm={onChangeActions ? ({ formAdd, formEdit }) => {
                    const tmp = { ...fkItem, FormId: formAdd, EditFormId: formEdit }
                    onChangeActions(actions!.map(a => a.Id === fkItem.Id ? tmp : a))
                } : undefined}
                customFormId={{ formAdd: fkItem.FormId, formEdit: fkItem.EditFormId }}
                formTitle={{ formAdd: fkItem.FormTitle, formEdit: fkItem.EditFormTitle }}
                onChangeFormTitle={onChangeActions ? (({ formAdd, formEdit }) => {
                    const tmp = { ...fkItem, FormTitle: formAdd, EditFormTitle: formEdit }
                    onChangeActions(actions!.map(a => a.Id === fkItem.Id ? tmp : a))
                }) : undefined}
                {...props}
            />
        </div>
    </div>
}