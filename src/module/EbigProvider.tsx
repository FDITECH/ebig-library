import { createContext, forwardRef, ReactNode, useContext, useEffect, useImperativeHandle, useMemo, useRef, useState } from "react"
import { BrowserRouter, Routes, useLocation, useNavigate, useParams } from "react-router-dom"
import { BaseDA, ConfigData, refreshTokenHeaders } from "../controller/config"
import { TableController, EbigController } from "../controller/setting"
import { Dialog, showDialog } from "../component/dialog/dialog"
import { ToastContainer } from 'react-toastify'
import { DesignTokenType, ProjectItem } from "./da"
import { randomGID, Util } from "../controller/utils"
import { useTranslation } from "react-i18next"
import { loadCdnTranslations } from "../language/i18n"
import { AccountController, DataController } from "../controller/data"
import { encodeClassName, LayoutElement } from "./page/config"
import { i18n } from "i18next"
import { getValidLink } from "./page/pageById"
import { ToastMessage, showPopup, OfflineBanner, ComponentStatus, Popup } from "../index"

interface Props {
    /**
     * project id on admin ebig
     * */
    pid: string,
    /**
     * api link
     * */
    url: string,
    fileUrl: string,
    imgUrlId: string,
    onInvalidToken?: () => void,
    children?: React.ReactNode,
    theme?: "light" | "dark",
    /** default true */
    loadResources?: boolean,
}

const appendDesignTokens = (list: Array<{ [p: string]: any }>) => {
    const designTokens = list.map(e => e.Value ? { ...e, Value: typeof e.Value === "string" ? JSON.parse(e.Value) : e.Value } : e)
    if (designTokens.length) {
        const tokenValues = designTokens.filter(e => e.Type !== DesignTokenType.group && !!e.Value)
        const groupTokens = designTokens.filter(e => e.Type === DesignTokenType.group)
        let styleElement = (document.head.querySelector(":scope > .designTokens") ?? document.createElement('style')) as any;
        styleElement.type = 'text/css';
        const colorVariables = tokenValues.filter(e => e.Type === DesignTokenType.color)
        const classVariables = tokenValues.filter(e => e.Type !== DesignTokenType.color)
        const _innerHTML = `
        html {
            color-scheme: light;
            \n${colorVariables.map(e => {
            const tkParent = groupTokens.find(g => g.Id === e.ParentId);
            return e.Value?.lightMode ? `--${tkParent ? `${Util.toSlug(tkParent.Name)}-` : ""}${Util.toSlug(e.Name)}: ${e.Value.lightMode};` : ""
        }).join('\n')}\n
        }

        html.dark {
            color-scheme: dark;
            \n${colorVariables.map(e => {
            const tkParent = groupTokens.find(g => g.Id === e.ParentId);
            return e.Value?.lightMode ? `--${tkParent ? `${Util.toSlug(tkParent.Name)}-` : ""}${Util.toSlug(e.Name)}: ${e.Value.darkMode};` : ""
        }).join('\n')}\n
        }

        #root>.${LayoutElement.main} { 
            width: 100dvw;
            height: 100dvh;
        }

        p {
            white-space: pre-line;
        }
            
        @supports (color: light-dark(black, white)) {\n
            :root { \n${colorVariables.map(e => {
            const tkParent = groupTokens.find(g => g.Id === e.ParentId);
            return e.Value?.lightMode ? `--${tkParent ? `${Util.toSlug(tkParent.Name)}-` : ""}${Util.toSlug(e.Name)}: light-dark(${e.Value.lightMode}, ${e.Value.darkMode});` : ""
        }).join('\n')}\n }\n\n
        }\n\n
        ${classVariables.map(e => {
            let classValue: string | undefined = undefined
            switch (e.Type) {
                case DesignTokenType.font:
                    if (e.Value.lightMode)
                        classValue = `font: ${e.Value.lightMode}`
                    else {
                        var tkParent = groupTokens.find(g => g.Id === e.ParentId);
                        classValue = Object.keys(e.Value.webMode).map(k => `${k}: ${e.Value.webMode[k]}`).join(";\n")
                        return `.${encodeClassName(`${tkParent ? `${Util.toSlug(tkParent.Name)}-` : ""}${Util.toSlug(e.Name)}`, "font")} { \n${classValue};\n }`
                    }
                    break;
                case DesignTokenType.boxShadow:
                    if (e.Value.lightMode)
                        classValue = `box-shadow: ${e.Value.lightMode}`
                    else {
                        tkParent = groupTokens.find(g => g.Id === e.ParentId);
                        classValue = `box-shadow: ${e.Value.webMode.boxShadow ?? e.Value.webMode["box-shadow"]}`
                        return `.${encodeClassName(`${tkParent ? `${Util.toSlug(tkParent.Name)}-` : ""}${Util.toSlug(e.Name)}`, "shadow")} { \n${classValue};\n }`
                    }
                    break;
                case DesignTokenType.custom:
                    return e.Value.lightMode ?? e.Value.webMode
                default:
                    return ""
            }
            return classValue ? `.${e.Name} { \n${classValue};\n }` : ""
        }).join('\n')}
        `
        styleElement.innerHTML = _innerHTML;
        if (!styleElement.classList.contains("designTokens")) {
            styleElement.classList.add("designTokens")
            document.head.appendChild(styleElement)
        }
    }
}

