export { common_selectall1 as "common_selectAll" };
export type LocalizedString = import("../runtime.js").LocalizedString;
export type Common_Selectall1Inputs = {};
/**
* | output |
* | --- |
* | "Select all" |
*
* @param {Common_Selectall1Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
declare const common_selectall1: ((inputs?: Common_Selectall1Inputs, options?: {
    locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Common_Selectall1Inputs, {
    locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru";
}, {}>;
