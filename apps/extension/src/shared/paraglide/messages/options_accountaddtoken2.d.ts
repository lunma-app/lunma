export { options_accountaddtoken2 as "options_accountAddToken" };
export type LocalizedString = import("../runtime.js").LocalizedString;
export type Options_Accountaddtoken2Inputs = {};
/**
* | output |
* | --- |
* | "Add token" |
*
* @param {Options_Accountaddtoken2Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
declare const options_accountaddtoken2: ((inputs?: Options_Accountaddtoken2Inputs, options?: {
    locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Options_Accountaddtoken2Inputs, {
    locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru";
}, {}>;
