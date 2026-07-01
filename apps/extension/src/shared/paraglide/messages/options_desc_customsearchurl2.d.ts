export { options_desc_customsearchurl2 as "options_desc_customSearchUrl" };
export type LocalizedString = import("../runtime.js").LocalizedString;
export type Options_Desc_Customsearchurl2Inputs = {};
/**
* | output |
* | --- |
* | "Used when the engine above is set to Custom — %s is the query" |
*
* @param {Options_Desc_Customsearchurl2Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
declare const options_desc_customsearchurl2: ((inputs?: Options_Desc_Customsearchurl2Inputs, options?: {
    locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Options_Desc_Customsearchurl2Inputs, {
    locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru";
}, {}>;
