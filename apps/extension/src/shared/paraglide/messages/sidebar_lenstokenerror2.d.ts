export { sidebar_lenstokenerror2 as "sidebar_lensTokenError" };
export type LocalizedString = import("../runtime.js").LocalizedString;
export type Sidebar_Lenstokenerror2Inputs = {};
/**
* | output |
* | --- |
* | "That token didn't work — check it can read pull requests." |
*
* @param {Sidebar_Lenstokenerror2Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
declare const sidebar_lenstokenerror2: ((inputs?: Sidebar_Lenstokenerror2Inputs, options?: {
    locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Sidebar_Lenstokenerror2Inputs, {
    locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru";
}, {}>;
