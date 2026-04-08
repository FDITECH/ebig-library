import styles from "./table.module.css";
import { BaseDA, Button, DataController, DialogAlignment, imgFileTypes, OptionsItem, Pagination, Popup, randomGID, SettingDataController, showDialog, showPopup, TableController, Text, ToastMessage, useParams, useEbigContext, Util, Ebigicon } from "../../index";
import { CSSProperties, Dispatch, forwardRef, ReactNode, SetStateAction, useEffect, useImperativeHandle, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useForm, UseFormReturn } from "react-hook-form";
import { TableHeader, TableRow } from "./tableElement";
import ExportXlsx from "./exportXlsx";
import { ButtonImportData, SearchFilterData } from "./featureElement";
import { FEDataType } from "../da";
import { cellValue } from "./config";
import AddEditElementForm from "./addEditElement";
import { AsyncFunction, getValidLink } from "../page/pageById";

export function TableById({ id, ...props }: { id: string, className?: string, style?: CSSProperties }) {
    const [reportItem, setReportItem] = useState<{ [p: string]: any }>()
    const settingDataController = new SettingDataController("report")
    const [filterSearch, setFilterSearch] = useState<any>({ searchRaw: "*", sortby: [] })
    const params = useParams()

    useEffect(() => {
        if (id) {
            settingDataController.getByIds([id]).then((res: any) => {
                if (res.code === 200 && res.data[0]) {
                    let tmp = res.data[0]
                    if (tmp.Props && typeof tmp.Props === "string") tmp.Props = JSON.parse(tmp.Props)
                    setReportItem(tmp)
                }
            })
        }
    }, [id])

    const [handleRequired, setHandleRequired] = useState()
    useEffect(() => {
        if (reportItem) {
            const updateRequired = async () => {
                const tmp = await (new AsyncFunction(
                    "Util", "DataController", "randomGID", "ToastMessage", "useEbigContext", "useParams",
                    reportItem.Props.requiredSearchRaw
                ))(Util, DataController, randomGID, ToastMessage, useEbigContext, () => params)
                return tmp
            }
            if (reportItem.Props.requiredSearchRaw?.length) updateRequired().then(setHandleRequired)
            else setHandleRequired(undefined)
        }
    }, [reportItem?.Props?.requiredSearchRaw])

    return reportItem && <>
        {reportItem.Props && <DataTable
            enableEdit
            key={reportItem.Id}
            showIndex={reportItem.Props.showIndex}
            hideCheckbox={reportItem.Props.hideCheckbox}
            tbName={reportItem.TbName}
            actions={reportItem.Props.actions ?? []}
            title={reportItem.Name}
            columns={reportItem.Props.props ?? []}
            filterList={reportItem.Props.filter ?? []}
            onChangeFilterData={setFilterSearch}
            formTitle={{ formAdd: reportItem.Props.FormTitle, formEdit: reportItem.Props.EditFormTitle }}
            customFormId={{ formAdd: reportItem.Props.FormId, formEdit: reportItem.Props.EditFormId }}
            filterData={{
                required: handleRequired,
                ...filterSearch
            }}
            className={props.className}
            style={props.style}
        />}
    </>
}

interface DataTableProps {
    id?: string;
    className?: string;
    style?: CSSProperties;
    tbName: string;
    staticSearch?: string;
    title?: string;
    columns: Array<{ [p: string]: any }>,
    onChangeConfigData?: (params: Array<{ [p: string]: any }>) => void;
    filterData?: {
        searchRaw: string,
        pattern?: { returns: Array<string>, [p: string]: Array<string> | { searchRaw?: string, reducers: string } },
        sortby: Array<{ prop: string, direction: string }>,
        /** requred searchRaw */
        required?: string
    };
    filterList?: Array<string>;
    onChangeFilterList?: (filterList: Array<string>) => void;
    onChangeFilterData?: (params: { searchRaw: string; sortby: Array<{ prop: string, direction: string }>; searchData?: { name: string, value: any }[] }) => void;
    showIndex?: boolean;
    hideCheckbox?: boolean;
    enableEdit?: boolean;
    actions?: Array<{ [p: string]: any }>;
    onChangeActions?: () => void;
    onEditColumn?: (params: { [p: string]: any }) => void;
    customCell?: { [k: string]: (params: { item: { [p: string]: any }, index: number }) => ReactNode };
    customFilterOptions?: { [k: string]: { query?: string, options?: OptionsItem[] } };
    hideActionColumn?: boolean;
    /** allow: "add" | "total" | "divider" | "search" | "export" | "import" | ReactNode | undefined */
    features?: Array<"add" | "total" | "divider" | "search" | "filter" | "export" | "import" | ReactNode | undefined>;
    /** toolbars = false OR an array allow: "total" | "export" | "duplicate" | "delete" | ReactNode | undefined */
    toolbars?: Array<"total" | "export" | "duplicate" | "delete" | ReactNode | undefined> | false;
    /** default: true */
    isMultiplePage?: boolean;
    getData?: (page: number, size: number, exportData?: boolean) => Promise<{ data: Array<{ [p: string]: any }>, totalCount?: number }>;
    expandForm?: (methods: UseFormReturn) => ReactNode;
    handleSubmit?: (params: { item: { [k: string]: any }, initItem?: { [k: string]: any }, methods: UseFormReturn, onSuccess?: () => void }) => Promise<any>;
    customFields?: { [key: string]: (methods: UseFormReturn) => ReactNode };
    onClickRow?: (prarams: { item: { [p: string]: any }, index: number, event: MouseEvent }) => void;
    onContextMenu?: (prarams: { item: { [p: string]: any }, index: number, event: MouseEvent }) => void;
    onSelectCustomForm?: (params: { formAdd?: string | null, formEdit?: string | null }) => void;
    customFormId?: { formAdd?: string, formEdit?: string };
    formTitle?: { formAdd?: string, formEdit?: string };
    onChangeFormTitle?: (params: { formAdd?: string | null, formEdit?: string | null }) => void;
    handleImport?: (data: { [p: string]: any }[]) => Promise<{ [p: string]: any }[]>;
    handleExport?: (data: { [p: string]: any }[]) => Promise<{ [p: string]: any }[]>;
    customTablePKOptions?: { [pk: string]: string }
}

