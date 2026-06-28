export { launcher_nomatches1 as "launcher_noMatches" };
export type LocalizedString = import("../runtime.js").LocalizedString;
export type Launcher_Nomatches1Inputs = {};
/**
* | output |
* | --- |
* | "No matches" |
*
* @param {Launcher_Nomatches1Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
declare const launcher_nomatches1: ((inputs?: Launcher_Nomatches1Inputs, options?: {
    locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Launcher_Nomatches1Inputs, {
    locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru";
}, {}>;
