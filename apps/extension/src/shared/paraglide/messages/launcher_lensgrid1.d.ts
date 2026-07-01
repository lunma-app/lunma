export { launcher_lensgrid1 as "launcher_lensGrid" };
export type LocalizedString = import("../runtime.js").LocalizedString;
export type Launcher_Lensgrid1Inputs = {};
/**
* | output |
* | --- |
* | "Grid" |
*
* @param {Launcher_Lensgrid1Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
declare const launcher_lensgrid1: ((inputs?: Launcher_Lensgrid1Inputs, options?: {
    locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Launcher_Lensgrid1Inputs, {
    locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru";
}, {}>;
