export { options_accountreachline2 as "options_accountReachLine" };
export type LocalizedString = import("../runtime.js").LocalizedString;
export type Options_Accountreachline2Inputs = {
    reach: NonNullable<unknown>;
    entity: NonNullable<unknown>;
};
/**
* | output |
* | --- |
* | "{reach} · powers {entity}" |
*
* @param {Options_Accountreachline2Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
declare const options_accountreachline2: ((inputs: Options_Accountreachline2Inputs, options?: {
    locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Options_Accountreachline2Inputs, {
    locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru";
}, {}>;
