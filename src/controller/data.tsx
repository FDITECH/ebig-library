import { BaseDA, ConfigData, getHeaders } from "./config";
import { Util } from "./utils";

export class DataController {
    private module: string;
    constructor(module: string) {
        this.module = module
    }

    async getAll() {
        const res = await BaseDA.get(ConfigData.url + 'data/getAll', {
            headers: {
                pid: ConfigData.pid,
                module: this.module,
            },
        })
        return res
    }

    async getProperties() {
        let _headers: { [k: string]: any } = await getHeaders()
        const res = await BaseDA.get(ConfigData.url + `data/getProperties?name=${this.module}`, {
            headers: { ..._headers, pid: ConfigData.pid }
        })
        return res
    }

    async buildIndex(properties: { [p: string]: string }) {
        let _headers: { [k: string]: any } = await getHeaders()
        const res = await BaseDA.post(ConfigData.url + 'data/buildIndex', {
            headers: {
                ..._headers,
                pid: ConfigData.pid,
                module: this.module
            },
            body: { properties }
        })
        return res
    }

    async aggregateList(options: { page?: number, size?: number, searchRaw?: string, filter?: string, sortby?: Array<{ prop: string, direction?: "ASC" | "DESC" }>, returns?: Array<string>, exact?: boolean }) {
        const res = await BaseDA.post(ConfigData.url + 'data/aggregateList', {
            headers: {
                pid: ConfigData.pid,
                module: this.module,
            },
            body: options
        })
        return res
    }

    async patternList(options: { page?: number, size?: number, searchRaw?: string, filter?: string, sortby?: Array<{ prop: string, direction?: "ASC" | "DESC" }>, exact?: boolean, pattern?: { returns: Array<string>, [p: string]: Array<string> | { searchRaw?: string, reducers: string } } }) {
        const res = await BaseDA.post(ConfigData.url + 'data/patternList', {
            headers: {
                pid: ConfigData.pid,
                module: this.module,
            },
            body: options
        })
        return res
    }

    async group(options: { searchRaw?: string, reducers: string }) {
        const res = await BaseDA.post(ConfigData.url + 'data/group', {
            headers: {
                pid: ConfigData.pid,
                module: this.module,
            },
            body: options
        })
        return res
    }

    async getListSimple({ query = "*", ...options }: { page?: number, size?: number, query?: string, returns?: Array<string>, sortby?: { BY: string, DIRECTION?: "ASC" | "DESC" }, exact?: boolean }) {
        const body = { ...options, searchRaw: query }
        const res = await BaseDA.post(ConfigData.url + 'data/getListSimple', {
            headers: {
                pid: ConfigData.pid,
                module: this.module,
            },
            body: body
        })
        return res
    }

    async getById(id: string) {
        const res = await BaseDA.get(ConfigData.url + `data/getById?id=${id}`, {
            headers: {
                pid: ConfigData.pid,
                module: this.module,
            },
        })
        return res
    }

    async getByListId(ids: Array<string>) {
        const res = await BaseDA.post(ConfigData.url + 'data/getByIds', {
            headers: {
                pid: ConfigData.pid,
                module: this.module,
            },
            body: { ids }
        })
        return res
    }

    async add(data: Array<{ [p: string]: any }>, type?: string) {
        let _headers: { [k: string]: any } = await getHeaders()
        const res = await BaseDA.post(ConfigData.url + 'data/action?action=add', {
            headers: {
                ..._headers,
                pid: ConfigData.pid,
                module: this.module
            },
            body: { data, type }
        })
        return res
    }

    async edit(data: Array<{ [p: string]: any }>, type?: string) {
        let _headers: { [k: string]: any } = await getHeaders()
        const res = await BaseDA.post(ConfigData.url + 'data/action?action=edit', {
            headers: {
                ..._headers,
                pid: ConfigData.pid,
                module: this.module
            },
            body: { data, type }
        })
        return res
    }

    async duplicate(ids: Array<string>) {
        let _headers: { [k: string]: any } = await getHeaders()
        const res = await BaseDA.post(ConfigData.url + 'data/action?action=duplicate', {
            headers: {
                ..._headers,
                pid: ConfigData.pid,
                module: this.module
            },
            body: { ids }
        })
        return res
    }