interface EbigContextProps {
    i18n: i18n,
    theme: "light" | "dark",
    setTheme: (theme: "light" | "dark") => void,
    projectData?: { [k: string]: any },
    userData?: { [k: string]: any },
    setUserData: (data?: { [k: string]: any }) => void,
    globalData?: { [k: string]: any },
    setGlobalData: (data?: { [k: string]: any }) => void,
    functions?: { [k: string]: any },
    setFunctions: (data: { [k: string]: any }[]) => void
}

const EbigContext = createContext<EbigContextProps | undefined>(undefined)

export const EbigProvider = ({ loadResources = true, ...props }: Props) => {
    ConfigData.pid = props.pid
    if (loadResources) refreshTokenHeaders.pid = props.pid
    ConfigData.url = props.url
    ConfigData.imgUrlId = props.imgUrlId
    ConfigData.fileUrl = props.fileUrl
    if (props.onInvalidToken) ConfigData.onInvalidToken = props.onInvalidToken
    const { i18n } = useTranslation()
    const [loadedResources, setLoadedResources] = useState(false)
    const [theme, setTheme] = useState<"light" | "dark">("light")
    const [userData, setUserData] = useState<{ [k: string]: any } | undefined>(undefined)
    const [projectData, setProjectData] = useState<ProjectItem | undefined>(undefined)
    const [globalData, setGlobalData] = useState<{ [k: string]: any } | undefined>(undefined)
    const [rawFunctions, setRawFunctions] = useState<{ [k: string]: any }[]>([])
    const [functions, setFunctions] = useState<{ [k: string]: any } | undefined>(undefined)

    useEffect(() => {
        loadCdnTranslations(ConfigData.ebigCdn)
    }, [])
    useEffect(() => {
        if (loadResources) {
            refreshTokenHeaders.pid = props.pid
            initializeProject(props.url, { pid: props.pid }).then((res) => {
                if (res.LogoId) (document.head.querySelector(`:scope > link[rel="icon"]`) as HTMLLinkElement)!.href = res.LogoId.startsWith("http") ? res.LogoId : `${ConfigData.ebigCdn}/wini/${res.LogoId}`;
                document.title = res.Name;
                if (res.FileDomain && !props.fileUrl) ConfigData.fileUrl = res.FileDomain
                setProjectData(res)
            })
        } else refreshTokenHeaders.pid = "wini"
    }, [props.pid])

    useEffect(() => {
        setTheme(props.theme ?? "light")
    }, [props.theme])

    useEffect(() => {
        if (theme === "dark") document.documentElement.classList.add("dark");
        else document.documentElement.classList.remove("dark");
    }, [theme])

    const onLoadResources = async () => {
        if (props.pid.length === 32) {
            const desginTokenController = new TableController("designtoken")
            const functionController = new TableController("function")
            const languageController = new DataController("Language")
            desginTokenController.getAll().then(res => {
                if (res.code === 200 && res.data.length) appendDesignTokens(res.data)
            })
            functionController.getAll().then((res) => {
                if (res.code === 200 && res.data.length) setRawFunctions(res.data)
            })
            const result = await languageController.getAll()
            if (result.code === 200 && result.data.length) {
                const languages = await Promise.all(result.data.filter((e: any) => !!e.Json?.length).map((e: any) => BaseDA.get(getValidLink(e.Json), { headers: { "Cache-Control": "no-cache" } })))
                languages.forEach((lngData, i) => {
                    if (lngData) i18n.addResourceBundle(result.data[i].Lng, "translation", lngData, true, true)
                })
            }
        } else {
            console.error("Project resources not found")
        }
        setLoadedResources(true)
    }

    useEffect(() => {
        ConfigData.pid = props.pid
        ConfigData.url = props.url
        ConfigData.imgUrlId = props.imgUrlId
        ConfigData.fileUrl = props.fileUrl
        if (loadResources) onLoadResources()
        else setLoadedResources(true)
    }, [props.pid, props.imgUrlId, props.fileUrl])

    return <EbigContext.Provider value={{ projectData, theme, setTheme, i18n, userData, setUserData, globalData, setGlobalData, functions, setFunctions: setRawFunctions }}>
        <OfflineBanner />
        <BrowserRouter>
            <ToastContainer />
            <Dialog />
            <HandleFunctions rawFunctions={rawFunctions} setFunctions={setFunctions} />
            {loadedResources && (!loadResources || projectData) && <Routes>{props.children}</Routes>}
        </BrowserRouter>
    </EbigContext.Provider>
}

