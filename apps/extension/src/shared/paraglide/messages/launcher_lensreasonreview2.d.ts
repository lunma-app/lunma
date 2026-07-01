export { launcher_lensreasonreview2 as "launcher_lensReasonReview" };
export type LocalizedString = import("../runtime.js").LocalizedString;
export type Launcher_Lensreasonreview2Inputs = {};
/**
* | output |
* | --- |
* | "review requested" |
*
* @param {Launcher_Lensreasonreview2Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
declare const launcher_lensreasonreview2: ((inputs?: Launcher_Lensreasonreview2Inputs, options?: {
    locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Launcher_Lensreasonreview2Inputs, {
    locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru";
}, {}>;
