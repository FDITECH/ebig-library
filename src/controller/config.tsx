import axios from 'axios';
import { Util } from "./utils";
import { ToastMessage } from '../component/toast-noti/toast-noti';

export class ConfigData {
    static pid = "";
    static url = "";
    static fileUrl = "";
    static imgUrlId = "";
    static regexGuid = /^[0-9a-fA-F]{32}$/;
    static ebigCdn = "https://cdn.ebig.co"
    static onInvalidToken = () => Util.clearCookie();
}

export const refreshTokenHeaders = { 'Content-Type': 'application/json', pid: "wini" }
export const specialCharsRegex = /[^a-zA-Z0-9]/g;

export const imgFileTypes = [".png", ".svg", ".jpg", "jpeg", ".webp", ".gif"]

const maxFileSize = 2 * 1024 * 1024 * 1024        // tối đa 2GB / file
const directBatchLimit = 25 * 1024 * 1024         // file nhỏ đi qua BE (Cloud Run giới hạn 32MB / request)
const directMaxFiles = 12                         // BE nhận tối đa 12 file / request

// PUT thẳng lên R2 bằng XHR: không kèm header pid/Authorization (sẽ làm hỏng chữ ký) và có tiến trình
const putToR2 = (url: string, file: File, contentType: string, onProgress?: (loaded: number) => void) =>
    new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest()
        xhr.open("PUT", url)
        xhr.setRequestHeader("Content-Type", contentType)
        xhr.upload.onprogress = (e) => { if (e.lengthComputable) onProgress?.(e.loaded) }
        xhr.onload = () => (xhr.status >= 200 && xhr.status < 300) ? resolve() : reject(new Error(`Upload to storage failed (${xhr.status})`))
        xhr.onerror = () => reject(new Error("Network error while uploading"))
        xhr.send(file)
    })

export class BaseDA {
    static post = async (url: string, options?: { headers?: { [k: string]: any }, body?: any }) => {
        try {
            let _headers = { 'Content-Type': 'application/json' }
            if (options?.headers) _headers = { ..._headers, ...options.headers }
            const response = await axios.post(url, options?.body, { headers: _headers })
            if (response.status === 200 || response.status === 201) {
                return response.data
            } else if (response.status === 204) {
                return {
                    message: 'ok',
                    data: options?.body
                }
            } else if (response.status === 401) {
                ToastMessage.errors('Unauthorized access')
                ConfigData.onInvalidToken()
            } else {
                console.log("error: ??: ", response.statusText)
                return { status: response.status, message: response.statusText };
            }
        } catch (error) {
            console.error("Failed to POST data:", error);
            throw error;
        }
    }

    static postFile = async (url: string, options?: { headers?: { [k: string]: any }, body?: any }) => {
        try {
            let _headers = { 'Content-Type': 'multipart/form-data' }
            if (options?.headers) _headers = { ...options.headers, ..._headers }
            const response = await axios.post(url, options?.body, { headers: _headers })
            switch (response.status) {
                case 200:
                case 201:
                    return response.data
                case 204:
                    return {
                        message: 'ok',
                        data: options?.body
                    }
                case 401:
                    ToastMessage.errors('Unauthorized access')
                    ConfigData.onInvalidToken()
                    return;
                default:
                    console.log("error: ??: ", response.statusText)
                    return { status: response.status, message: response.statusText };
            }
        } catch (error) {
            console.error("Failed to POST data:", error);
            return undefined;
        }
    }

    static get = async (url: string, options?: { headers?: { [k: string]: any } }) => {
        try {
            let _headers = { 'Content-Type': 'application/json' }
            if (options?.headers) _headers = { ..._headers, ...options.headers }
            const response = await axios.get(url, { headers: _headers })
            if (response.status === 200 || response.status === 201) {
                return response.data
            } else if (response.status === 204) {
                return { message: 'ok' }
            } else if (response.status === 401) {
                ToastMessage.errors('Unauthorized access')
                ConfigData.onInvalidToken()
                return;
            } else {
                console.log("error: ??: ", response.statusText)
                return { status: response.status, message: response.statusText };
            }
        } catch (error) {
            console.error("Failed to GET data:", error);
            return undefined;
        }
    }

