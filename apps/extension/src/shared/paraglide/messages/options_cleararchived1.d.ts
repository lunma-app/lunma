export { options_cleararchived1 as "options_clearArchived" };
export type LocalizedString = import("../runtime.js").LocalizedString;
export type Options_Cleararchived1Inputs = {};
/**
* | output |
* | --- |
* | "Clear all" |
*
* @param {Options_Cleararchived1Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
declare const options_cleararchived1: ((inputs?: Options_Cleararchived1Inputs, options?: {
    locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Options_Cleararchived1Inputs, {
    locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru";
}, {}>;
