/**
* | output |
* | --- |
* | "System" |
*
* @param {Options_Language_SystemInputs} inputs
* @param {{ locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
export const options_language_system: ((inputs?: Options_Language_SystemInputs, options?: {
    locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Options_Language_SystemInputs, {
    locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru";
}, {}>;
export type LocalizedString = import("../runtime.js").LocalizedString;
export type Options_Language_SystemInputs = {};
