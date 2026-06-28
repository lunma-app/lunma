export { launcher_actionhintopen2 as "launcher_actionHintOpen" };
export type LocalizedString = import("../runtime.js").LocalizedString;
export type Launcher_Actionhintopen2Inputs = {};
/**
* | output |
* | --- |
* | "↵ Open" |
*
* @param {Launcher_Actionhintopen2Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
declare const launcher_actionhintopen2: ((inputs?: Launcher_Actionhintopen2Inputs, options?: {
    locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Launcher_Actionhintopen2Inputs, {
    locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru";
}, {}>;
