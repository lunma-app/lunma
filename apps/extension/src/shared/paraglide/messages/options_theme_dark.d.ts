/**
* | output |
* | --- |
* | "Dark" |
*
* @param {Options_Theme_DarkInputs} inputs
* @param {{ locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
export const options_theme_dark: ((inputs?: Options_Theme_DarkInputs, options?: {
    locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Options_Theme_DarkInputs, {
    locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru";
}, {}>;
export type LocalizedString = import("../runtime.js").LocalizedString;
export type Options_Theme_DarkInputs = {};