interface DataTableRef {
    parseSearchDataToSearchRaw: (searchData: { name: string, value: any }[]) => { searchRaw: string, searchData: { name: string, value: any }[] },
    getData: (params: { page?: number, size?: number, exportData?: boolean, id?: string }) => Promise<any>;
    fields: Array<{ [p: string]: any }>,
    data: { data: Array<{ [p: string]: any }>, totalCount?: number };
    setData: Dispatch<SetStateAction<{ data: Array<{ [p: string]: any }>, totalCount?: number }>>;
    selected: string[];
    setSelected: Dispatch<SetStateAction<string[]>>;
    showAddEditPopup: (id?: string) => void
}

export const DataTable = forwardRef<DataTableRef, DataTableProps>(({
    id,
    className,
    style = {},
    staticSearch = "",
    tbName,
    columns = [],
    onChangeConfigData,
    filterData = { searchRaw: "*", sortby: [] },
    filterList = [],
    onChangeFilterList,
    onChangeFilterData,
    showIndex = false,
    hideCheckbox = false,
    enableEdit = false,
    isMultiplePage = true,
    actions = [],
    onChangeActions,
    onEditColumn,
    features = ["add", "total", <div key={"space"} style={{ flex: 1 }} />, "search", "filter", "divider", "export"],
    toolbars = ["total", <div key={"space"} style={{ flex: 1 }} />, "export", "duplicate", "delete"],
    customFormId, onSelectCustomForm,
    formTitle, onChangeFormTitle,
    handleImport, handleExport,
    ...props }, ref) => {
    // static variables
    const configMethods = useForm<any>({ shouldFocusError: false, defaultValues: { columns: [], searchRaw: "*", sortby: [], TbName: tbName } })
    const dataController = new DataController(tbName)
    const relController = new TableController("rel")
    const colController = new TableController("column")
    const popupRef = useRef<Popup>(null)
    const { t } = useTranslation()
    // dynamic variables
    const [data, setData] = useState<{ data: Array<{ [p: string]: any }>, totalCount?: number }>({ data: [], totalCount: undefined })
    const [pageDetails, setPageDetails] = useState({ page: 1, size: 20 })
    const methodsRelative = useForm<any>({ shouldFocusError: false })
    const relativeData = useMemo<{ [p: string]: any }>(() => methodsRelative.watch(), [JSON.stringify(methodsRelative.watch())])
    const methodsRelativeFields = useForm<any>({ shouldFocusError: false })
    const relativeFields = useMemo<{ [p: string]: any[] }>(() => methodsRelativeFields.watch(), [JSON.stringify(methodsRelativeFields.watch())])
    const [files, setFiles] = useState<{ [p: string]: any }[]>([])
    const [fields, setFields] = useState<{ [p: string]: any }[]>([])
    const [selected, setSelected] = useState<string[]>([])
    const treeData = useMemo(() => fields.some(e => e.Column === 'ParentId'), [fields])

    // initData
    const getFields = async () => {
        const res = await Promise.all([
            relController.getListSimple({ size: 1000, query: `@TableFK:{${tbName}}`, returns: ["Id", "Column", "TablePK", "TableFK", "Query", "Form"] }),
            colController.getListSimple({ size: 1000, query: `@TableName:{${tbName}} -@Name:{Id}`, returns: ["Id", "Name", "DataType", "Query", "Form", "TableName"], sortby: { BY: "DateCreated" } })
        ])
        if (res.every((e: any) => e.code === 200)) {
            setFields(res.map((e: any) => e.data).flat(Infinity).map((e: any) => ({ ...e, Form: JSON.parse(e.Form) })))
        }
    }

    useEffect(() => {
        if (tbName) {
            configMethods.setValue("TbName", tbName)
            getFields()
        }
    }, [tbName])
    useEffect(() => { configMethods.setValue("columns", columns) }, [columns])
    useEffect(() => { configMethods.setValue("searchRaw", filterData.searchRaw ?? "*") }, [filterData.searchRaw])
    useEffect(() => { configMethods.setValue("sortby", filterData.sortby ?? []) }, [JSON.stringify(filterData.sortby)])

    useEffect(() => {
        const { searchRaw, sortby } = configMethods.watch()
        if (onChangeFilterData && (searchRaw !== filterData.searchRaw || JSON.stringify(sortby) !== JSON.stringify(filterData.sortby)))
            onChangeFilterData({ searchRaw, sortby })
    }, [JSON.stringify(configMethods.watch("sortby"))])

    // get data
    const getData = async ({ page = 1, size = 20, exportData = false, ...rest }: { page?: number, size?: number, exportData?: boolean, id?: string }) => {
        if (props.getData) {
            const result = await props.getData(page, size, exportData)
            if (exportData) return result
            else return setData(result)
        }
        const pattern: any = {
            returns: ["Id", ...columns.map(e => e.Name.split(".").shift())].filter((k, i, a) => a.indexOf(k) === i),
        }
        const { searchRaw, sortby } = configMethods.getValues()
        let querySearch = searchRaw
        if (staticSearch.length) querySearch = `${staticSearch} ${querySearch !== "*" ? querySearch : ""}`
        querySearch = escapeRedisTagValue(querySearch)
        if (treeData) pattern[tbName] = { searchRaw: "*", reducers: "GROUPBY 1 @ParentId REDUCE COUNT 0 AS _totalChild" }
        if (filterData.pattern?.returns) {
            const pkKeysByPattern = filterData.pattern.returns.filter((pk: string) => pk.split(".").length > 1);
            pkKeysByPattern.forEach((k) => {
                const tmp = k.split(".")
                pattern[tmp[0]] ??= ["Id"]
                if (!pattern[tmp[0]].includes(tmp[1])) pattern[tmp[0]].push(tmp[1])
                if (!pattern.returns.includes(tmp[0])) pattern.returns.push(tmp[0])
            })
            pattern.returns = pattern.returns.concat(filterData.pattern.returns).filter((k: string) => k.split(".").length === 1).filter((k: string, i: number, a: string[]) => a.indexOf(k) === i)
        }
        const pkKeys = columns.filter(e => e.Name.split(".").length > 1);
        pkKeys.forEach((e) => {
            const tmp = e.Name.split(".")
            pattern[tmp[0]] ??= ["Id"]
            if (!pattern[tmp[0]].includes(tmp[1])) pattern[tmp[0]].push(tmp[1])
        });
        const finalSearchRaw = treeData ? `@ParentId:{empty} ${querySearch !== "*" ? querySearch : ""}` : querySearch
        const res = await dataController.patternList({
            page, size,
            searchRaw: rest.id ? `@Id:{${rest.id}}` : filterData.required?.length ? `${filterData.required}${finalSearchRaw !== "*" ? finalSearchRaw : ""}` : finalSearchRaw,
            sortby: sortby?.length ? sortby.map((s: any) => (s.prop.includes(".") ? { prop: s.prop.split(".").shift(), direction: s.direction } : s)) : [{ prop: "DateCreated", direction: "DESC" }],
            pattern: filterData.pattern ? { ...pattern, ...filterData.pattern, returns: pattern.returns } : pattern
        })
        if (res.code === 200) {
            if (exportData) return res
            if (rest.id) setData(prev => ({ data: prev.data.map(e => e.Id === rest.id ? (res.data[0] ?? e) : e), totalCount: res.totalCount }))
            delete res.data
            delete res.totalCount
            delete res.code
            delete res.message
            if (Object.keys(res).length) {
                Object.keys(res).forEach(p => methodsRelative.setValue(p, res[p]))
            } else methodsRelative.reset()
        } else {
            setData({ data: [], totalCount: 0 })
            ToastMessage.errors("Failed to get data")
            console.error("Get data error:", res)
        }
    }

    useEffect(() => {
        if (columns.length && fields.length) getData(pageDetails)
    }, [columns, configMethods.watch("searchRaw"), configMethods.watch("sortby"), filterData.required, fields, filterData.pattern])

    useEffect(() => {
        if (selected.length) setSelected([])
    }, [configMethods.watch("searchRaw"), configMethods.watch("sortby"), data.totalCount])

    const relativeCols = useMemo(() => columns.filter(e => e.Name.split(".").length > 1), [columns.length])

    useEffect(() => {
        const mergeRelFields: string[] = [...relativeCols.map(rl => rl.Name), ...(filterData.pattern?.returns ?? []).filter((k) => k.split(".").length > 1)]
        if (mergeRelFields.length) {
            const relativeTb = mergeRelFields.map(rl => {
                const tmp = rl.split(".").shift()
                return tmp!.substring(0, tmp!.lastIndexOf("Id"))
            }).filter((e, i, a) => a.indexOf(e) === i)
            const relativeKeyNames = mergeRelFields.map(rl => rl.split(".").pop()).filter((e, i, a) => a.indexOf(e) === i)
            colController.getListSimple({
                page: 1, size: 1000,
                query: `@TableName:{${relativeTb.join(" | ")}} @Name:{${relativeKeyNames.join(" | ")}}`,
                returns: ["Id", "Name", "DataType", "Query", "Form", "TableName"]
            }).then((res: any) => {
                if (res.code === 200) {
                    relativeTb.forEach((tb) => {
                        const relColItem = res.data.filter((e: any) => e.TableName === tb).map((e: any) => ({ ...e, Form: e.Form ? JSON.parse(e.Form) : e.Form }))
                        if (relColItem.length) methodsRelativeFields.setValue(`${tb}Id`, relColItem)
                    })
                }
            })
        }
    }, [relativeCols, filterData.pattern?.returns?.length])

    const mapRelativeData = useMemo(() => {
        const tmp: any = {}
        if (relativeData) {
            for (const item of data.data) {
                Object.keys(relativeData).forEach(p => {
                    if (item[`${p}Id`]?.length) {
                        const pData = relativeData[p].filter((e: any) => item[`${p}Id`].includes(e.Id))
                        if (pData) {
                            tmp[item.Id] ??= {}
                            tmp[item.Id][p] = pData
                        }
                    }
                })
            }
        }
        return tmp
    }, [relativeData, data.data])

    const regexGuid = /^[0-9a-fA-F]{32}$/;
    useEffect(() => {
        const mergeFields: string[] = [...columns.map(c => c.Name), ...(filterData.pattern?.returns ?? [])]
        const dataFileIds: Array<string> = []
        mergeFields.forEach((mf) => {
            const tmp = mf.split(".")
            if (tmp.length > 1) {
                const getFileField = relativeFields[tmp[0]]?.find((e: any) => e.Name === tmp[1] && e.DataType === FEDataType.FILE)
                const fileFieldData = relativeData[tmp[0].substring(0, tmp[0].lastIndexOf("Id"))]
                if (getFileField && fileFieldData) {
                    dataFileIds.push(...fileFieldData.map((e: any) => e[tmp[1]]?.split(",")).flat(Infinity).filter((id: string, i: number, arr: Array<string>) => !!id && arr.indexOf(id) === i))
                }
            } else if (fields.find(e => e.Name === mf && e.DataType === FEDataType.FILE)) {
                dataFileIds.push(...data.data.map(e => e[mf]?.split(",")).flat(Infinity).filter((id, i, arr) => !!id && arr.indexOf(id) === i))
            }
        })
        if (dataFileIds.length) {
            const listValidIds = dataFileIds.filter(id => regexGuid.test(id))
            const listFilesInfor = dataFileIds.filter(id => !regexGuid.test(id)).map(id => {
                const _url = getValidLink(id)
                const _type = id.split(".").pop()?.toLowerCase()
                return { Id: id, Name: id, Url: _url, Type: imgFileTypes.includes(`.${_type}`) ? `image/${_type}` : _type }
            })
            if (listValidIds.length) {
                BaseDA.getFilesInfor(dataFileIds.filter((id, i, arr) => arr.indexOf(id) === i)).then((res: any) => {
                    if (res.code === 200) setFiles([...listFilesInfor, ...res.data.filter((f: any) => !!f)])
                })
            } else setFiles(listFilesInfor)
        } else setFiles([])
    }, [data.data, relativeData, relativeFields])

    const showAddEditPopup = (id?: string) => {
        showPopup({
            ref: popupRef as any,
            clickOverlayClosePopup: true,
            content: <AddEditElementForm
                ref={popupRef}
                tbName={tbName}
                id={id}
                title={(id ? formTitle?.formEdit : formTitle?.formAdd) ?? tbName}
                onChangeTitle={onChangeFormTitle ? (newTitle) => {
                    const tmp: any = { ...formTitle }
                    if (id) tmp.formEdit = newTitle
                    else tmp.formAdd = newTitle
                    onChangeFormTitle(tmp)
                } : undefined}
                activeColumns={columns}
                onSuccess={() => {
                    if (id) getData({ id })
                    else getData({})
                }}
                formId={customFormId}
                onSelectCustomForm={onSelectCustomForm}
                {...props}
            />
        })
    }

    const parseSearchDataToSearchRaw = (searchData: { name: string, value: any }[]) => {
        let convertToSearchRaw = "*"
        const activeSearchs = searchData.filter(s => s.value !== undefined && s.value !== null && s.value !== "")
        if (activeSearchs.length) {
            const orList: string[] = []
            const andList: string[] = []
            activeSearchs.forEach((s) => {
                const findField = fields.find((f) => (f.Column ?? f.Name) === s.name)
                if (findField) {
                    if (findField.Column) {
                        andList.push(`@${findField.Column}:{${s.value.split(",").map((v: string) => `*${v}*`).join(" | ")}}`)
                    } else {
                        switch (findField.DataType) {
                            case FEDataType.STRING:
                            case FEDataType.HTML:
                                if (findField.Form?.Options?.length) {
                                    andList.push(`@${s.name}:(${s.value.split(",").map((v: string) => `"${v}"`).join(" | ")})`)
                                } else {
                                    orList.push(`@${s.name}:("${s.value}")`)
                                }
                                break;
                            case FEDataType.UNIQUE:
                                if (findField.Form?.Options?.length) {
                                    andList.push(`@${s.name}:{${s.value.split(",").filter((v: string) => !!v.length).join(" | ")}}`)
                                } else {
                                    orList.push(`@${s.name}:{${s.value.split(",").filter((v: string) => !!v.length).map((v: string) => `*${v}*`).join(" | ")}}`)
                                }
                                break;
                            case FEDataType.BOOLEAN:
                                andList.push(`@${s.name}:{${s.value}}`)
                                break;
                            case FEDataType.NUMBER:
                            case FEDataType.MONEY:
                                if (findField.Form?.Options?.length) {
                                    const tmp = s.value.split(",").map((v: string) => `@${s.name}:[${v}]`).join(" | ")
                                    andList.push(s.value.includes(",") ? `(${tmp})` : tmp)
                                } else {
                                    andList.push(`@${s.name}:[${s.value.replace(",", " ")}]`)
                                }
                                break;
                            case FEDataType.DATE:
                            case FEDataType.DATETIME:
                                andList.push(`@${s.name}:[${s.value.replace(",", " ")}]`)
                                break;
                            default:
                                break;
                        }
                    }
                }
            })
            convertToSearchRaw = (andList.join(" ") + ` ${orList.length ? `(${orList.join(" | ")})` : ""}`).trim()
        }
        return { searchRaw: convertToSearchRaw, searchData: activeSearchs }
    }

    useImperativeHandle(ref, () => ({
        getData, data, setData, selected, setSelected,
        showAddEditPopup, parseSearchDataToSearchRaw, fields
    }), [columns, tbName, filterData, configMethods.watch(), data, selected, fields])

    return <>
        <div className={`col ${className ?? ""}`} style={{ padding: !!data.totalCount && data.totalCount > 20 ? "0 2.4rem" : "0 2.4rem 1.6rem", flex: 1, ...style }}>
            <Popup ref={popupRef} />
            {!!features.length && <div className={`row ${styles["table-feature"]}`}>
                {features.map((f, i) => {
                    switch (f) {
                        case "add":
                            return enableEdit && <Button
                                key={"add"}
                                label={`${t("add")} ${t("new").toLowerCase()}`}
                                prefix={<Ebigicon src={"outline/user-interface/e-add"} size={12} />}
                                className="label-3 button-neutral border"
                                onClick={() => showAddEditPopup()}
                            />
                        case "total":
                            return !!data.totalCount && <span key={"total"} className="label-3">{data.totalCount ?? 0} totals</span>
                        case "search":
                        case "filter":
                            return <SearchFilterData
                                key={f + "-" + i}
                                type={f as any}
                                columns={columns}
                                fields={props.customFilterOptions ? fields.map((f: any) => {
                                    const tmpCustom = props.customFilterOptions![f.Column ?? f.Name]
                                    if (tmpCustom) {
                                        if (tmpCustom.query) return { ...f, Query: tmpCustom.query }
                                        else if (tmpCustom.options) return { ...f, Form: { ...f.Form, Options: tmpCustom.options } }
                                    }
                                    return f
                                }) : fields}
                                initFilterList={filterList}
                                onChangeFilterData={enableEdit ? onChangeFilterList : undefined}
                                searchData={parseRedisQuery(configMethods.watch("searchRaw"))}
                                onChange={(searchValue: any[]) => {
                                    const { searchRaw, searchData } = parseSearchDataToSearchRaw(searchValue)
                                    onChangeFilterData?.({ searchRaw, sortby: configMethods.watch("sortby"), searchData })
                                }}
                            />
                        case "divider":
                            return <div key={"divider-" + i} className={`row ${styles["divider"]}`} />
                        case "export":
                            return <ExportXlsx
                                key={"export"}
                                label={t("export")}
                                disabled={!data.totalCount}
                                getData={async () => {
                                    const res = await getData({ size: 2000, exportData: true })
                                    if (res.code === 200 && res.data.length) {
                                        const dataFileIds: Array<string> = []
                                        let activeColumns = configMethods.getValues("columns");
                                        const tmpActiveCols = [...activeColumns];
                                        tmpActiveCols.forEach((_col: any) => {
                                            const tmp = _col.Name.split(".")
                                            if (tmp.length > 1) {
                                                if (relativeFields?.[tmp[0]]?.find((e: any) => e.Name === tmp[1] && e.DataType === FEDataType.FILE))
                                                    dataFileIds.push(...res[tmp[0].substring(0, tmp[0].lastIndexOf("Id"))].map((e: any) => e[tmp[1]]?.split(",").slice(0, 4)).flat(Infinity).filter((id: string, i: number, arr: string[]) => !!id && arr.indexOf(id) === i))
                                            } else if (fields.find(e => e.Name === _col.Name && e.DataType === FEDataType.FILE)) {
                                                dataFileIds.push(...res.data.map((e: any) => e[_col.Name]?.split(",").slice(0, 2)).flat(Infinity).filter((id: string, i: number, arr: string[]) => !!id && arr.indexOf(id) === i))
                                            } else if (fields.find(e => e.Name === _col.Name && e.DataType === FEDataType.HTML)) activeColumns = activeColumns.filter((e: any) => e.Id !== _col.Id)
                                        })
                                        let getFiles: any = []
                                        if (dataFileIds.length) {
                                            getFiles = await BaseDA.getFilesInfor(dataFileIds.filter((id, i, arr) => arr.indexOf(id) === i))
                                            getFiles = getFiles.data.filter(Boolean)
                                        }
                                        return res.data.map((item: any) => {
                                            let result: any = {}
                                            activeColumns.sort((a: any, b: any) => a.Sort - b.Sort).forEach((_col: any) => {
                                                const tmp = _col.Name.split(".")
                                                const params = (tmp.length > 1 ? { data: res[tmp[0].substring(0, tmp[0].lastIndexOf("Id"))]?.filter((e: any) => item[tmp[0]]?.includes(e.Id)), fields: relativeFields?.[tmp[0]] } : { data: item, fields: fields }) as any
                                                result[_col.Title] = cellValue(_col, params.data, params.fields, getFiles)
                                            })
                                            return result
                                        })
                                    } else return []
                                }}
                                prefix={<Ebigicon src='outline/arrows/data-download' />}
                                config={{
                                    title: configMethods.watch("columns").filter((e: any) => !fields.find(c => c.Name === e.Name && c.DataType === FEDataType.HTML)).map((e: any) => e.Title)
                                }}
                            />
                        case "import":
                            return enableEdit && <ButtonImportData
                                key={"import"}
                                onImport={async (result) => {
                                    if (result.length) {
                                        const newDataItems = handleImport ? (await handleImport(result)) : result.map((it: any) => {
                                            const tmp: any = { Id: randomGID(), DateCreated: Date.now() }
                                            for (const fd of fields) {
                                                if (fd.Column) {
                                                    if (typeof it[fd.Column] === "string") tmp[fd.Column] = it[fd.Column]
                                                } else {
                                                    switch (fd.DataType) {
                                                        case FEDataType.NUMBER:
                                                            if (!isNaN(Number(it[fd.Name]))) tmp[fd.Name] = Number(it[fd.Name])
                                                            break;
                                                        default:
                                                            if (it[fd.Name] || typeof it[fd.Name] === "boolean" || typeof it[fd.Name] === "number") tmp[fd.Name] = it[fd.Name]
                                                            break;
                                                    }
                                                }
                                            }
                                            return tmp
                                        })
                                        if (!newDataItems?.length) return;
                                        const response = await dataController.add(newDataItems)
                                        if (response.code !== 200) {
                                            ToastMessage.errors("Failed to import data")
                                            return console.error("Failed to import data: " + response.message)
                                        }
                                        getData({})
                                    }
                                }}
                            />
                        default:
                            return f
                    }
                })}
            </div>}
            {data.totalCount === 0 && <div className={`col ${styles["table"]}`} style={{ alignItems: "center", justifyContent: "center", margin: "2.4rem 0" }}>
                <Ebigicon src='color/files/archive-file' size={28} />
                <h6 className='heading-7' style={{ margin: "0.8rem 0" }}>{t(configMethods.watch("searchRaw") !== "*" ? "noResultFound" : "noData")}</h6>
            </div>}
            {columns.length && fields.length && !!data.totalCount ? <div className={`col ${styles["table"]}`}>
                <TableHeader
                    key={tbName}
                    onEditColumn={onEditColumn}
                    selected={selected.length ? (data.data.every(e => selected.includes(e.Id)) ? true : null) : false}
                    onChangeSelected={(v: boolean) => {
                        const _filter = selected.filter(id => data.data.every(e => id !== e.Id))
                        if (v) setSelected([..._filter, ...data.data.map(e => e.Id)])
                        else setSelected(_filter)
                    }}
                    methods={configMethods}
                    onChangeConfigData={onChangeConfigData ? (() => { onChangeConfigData?.(configMethods.getValues("columns")) }) : undefined}
                    showIndex={showIndex}
                    hideCheckbox={hideCheckbox}
                    fields={fields}
                    hideActionColumn={props.hideActionColumn}
                />
                {
                    data.data.map((item, index) => {
                        return <TableRow
                            key={`${tbName}-${item.Id}-${index}`}
                            item={item}
                            setItem={(ev: { [key: string]: any }) => { setData(prev => ({ data: prev.data.map(e => e.Id === item.Id ? ev : e), totalCount: prev.totalCount })) }}
                            index={index + pageDetails.size * (pageDetails.page - 1) + 1}
                            onEditActionColumn={onEditColumn}
                            methods={configMethods}
                            fields={fields}
                            files={files}
                            relativeData={mapRelativeData[item.Id]}
                            relativeFields={relativeFields}
                            selected={selected}
                            setSelected={setSelected}
                            showIndex={showIndex}
                            hideCheckbox={hideCheckbox}
                            onChangeActions={enableEdit ? onChangeActions : undefined}
                            showAddEditPopup={enableEdit ? showAddEditPopup : undefined}
                            actions={actions}
                            onDelete={enableEdit ? (async () => {
                                const res = await dataController.delete([item.Id])
                                if (res.code === 200) getData(pageDetails)
                                else {
                                    ToastMessage.errors("Failed to delete this item")
                                    console.error("Failed to delete this item: " + res.message)
                                }
                            }) : undefined}
                            onDuplicate={enableEdit ? (async () => {
                                const res = await dataController.duplicate([item.Id])
                                if (res.code === 200) {
                                    getData(pageDetails)
                                    ToastMessage.success(`Duplicate element successfully!`)
                                } else {
                                    ToastMessage.errors("Failed to duplicate this item")
                                    console.error("Failed to duplicate this item: " + res.message)
                                }
                            }) : undefined}
                            customFormId={customFormId}
                            onSelectCustomForm={enableEdit ? onSelectCustomForm : undefined}
                            formTitle={formTitle}
                            onChangeFormTitle={enableEdit ? onChangeFormTitle : undefined}
                            {...props}
                        />
                    })
                }
            </div> : null}
        </div>
        {isMultiplePage && !!data.totalCount && data.totalCount > 20 && <div style={{ width: "100%", padding: '1.2rem 2.4rem' }}>
            <Pagination
                currentPage={pageDetails.page}
                itemPerPage={pageDetails.size}
                totalItem={data.totalCount}
                onChange={({ page, size }) => {
                    if (pageDetails.page !== page || pageDetails.size !== size) {
                        setPageDetails({ page: page, size: size });
                        getData({ page, size });
                    }
                }} />
        </div>}
        {!!selected.length && toolbars && !!toolbars.length && <div className={`row ${styles["selected-item-options"]}`}>
            {toolbars.map((tl, i) => {
                switch (tl) {
                    case "total":
                        return <div key={tl + "-" + i} className={`row ${styles["selected-item-total"]}`}>
                            <Text className="button-text-5">{t("itemsSelected", { count: selected.length })}</Text>
                            <Ebigicon src="outline/user-interface/e-remove" size={12} onClick={() => setSelected([])} />
                        </div>
                    case "export":
                        return <ExportXlsx
                            key={tl + "-" + i}
                            className="button-text-5 size24"
                            label={t("export")}
                            style={{ color: "var(--neutral-text-body-reverse-color)" }}
                            prefix={<Ebigicon src="outline/user-interface/data-download" color="var(--neutral-text-body-reverse-color)" size={13} />}
                            config={{
                                title: configMethods.watch("columns").filter((e: any) => !fields.find(c => c.Name === e.Name && c.DataType === FEDataType.HTML)).map((e: any) => e.Title)
                            }}
                            getData={async () => {
                                const exportList = data.data.filter((e: any) => selected.includes(e.Id))
                                const relativeData = methodsRelative.getValues()
                                const dataFileIds: Array<string> = []
                                let activeColumns = configMethods.getValues("columns");
                                const tmpActiveCols = [...activeColumns];
                                tmpActiveCols.forEach((_col: any) => {
                                    const tmp = _col.Name.split(".")
                                    if (tmp.length > 1) {
                                        if (relativeFields?.[tmp[0]]?.find((e: any) => e.Name === tmp[1] && e.DataType === FEDataType.FILE)) {
                                            const relKey = tmp[0].substring(0, tmp[0].lastIndexOf("Id"))
                                            if (relativeData[relKey]) dataFileIds.push(...relativeData[relKey].map((e: any) => e[tmp[1]]?.split(",").slice(0, 4)).flat(Infinity).filter((id: string, i: number, arr: Array<string>) => !!id && arr.indexOf(id) === i))
                                        }
                                    } else if (fields.find(e => e.Name === _col.Name && e.DataType === FEDataType.FILE)) {
                                        dataFileIds.push(...exportList.map((e: any) => e[_col.Name]?.split(",").slice(0, 2)).flat(Infinity).filter((id: string, i: number, arr: string[]) => !!id && arr.indexOf(id) === i))
                                    } else if (fields.find(e => e.Name === _col.Name && e.DataType === FEDataType.HTML)) activeColumns = activeColumns.filter((e: any) => e.Id !== _col.Id)
                                })
                                let getFiles: any = []
                                if (dataFileIds.length) {
                                    getFiles = await BaseDA.getFilesInfor(dataFileIds.filter((id, i, arr) => arr.indexOf(id) === i))
                                    getFiles = getFiles.data.filter((f: any) => f !== undefined && f !== null)
                                }
                                return exportList.map((item: any) => {
                                    let result: any = {}
                                    activeColumns.sort((a: any, b: any) => a.Sort - b.Sort).forEach((_col: any) => {
                                        const tmp = _col.Name.split(".")
                                        const relKey = tmp[0].substring(0, tmp[0].lastIndexOf("Id"))
                                        const params = (tmp.length > 1 ? { data: relativeData[relKey]?.filter((e: any) => item[tmp[0]]?.includes(e.Id)), fields: relativeFields?.[tmp[0]] } : { data: item, fields: fields }) as any
                                        result[_col.Title] = cellValue(_col, params.data, params.fields, getFiles)
                                    })
                                    return result
                                })
                            }}
                        />
                    case "duplicate":
                        return enableEdit && <Button
                            key={tl + "-" + i}
                            className="button-text-5 size24"
                            label={t("duplicate")}
                            style={{ color: "var(--neutral-text-body-reverse-color)" }}
                            prefix={<Ebigicon src="outline/layout/copy-2" color="var(--neutral-text-body-reverse-color)" size={13} />}
                            onClick={() => {
                                dataController.duplicate(selected).then((res: any) => {
                                    if (res.code !== 200) return ToastMessage.errors(res.message)
                                    getData(pageDetails)
                                    ToastMessage.success(`${t("duplicate")} these ${tbName.toLowerCase()} ${t("successfully").toLowerCase()}!`)
                                    setSelected([])
                                })
                            }}
                        />
                    case "delete":
                        return enableEdit && <Button
                            key={tl + "-" + i}
                            className="button-text-5 size24"
                            label={t("delete")}
                            style={{ color: "var(--neutral-text-body-reverse-color)" }}
                            prefix={<Ebigicon src="outline/user-interface/trash-can" color="var(--neutral-text-body-reverse-color)" size={13} />}
                            onClick={() => {
                                showDialog({
                                    alignment: DialogAlignment.center,
                                    title: `${t("confirm")} ${t("delete").toLowerCase()}`,
                                    content: t("areYouSureMany", { act: t("delete").toLowerCase(), name: tbName.toLowerCase() }),
                                    submitTitle: t("delete"),
                                    onSubmit: () => {
                                        dataController.delete(selected).then((res: any) => {
                                            if (res.code !== 200) return ToastMessage.errors(res.message)
                                            getData(pageDetails)
                                            setSelected([])
                                        })
                                    }
                                })
                            }}
                        />
                    default:
                        return tl
                }
            })}
            <Button
                className="button-text-5 size24"
                label={t("close")}
                style={{ color: "var(--error-lighter-color)" }}
                prefix={<Ebigicon src="outline/user-interface/e-remove" color="var(--error-lighter-color)" size={13} />}
                onClick={() => setSelected([])}
            />
        </div>}
    </>
})

