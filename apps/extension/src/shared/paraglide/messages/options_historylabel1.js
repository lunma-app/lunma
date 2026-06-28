/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Options_Historylabel1Inputs */

const en_options_historylabel1 = /** @type {(inputs: Options_Historylabel1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Browsing history`)
};

const es_options_historylabel1 = /** @type {(inputs: Options_Historylabel1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Historial de navegación`)
};

const pt_pt2_options_historylabel1 = /** @type {(inputs: Options_Historylabel1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Histórico de navegação`)
};

const fr_options_historylabel1 = /** @type {(inputs: Options_Historylabel1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Historique de navigation`)
};

const de_options_historylabel1 = /** @type {(inputs: Options_Historylabel1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Browserverlauf`)
};

const ja_options_historylabel1 = /** @type {(inputs: Options_Historylabel1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`閲覧履歴`)
};

const ko_options_historylabel1 = /** @type {(inputs: Options_Historylabel1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`브라우징 기록`)
};

const zh_cn2_options_historylabel1 = /** @type {(inputs: Options_Historylabel1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`浏览历史`)
};

const ru_options_historylabel1 = /** @type {(inputs: Options_Historylabel1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`История браузера`)
};

/**
* | output |
* | --- |
* | "Browsing history" |
*
* @param {Options_Historylabel1Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const options_historylabel1 = /** @type {((inputs?: Options_Historylabel1Inputs, options?: { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Options_Historylabel1Inputs, { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_options_historylabel1(inputs)
	if (locale === "es") return es_options_historylabel1(inputs)
	if (locale === "pt-PT") return pt_pt2_options_historylabel1(inputs)
	if (locale === "fr") return fr_options_historylabel1(inputs)
	if (locale === "de") return de_options_historylabel1(inputs)
	if (locale === "ja") return ja_options_historylabel1(inputs)
	if (locale === "ko") return ko_options_historylabel1(inputs)
	if (locale === "zh-CN") return zh_cn2_options_historylabel1(inputs)
	return ru_options_historylabel1(inputs)
});
export { options_historylabel1 as "options_historyLabel" }