export { options_accountdisconnect1 as "options_accountDisconnect" };
export type LocalizedString = import("../runtime.js").LocalizedString;
export type Options_Accountdisconnect1Inputs = {};
/**
* | output |
* | --- |
* | "Disconnect" |
*
* @param {Options_Accountdisconnect1Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
declare const options_accountdisconnect1: ((inputs?: Options_Accountdisconnect1Inputs, options?: {
    locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Options_Accountdisconnect1Inputs, {
    locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru";
}, {}>;
