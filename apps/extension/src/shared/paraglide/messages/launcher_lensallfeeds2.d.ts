export { launcher_lensallfeeds2 as "launcher_lensAllFeeds" };
export type LocalizedString = import("../runtime.js").LocalizedString;
export type Launcher_Lensallfeeds2Inputs = {};
/**
* | output |
* | --- |
* | "All feeds" |
*
* @param {Launcher_Lensallfeeds2Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
declare const launcher_lensallfeeds2: ((inputs?: Launcher_Lensallfeeds2Inputs, options?: {
    locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Launcher_Lensallfeeds2Inputs, {
    locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru";
}, {}>;
