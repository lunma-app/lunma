export { options_customurlhint2 as "options_customUrlHint" };
export type LocalizedString = import("../runtime.js").LocalizedString;
export type Options_Customurlhint2Inputs = {};
/**
* | output |
* | --- |
* | "Include %s where the query goes." |
*
* @param {Options_Customurlhint2Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
declare const options_customurlhint2: ((inputs?: Options_Customurlhint2Inputs, options?: {
    locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Options_Customurlhint2Inputs, {
    locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru";
}, {}>;