    static uploadFiles = async (
        listFile: File[] | { id: string, file: File }[],
        headers?: { [k: string]: any },
        onProgress?: (percent: number) => void,
    ) => {
        const loader = document.createElement("div")
        loader.className = "loader"
        document.body.appendChild(loader)

        try {
            const entries = ([...listFile] as Array<File | { id: string, file: File }>).map(e =>
                e instanceof File ? { file: e, id: undefined as string | undefined } : { file: e.file, id: e.id }
            )
            if (entries.some(e => e.file.size > maxFileSize)) {
                ToastMessage.errors('File size must be not more than 2GB')
                return null
            }

            const headersObj: any = { pid: ConfigData.pid, ...headers }
            const results: any[] = new Array(entries.length)
            const loaded: number[] = new Array(entries.length).fill(0)
            const totalBytes = entries.reduce((a, e) => a + e.file.size, 0) || 1
            const report = () => onProgress?.(Math.min(100, Math.round(loaded.reduce((a, b) => a + b, 0) / totalBytes * 100)))

            // Chia file nhỏ (qua BE như cũ) / file lớn (PUT thẳng lên R2)
            const small: number[] = []
            const large: number[] = []
            entries.forEach((e, i) => (e.file.size <= directBatchLimit ? small : large).push(i))

            // File có id xếp trước để ids khớp vị trí file trên server
            small.sort((a, b) => Number(!!entries[b].id) - Number(!!entries[a].id))
            const batches: number[][] = []
            let cur: number[] = []
            let curSize = 0
            for (const i of small) {
                const size = entries[i].file.size
                if (cur.length && (cur.length >= directMaxFiles || curSize + size > directBatchLimit)) {
                    batches.push(cur)
                    cur = []
                    curSize = 0
                }
                cur.push(i)
                curSize += size
            }
            if (cur.length) batches.push(cur)

            const smallJobs = batches.map(async (batch) => {
                const formData = new FormData()
                batch.forEach(i => formData.append("files", entries[i].file))
                const ids = batch.map(i => entries[i].id).filter(Boolean) as string[]
                if (ids.length) formData.append("ids", ids.join(","))
                const res = await BaseDA.postFile(ConfigData.url + 'file/uploadfiles', { headers: headersObj, body: formData })
                if (res?.code !== 200) throw new Error(res?.message ?? "Failed to upload files")
                if (!Array.isArray(res.data) || res.data.length !== batch.length) throw new Error("Some files failed to upload")
                batch.forEach((i, j) => {
                    results[i] = res.data[j]
                    loaded[i] = entries[i].file.size
                })
                report()
            })

            // File lớn: xin URL -> PUT thẳng lên R2 -> xác nhận (lần lượt từng file)
            const largeJob = async () => {
                for (const i of large) {
                    const { file, id } = entries[i]
                    const contentType = file.type || "application/octet-stream"
                    const pre = await BaseDA.post(ConfigData.url + 'file/presignUpload', {
                        headers: headersObj,
                        body: { id, type: contentType, size: file.size },
                    })
                    if (pre?.code !== 200) throw new Error(pre?.message ?? "Failed to get upload url")
                    await putToR2(pre.data.uploadUrl, file, contentType, (n) => {
                        loaded[i] = n
                        report()
                    })
                    const done = await BaseDA.post(ConfigData.url + 'file/confirmUpload', {
                        headers: headersObj,
                        body: { id: pre.data.id, name: file.name, overwrite: !!id },
                    })
                    if (done?.code !== 200) throw new Error(done?.message ?? "Failed to confirm upload")
                    results[i] = done.data[0]
                    loaded[i] = file.size
                    report()
                }
            }

            await Promise.all([...smallJobs, largeJob()])
            return results
        } catch (err: any) {
            console.error("Failed to upload files:", err)
            ToastMessage.errors(err?.message ?? "Failed to upload files")
            return null
        } finally {
            loader.remove()
        }
    }

    static getFilesInfor = async (ids: Array<string>) => {
        const response = await BaseDA.post(ConfigData.url + 'file/getFilesInfor', {
            headers: { pid: ConfigData.pid, 'Content-Type': 'application/json' },
            body: { ids },
        })
        return response
    }

    static updateFilesInfor = async (data: Array<{ [p: string]: any }>) => {
        const response = await BaseDA.post(ConfigData.url + 'file/editFileInfor', {
            headers: { pid: ConfigData.pid, 'Content-Type': 'application/json' },
            body: { data },
        })
        return response
    }

    static deleteFiles = async (ids: Array<string>, headers?: { [k: string]: any }) => {
        const loader = document.createElement("div")
        loader.className = "loader"
        document.body.appendChild(loader)

        const headersObj: any = { "Content-Type": "application/json", pid: ConfigData.pid, ...headers }

        const response = await BaseDA.post(ConfigData.url + 'file/deleteFiles', {
            headers: headersObj,
            body: { ids },
        })
        loader.remove()
        return response
    }

    static duplicateFiles = async (ids: Array<string>, headers?: { [k: string]: any }) => {
        const loader = document.createElement("div")
        loader.className = "loader"
        document.body.appendChild(loader)

        const headersObj: any = { "Content-Type": "application/json", pid: ConfigData.pid, ...headers }

        const response = await BaseDA.post(ConfigData.url + 'file/duplicateFiles', {
            headers: headersObj,
            body: { ids },
        })
        loader.remove()
        return response
    }
}

export class CkEditorUploadAdapter {
    loader: any;


    constructor(loader: any) {
        // The file loader instance to use during the upload.
        this.loader = loader;
    }

    // Starts the upload process.
    upload() {
        return this.loader.file.then((file: any) => new Promise((resolve, reject) => {
            this._sendRequest(file, resolve, reject);
        }));
    }

    async _sendRequest(file: File, resolve: { (value: unknown): void; (arg0: { default: string }): void }, reject: { (arg0: string): void }) {
        BaseDA.uploadFiles([file]).then((res: any) => {
            if (res?.length) {
                resolve({
                    default: res[0].Url
                })
            } else {
                ToastMessage.errors("Failed to upload file")
                reject("Failed to upload file")
                console.error(`Failed to upload file: ${res?.message}`)
            }
        }).catch(err => {
            ToastMessage.errors("Failed to upload file")
            reject("Failed to upload file")
            console.error(`Failed to upload file: ${err.message}`)
        })
    }
}