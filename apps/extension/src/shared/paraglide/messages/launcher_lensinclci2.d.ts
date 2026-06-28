export { launcher_lensinclci2 as "launcher_lensInclCi" };
export type LocalizedString = import("../runtime.js").LocalizedString;
export type Launcher_Lensinclci2Inputs = {};
/**
* | output |
* | --- |
* | "incl. CI" |
*
* @param {Launcher_Lensinclci2Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
declare const launcher_lensinclci2: ((inputs?: Launcher_Lensinclci2Inputs, options?: {
    locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Launcher_Lensinclci2Inputs, {
    locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru";
}, {}>;
