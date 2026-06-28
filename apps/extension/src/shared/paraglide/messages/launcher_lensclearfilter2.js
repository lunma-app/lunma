/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Launcher_Lensclearfilter2Inputs */

const en_launcher_lensclearfilter2 = /** @type {(inputs: Launcher_Lensclearfilter2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Clear filter`)
};

const es_launcher_lensclearfilter2 = /** @type {(inputs: Launcher_Lensclearfilter2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Limpiar filtro`)
};

const pt_pt2_launcher_lensclearfilter2 = /** @type {(inputs: Launcher_Lensclearfilter2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Limpar filtro`)
};

const fr_launcher_lensclearfilter2 = /** @type {(inputs: Launcher_Lensclearfilter2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Effacer le filtre`)
};

const de_launcher_lensclearfilter2 = /** @type {(inputs: Launcher_Lensclearfilter2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Filter löschen`)
};

const ja_launcher_lensclearfilter2 = /** @type {(inputs: Launcher_Lensclearfilter2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`フィルターをクリア`)
};

const ko_launcher_lensclearfilter2 = /** @type {(inputs: Launcher_Lensclearfilter2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`필터 지우기`)
};

const zh_cn2_launcher_lensclearfilter2 = /** @type {(inputs: Launcher_Lensclearfilter2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`清除过滤器`)
};

const ru_launcher_lensclearfilter2 = /** @type {(inputs: Launcher_Lensclearfilter2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Сбросить фильтр`)
};

/**
* | output |
* | --- |
* | "Clear filter" |
*
* @param {Launcher_Lensclearfilter2Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const launcher_lensclearfilter2 = /** @type {((inputs?: Launcher_Lensclearfilter2Inputs, options?: { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Launcher_Lensclearfilter2Inputs, { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_launcher_lensclearfilter2(inputs)
	if (locale === "es") return es_launcher_lensclearfilter2(inputs)
	if (locale === "pt-PT") return pt_pt2_launcher_lensclearfilter2(inputs)
	if (locale === "fr") return fr_launcher_lensclearfilter2(inputs)
	if (locale === "de") return de_launcher_lensclearfilter2(inputs)
	if (locale === "ja") return ja_launcher_lensclearfilter2(inputs)
	if (locale === "ko") return ko_launcher_lensclearfilter2(inputs)
	if (locale === "zh-CN") return zh_cn2_launcher_lensclearfilter2(inputs)
	return ru_launcher_lensclearfilter2(inputs)
});
export { launcher_lensclearfilter2 as "launcher_lensClearFilter" }