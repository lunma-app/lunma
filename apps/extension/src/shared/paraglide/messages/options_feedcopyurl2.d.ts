export { options_feedcopyurl2 as "options_feedCopyUrl" };
export type LocalizedString = import("../runtime.js").LocalizedString;
export type Options_Feedcopyurl2Inputs = {};
/**
* | output |
* | --- |
* | "Copy URL" |
*
* @param {Options_Feedcopyurl2Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
declare const options_feedcopyurl2: ((inputs?: Options_Feedcopyurl2Inputs, options?: {
    locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Options_Feedcopyurl2Inputs, {
    locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru";
}, {}>;
