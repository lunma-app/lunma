export { options_feedreachline2 as "options_feedReachLine" };
export type LocalizedString = import("../runtime.js").LocalizedString;
export type Options_Feedreachline2Inputs = {
    feedUrl: NonNullable<unknown>;
    reach: NonNullable<unknown>;
    entity: NonNullable<unknown>;
};
/**
* | output |
* | --- |
* | "{feedUrl} · {reach} · powers {entity}" |
*
* @param {Options_Feedreachline2Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
declare const options_feedreachline2: ((inputs: Options_Feedreachline2Inputs, options?: {
    locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Options_Feedreachline2Inputs, {
    locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru";
}, {}>;
