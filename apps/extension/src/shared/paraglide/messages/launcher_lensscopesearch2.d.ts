export { launcher_lensscopesearch2 as "launcher_lensScopeSearch" };
export type LocalizedString = import("../runtime.js").LocalizedString;
export type Launcher_Lensscopesearch2Inputs = {};
/**
* | output |
* | --- |
* | "Search…" |
*
* @param {Launcher_Lensscopesearch2Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
declare const launcher_lensscopesearch2: ((inputs?: Launcher_Lensscopesearch2Inputs, options?: {
    locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Launcher_Lensscopesearch2Inputs, {
    locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru";
}, {}>;
