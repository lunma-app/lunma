export { sidebar_tabrename1 as "sidebar_tabRename" };
export type LocalizedString = import("../runtime.js").LocalizedString;
export type Sidebar_Tabrename1Inputs = {};
/**
* | output |
* | --- |
* | "Rename" |
*
* @param {Sidebar_Tabrename1Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
declare const sidebar_tabrename1: ((inputs?: Sidebar_Tabrename1Inputs, options?: {
    locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Sidebar_Tabrename1Inputs, {
    locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru";
}, {}>;
