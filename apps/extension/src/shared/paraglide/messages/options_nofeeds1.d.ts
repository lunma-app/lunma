export { options_nofeeds1 as "options_noFeeds" };
export type LocalizedString = import("../runtime.js").LocalizedString;
export type Options_Nofeeds1Inputs = {};
/**
* | output |
* | --- |
* | "No feeds yet." |
*
* @param {Options_Nofeeds1Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
declare const options_nofeeds1: ((inputs?: Options_Nofeeds1Inputs, options?: {
    locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Options_Nofeeds1Inputs, {
    locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru";
}, {}>;
