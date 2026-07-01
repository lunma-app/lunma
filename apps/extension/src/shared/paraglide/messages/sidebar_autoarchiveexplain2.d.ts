export { sidebar_autoarchiveexplain2 as "sidebar_autoArchiveExplain" };
export type LocalizedString = import("../runtime.js").LocalizedString;
export type Sidebar_Autoarchiveexplain2Inputs = {
    threshold: NonNullable<unknown>;
};
/**
* | output |
* | --- |
* | "Temporary tabs left idle for {threshold} are archived automatically so your workspace stays tidy — restorable for 7 days." |
*
* @param {Sidebar_Autoarchiveexplain2Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
declare const sidebar_autoarchiveexplain2: ((inputs: Sidebar_Autoarchiveexplain2Inputs, options?: {
    locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Sidebar_Autoarchiveexplain2Inputs, {
    locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru";
}, {}>;
