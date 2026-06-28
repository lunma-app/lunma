export { sidebar_archivedlabel1 as "sidebar_archivedLabel" };
export type LocalizedString = import("../runtime.js").LocalizedString;
export type Sidebar_Archivedlabel1Inputs = {
    count: NonNullable<unknown>;
};
/**
* | output |
* | --- |
* | "Recently archived ({count})" |
*
* @param {Sidebar_Archivedlabel1Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
declare const sidebar_archivedlabel1: ((inputs: Sidebar_Archivedlabel1Inputs, options?: {
    locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Sidebar_Archivedlabel1Inputs, {
    locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru";
}, {}>;
