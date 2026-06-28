/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Options_Exportopml1Inputs */

const en_options_exportopml1 = /** @type {(inputs: Options_Exportopml1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Export OPML`)
};

const es_options_exportopml1 = /** @type {(inputs: Options_Exportopml1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Exportar OPML`)
};

const pt_pt2_options_exportopml1 = /** @type {(inputs: Options_Exportopml1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Exportar OPML`)
};

const fr_options_exportopml1 = /** @type {(inputs: Options_Exportopml1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Exporter l'OPML`)
};

const de_options_exportopml1 = /** @type {(inputs: Options_Exportopml1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`OPML exportieren`)
};

const ja_options_exportopml1 = /** @type {(inputs: Options_Exportopml1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`OPML をエクスポート`)
};

const ko_options_exportopml1 = /** @type {(inputs: Options_Exportopml1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`OPML 내보내기`)
};

const zh_cn2_options_exportopml1 = /** @type {(inputs: Options_Exportopml1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`导出 OPML`)
};

const ru_options_exportopml1 = /** @type {(inputs: Options_Exportopml1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Экспортировать OPML`)
};

/**
* | output |
* | --- |
* | "Export OPML" |
*
* @param {Options_Exportopml1Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const options_exportopml1 = /** @type {((inputs?: Options_Exportopml1Inputs, options?: { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Options_Exportopml1Inputs, { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_options_exportopml1(inputs)
	if (locale === "es") return es_options_exportopml1(inputs)
	if (locale === "pt-PT") return pt_pt2_options_exportopml1(inputs)
	if (locale === "fr") return fr_options_exportopml1(inputs)
	if (locale === "de") return de_options_exportopml1(inputs)
	if (locale === "ja") return ja_options_exportopml1(inputs)
	if (locale === "ko") return ko_options_exportopml1(inputs)
	if (locale === "zh-CN") return zh_cn2_options_exportopml1(inputs)
	return ru_options_exportopml1(inputs)
});
export { options_exportopml1 as "options_exportOpml" }