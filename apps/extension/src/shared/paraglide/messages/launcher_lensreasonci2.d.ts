export { launcher_lensreasonci2 as "launcher_lensReasonCi" };
export type LocalizedString = import("../runtime.js").LocalizedString;
export type Launcher_Lensreasonci2Inputs = {};
/**
* | output |
* | --- |
* | "CI failing" |
*
* @param {Launcher_Lensreasonci2Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
declare const launcher_lensreasonci2: ((inputs?: Launcher_Lensreasonci2Inputs, options?: {
    locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Launcher_Lensreasonci2Inputs, {
    locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru";
}, {}>;
