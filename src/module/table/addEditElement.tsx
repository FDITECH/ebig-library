import { forwardRef, MouseEventHandler, ReactNode, useEffect, useMemo, useRef, useState } from "react";
import { useForm, UseFormReturn } from "react-hook-form";
import { BaseDA, randomGID, Util, Button, closePopup, ComponentStatus, DialogAlignment, showDialog, ToastMessage, Ebigicon, DataController, TableController, AccountController, urlToFileType, FormById, SelectDropdownForm } from "../../index";
import { useTranslation } from 'react-i18next';
import { RenderComponentByType, validateForm } from "../form/config";
import { ConfigData, specialCharsRegex } from "../../controller/config";
import { ComponentType, FEDataType } from "../da";
import { CustomerAvatar } from "./config";
import { getValidLink } from "../page/pageById";
import { regexGetVariableByThis } from "../card/config";

interface AddEditElementFormProps {
    id?: string;
    tbName: string;
    title?: string;
    onChangeTitle?: (newTitle?: string | null) => void;
    activeColumns: { [p: string]: any }[];
    onSuccess?: () => void;
    expandForm?: (methods: UseFormReturn) => ReactNode;
    handleSubmit?: (params: { item: { [k: string]: any }, initItem?: { [k: string]: any }, methods: UseFormReturn, onSuccess?: () => void }) => Promise<any>;
    customFields?: { [key: string]: (methods: UseFormReturn) => ReactNode };
    formId?: { formAdd?: string, formEdit?: string };
    onSelectCustomForm?: (params: { formAdd?: string | null, formEdit?: string | null }) => void;
    customTablePKOptions?: { [pk: string]: string }
}

