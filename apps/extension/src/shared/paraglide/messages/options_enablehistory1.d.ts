export { options_enablehistory1 as "options_enableHistory" };
export type LocalizedString = import("../runtime.js").LocalizedString;
export type Options_Enablehistory1Inputs = {};
/**
* | output |
* | --- |
* | "Enable history results" |
*
* @param {Options_Enablehistory1Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
declare const options_enablehistory1: ((inputs?: Options_Enablehistory1Inputs, options?: {
    locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Options_Enablehistory1Inputs, {
    locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru";
}, {}>;
