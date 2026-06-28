export { options_importfailederror2 as "options_importFailedError" };
export type LocalizedString = import("../runtime.js").LocalizedString;
export type Options_Importfailederror2Inputs = {};
/**
* | output |
* | --- |
* | "Import failed — the file may be corrupt or from an incompatible version." |
*
* @param {Options_Importfailederror2Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
declare const options_importfailederror2: ((inputs?: Options_Importfailederror2Inputs, options?: {
    locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Options_Importfailederror2Inputs, {
    locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru";
}, {}>;
