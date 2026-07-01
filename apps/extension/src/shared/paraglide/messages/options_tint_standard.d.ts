/**
* | output |
* | --- |
* | "Standard" |
*
* @param {Options_Tint_StandardInputs} inputs
* @param {{ locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
export const options_tint_standard: ((inputs?: Options_Tint_StandardInputs, options?: {
    locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Options_Tint_StandardInputs, {
    locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru";
}, {}>;
export type LocalizedString = import("../runtime.js").LocalizedString;
export type Options_Tint_StandardInputs = {};
