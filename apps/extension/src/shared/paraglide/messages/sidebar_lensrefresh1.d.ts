export { sidebar_lensrefresh1 as "sidebar_lensRefresh" };
export type LocalizedString = import("../runtime.js").LocalizedString;
export type Sidebar_Lensrefresh1Inputs = {};
/**
* | output |
* | --- |
* | "Refresh now" |
*
* @param {Sidebar_Lensrefresh1Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
declare const sidebar_lensrefresh1: ((inputs?: Sidebar_Lensrefresh1Inputs, options?: {
    locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Sidebar_Lensrefresh1Inputs, {
    locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru";
}, {}>;
