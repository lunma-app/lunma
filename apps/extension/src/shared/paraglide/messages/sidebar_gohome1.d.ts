export { sidebar_gohome1 as "sidebar_goHome" };
export type LocalizedString = import("../runtime.js").LocalizedString;
export type Sidebar_Gohome1Inputs = {};
/**
* | output |
* | --- |
* | "Go home" |
*
* @param {Sidebar_Gohome1Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
declare const sidebar_gohome1: ((inputs?: Sidebar_Gohome1Inputs, options?: {
    locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Sidebar_Gohome1Inputs, {
    locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru";
}, {}>;
