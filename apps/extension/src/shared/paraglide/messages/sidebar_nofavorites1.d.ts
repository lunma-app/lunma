export { sidebar_nofavorites1 as "sidebar_noFavorites" };
export type LocalizedString = import("../runtime.js").LocalizedString;
export type Sidebar_Nofavorites1Inputs = {};
/**
* | output |
* | --- |
* | "No favorites yet." |
*
* @param {Sidebar_Nofavorites1Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
declare const sidebar_nofavorites1: ((inputs?: Sidebar_Nofavorites1Inputs, options?: {
    locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Sidebar_Nofavorites1Inputs, {
    locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru";
}, {}>;
