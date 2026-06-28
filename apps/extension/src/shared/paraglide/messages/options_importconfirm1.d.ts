export { options_importconfirm1 as "options_importConfirm" };
export type LocalizedString = import("../runtime.js").LocalizedString;
export type Options_Importconfirm1Inputs = {};
/**
* | output |
* | --- |
* | "Replace your data? This cannot be undone." |
*
* @param {Options_Importconfirm1Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
declare const options_importconfirm1: ((inputs?: Options_Importconfirm1Inputs, options?: {
    locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Options_Importconfirm1Inputs, {
    locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru";
}, {}>;
