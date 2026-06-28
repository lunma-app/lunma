export { options_importreaderror2 as "options_importReadError" };
export type LocalizedString = import("../runtime.js").LocalizedString;
export type Options_Importreaderror2Inputs = {};
/**
* | output |
* | --- |
* | "Could not read the backup file." |
*
* @param {Options_Importreaderror2Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
declare const options_importreaderror2: ((inputs?: Options_Importreaderror2Inputs, options?: {
    locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Options_Importreaderror2Inputs, {
    locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru";
}, {}>;
