export { launcher_lensempty1 as "launcher_lensEmpty" };
export type LocalizedString = import("../runtime.js").LocalizedString;
export type Launcher_Lensempty1Inputs = {};
/**
* | output |
* | --- |
* | "This lens has nothing waiting right now." |
*
* @param {Launcher_Lensempty1Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
declare const launcher_lensempty1: ((inputs?: Launcher_Lensempty1Inputs, options?: {
    locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Launcher_Lensempty1Inputs, {
    locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru";
}, {}>;
