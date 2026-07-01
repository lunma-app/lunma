export { sidebar_dragtabstopinhint4 as "sidebar_dragTabsToPinHint" };
export type LocalizedString = import("../runtime.js").LocalizedString;
export type Sidebar_Dragtabstopinhint4Inputs = {
    modifier: NonNullable<unknown>;
};
/**
* | output |
* | --- |
* | "Drag a tab up here, or press {modifier}, to pin it." |
*
* @param {Sidebar_Dragtabstopinhint4Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
declare const sidebar_dragtabstopinhint4: ((inputs: Sidebar_Dragtabstopinhint4Inputs, options?: {
    locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Sidebar_Dragtabstopinhint4Inputs, {
    locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru";
}, {}>;
