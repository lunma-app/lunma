export { options_connectionsdescription1 as "options_connectionsDescription" };
export type LocalizedString = import("../runtime.js").LocalizedString;
export type Options_Connectionsdescription1Inputs = {};
/**
* | output |
* | --- |
* | "Connect a service once, then reuse it in any lens. GitLab and Jira ride your browser's sign-in by default; GitHub needs a token. RSS feeds are public URLs — ..." |
*
* @param {Options_Connectionsdescription1Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
declare const options_connectionsdescription1: ((inputs?: Options_Connectionsdescription1Inputs, options?: {
    locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Options_Connectionsdescription1Inputs, {
    locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru";
}, {}>;