const parseRedisQuery = (query: string) => {
    if (query === "*") return [];
    const results: { name: string, value: any }[] = [];

    const patterns = [
        // TAG: @field:{*value1* | *value2* | ...}
        {
            regex: /@(\w+):\{([^}]*)\}/g,
            getValue: (match: RegExpExecArray) => {
                const values = match[2]
                    .split("|")
                    .map((v) => v.replace(/\*/g, "").trim())
                    .filter(Boolean);
                return values.length === 1 ? values[0] : values;
            },
        },
        // TEXT: @field:("value1" | "value2" | ...)
        {
            regex: /@(\w+):\(([^)]*)\)/g,
            getValue: (match: RegExpExecArray) => {
                const values = match[2]
                    .split("|")
                    .map((v) => v.replace(/"/g, "").trim())
                    .filter(Boolean);
                return values.length === 1 ? values[0] : values;
            },
        },
        // NUMERIC: @field:[num1 num2]
        {
            regex: /@(\w+):\[([^\]]+)\]/g,
            getValue: (match: RegExpExecArray) => {
                const values = match[2].trim().split(/\s+/);
                return values.join(",");
            },
        },
    ];

    for (const { regex, getValue } of patterns) {
        let match: RegExpExecArray | null;
        while ((match = regex.exec(query)) !== null) {
            if (match?.[1]) {
                const findExisting = results.find(r => r.name === match![1])
                if (findExisting) {
                    results.push({ name: match[1], value: Array.isArray(findExisting.value) ? findExisting.value.concat(getValue(match)) : [findExisting.value, getValue(match)] });
                } else {
                    results.push({ name: match[1], value: getValue(match) });
                }
            }
        }
    }

    return results;
}

const escapeRedisTagValue = (query: string): string => {
    return query.replace(
        /@(\w+):\{\*([^}]*?)\*\}/g,
        (_, field, innerContent) => {
            // Split by " | " to handle multiple values like *val1* | *val2*
            const escaped = innerContent
                .split(/\s*\|\s*/)
                .map((val: string) =>
                    val.replace(/([,.<>{}\[\]"':;!@#$%^&()\-=+~`\\\/])/g, '\\$1')
                )
                .join(' | ');
            return `@${field}:{*${escaped}*}`;
        }
    );
};

export { TableHeader, TableRow, ExportXlsx, ButtonImportData, SearchFilterData }