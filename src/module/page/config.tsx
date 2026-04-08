export const regexAvoidCls = /_([a-zA-Z0-9-]+)_[a-z0-9]+_\d+/g
export const regexI18n = /t\("([^"]+)"\)/;
export const avoidCls = ["layer-item", "comp-text", "row", "col", "remain", "fill-icon", "outline-icon", "color-icon"]
export const supportProperties = ["Icon", "Selector", "Layout", "Position", "Dimension", "Font", "Appearance", "Background"]
export enum LayoutElement {
    main = "_ebig-main-layout_axts4_37",
    header = "_ebig-header-layout_axts4_37",
    siderbar = "_ebig-sidebar-layout_axts4_37",
    body = "_ebig-body-layout_axts4_37",
}

export const layoutElements = [
    LayoutElement.main,
    LayoutElement.header,
    LayoutElement.siderbar,
    LayoutElement.body
]

export const encodeClassName = (cls: string, prefix?: string) => {
    return `_${prefix ?? "ebig"}-${cls}_axts4_37`
}

export const decodeClassName = (cls: string, prefix?: string) => {
    return cls.replace(`_${prefix ?? "ebig"}-`, "").replace("_axts4_37", "")
}

export const handleErrorImgSrc = "https://cdn.ebig.co/icon-library/image-placeholder.png";