const AddEditElementForm = forwardRef(({ tbName = "", title, activeColumns = [], id, onSuccess, expandForm, handleSubmit, customFields, formId, onChangeTitle, onSelectCustomForm, customTablePKOptions, ...props }: AddEditElementFormProps, ref: any) => {
    const dataController = new DataController(tbName)
    const [item, setItem] = useState<{ [p: string]: any }>()
    const [column, setColumn] = useState<{ [p: string]: any }[]>([])
    const [relative, setRelative] = useState<{ [p: string]: any }[]>([])
    const { t } = useTranslation()
    const formRef = useRef<any>(null)
    const [selectedFormId, setSelectedFormId] = useState<{ formAdd?: string | null, formEdit?: string | null }>(formId ?? { formAdd: null, formEdit: null })
    const [isExpand, setExpand] = useState(false)
    const diveRef = useRef<HTMLDivElement>(null)

    //#region getSetting
    const getSetting = async () => {
        const activeCols = activeColumns.filter(e => e.Name.split(".").length === 1).map(e => e.Name).filter((v, i, a) => v !== "DateCreated" && a.indexOf(v) === i)
        const activeRels = activeColumns.filter(e => e.Name.split(".").length > 1).map(e => e.Name.split(".").shift()).filter((v, i, a) => a.indexOf(v) === i)
        const _colController = new TableController("column")
        const _relController = new TableController("rel")
        const apiList: Array<Promise<any>> = [
            _colController.getListSimple({
                page: 1,
                size: 100,
                query: `@TableName:{${tbName}} @Name:{${activeCols.join(" | ")}}`,
                returns: ["Id", "Name", "DataType", "Query", "Form"],
                sortby: { BY: "DateCreated" }
            })
        ]
        if (activeRels.length) {
            apiList.push(_relController.getListSimple({
                page: 1,
                size: 100,
                query: `@TableFK:{${tbName}} @Column:{${activeRels.join(" | ")}}`,
                returns: ["Id", "Column", "Form", "TablePK", "Query"]
            }))
        }
        const res = await Promise.all(apiList)
        if (res.every(e => e.code === 200)) {
            const relRes = res[1]
            const colRes = res[0]
            if (relRes?.totalCount) setRelative(relRes.data.map((e: any) => {
                const tmp = { ...e, Form: e.Form ? JSON.parse(e.Form) : {} }
                tmp.Form.Sort = activeColumns.findIndex(el => el.Name.split(".")[0] === e.Column)
                return tmp
            }))
            if (colRes.totalCount) setColumn(colRes.data.map((e: any) => {
                const tmp = { ...e, Form: e.Form ? JSON.parse(e.Form) : {} }
                tmp.Form.Sort = activeColumns.findIndex(el => el.Name === e.Name)
                return tmp
            }))
        }
    }

    useEffect(() => {
        if (id) {
            dataController.getById(id).then(res => {
                if (res.code === 200) setItem(res.data)
                else ToastMessage.errors(res.message)
            })
        }
        getSetting()
    }, [])

    const initFormItem = useMemo(() => {
        const tmp = item ?? {}
        Object.keys(props).forEach(k => {
            if (k.endsWith("Id") && k !== "ParentId") tmp[k] = (props as any)[k]
        })
        if (!Object.keys(tmp).length) return undefined
        return tmp
    }, [item])

    return <div ref={diveRef} className="col right-drawer" style={{ alignItems: "center", transition: "max-width 0.6s", width: "100dvw", maxWidth: isExpand ? "100dvw" : 720 }}>
        <div className='popup-header row' style={{ gap: 8, width: "100%" }}>
            <span
                className="heading-7" style={{ flex: 1 }}
                contentEditable={!!onChangeTitle}
                suppressContentEditableWarning={!!onChangeTitle}
                onKeyDown={onChangeTitle ?
                    ((ev: any) => {
                        switch (ev.key.toLowerCase()) {
                            case "enter":
                                ev.preventDefault()
                                ev.target.blur()
                                break;

                            default:
                                break;
                        }
                    }) : undefined}
                onBlur={onChangeTitle ?
                    ((ev) => {
                        const newTitle = ev.target.innerText.trim()
                        if (newTitle.length) onChangeTitle!(newTitle)
                        else {
                            ev.target.innerText = `${id ? "Edit" : "Add"} ${tbName}`
                            onChangeTitle!(null)
                        }
                    }) : undefined}
            >{title ?? `${id ? "Edit" : "Add"} ${tbName}`}</span>
            <Ebigicon
                src={isExpand ? "outline/arrows/box-arrow-right" : "fill/multimedia/fullscreen"}
                size={14} className="icon-button size24"
                onClick={() => { setExpand(!isExpand) }}
            />
            <Ebigicon
                src="outline/user interface/e-remove"
                size={14} className="icon-button size24"
                onClick={() => {
                    if (diveRef.current) {
                        diveRef.current.classList.add("right-drawer-collapse")
                        diveRef.current.classList.remove("right-drawer")
                        setTimeout(() => { closePopup(ref) }, 500)
                    } else closePopup(ref)
                }}
            />
        </div>
        {!!column.length && (!id || initFormItem) &&
            (
                ((id && selectedFormId.formEdit) || (!id && selectedFormId.formAdd)) ?
                    <FormById
                        key={id ? selectedFormId.formEdit : selectedFormId.formAdd}
                        id={id ? selectedFormId.formEdit! : selectedFormId.formAdd!}
                        ref={formRef}
                        data={initFormItem}
                        style={{ flex: 1, width: '100%', height: '100%', overflow: 'hidden auto', scrollbarWidth: "thin", animation: "loading-change-view 0.5s ease-in-out" }}
                        onGetFormError={() => {
                            const tmp = { ...selectedFormId }
                            if (id) tmp.formEdit = null
                            else tmp.formAdd = null
                            setSelectedFormId(tmp)
                            onSelectCustomForm?.(tmp)
                        }}
                        onSubmit={onSuccess}
                    /> :
                    <FormView
                        cols={column.filter(e => !e.Query?.length)}
                        rels={relative}
                        item={initFormItem}
                        parentId={(props as any).ParentId}
                        tbName={tbName}
                        customTablePKOptions={customTablePKOptions}
                        expandForm={expandForm}
                        onCancel={() => {
                            showDialog({
                                alignment: DialogAlignment.center,
                                status: ComponentStatus.WARNING,
                                submitTitle: t("submit"),
                                title: `${t("confirm")} ${t("cancel").toLowerCase()} ` + (id ? t('edit') : t('add')).toLowerCase(),
                                onSubmit: () => { closePopup(ref) }
                            })
                        }}
                        onSuccess={() => {
                            closePopup(ref)
                            ToastMessage.success(`${id ? t('edit') : t('add')} ${title ?? tbName} ${t("successfully").toLowerCase()}!`)
                            onSuccess?.()
                        }}
                        handleSubmit={handleSubmit}
                        customFields={customFields}
                    />
            )}
    </div>
})

