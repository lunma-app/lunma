export { options_desc_defaultsearchengine2 as "options_desc_defaultSearchEngine" };
export type LocalizedString = import("../runtime.js").LocalizedString;
export type Options_Desc_Defaultsearchengine2Inputs = {};
/**
* | output |
* | --- |
* | "Which engine the launcher searches a query with" |
*
* @param {Options_Desc_Defaultsearchengine2Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
declare const options_desc_defaultsearchengine2: ((inputs?: Options_Desc_Defaultsearchengine2Inputs, options?: {
    locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Options_Desc_Defaultsearchengine2Inputs, {
    locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru";
}, {}>;
