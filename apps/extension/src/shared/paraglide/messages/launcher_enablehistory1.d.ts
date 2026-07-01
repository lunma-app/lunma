export { launcher_enablehistory1 as "launcher_enableHistory" };
export type LocalizedString = import("../runtime.js").LocalizedString;
export type Launcher_Enablehistory1Inputs = {};
/**
* | output |
* | --- |
* | "Enable history results" |
*
* @param {Launcher_Enablehistory1Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
declare const launcher_enablehistory1: ((inputs?: Launcher_Enablehistory1Inputs, options?: {
    locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Launcher_Enablehistory1Inputs, {
    locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru";
}, {}>;
