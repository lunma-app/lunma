export { options_historydescription1 as "options_historyDescription" };
export type LocalizedString = import("../runtime.js").LocalizedString;
export type Options_Historydescription1Inputs = {};
/**
* | output |
* | --- |
* | "Show matching pages from your browsing history in the launcher." |
*
* @param {Options_Historydescription1Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
declare const options_historydescription1: ((inputs?: Options_Historydescription1Inputs, options?: {
    locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Options_Historydescription1Inputs, {
    locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru";
}, {}>;
