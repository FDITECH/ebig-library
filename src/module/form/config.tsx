import { differenceInCalendarDays, differenceInMinutes } from "date-fns";
import { validate } from "validate.js";
import { ValidateType } from "../da";
import { Util } from "../../controller/utils";
import { BaseDA } from "../../controller/config";

// {Name:, Validate}
export async function validateForm({ list = [], formdata }: { list?: Array<{ [p: string]: any }>, formdata?: { [p: string]: any } }) {
    const val = validate as any
    val.validators.customDate = customValidateDateTime
    val.validators.myAsyncValidator = myAsyncValidator
    val.options = { fullMessages: false }
    const myValidators = validateByType({ list: list })
    let res = validate(formdata, myValidators.validator)
    if (!res && Object.keys(myValidators.asyncValidator).length) {
        try {
            res = await val.async(formdata, myValidators.asyncValidator)
        } catch (error) {
            res = error
        }
    }
    return res
}

function validateByType({ list = [] }: { list?: Array<{ [p: string]: any }> }) {
    let validator: { [p: string]: any } = {}
    let asyncValidator: { [p: string]: any } = {}
    list.forEach(e => {
        let eValidateConfig: { [p: string]: any } = {}
        e.Validate?.forEach((el: any) => {
            switch (el.type) {
                case ValidateType.email:
                    eValidateConfig.email = { message: el.message ?? 'Invalid email' }
                    break;
                case ValidateType.minLength:
                    eValidateConfig.length = { ...(eValidateConfig.length ?? {}), minimum: el.value, tooShort: el.message ?? `At least ${el.value} characters` }
                    break;
                case ValidateType.maxLength:
                    eValidateConfig.length = { ...(eValidateConfig.length ?? {}), maximum: el.value, tooLong: el.message ?? `At most ${el.value} characters` }
                    break;
                case ValidateType.number:
                    eValidateConfig.format = { pattern: "[0-9]+", flags: "i", message: el.message ?? `Only number` }
                    break;
                case ValidateType.phone:
                    eValidateConfig.format = { pattern: "([\+]{0,1})(84|0[3|5|7|8|9])+([0-9]{8})", flags: "g", message: el.message ?? `Invalid phone number` }
                    break;
                // case ValidateType.date:
                //     eValidateConfig.customDate = { dateOnly: true, message: el.message ?? `Không đúng định dạng dd/mm/yyyy` }
                //     break;
                // case ValidateType.dateTime:
                //     eValidateConfig.customDate = { message: el.message ?? `Không đúng định dạng dd/mm/yyyy hh:mm` }
                //     break;
                // case ValidateType.earliestDate:
                //     eValidateConfig.customDate = { dateOnly: true, earliest: el.value, tooEarly: el.message ?? `Không được trước ${Util.dateToString(new Date(el.value))}` }
                //     break;
                // case ValidateType.latestDate:
                //     eValidateConfig.customDate = { dateOnly: true, latest: el.value, tooLate: el.message ?? `Không được sau ${Util.dateToString(new Date(el.value))}` }
                //     break;
                // case ValidateType.earliestTime:
                //     eValidateConfig.customDate = { earliest: el.value, tooEarly: el.message ?? `Không được trước ${Util.dateToString(new Date(el.value))}` }
                //     break;
                // case ValidateType.latestTime:
                //     eValidateConfig.customDate = { latest: el.value, tooLate: el.message ?? `Không được sau ${Util.dateToString(new Date(el.value))}` }
                //     break;
                case ValidateType.greaterThan:
                    eValidateConfig.numericality = { ...(eValidateConfig.numericality ?? {}), greaterThan: el.value, notGreaterThan: el.message ?? `Value must be greater than ${el.value}` }
                    break;
                case ValidateType.greaterThanOrEqualTo:
                    eValidateConfig.numericality = { ...(eValidateConfig.numericality ?? {}), greaterThanOrEqualTo: el.value, notGreaterThan: el.message ?? `Value must be greater than or equal to ${el.value}` }
                    break;
                case ValidateType.lessThan:
                    eValidateConfig.numericality = { ...(eValidateConfig.numericality ?? {}), lessThan: el.value, notLessThan: el.message ?? `Value must be less than ${el.value}` }
                    break;
                case ValidateType.lessThanOrEqualTo:
                    eValidateConfig.numericality = { ...(eValidateConfig.numericality ?? {}), lessThanOrEqualTo: el.value, notLessThanOrEqualTo: el.message ?? `Value must be less than or equal to ${el.value}` }
                    break;
                // case ValidateType.async:
                //     asyncValidator[e.Name] = { myAsyncValidator: { url: el.value } }
                //     break;
                default:
                    break;
            }
        })
        validator[e.Name] = eValidateConfig
    })
    return {
        validator: validator,
        asyncValidator: asyncValidator
    }
}

function customValidateDateTime(value: any, options: { [p: string]: any }) {
    try {
        const parseValue: any = typeof value === 'string' ? Util.stringToDate(value, options.dateOnly ? 'dd/mm/yyyy' : 'dd/mm/yyyy hh:mm') : (new Date(value))
        if (options.earliest) {
            try {
                var _earliest: any = typeof options.earliest === 'string' ? Util.stringToDate(value, options.dateOnly ? 'dd/mm/yyyy' : 'dd/mm/yyyy hh:mm') : (new Date(options.earliest))
            } catch (error) {
                console.log(error)
            }
        }
        if (options.latest) {
            try {
                var _latest: any = typeof options.latest === 'string' ? Util.stringToDate(value, options.dateOnly ? 'dd/mm/yyyy' : 'dd/mm/yyyy hh:mm') : (new Date(options.latest))
            } catch (error) {
                console.log(error)
            }
        }
        if (isNaN(parseValue)) {
            return options.message;
        } else if (_earliest) {
            if (options.dateOnly && differenceInCalendarDays(parseValue, _earliest) < 0) {
                return options.tooEarly
            } else if (!options.dateOnly && differenceInMinutes(parseValue, _earliest) < 0) {
                return options.tooEarly
            }
        } else if (_latest) {
            if (options.dateOnly && differenceInCalendarDays(parseValue, _latest) < 0) {
                return options.tooLate
            } else if (!options.dateOnly && differenceInMinutes(parseValue, _latest) < 0) {
                return options.tooLate
            }
        }
    } catch (error) {
        return options.message;
    }
    return
};

async function myAsyncValidator(value: any, options: any) {
    console.log("????????: ", value, " -----------: ", options)
    if (options.url) {
        const res = await BaseDA.post(options.url, {
            body: { value: value }
        })
        if (res) {
            if (res.code !== 200) return res.message
        }
    }
    return undefined
}