export { launcher_enablebookmarks1 as "launcher_enableBookmarks" };
export type LocalizedString = import("../runtime.js").LocalizedString;
export type Launcher_Enablebookmarks1Inputs = {};
/**
* | output |
* | --- |
* | "Enable bookmark results" |
*
* @param {Launcher_Enablebookmarks1Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
declare const launcher_enablebookmarks1: ((inputs?: Launcher_Enablebookmarks1Inputs, options?: {
    locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Launcher_Enablebookmarks1Inputs, {
    locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru";
}, {}>;
