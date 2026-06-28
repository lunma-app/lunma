export { options_importrestore1 as "options_importRestore" };
export type LocalizedString = import("../runtime.js").LocalizedString;
export type Options_Importrestore1Inputs = {};
/**
* | output |
* | --- |
* | "Restore" |
*
* @param {Options_Importrestore1Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
declare const options_importrestore1: ((inputs?: Options_Importrestore1Inputs, options?: {
    locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Options_Importrestore1Inputs, {
    locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru";
}, {}>;
