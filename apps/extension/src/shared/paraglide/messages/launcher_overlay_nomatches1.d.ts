export { launcher_overlay_nomatches1 as "launcher_overlay_noMatches" };
export type LocalizedString = import("../runtime.js").LocalizedString;
export type Launcher_Overlay_Nomatches1Inputs = {};
/**
* | output |
* | --- |
* | "No matches" |
*
* @param {Launcher_Overlay_Nomatches1Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
declare const launcher_overlay_nomatches1: ((inputs?: Launcher_Overlay_Nomatches1Inputs, options?: {
    locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Launcher_Overlay_Nomatches1Inputs, {
    locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru";
}, {}>;
