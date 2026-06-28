/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Options_Label_Pinnedtabboundarydefault3Inputs */

const en_options_label_pinnedtabboundarydefault3 = /** @type {(inputs: Options_Label_Pinnedtabboundarydefault3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Lock pinned tabs to their site`)
};

const es_options_label_pinnedtabboundarydefault3 = /** @type {(inputs: Options_Label_Pinnedtabboundarydefault3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Anclar pestañas fijadas a su sitio`)
};

const pt_pt2_options_label_pinnedtabboundarydefault3 = /** @type {(inputs: Options_Label_Pinnedtabboundarydefault3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Bloquear separadores fixos ao seu site`)
};

const fr_options_label_pinnedtabboundarydefault3 = /** @type {(inputs: Options_Label_Pinnedtabboundarydefault3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Verrouiller les onglets épinglés sur leur site`)
};

const de_options_label_pinnedtabboundarydefault3 = /** @type {(inputs: Options_Label_Pinnedtabboundarydefault3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Angeheftete Tabs an ihre Site binden`)
};

const ja_options_label_pinnedtabboundarydefault3 = /** @type {(inputs: Options_Label_Pinnedtabboundarydefault3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`固定タブをサイトにロック`)
};

const ko_options_label_pinnedtabboundarydefault3 = /** @type {(inputs: Options_Label_Pinnedtabboundarydefault3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`고정 탭을 해당 사이트에 잠금`)
};

const zh_cn2_options_label_pinnedtabboundarydefault3 = /** @type {(inputs: Options_Label_Pinnedtabboundarydefault3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`将固定标签页锁定到其站点`)
};

const ru_options_label_pinnedtabboundarydefault3 = /** @type {(inputs: Options_Label_Pinnedtabboundarydefault3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Привязать закреплённые вкладки к их сайту`)
};

/**
* | output |
* | --- |
* | "Lock pinned tabs to their site" |
*
* @param {Options_Label_Pinnedtabboundarydefault3Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const options_label_pinnedtabboundarydefault3 = /** @type {((inputs?: Options_Label_Pinnedtabboundarydefault3Inputs, options?: { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Options_Label_Pinnedtabboundarydefault3Inputs, { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_options_label_pinnedtabboundarydefault3(inputs)
	if (locale === "es") return es_options_label_pinnedtabboundarydefault3(inputs)
	if (locale === "pt-PT") return pt_pt2_options_label_pinnedtabboundarydefault3(inputs)
	if (locale === "fr") return fr_options_label_pinnedtabboundarydefault3(inputs)
	if (locale === "de") return de_options_label_pinnedtabboundarydefault3(inputs)
	if (locale === "ja") return ja_options_label_pinnedtabboundarydefault3(inputs)
	if (locale === "ko") return ko_options_label_pinnedtabboundarydefault3(inputs)
	if (locale === "zh-CN") return zh_cn2_options_label_pinnedtabboundarydefault3(inputs)
	return ru_options_label_pinnedtabboundarydefault3(inputs)
});
export { options_label_pinnedtabboundarydefault3 as "options_label_pinnedTabBoundaryDefault" }