import { CSSProperties, forwardRef, ReactNode, useDeferredValue, useEffect, useImperativeHandle, useMemo, useRef, useState } from "react"
import { FieldValues, useForm, UseFormReturn } from "react-hook-form"
import { CustomHTMLProps, getValidLink, globalTableCache, RenderLayerElement } from "../page/pageById"
import { AccountController, BaseDA, DataController, OptionsItem, randomGID, SettingDataController, urlToFileType, Util } from "../../index"
import { ComponentType, FEDataType } from "../da"
import { validateForm } from "./config"
import { TableController } from "../../controller/setting"
import { ConfigData, specialCharsRegex } from "../../controller/config"
import { CustomerAvatar } from "../table/config"

interface Props {
    id: string;
    style?: CSSProperties;
    className?: string;
    propsData?: { [p: string]: CustomHTMLProps };
    childrenData?: { [p: string]: ReactNode };
    itemData?: { [p: string]: ReactNode };
    data?: { [p: string]: any };
    customOptions?: { [p: string]: Array<OptionsItem> };
    onSubmit?: (e?: { [p: string]: any }) => void;
    onError?: (e?: { [p: string]: any }) => void;
    onGetFormError?: (e: { [p: string]: any }) => void;
    autoBcrypt?: boolean
    onUnMount?: () => void
    controller?: { searchRaw?: string, filter?: string, sortby?: Array<{ prop: string, direction?: "ASC" | "DESC" }>, pattern?: { returns: Array<string>, [p: string]: Array<string> | { searchRaw?: string, reducers: string } } } | { ids: string, maxLength?: number | "none" },
    /** Listen form data change */
    onChange?: (ev: { data?: { [p: string]: any } }) => void
}

interface FormByIdRef {
    onSubmit: (e?: React.BaseSyntheticEvent) => Promise<void>,
    methods: UseFormReturn<FieldValues, any, FieldValues>,
    cols: Array<{ [p: string]: any }>,
    rels: Array<{ [p: string]: any }>,
}