    async delete(ids: Array<string>) {
        let _headers: { [k: string]: any } = await getHeaders()
        const res = await BaseDA.post(ConfigData.url + 'data/action?action=delete', {
            headers: {
                ..._headers,
                pid: ConfigData.pid,
                module: this.module
            },
            body: { ids }
        })
        return res
    }

    async checkotp(idToken: string) {
        const res = await BaseDA.post(ConfigData.url + 'data/checkotp', {
            body: { idToken }
        })
        return res
    }
}

export class SettingDataController {
    private setting: "report" | "chart" | "form" | "card" | "view";
    constructor(setting: "report" | "chart" | "form" | "card" | "view") {
        this.setting = setting
    }

    async action(action: "add" | "edit" | "delete", options: { data?: Array<{ [p: string]: any }>, ids?: Array<string> }) {
        let _headers: { [k: string]: any } = await getHeaders()
        const res = await BaseDA.post(ConfigData.url + `data/${this.setting}/action?action=${action}`, {
            headers: { ..._headers, pid: ConfigData.pid },
            body: { data: options.data, ids: options.ids }
        })
        return res
    }

    async getListSimple({ query = "*", ...options }: { page?: number, size?: number, query?: string, returns?: Array<string>, sortby?: { BY: string, DIRECTION?: "ASC" | "DESC" }, exact?: boolean }) {
        const res = await BaseDA.post(ConfigData.url + `data/${this.setting}/getListSimple`, {
            headers: { pid: ConfigData.pid },
            body: { searchRaw: query, ...options }
        })
        return res
    }

    async group(options: { searchRaw?: string, reducers: string }) {
        let _headers: { [k: string]: any } = await getHeaders()
        const res = await BaseDA.post(ConfigData.url + `data/${this.setting}/group`, {
            headers: { ..._headers, pid: ConfigData.pid },
            body: options
        })
        return res
    }

    async getByIds(ids: Array<string>) {
        const res = await BaseDA.post(ConfigData.url + `data/${this.setting}/getByIds`, {
            headers: { pid: ConfigData.pid },
            body: { ids }
        })
        return res
    }

    static async searchSetting({ query = "*", ...options }: { page?: number, size?: number, query?: string, returns?: Array<string>, sortby?: { BY: string, DIRECTION?: "ASC" | "DESC" } }) {
        let _headers: { [k: string]: any } = await getHeaders()
        const res = await BaseDA.post(ConfigData.url + `data/getListSimple`, {
            headers: _headers,
            body: { searchRaw: query, ...options }
        })
        return res
    }
}

export class AccountController {
    private module: string;
    constructor(module?: "Customer" | "User") {
        this.module = module ?? "Customer"
    }

    async login(body: { type: "phone" | "apple" | "google" | "microsoft" | "account", token?: string, deviceToken?: string, ggClientId?: string, phone?: string, password?: string, email?: string, username?: string }, resolve?: () => void) {
        const res = await BaseDA.post(ConfigData.url + 'data/login', {
            headers: { module: this.module, pid: ConfigData.pid },
            body: body
        })
        if (res.code === 200 && !resolve) {
            Object.keys(res.data).forEach(key => {
                Util.setCookie(key, res.data[key])
            })
            Util.setCookie("timeRefresh", Date.now() / 1000 + 9 * 60)
        }
        return res
    }

    async getInfor() {
        let _headers: { [k: string]: any } = await getHeaders()
        const res = await BaseDA.get(ConfigData.url + 'data/getInfo', {
            headers: { ..._headers, module: this.module, pid: ConfigData.pid },
        })
        return res
    }

    async checkPassword(body: { phone?: string, password?: string, email?: string, username?: string }) {
        const res = await BaseDA.post(ConfigData.url + 'data/checkPassword', {
            headers: { module: this.module, pid: ConfigData.pid },
            body: body
        })
        return res
    }

    async hashPassword(password: string) {
        const res = await BaseDA.get(ConfigData.url + `data/bcrypt?password=${encodeURIComponent(password)}`)
        return res
    }
}