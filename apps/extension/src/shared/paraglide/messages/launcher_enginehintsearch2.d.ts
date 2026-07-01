export { launcher_enginehintsearch2 as "launcher_engineHintSearch" };
export type LocalizedString = import("../runtime.js").LocalizedString;
export type Launcher_Enginehintsearch2Inputs = {};
/**
* | output |
* | --- |
* | "Tab to search" |
*
* @param {Launcher_Enginehintsearch2Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
declare const launcher_enginehintsearch2: ((inputs?: Launcher_Enginehintsearch2Inputs, options?: {
    locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Launcher_Enginehintsearch2Inputs, {
    locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru";
}, {}>;
