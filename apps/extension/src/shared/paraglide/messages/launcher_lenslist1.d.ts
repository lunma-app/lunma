export { launcher_lenslist1 as "launcher_lensList" };
export type LocalizedString = import("../runtime.js").LocalizedString;
export type Launcher_Lenslist1Inputs = {};
/**
* | output |
* | --- |
* | "List" |
*
* @param {Launcher_Lenslist1Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
declare const launcher_lenslist1: ((inputs?: Launcher_Lenslist1Inputs, options?: {
    locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Launcher_Lenslist1Inputs, {
    locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru";
}, {}>;
