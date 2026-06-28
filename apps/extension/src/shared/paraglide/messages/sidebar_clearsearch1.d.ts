export { sidebar_clearsearch1 as "sidebar_clearSearch" };
export type LocalizedString = import("../runtime.js").LocalizedString;
export type Sidebar_Clearsearch1Inputs = {};
/**
* | output |
* | --- |
* | "Clear" |
*
* @param {Sidebar_Clearsearch1Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
declare const sidebar_clearsearch1: ((inputs?: Sidebar_Clearsearch1Inputs, options?: {
    locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Sidebar_Clearsearch1Inputs, {
    locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru";
}, {}>;
