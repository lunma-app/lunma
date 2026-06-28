export { launcher_lensallrepos2 as "launcher_lensAllRepos" };
export type LocalizedString = import("../runtime.js").LocalizedString;
export type Launcher_Lensallrepos2Inputs = {};
/**
* | output |
* | --- |
* | "All repos" |
*
* @param {Launcher_Lensallrepos2Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
declare const launcher_lensallrepos2: ((inputs?: Launcher_Lensallrepos2Inputs, options?: {
    locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Launcher_Lensallrepos2Inputs, {
    locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru";
}, {}>;
