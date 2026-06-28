export { options_noaccounts1 as "options_noAccounts" };
export type LocalizedString = import("../runtime.js").LocalizedString;
export type Options_Noaccounts1Inputs = {};
/**
* | output |
* | --- |
* | "No accounts yet." |
*
* @param {Options_Noaccounts1Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
declare const options_noaccounts1: ((inputs?: Options_Noaccounts1Inputs, options?: {
    locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Options_Noaccounts1Inputs, {
    locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru";
}, {}>;
