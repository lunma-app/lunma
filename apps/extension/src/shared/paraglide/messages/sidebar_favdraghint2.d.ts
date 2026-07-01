export { sidebar_favdraghint2 as "sidebar_favDragHint" };
export type LocalizedString = import("../runtime.js").LocalizedString;
export type Sidebar_Favdraghint2Inputs = {};
/**
* | output |
* | --- |
* | "Drag a tab up here to favorite it." |
*
* @param {Sidebar_Favdraghint2Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
declare const sidebar_favdraghint2: ((inputs?: Sidebar_Favdraghint2Inputs, options?: {
    locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Sidebar_Favdraghint2Inputs, {
    locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru";
}, {}>;
