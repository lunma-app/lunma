/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Launcher_Nomatches1Inputs */

const en_launcher_nomatches1 = /** @type {(inputs: Launcher_Nomatches1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`No matches`)
};

const es_launcher_nomatches1 = /** @type {(inputs: Launcher_Nomatches1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Sin coincidencias`)
};

const pt_pt2_launcher_nomatches1 = /** @type {(inputs: Launcher_Nomatches1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Sem resultados`)
};

const fr_launcher_nomatches1 = /** @type {(inputs: Launcher_Nomatches1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Aucun résultat`)
};

const de_launcher_nomatches1 = /** @type {(inputs: Launcher_Nomatches1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Keine Treffer`)
};

const ja_launcher_nomatches1 = /** @type {(inputs: Launcher_Nomatches1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`一致なし`)
};

const ko_launcher_nomatches1 = /** @type {(inputs: Launcher_Nomatches1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`일치 항목 없음`)
};

const zh_cn2_launcher_nomatches1 = /** @type {(inputs: Launcher_Nomatches1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`无匹配结果`)
};

const ru_launcher_nomatches1 = /** @type {(inputs: Launcher_Nomatches1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Нет совпадений`)
};

/**
* | output |
* | --- |
* | "No matches" |
*
* @param {Launcher_Nomatches1Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const launcher_nomatches1 = /** @type {((inputs?: Launcher_Nomatches1Inputs, options?: { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Launcher_Nomatches1Inputs, { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_launcher_nomatches1(inputs)
	if (locale === "es") return es_launcher_nomatches1(inputs)
	if (locale === "pt-PT") return pt_pt2_launcher_nomatches1(inputs)
	if (locale === "fr") return fr_launcher_nomatches1(inputs)
	if (locale === "de") return de_launcher_nomatches1(inputs)
	if (locale === "ja") return ja_launcher_nomatches1(inputs)
	if (locale === "ko") return ko_launcher_nomatches1(inputs)
	if (locale === "zh-CN") return zh_cn2_launcher_nomatches1(inputs)
	return ru_launcher_nomatches1(inputs)
});
export { launcher_nomatches1 as "launcher_noMatches" }