const globalFormCache = new Map()
export const FormById = forwardRef<FormByIdRef, Props>((props, ref) => {
    const methods = useForm({ shouldFocusError: false })
    const methodOptions = useForm({ shouldFocusError: false })
    const [formItem, setFormItem] = useState<{ [p: string]: any }>()
    const layers = useMemo(() => (formItem?.Props ?? []).sort((a: any, b: any) => (a.Setting.style?.order ?? 0) - (b.Setting.style?.order ?? 0)), [formItem])
    const keyNames = useMemo<string[]>(() => layers.filter((e: any) => e.NameField?.length).map((e: any) => e.NameField), [layers.length])
    const inputComponents = [ComponentType.img, ComponentType.textField, ComponentType.textArea, ComponentType.selectDropdown, ComponentType.checkbox, ComponentType.switch, ComponentType.radio, ComponentType.colorPicker, ComponentType.ckEditor, ComponentType.datePicker, ComponentType.upload, ComponentType.numberPicker]
    const inputLayers = useMemo<{ [p: string]: any }[]>(() => layers.filter((e: any) => e.NameField?.length && inputComponents.includes(e.Type)), [layers])
    const _colController = new TableController("column")
    const _relController = new TableController("rel")
    const [controller, setController] = useState<any>(undefined)
    const [cols, setCols] = useState<Array<{ [p: string]: any }>>([])
    const [rels, setRels] = useState<Array<{ [p: string]: any }>>([])
    const [relativeCols, setRelativeCols] = useState<Array<{ [p: string]: any }>>([])
    const accountController = new AccountController()
    const htmlContent = useRef<{ [k: string]: string }>({})

    useEffect(() => {
        if (props.id) {
            if (globalFormCache.has(props.id)) {
                setFormItem(globalFormCache.get(props.id))
            } else {
                const controller = new SettingDataController("form")
                controller.getByIds([props.id]).then(async (res) => {
                    if (res.code === 200 && res.data[0]) {
                        let _formItem = res.data[0]
                        if (_formItem.Props && typeof _formItem.Props === "string") _formItem.Props = JSON.parse(_formItem.Props)
                        if (!Array.isArray(_formItem.Props)) _formItem.Props = []
                        setFormItem(_formItem)
                        globalFormCache.set(props.id, _formItem)
                    } else if (props.onGetFormError) props.onGetFormError(res)
                })
            }
        }
        return () => {
            if (globalFormCache.size > 20) globalFormCache.clear()
            props.onUnMount?.()
        }
    }, [props.id])

    useEffect(() => {
        if (JSON.stringify(controller) !== JSON.stringify(props.controller)) setController(props.controller)
    }, [props.controller])

    const getInitData = async () => {
        let initData = props.data
        if (!props.data && controller) {
            const dataController = new DataController(formItem!.TbName)
            if (controller.searchRaw) {
                const tmpController = { ...controller, page: 1, size: 1, searchRaw: controller!.searchRaw ?? "*" }
                const res = await dataController.patternList(tmpController)
                if (res.code === 200 && res.data[0]) initData = res.data[0]
            } else { // get by ids
                let listIds = controller.ids.split(",")
                if (controller.maxLength && controller.maxLength !== "none") listIds = listIds.slice(0, controller.maxLength)
                const res = await dataController.getByListId(listIds)
                if (res.code === 200 && res.data.length) initData = res.data.find(Boolean)
            }
        }
        if (initData) {
            const dataItem = initData
            const _fileIds: Array<any> = []
            Object.keys(dataItem).forEach(prop => {
                const tmpLayer = inputLayers.find(e => e.NameField === prop)
                if (tmpLayer) {
                    const _col = cols.find(e => e.Name === prop)
                    const _rel = rels.find(e => e.Column === prop)
                    if (_col) {
                        switch (_col.DataType) {
                            case FEDataType.UNIQUE:
                            case FEDataType.STRING:
                            case FEDataType.PASSWORD:
                                methods.setValue(prop, dataItem[prop])
                                break;
                            case FEDataType.HTML:
                                if (ConfigData.regexGuid.test(dataItem[prop])) {
                                    BaseDA.get(`${ConfigData.ebigCdn}/${ConfigData.pid}/${dataItem[prop]}`, { headers: { "Cache-Control": "no-cache" } }).then((result) => {
                                        if (typeof result === 'string') {
                                            htmlContent.current[prop] = dataItem[prop]
                                            methods.setValue(prop, result)
                                        } else methods.setValue(prop, dataItem[prop])
                                    })
                                } else {
                                    methods.setValue(prop, dataItem[prop])
                                }
                                break;
                            case FEDataType.BOOLEAN:
                                methods.setValue(prop, dataItem[prop])
                                if (_col.Form.ComponentType === ComponentType.radio) methods.setValue(prop, `${dataItem[prop]}`)
                                break;
                            case FEDataType.NUMBER:
                                methods.setValue(prop, typeof dataItem[prop] === 'string' ? Number(dataItem[prop]) : dataItem[prop])
                                break;
                            case FEDataType.DATE:
                            case FEDataType.DATETIME:
                                methods.setValue(prop, new Date(typeof dataItem[prop] === 'string' && !isNaN(Number(dataItem[prop])) ? parseInt(dataItem[prop]) : dataItem[prop]))
                                break;
                            case FEDataType.MONEY:
                                if (typeof dataItem[prop] === 'number') methods.setValue(prop, Util.formatCurrency(dataItem[prop]))
                                break;
                            case FEDataType.FILE:
                                if (dataItem[prop]) {
                                    if (_col.Form.ComponentType === ComponentType.upload) _fileIds.push({ id: dataItem[prop], name: prop })
                                    else methods.setValue(prop, dataItem[prop])
                                }
                                break;
                            default:
                                break;
                        }
                    } else if (_rel) {
                        const _tmpParse = dataItem[prop]?.length ? dataItem[prop].split(",") : []
                        if (props.customOptions?.[_rel.Column]) {
                            let _opt = props.customOptions?.[_rel.Column] ?? []
                            methodOptions.setValue(`${_rel.Column}_Options`, _opt)
                        } else {
                            const pkController = new DataController(_rel.TablePK)
                            pkController.getByListId(_tmpParse).then(pkRes => {
                                if (pkRes.code === 200) methodOptions.setValue(`${_rel.Column}_Options`, pkRes.data?.filter(Boolean)?.map((e: any) => ({ id: e.Id, name: e.Name, prefix: (_rel.TablePK === "Customer" || _rel.TablePK === "User") ? <CustomerAvatar data={e} /> : undefined, ...e })) ?? [])
                            })
                        }
                        methods.setValue(prop, (_rel.Form.ComponentType === "SelectMultiple" || _rel.Form.Multiple) ? _tmpParse : _tmpParse[0])
                    } else {
                        methods.setValue(prop, dataItem[prop])
                    }
                } else methods.setValue(prop, dataItem[prop])
            })
            if (_fileIds.length) {
                let filesInfor = _fileIds.map(e => e.id?.split(",")).flat(Infinity)
                const fileGuids = filesInfor.filter((id, i, arr) => !!id?.length && ConfigData.regexGuid.test(id) && arr.indexOf(id) === i)
                filesInfor = filesInfor.filter((id, i, arr) => !!id?.length && !ConfigData.regexGuid.test(id) && arr.indexOf(id) === i).map((url) => ({ id: randomGID(), name: url.split(/[\\/]/).pop(), type: urlToFileType(url), exactUrl: url, url: url.startsWith("https") ? url : getValidLink(url) }))
                if (fileGuids.length) {
                    BaseDA.getFilesInfor(fileGuids).then(res => {
                        if (res.code === 200) _fileIds.forEach(e => {
                            const tmpF = res.data.filter((f: any) => !!f && e.id.includes(f.Id)).map((f: any) => ({ id: f.Id, name: f.Name, size: f.Size, type: f.Type, url: f.Url }))
                            methods.setValue(e.name, [...filesInfor.filter((f: any) => e.id.includes(f.exactUrl)), ...tmpF])
                        })
                    })
                } else {
                    _fileIds.forEach(e => {
                        const tmpF = filesInfor.filter((f: any) => e.id.includes(f.exactUrl))
                        methods.setValue(e.name, tmpF)
                    })
                }
            }
        } else {
            inputLayers.filter(e => !!e.Setting.default).forEach((tmpLayer) => {
                const _col = cols.find(e => tmpLayer.NameField === e.Name)
                switch (_col?.DataType) {
                    case FEDataType.UNIQUE:
                    case FEDataType.STRING:
                    case FEDataType.PASSWORD:
                        methods.setValue(_col.Name, _col.Form.DefaultValue)
                        break;
                    case FEDataType.HTML:
                        if (ConfigData.regexGuid.test(_col.Form.DefaultValue)) {
                            BaseDA.get(`${ConfigData.ebigCdn}/${ConfigData.pid}/${_col.Form.DefaultValue}`, { headers: { "Cache-Control": "no-cache" } }).then((result) => {
                                if (typeof result === 'string') {
                                    htmlContent.current[_col.Name] = _col.Form.DefaultValue
                                    methods.setValue(_col.Name, result)
                                } else methods.setValue(_col.Name, _col.Form.DefaultValue)
                            })
                        } else {
                            methods.setValue(_col.Name, _col.Form.DefaultValue)
                        }
                        break;
                    case FEDataType.BOOLEAN:
                        methods.setValue(_col.Name, _col.Form.DefaultValue)
                        break;
                    case FEDataType.NUMBER:
                        methods.setValue(_col.Name, typeof _col.Form.DefaultValue === 'string' ? parseFloat(_col.Form.DefaultValue) : _col.Form.DefaultValue)
                        break;
                    case FEDataType.DATE:
                    case FEDataType.DATETIME:
                        methods.setValue(_col.Name, new Date(typeof _col.Form.DefaultValue === 'string' ? parseInt(_col.Form.DefaultValue) : _col.Form.DefaultValue))
                        break;
                    case FEDataType.MONEY:
                        if (typeof _col.Form.DefaultValue === 'number') methods.setValue(_col.Name, Util.formatCurrency(_col.Form.DefaultValue))
                        break;
                    default:
                        break;
                }
            })
        }
    }

    useEffect(() => {
        if (cols.length) {
            methods.reset()
            getInitData()
        }
    }, [props.data, cols.length, controller])

    const onSubmit = async (ev: any) => {
        let dataItem = { ...ev }
        delete dataItem.id
        dataItem.DateCreated ??= Date.now()
        let validateDataForm: { [k: string]: any } = {}
        Object.keys(dataItem).forEach((key) => {
            if (typeof dataItem[key] === "string") validateDataForm[key] = dataItem[key].trim()
        })
        const _val = await validateForm({
            list: inputLayers.filter((e: any) => e.Setting.validate?.length).map((e: any) => {
                return {
                    Name: e.NameField,
                    Validate: e.Setting.validate
                }
            }) as any,
            formdata: validateDataForm
        })
        // Cập nhật lỗi vào React Hook Form
        if (_val && Object.keys(_val).length > 0) {
            Object.keys(_val).forEach((field: any) => {
                methods.setError(field, { message: _val[field]?.[0] });
            });
            return;
        }
        // Nếu có lỗi, dừng lại không thực hiện submit
        for (let _col of cols) {
            switch (_col.Name) {
                case "DateCreated":
                    dataItem[_col.Name] ??= Date.now()
                    break;
                default:
                    if (dataItem[_col.Name] === undefined || dataItem[_col.Name] === null) {
                        dataItem[_col.Name] = null
                        continue;
                    }
                    if (_col.Query) continue;
                    // handle other columns value
                    switch (_col.DataType) {
                        case FEDataType.STRING:
                            if (Array.isArray(dataItem[_col.Name])) {
                                dataItem[_col.Name] = dataItem[_col.Name].join(",")
                            } else if (typeof dataItem[_col.Name] !== 'string') {
                                dataItem[_col.Name] = `${dataItem[_col.Name]}`
                            }
                            break;
                        case FEDataType.BOOLEAN:
                            dataItem[_col.Name] = [true, 1, "true"].includes(dataItem[_col.Name]) ? true : false
                            break;
                        case FEDataType.NUMBER:
                            dataItem[_col.Name] = typeof dataItem[_col.Name] === 'string' ? parseFloat(dataItem[_col.Name]) : dataItem[_col.Name]
                            break;
                        case FEDataType.DATE:
                        case FEDataType.DATETIME:
                            dataItem[_col.Name] = dataItem[_col.Name].getTime()
                            break;
                        case FEDataType.MONEY:
                            if (dataItem[_col.Name].replace(/,/g, '').length)
                                dataItem[_col.Name] = parseInt(dataItem[_col.Name].replace(/,/g, ''))
                            else delete dataItem[_col.Name]
                            break;
                        case FEDataType.PASSWORD:
                            if (props.autoBcrypt && dataItem[_col.Name]?.length && dataItem[_col.Name] !== props.data?.[_col.Name]) {
                                const getHashPassword = await accountController.hashPassword(dataItem[_col.Name])
                                dataItem[_col.Name] = getHashPassword.data
                            }
                            break;
                        case FEDataType.HTML:
                            if (dataItem[_col.Name].length || htmlContent.current[_col.Name]) {
                                const createHtmlFile = Util.stringToFile(dataItem[_col.Name], `${dataItem.Name}'s ${_col.Name}.txt`)
                                const res = await BaseDA.uploadFiles(htmlContent.current[_col.Name] ? [{ id: htmlContent.current[_col.Name], file: createHtmlFile }] : [createHtmlFile])
                                if (res?.length) dataItem[_col.Name] = res[0].Id
                            }
                            break;
                        case FEDataType.FILE:
                            if (ev[_col.Name] && Array.isArray(ev[_col.Name])) {
                                const uploadFiles = ev[_col.Name].filter((e: any) => !!e?.file)
                                if (uploadFiles.length) {
                                    const res = await BaseDA.uploadFiles(uploadFiles.map((e: any) => e.file))
                                    if (res?.length) dataItem[_col.Name] = ev[_col.Name].map((e: any) => e.file ? res.shift().Id : e.exactUrl).filter(Boolean).join(",")
                                } else {
                                    dataItem[_col.Name] = ev[_col.Name].map((e: any) => e.exactUrl ?? e.id).join(",")
                                }
                            }
                            break;
                        default:
                            break;
                    }
                    break;
            }
        }
        for (let _rel of rels) {
            if (dataItem[_rel.Column] && Array.isArray(dataItem[_rel.Column]))
                dataItem[_rel.Column] = dataItem[_rel.Column].join(",")
        }
        Object.keys(dataItem).forEach(p => {
            if (![...cols, ...rels].find(e => e.Name === p || e.Column === p)) delete dataItem[p]
        })
        props.onSubmit?.(dataItem)
    }

    useEffect(() => {
        if (formItem) {
            if (globalTableCache.has(formItem.TbName)) {
                const cacheTable = globalTableCache.get(formItem.TbName)
                setCols(cacheTable.cols)
                setRels(cacheTable.rels)
            } else {
                Promise.all([
                    _relController.getListSimple({ page: 1, size: 100, query: `@TableFK:{${formItem.TbName}}` }),
                    _colController.getListSimple({ page: 1, size: 100, query: `@TableName:{${formItem.TbName}}` })
                ]).then(res => {
                    if (res.every((e: any) => e.code === 200)) {
                        const relTmp = res[0].data.map((e: any) => ({ ...e, Form: JSON.parse(e.Form) }))
                        const colTmp = res[1].data.map((e: any) => ({ ...e, Form: JSON.parse(e.Form) }))
                        setCols(colTmp)
                        setRels(relTmp)
                        globalTableCache.set(formItem.TbName, { cols: colTmp, rels: relTmp })
                    }
                })
            }
        }
    }, [formItem])

    const mapRelativeData = async () => {
        const relKeys = keyNames.filter((e: string) => e.split(".").length > 1)
        if (!relKeys.length) return null;
        const _rels = await _relController.getListSimple({
            page: 1, size: 100,
            query: `@TableFK:{${formItem!.TbName}} @Column:{${relKeys.map((e: any) => e.split(".")[0]).filter((k: string, i: number, arr: Array<string>) => arr.indexOf(k) === i).join(" | ")}}`,
            returns: ["Id", "Column", "TablePK"]
        })
        if (_rels.code === 200) {
            const relRes = await _colController.getListSimple({
                page: 1, size: _rels.data.length * 50,
                query: `@TableName:{${_rels.data.map((e: any) => e.TablePK).join(" | ")}} @Name:{${_rels.data.map((relItem: any) => {
                    const relKeyFilter = relKeys.filter((e: any) => e.split(".")[0] === relItem.Column).map((e: any) => e.split(".")[1])
                    return relKeyFilter
                }).flat(Infinity).join(" | ")}}`
            })
            if (relRes.code === 200) setRelativeCols(relRes.data.map((r: any) => ({ ...r, Form: JSON.parse(r.Form) })))
        }
    }

    useEffect(() => {
        if (keyNames.length) mapRelativeData()
    }, [keyNames])

    const cacheCheckTree = useRef<{ [table: string]: boolean }>({})
    const getOptions = async ({ length, search, parentId, _rel }: { length: number, search?: string, parentId?: string | number, _rel: { [p: string]: any } }) => {
        if (props.customOptions?.[_rel.Column]) {
            let _opt = props.customOptions?.[_rel.Column] ?? []
            if (search?.length) _opt = _opt.filter(e => typeof e.name === "string" ? (e.name.toLowerCase().includes(search.toLowerCase()) || search.toLowerCase().includes(e.name.toLowerCase())) : true)
            return { data: _opt, totalCount: _opt.length }
        }
        let checkTree = cacheCheckTree.current[_rel.TablePK];
        if (typeof checkTree !== "boolean") {
            const pkTableController = new TableController("rel")
            const checkPKTree: any = await pkTableController.getListSimple({ page: 1, size: 1, query: `@Column:{ParentId} @TablePK:{${_rel.TablePK}} @TableFK:{${_rel.TablePK}}` })
            cacheCheckTree.current[_rel.TablePK] = checkPKTree.code === 200 && checkPKTree.totalCount > 0
            checkTree = cacheCheckTree.current[_rel.TablePK]
        }
        let querySearch: string = ""
        if (checkTree) querySearch += ` @ParentId:{${parentId ?? "empty"}}`
        if (search?.length) querySearch += _rel.TablePK === "Customer" || _rel.TablePK === "User" ? ` (@Name:("${search}") | @Email:{*${search.replace(specialCharsRegex, (m: string) => `\\${m}`)}*})` : ` @Name:("${search}")`
        querySearch = querySearch.trim().length ? querySearch : "*"
        const pkDataController = new DataController(_rel.TablePK)
        const pattern: any = { returns: ["Id", "Name"] }
        if (_rel.TablePK === "Customer" || _rel.TablePK === "User") pattern.returns.push("AvatarUrl")
        if (checkTree) {
            pattern.returns.push("ParentId")
            pattern.ParentId = ["Id", "Name"]
            pattern[_rel.TablePK] = { searchRaw: "*", reducers: "GROUPBY 1 @ParentId REDUCE COUNT 0 AS totalChild" }
        }
        const res = await pkDataController.patternList({
            page: Math.floor(length / 20) + 1, size: 20,
            searchRaw: querySearch,
            sortby: [{ prop: "DateCreated", direction: "DESC" }],
            pattern: pattern
        })
        if (res.code === 200) {
            const result: Array<any> = res.data
            if (res.Parent?.length && !parentId) result.push(...res.Parent)
            return {
                data: res.data.filter((e: any, i: number, arr: Array<any>) => !!e && arr.findIndex(f => f.Id === e.Id) === i).map((e: any) => {
                    return {
                        id: e.Id,
                        name: e.Name,
                        prefix: (_rel.TablePK === "Customer" || _rel.TablePK === "User") ? <CustomerAvatar data={e} /> : undefined,
                        parentId: e.ParentId,
                        totalChild: e.totalChild ? typeof e.totalChild === "string" ? parseInt(e.totalChild) : e.totalChild : undefined
                    }
                }),
                totalCount: res.totalCount
            }
        } else return { data: [], totalCount: 0 }
    }

    const mapColOptions = useMemo(() => {
        if (props.customOptions && Object.keys(props.customOptions).length) {
            return cols.map(e => (props.customOptions![e.Name] ? { ...e, Form: { ...e.Form, Options: props.customOptions![e.Name] } } : e))
        } else return cols
    }, [props.customOptions, cols])

    const formValues = useMemo(() => {
        if (!cols.length) return undefined
        const tmp = methods.getValues()
        const tmpValue: any = {};
        [...cols, ...rels].forEach(c => {
            tmpValue[c.Column ?? c.Name] = tmp[c.Column ?? c.Name]
        })
        return tmpValue
    }, [cols.length, rels.length, JSON.stringify(methods.watch())])
    const finalFormValues = useDeferredValue(formValues);

    useEffect(() => {
        if (props.onChange) props.onChange(finalFormValues)
    }, [finalFormValues])

    useImperativeHandle(ref, () => ({
        onSubmit: methods.handleSubmit(onSubmit, props.onError),
        methods: methods as any,
        cols,
        rels
    }), [JSON.stringify(methods.watch())]);

    const finalOptions = useMemo(() => methodOptions.watch(), [JSON.stringify(methodOptions.watch())])
    const opts = useDeferredValue(finalOptions)

    return formItem && !!cols.length && finalFormValues && layers.filter((e: any) => !e.ParentId).map((e: any) => {
        return <RenderLayerElement
            key={e.Id}
            item={e}
            list={layers}
            style={props.style}
            className={props.className}
            type={"form"}
            methods={methods}
            indexItem={finalFormValues}
            propsData={props.propsData}
            childrenData={props.childrenData}
            itemData={props.itemData}
            cols={mapColOptions}
            rels={rels.map((_rel => ({ ..._rel, getOptions: async (params: any) => await getOptions({ ...params, _rel }) }))).concat(relativeCols as any)}
            options={opts}
            onSubmit={methods.handleSubmit(onSubmit, props.onError)}
            tbName={formItem.TbName}
        />
    })
})