/**
* | output |
* | --- |
* | "Open" |
*
* @param {Launcher_Overlay_OpenInputs} inputs
* @param {{ locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
export const launcher_overlay_open: ((inputs?: Launcher_Overlay_OpenInputs, options?: {
    locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Launcher_Overlay_OpenInputs, {
    locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru";
}, {}>;
export type LocalizedString = import("../runtime.js").LocalizedString;
export type Launcher_Overlay_OpenInputs = {};
