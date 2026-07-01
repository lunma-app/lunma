export { options_accountreplacetoken2 as "options_accountReplaceToken" };
export type LocalizedString = import("../runtime.js").LocalizedString;
export type Options_Accountreplacetoken2Inputs = {};
/**
* | output |
* | --- |
* | "Replace token" |
*
* @param {Options_Accountreplacetoken2Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
declare const options_accountreplacetoken2: ((inputs?: Options_Accountreplacetoken2Inputs, options?: {
    locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Options_Accountreplacetoken2Inputs, {
    locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru";
}, {}>;
