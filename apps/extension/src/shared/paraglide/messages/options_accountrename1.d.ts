export { options_accountrename1 as "options_accountRename" };
export type LocalizedString = import("../runtime.js").LocalizedString;
export type Options_Accountrename1Inputs = {};
/**
* | output |
* | --- |
* | "Rename" |
*
* @param {Options_Accountrename1Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
declare const options_accountrename1: ((inputs?: Options_Accountrename1Inputs, options?: {
    locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Options_Accountrename1Inputs, {
    locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru";
}, {}>;
