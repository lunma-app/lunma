export { options_feedrename1 as "options_feedRename" };
export type LocalizedString = import("../runtime.js").LocalizedString;
export type Options_Feedrename1Inputs = {};
/**
* | output |
* | --- |
* | "Rename" |
*
* @param {Options_Feedrename1Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
declare const options_feedrename1: ((inputs?: Options_Feedrename1Inputs, options?: {
    locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Options_Feedrename1Inputs, {
    locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru";
}, {}>;
