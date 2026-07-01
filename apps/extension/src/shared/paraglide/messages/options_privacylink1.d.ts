export { options_privacylink1 as "options_privacyLink" };
export type LocalizedString = import("../runtime.js").LocalizedString;
export type Options_Privacylink1Inputs = {};
/**
* | output |
* | --- |
* | "Privacy policy" |
*
* @param {Options_Privacylink1Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
declare const options_privacylink1: ((inputs?: Options_Privacylink1Inputs, options?: {
    locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Options_Privacylink1Inputs, {
    locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru";
}, {}>;
