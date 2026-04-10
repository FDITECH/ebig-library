import { createContext, useContext, useEffect, useState } from "react"
import { BrowserRouter, Routes } from "react-router-dom"
import { BaseDA, ConfigData, refreshTokenHeaders } from "../controller/config"
import { TableController, EbigController } from "../controller/setting"
import { Dialog } from "../component/dialog/dialog"
import { ToastContainer } from 'react-toastify'
import { DesignTokenType, ProjectItem } from "./da"
import { Util } from "../controller/utils"
import { useTranslation } from "react-i18next"
import { loadCdnTranslations } from "../language/i18n"
import { DataController } from "../controller/data"
import { encodeClassName, LayoutElement } from "./page/config"
import { i18n } from "i18next"
import { OfflineBanner } from "../component/offline-banner/offline-banner"

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
    setGlobalData: (data?: { [k: string]: any }) => void
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

    useEffect(() => {
        if (loadResources) {
            refreshTokenHeaders.pid = props.pid
            initializeProject(props.url, { pid: props.pid }).then((res) => {
                if (res.LogoId) (document.head.querySelector(`:scope > link[rel="icon"]`) as HTMLLinkElement)!.href = res.LogoId.startsWith("http") ? res.LogoId : `${ConfigData.ebigCdn}/wini/${res.LogoId}`;
                (document.head.querySelector(`:scope > title`) as HTMLTitleElement)!.innerHTML = res.Name;
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

    useEffect(() => {
        ConfigData.pid = props.pid
        ConfigData.url = props.url
        ConfigData.imgUrlId = props.imgUrlId
        ConfigData.fileUrl = props.fileUrl
        if (loadResources) {
            if (props.pid.length === 32) {
                // Load base translations from CDN (en, vi)
                const _desginTokenController = new TableController("designtoken")
                _desginTokenController.getAll().then(res => {
                    if (res.code === 200 && res.data.length) appendDesignTokens(res.data)
                })
                const languageController = new DataController("Language")
                languageController.getAll().then(async (res) => {
                    if (res.code === 200 && res.data.length) {
                        const languages = await Promise.all(res.data.map((e: any) => BaseDA.get(ConfigData.imgUrlId + e.Json)))
                        languages.forEach((lngData, i) => {
                            if (lngData) i18n.addResourceBundle(res.data[i].Lng, "translation", lngData, true, true)
                        })
                        setLoadedResources(true)
                    } else setLoadedResources(true)
                })
            } else {
                console.error("Project resources not found")
                setLoadedResources(true)
            }
        } else setLoadedResources(true)
    }, [props.pid, props.imgUrlId, props.fileUrl])

    return <EbigContext.Provider value={{ projectData, theme, setTheme, i18n, userData, setUserData, globalData, setGlobalData }}>
        <OfflineBanner />
        <BrowserRouter>
            <ToastContainer />
            <Dialog />
            {loadedResources && <Routes>{props.children}</Routes>}
        </BrowserRouter>
    </EbigContext.Provider>
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

export const initializeProject = async (domain: string, props: { pid?: string, domain?: string }) => {
    await loadCdnTranslations(ConfigData.ebigCdn)
    ConfigData.url = domain
    const tmp = document.createElement("div")
    tmp.innerHTML = `
        <link rel="stylesheet" href="https://cdn.ebig.co/library/style/v0.0.14/root.min.css">
        <link rel="stylesheet" href="https://cdn.ebig.co/library/style/v0.0.14/layout.min.css">
        <link rel="stylesheet" href="https://cdn.ebig.co/library/style/v0.0.14/typography.min.css">
        <link rel="stylesheet" href="https://cdn.ebig.co/library/style/v0.0.14/toast-noti.min.css">
        <link rel="stylesheet" href="https://cdn.ebig.co/library/style/v0.0.14/style.css">
    `
    document.head.children[0].before(...tmp.childNodes)
    tmp.remove()
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