export default AddEditElementForm

//#region form
interface FormViewProps {
    cols: { [key: string]: any }[];
    rels: { [key: string]: any }[];
    item?: { [key: string]: any };
    tbName: string;
    onCancel?: MouseEventHandler<HTMLButtonElement | HTMLAnchorElement>;
    onSuccess?: () => void;
    expandForm?: (methods: UseFormReturn) => ReactNode;
    handleSubmit?: (params: { item: { [k: string]: any }, initItem?: { [k: string]: any }, methods: UseFormReturn, onSuccess?: () => void }) => Promise<any>;
    customFields?: { [key: string]: (methods: UseFormReturn) => ReactNode },
    parentId?: string,
    customTablePKOptions?: { [pk: string]: string },
}

const FormView = ({ cols = [], rels = [], item, tbName, onCancel, onSuccess, expandForm, handleSubmit, customFields, customTablePKOptions, ...props }: FormViewProps) => {
    const dataController = new DataController(tbName)
    const methods = useForm<any>({ shouldFocusError: false, defaultValues: { Id: randomGID() } })
    const watchRel = useMemo(() => rels.filter(e => e.Query && e.Query.match(regexGetVariableByThis)?.length), [rels.length])
    const methodsOptions = useForm<any>({ shouldFocusError: false })
    const { t } = useTranslation()
    const htmlContent = useRef<{ [k: string]: string }>({})

    useEffect(() => {
        if (cols.length) {
            if (item) {
                const _fileIds: Array<any> = []
                Object.keys(item).forEach(prop => {
                    const _col = cols.find(e => e.Name === prop)
                    const _rel = rels.find(e => e.Column === prop)
                    if (_col) {
                        switch (_col.DataType) {
                            case FEDataType.UNIQUE:
                            case FEDataType.STRING:
                            case FEDataType.PASSWORD:
                                methods.setValue(prop, item[prop])
                                break;
                            case FEDataType.HTML:
                                if (ConfigData.regexGuid.test(item[prop])) {
                                    BaseDA.get(`${ConfigData.ebigCdn}/${ConfigData.pid}/${item[prop]}`, { headers: { 'Cache-Control': 'no-cache' } }).then((result) => {
                                        if (typeof result === 'string') {
                                            htmlContent.current[prop] = item[prop]
                                            methods.setValue(prop, result)
                                        } else methods.setValue(prop, item[prop])
                                    })
                                } else {
                                    methods.setValue(prop, item[prop])
                                }
                                break;
                            case FEDataType.BOOLEAN:
                                methods.setValue(prop, item[prop])
                                if (_col.Form.ComponentType === ComponentType.radio) methods.setValue(prop, `${item[prop]}`)
                                break;
                            case FEDataType.NUMBER:
                                methods.setValue(prop, typeof item[prop] === 'string' ? parseFloat(item[prop]) : item[prop])
                                break;
                            case FEDataType.DATE:
                            case FEDataType.DATETIME:
                                methods.setValue(prop, new Date(typeof item[prop] === 'string' ? parseInt(item[prop]) : item[prop]))
                                break;
                            case FEDataType.MONEY:
                                methods.setValue(prop, Util.formatCurrency(item[prop]))
                                break;
                            case FEDataType.FILE:
                                if (item[prop]) {
                                    if (_col.Form.ComponentType === ComponentType.upload) _fileIds.push({ id: item[prop], name: prop })
                                    else methods.setValue(prop, item[prop])
                                }
                                break;
                            default:
                                break;
                        }
                    } else if (_rel) {
                        const _tmpParse = item[prop]?.length ? item[prop].split(",") : []
                        const pkController = new DataController(_rel.TablePK)
                        pkController.getByListId(_tmpParse).then(pkRes => {
                            if (pkRes.code === 200) methodsOptions.setValue(`${_rel.Column}_Options`, pkRes.data?.filter(Boolean) ?? [])
                        })
                        methods.setValue(prop, (_rel.Form.ComponentType === "SelectMultiple" || _rel.Form.Multiple) ? _tmpParse : _tmpParse[0])
                    } else {
                        methods.setValue(prop, item[prop])
                    }
                })
                if (_fileIds.length) {
                    let filesInfor = _fileIds.map(e => e.id?.split(",")).flat(Infinity)
                    const fileGuids = filesInfor.filter((id, i, arr) => !!id?.length && ConfigData.regexGuid.test(id) && arr.indexOf(id) === i)
                    filesInfor = filesInfor.filter((id, i, arr) => !!id?.length && !ConfigData.regexGuid.test(id) && arr.indexOf(id) === i).map((url) => ({ id: randomGID(), name: url.split(/[\\/]/).pop(), type: urlToFileType(url), exactUrl: url, url: url.startsWith("https") ? url : getValidLink(url) }))
                    if (fileGuids.length) {
                        BaseDA.getFilesInfor(fileGuids).then(res => {
                            if (res.code === 200) _fileIds.forEach(e => {
                                const tmpF = res.data.filter((f: any) => !!f && e.id.includes(f.Id)).map((f: any) => ({ id: f.Id, name: f.Name, size: f.Size, type: f.Type, url: ConfigData.url + f.Url }))
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
                cols.filter((e) => e.Form?.DefaultValue != undefined && e.Form?.DefaultValue !== "").forEach((_col) => {
                    switch (_col.DataType) {
                        case FEDataType.UNIQUE:
                        case FEDataType.STRING:
                        case FEDataType.PASSWORD:
                            methods.setValue(_col.Name, _col.Form.DefaultValue)
                            break;
                        case FEDataType.HTML:
                            if (ConfigData.regexGuid.test(_col.Form.DefaultValue)) {
                                BaseDA.get(`${ConfigData.ebigCdn}/${ConfigData.pid}/${_col.Form.DefaultValue}`, { headers: { 'Cache-Control': 'no-cache' } }).then((result) => {
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
                            methods.setValue(_col.Name, Util.formatCurrency(_col.Form.DefaultValue))
                            break;
                        default:
                            break;
                    }
                })
            }
        }
        if (props.parentId) methods.setValue("ParentId", props.parentId)
    }, [item, cols.length, props.parentId])

    const onSubmit = async (ev: any) => {
        let dataItem = { ...ev }
        dataItem.DateCreated ??= Date.now()
        let validateDataForm: any = {}
        Object.keys(dataItem).forEach((key) => {
            if (typeof dataItem[key] === "string") validateDataForm[key] = dataItem[key].trim()
        })
        const _val = await validateForm({
            list: cols.filter(e => e.Form.Validate?.length).map(e => {
                return {
                    Name: e.Name,
                    Validate: e.Form.Validate
                }
            }),
            formdata: validateDataForm
        })
        // Cập nhật lỗi vào React Hook Form
        if (_val && Object.keys(_val).length > 0) {
            Object.keys(_val).forEach((field) => {
                methods.setError(field, { message: _val[field].join(', ') });
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
                            if (isNaN(dataItem[_col.Name])) delete dataItem[_col.Name]
                            break;
                        case FEDataType.DATE:
                        case FEDataType.DATETIME:
                            dataItem[_col.Name] = dataItem[_col.Name].getTime()
                            break;
                        case FEDataType.MONEY:
                            dataItem[_col.Name] = dataItem[_col.Name] ? parseInt(dataItem[_col.Name].replaceAll(',', '')) : null
                            break;
                        case FEDataType.PASSWORD:
                            if (dataItem[_col.Name] !== item?.[_col.Name]) {
                                const IntegrationController = new AccountController()
                                const getHashPassword = await IntegrationController.hashPassword(dataItem[_col.Name])
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
                                    if (res?.length) dataItem[_col.Name] = ev[_col.Name].map((e: any) => e.file ? res.shift().Id : (e.exactUrl ?? e.id)).filter(Boolean).join(",")
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
        if (dataItem.DateCreated instanceof Date) dataItem.DateCreated = dataItem.DateCreated.getTime()
        for (let _rel of rels) {
            if (dataItem[_rel.Column] && Array.isArray(dataItem[_rel.Column]))
                dataItem[_rel.Column] = dataItem[_rel.Column].join(",")
        }
        if (handleSubmit) await handleSubmit({ item: dataItem, initItem: item, methods, onSuccess })
        else {
            const res = await dataController.add([dataItem])
            if (res.code !== 200) return ToastMessage.errors(res.message)
            onSuccess?.()
        }
    }

    const onError = () => { }

    const cacheCheckTree = useRef<{ [table: string]: boolean }>({})
    const getOptions = async ({ length, search, parentId, _rel }: { length: number, search?: string, parentId?: string | number, _rel: { [p: string]: any } }) => {
        let checkTree = cacheCheckTree.current[_rel.TablePK];
        if (typeof checkTree !== "boolean") {
            const pkTableController = new TableController("rel")
            const checkPKTree: any = await pkTableController.getListSimple({ page: 1, size: 1, query: `@Column:{ParentId} @TablePK:{${_rel.TablePK}} @TableFK:{${_rel.TablePK}}` })
            cacheCheckTree.current[_rel.TablePK] = checkPKTree.code === 200 && checkPKTree.totalCount > 0
            checkTree = cacheCheckTree.current[_rel.TablePK]
        }
        let querySearch: string = customTablePKOptions?.[_rel.TablePK] ?? ""
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

    const sortFields = useMemo(() => cols.concat(rels).sort((a, b) => (a.Form.Sort ?? 0) - (b.Form.Sort ?? 0)), [cols.length, rels.length])

    return <form className="col" style={{ flex: 1, width: '100%', height: '100%' }}>
        <div className="col" style={{ flex: 1, animation: "loading-change-view 0.5s ease-in-out", height: '100%', padding: '1.6rem 2.4rem', gap: '2.4rem', overflow: 'hidden auto', scrollbarWidth: "thin" }}>
            {sortFields.map((sf) => {
                if (sf.Column) {
                    const checkCustom = customFields?.[sf.Column]
                    if (checkCustom) return checkCustom(methods)
                    const _options = methodsOptions.watch(`${sf.Column}_Options`) ?? []
                    let _mapOptions = _options.map((e: any) => {
                        return {
                            id: e.Id,
                            name: e.Name,
                            prefix: (sf.TablePK === "Customer" || sf.TablePK === "User") ? <CustomerAvatar data={e} /> : undefined,
                            parentId: e.ParentId,
                        }
                    })
                    return <SelectDropdownForm
                        methods={methods}
                        key={sf.Id}
                        required={sf.Form.Required}
                        disabled={(item?.Id && sf.Form.Uneditable) || sf.Form.Disabled}
                        name={sf.Column}
                        label={sf.Form.Label ?? sf.Column}
                        placeholder={sf.Form.Placeholder}
                        style={{ order: sf.Form.Sort }}
                        options={_mapOptions}
                        getOptions={(params) => getOptions({ ...params, _rel: sf })}
                        multiple={sf.Form.ComponentType === "SelectMultiple" || sf.Form.Multiple}
                    />
                } else {
                    const checkCustom = customFields?.[sf.Name]
                    if (checkCustom) return checkCustom(methods)
                    const tmpFieldItem = (item?.Id && sf.Form.Uneditable) ? { ...sf, Form: { ...sf.Form, Disabled: true } } : sf
                    return <RenderComponentByType key={sf.Id} fieldItem={tmpFieldItem} methods={methods} style={{ order: sf.Form.Sort }} />;
                }
            })}
            {expandForm?.(methods)}
        </div>
        <div className="row popup-footer">
            <Button
                label={t("cancel")}
                className="label-3 button-grey"
                onClick={onCancel}
            />
            <Button
                label={t("save")}
                className="button-primary label-3"
                onClick={methods.handleSubmit(onSubmit, onError)}
            />
        </div>
    </form>
}