const extractAllFunctionNames = (code: string) => {
    const depthAt = (pos: number): number => {
        let depth = 0;
        for (let i = 0; i < pos; i++) {
            if (code[i] === '{') depth++;
            else if (code[i] === '}') depth--;
        }
        return depth;
    };

    const patterns = [
        // function foo() {}  |  async function foo() {}
        /(?:async\s+)?function\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*\(/g,
        // const foo = function() {}  |  const foo = async function() {}  |  const foo = () => {}  |  const foo = async () => {}  |  const foo = a => {}  |  const foo = async a => {}
        /(?:const|let|var)\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*=\s*(?:async\s+)?(?:function|\(|[a-zA-Z_$])/g,
    ];

    const names = new Set();
    for (const regex of patterns) {
        let match;
        while ((match = regex.exec(code)) !== null) {
            if (depthAt(match.index) === 0) names.add(match[1]);
        }
    }
    return [...names];
}

const HandleFunctions = (props: { rawFunctions: any[], setFunctions: (data: { [k: string]: any }[]) => void }) => {
    const ebigContextData = useEbigContext()
    const { i18n, theme, projectData, userData, globalData } = ebigContextData
    const location = useLocation()
    const params = useParams()
    const navigate = useNavigate()
    const popupRef = useRef<any>(null)
    const namesByFunctions = useMemo(() => {
        if (!props.rawFunctions.length) return []
        return props.rawFunctions.map((func: any) => ({ title: func.Name, names: extractAllFunctionNames(func.Value), code: func.Value }))
    }, [props.rawFunctions])
    const functions = useMemo(() => {
        if (!namesByFunctions.length) return undefined
        const tmp: any = {}
        for (const func of namesByFunctions) {

            if (func.names.length === 0) continue;

            const wrappedCode = `
    ${func.code}
    try {
      return { ${func.names.join(', ')} };
    } catch(e) {
      return {};
    }
  `;

            try {
                const fn = new Function(
                    "Util", "AccountController", "DataController", "randomGID", "ToastMessage", "uploadFiles", "getFilesInfor", "post", "get", "showDialog", "showPopup", "ComponentStatus", "useParams", "useNavigate", "location", "useEbigContext",
                    wrappedCode
                );
                const result = fn(
                    Util,
                    AccountController,
                    DataController,
                    randomGID,
                    ToastMessage,
                    BaseDA.uploadFiles,
                    BaseDA.getFilesInfor,
                    BaseDA.post,
                    BaseDA.get,
                    showDialog,
                    ({ className, clickOverlayClosePopup, hideOverlay, content }: { className?: string, clickOverlayClosePopup?: boolean, hideOverlay?: boolean, content: ReactNode | HTMLElement }) => {
                        showPopup({ ref: popupRef, className, clickOverlayClosePopup, hideOverlay, content })
                    },
                    ComponentStatus,
                    () => params,
                    () => navigate,
                    location,
                    () => ebigContextData
                );

                // Filter out anything that isn't actually a function
                tmp[func.title] = Object.fromEntries(
                    Object.entries(result).filter(([_, v]) => typeof v === 'function')
                );
            } catch (e) {
                console.error("Error executing user code:", func);
                continue;
            }
        }
        if (Object.keys(tmp).length === 0) return undefined
        return tmp
    }, [namesByFunctions, globalData, projectData, userData, i18n.language, theme, location.pathname, location.search, JSON.stringify(params), JSON.stringify(location.state)])

    useEffect(() => {
        props.setFunctions(functions)
    }, [functions])

    return <Popup ref={popupRef} />
}

export const useEbigContext = () => {
    const context = useContext(EbigContext);
    if (context === undefined) {
        throw new Error(
            "useEbigContext must be used within a EbigProvider"
        );
    }
    return context;
}

const href = "https://cdn.ebig.co/library/style/v0.0.58/"
const appendStyleSheet = () => {
    const tmp = document.createElement("div")
    tmp.innerHTML = `
        <link rel="stylesheet" href="${href}root.min.css">
        <link rel="stylesheet" href="${href}layout.min.css">
        <link rel="stylesheet" href="${href}typography.min.css">
        <link rel="stylesheet" href="${href}toast-noti.min.css">
        <link rel="stylesheet" href="${href}style.css">
    `
    document.head.querySelectorAll(`:scope > link[rel="stylesheet"][href^="${href}"]`).forEach(e => e.remove())
    document.head.children[0].before(...tmp.childNodes)
    tmp.remove()
}

export const initializeProject = async (domain: string, props: { pid?: string, domain?: string }) => {
    ConfigData.url = domain
    appendStyleSheet()
    const ebigController = new EbigController("Project")
    if (!props.pid && !props.domain) {
        console.error("Failed to load project: missing project id or domain")
        throw new Error("Failed to load project: missing project id or domain")
    }
    let projectData: { [k: string]: any } | undefined = undefined
    if (props.pid) {
        const res = await ebigController.getById(props.pid)
        if (res.code === 200 && res.data) projectData = res.data
    } else {
        const res = await ebigController.getListSimple({
            page: 1, size: 1,
            query: `@Domain:{${props.domain!.replace(/[^a-zA-Z0-9]/g, (m) => `\\${m}`)}}`
        })
        if (res.code === 200 && res.data[0]) projectData = res.data[0]
    }
    if (!projectData) {
        console.error("Failed to load project: project not found")
        throw new Error("Failed to load project: project not found")
    }
    return projectData as ProjectItem
}