export { sidebar_lensaddtoken2 as "sidebar_lensAddToken" };
export type LocalizedString = import("../runtime.js").LocalizedString;
export type Sidebar_Lensaddtoken2Inputs = {};
/**
* | output |
* | --- |
* | "Add a token" |
*
* @param {Sidebar_Lensaddtoken2Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
declare const sidebar_lensaddtoken2: ((inputs?: Sidebar_Lensaddtoken2Inputs, options?: {
    locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Sidebar_Lensaddtoken2Inputs, {
    locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru";
}, {}>;
