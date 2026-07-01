export { sidebar_newtab1 as "sidebar_newTab" };
export type LocalizedString = import("../runtime.js").LocalizedString;
export type Sidebar_Newtab1Inputs = {};
/**
* | output |
* | --- |
* | "New Tab" |
*
* @param {Sidebar_Newtab1Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
declare const sidebar_newtab1: ((inputs?: Sidebar_Newtab1Inputs, options?: {
    locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Sidebar_Newtab1Inputs, {
    locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru";
}, {}>;
