export { options_sourceenabledtoast2 as "options_sourceEnabledToast" };
export type LocalizedString = import("../runtime.js").LocalizedString;
export type Options_Sourceenabledtoast2Inputs = {
    label: NonNullable<unknown>;
};
/**
* | output |
* | --- |
* | "{label} enabled" |
*
* @param {Options_Sourceenabledtoast2Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
declare const options_sourceenabledtoast2: ((inputs: Options_Sourceenabledtoast2Inputs, options?: {
    locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Options_Sourceenabledtoast2Inputs, {
    locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru";
}, {}>;
