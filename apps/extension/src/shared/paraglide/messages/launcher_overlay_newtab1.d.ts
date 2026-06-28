export { launcher_overlay_newtab1 as "launcher_overlay_newTab" };
export type LocalizedString = import("../runtime.js").LocalizedString;
export type Launcher_Overlay_Newtab1Inputs = {};
/**
* | output |
* | --- |
* | "New tab" |
*
* @param {Launcher_Overlay_Newtab1Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
declare const launcher_overlay_newtab1: ((inputs?: Launcher_Overlay_Newtab1Inputs, options?: {
    locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Launcher_Overlay_Newtab1Inputs, {
    locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru";
}, {}>;
