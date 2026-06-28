export { sidebar_addspace1 as "sidebar_addSpace" };
export type LocalizedString = import("../runtime.js").LocalizedString;
export type Sidebar_Addspace1Inputs = {};
/**
* | output |
* | --- |
* | "New Space" |
*
* @param {Sidebar_Addspace1Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
declare const sidebar_addspace1: ((inputs?: Sidebar_Addspace1Inputs, options?: {
    locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Sidebar_Addspace1Inputs, {
    locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru";
}, {}>;
