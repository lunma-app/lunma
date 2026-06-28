export { sidebar_clearedtabs1 as "sidebar_clearedTabs" };
export type LocalizedString = import("../runtime.js").LocalizedString;
export type Sidebar_Clearedtabs1Inputs = {
    count: NonNullable<unknown>;
};
/**
* | countPlural | output |
* | --- | --- |
* | "one" | "Cleared {count} tab" |
* | "other" | "Cleared {count} tabs" |
*
* @param {Sidebar_Clearedtabs1Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
declare const sidebar_clearedtabs1: ((inputs: Sidebar_Clearedtabs1Inputs, options?: {
    locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Sidebar_Clearedtabs1Inputs, {
    locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru";
}, {}>;
