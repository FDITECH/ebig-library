import { BaseDA, ConfigData, getHeaders } from "./config";

export class TableController {
    private module: "table" | "column" | "rel" | "menu" | "space" | "function" | "page" | "layout" | "layer" | "designtoken" | "diagram" | "whiteboard" | "workflow" | "process" | "step";
    constructor(module: "table" | "column" | "rel" | "menu" | "space" | "function" | "page" | "layout" | "layer" | "designtoken" | "diagram" | "whiteboard" | "workflow" | "process" | "step") {
        if (!["table", "column", "rel", "menu", "page", "layout", "designtoken", "workflow", "process", "step"].includes(module)) {
            throw new Error("Invalid module")
        }
        this.module = module
    }

    async getAll() {
        const res = await BaseDA.get(ConfigData.url + 'setting/getAll', {
            headers: {
                pid: ConfigData.pid,
                module: this.module,
            },
        })
        return res
    }

    async getById(id: string) {
        const res = await BaseDA.get(ConfigData.url + `setting/getById?id=${id}`, {
            headers: {
                pid: ConfigData.pid,
                module: this.module,
            },
        })
        return res
    }

    async getByListId(ids: Array<string>) {
        const res = await BaseDA.post(ConfigData.url + 'setting/getByIds', {
            headers: {
                pid: ConfigData.pid,
                module: this.module,
            },
            body: { ids }
        })
        return res
    }

    async getListSimple({ page = 1, size, query = "*", returns, sortby }: { page?: number, size?: number, query?: string, returns?: Array<string>, sortby?: { BY: string, DIRECTION?: "ASC" | "DESC" } }) {
        const res = await BaseDA.post(ConfigData.url + 'setting/getListSimple', {
            headers: {
                pid: ConfigData.pid,
                module: this.module,
            },
            body: { searchRaw: query, page, size, returns, sortby }
        })
        return res
    }

    async group(options: { searchRaw?: string, reducers: string }) {
        let _headers: { [k: string]: any } = await getHeaders()
        const res = await BaseDA.post(ConfigData.url + 'setting/group', {
            headers: {
                ..._headers,
                pid: ConfigData.pid,
                module: this.module,
            },
            body: options
        })
        return res
    }
}

export class EbigController {
    private module: string;
    constructor(module: "Project" | "ProjectCustomer" | "Customer") {
        this.module = module
    }

    async getById(id: string) {
        const res = await BaseDA.get(ConfigData.url + `ebig/getById?id=${id}`, { headers: { module: this.module } })
        return res
    }

    async getListSimple(options?: { page?: number, size?: number, query?: string, returns?: Array<string>, sortby?: { BY: string, DIRECTION?: "ASC" | "DESC" } }) {
        const res = await BaseDA.post(ConfigData.url + 'ebig/getListSimple', {
            headers: { module: this.module },
            body: { searchRaw: options?.query ?? "*", page: options?.page ?? 1, size: options?.size ?? 10, returns: options?.returns, sortby: options?.sortby }
        })
        return res
    }
}

export class IntegrationController {
    async sendEmail(props: { templateId?: string, templateParams: { to: string, [p: string]: any } | Array<{ to: string, [p: string]: any }> }) {
        const res = await BaseDA.post(ConfigData.url + 'intergration/sendEmail', {
            body: props
        })
        return res
    }
}