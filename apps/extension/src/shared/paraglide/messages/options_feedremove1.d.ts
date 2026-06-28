export { options_feedremove1 as "options_feedRemove" };
export type LocalizedString = import("../runtime.js").LocalizedString;
export type Options_Feedremove1Inputs = {};
/**
* | output |
* | --- |
* | "Remove" |
*
* @param {Options_Feedremove1Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
declare const options_feedremove1: ((inputs?: Options_Feedremove1Inputs, options?: {
    locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Options_Feedremove1Inputs, {
    locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru";
}, {}>;
