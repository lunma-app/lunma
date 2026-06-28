export { options_importinvaliderror2 as "options_importInvalidError" };
export type LocalizedString = import("../runtime.js").LocalizedString;
export type Options_Importinvaliderror2Inputs = {};
/**
* | output |
* | --- |
* | "Invalid backup file — it may be corrupt or from an incompatible version." |
*
* @param {Options_Importinvaliderror2Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
declare const options_importinvaliderror2: ((inputs?: Options_Importinvaliderror2Inputs, options?: {
    locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Options_Importinvaliderror2Inputs, {
    locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru";
}, {}>;
