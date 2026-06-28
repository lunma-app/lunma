export { launcher_lensmissingcopy2 as "launcher_lensMissingCopy" };
export type LocalizedString = import("../runtime.js").LocalizedString;
export type Launcher_Lensmissingcopy2Inputs = {};
/**
* | output |
* | --- |
* | "This page didn't get a lens to open, or that lens is no longer around." |
*
* @param {Launcher_Lensmissingcopy2Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
declare const launcher_lensmissingcopy2: ((inputs?: Launcher_Lensmissingcopy2Inputs, options?: {
    locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Launcher_Lensmissingcopy2Inputs, {
    locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru";
}, {}>;
