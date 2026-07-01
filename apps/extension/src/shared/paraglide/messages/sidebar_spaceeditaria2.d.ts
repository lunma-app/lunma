export { sidebar_spaceeditaria2 as "sidebar_spaceEditAria" };
export type LocalizedString = import("../runtime.js").LocalizedString;
export type Sidebar_Spaceeditaria2Inputs = {
    name: NonNullable<unknown>;
};
/**
* | output |
* | --- |
* | "Edit {name}" |
*
* @param {Sidebar_Spaceeditaria2Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
declare const sidebar_spaceeditaria2: ((inputs: Sidebar_Spaceeditaria2Inputs, options?: {
    locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Sidebar_Spaceeditaria2Inputs, {
    locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru";
}, {}>;
