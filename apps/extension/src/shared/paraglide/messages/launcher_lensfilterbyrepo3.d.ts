export { launcher_lensfilterbyrepo3 as "launcher_lensFilterByRepo" };
export type LocalizedString = import("../runtime.js").LocalizedString;
export type Launcher_Lensfilterbyrepo3Inputs = {};
/**
* | output |
* | --- |
* | "Filter by repo" |
*
* @param {Launcher_Lensfilterbyrepo3Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
declare const launcher_lensfilterbyrepo3: ((inputs?: Launcher_Lensfilterbyrepo3Inputs, options?: {
    locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Launcher_Lensfilterbyrepo3Inputs, {
    locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru";
}, {}>;
