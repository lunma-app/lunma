export { launcher_lensallprojects2 as "launcher_lensAllProjects" };
export type LocalizedString = import("../runtime.js").LocalizedString;
export type Launcher_Lensallprojects2Inputs = {};
/**
* | output |
* | --- |
* | "All projects" |
*
* @param {Launcher_Lensallprojects2Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
declare const launcher_lensallprojects2: ((inputs?: Launcher_Lensallprojects2Inputs, options?: {
    locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Launcher_Lensallprojects2Inputs, {
    locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru";
}, {}>;
