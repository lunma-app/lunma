/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Launcher_Lensallrepos2Inputs */

const en_launcher_lensallrepos2 = /** @type {(inputs: Launcher_Lensallrepos2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`All repos`)
};

const es_launcher_lensallrepos2 = /** @type {(inputs: Launcher_Lensallrepos2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Todos los repositorios`)
};

const pt_pt2_launcher_lensallrepos2 = /** @type {(inputs: Launcher_Lensallrepos2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Todos os repositórios`)
};

const fr_launcher_lensallrepos2 = /** @type {(inputs: Launcher_Lensallrepos2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Tous les dépôts`)
};

const de_launcher_lensallrepos2 = /** @type {(inputs: Launcher_Lensallrepos2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Alle Repos`)
};

const ja_launcher_lensallrepos2 = /** @type {(inputs: Launcher_Lensallrepos2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`すべてのリポジトリ`)
};

const ko_launcher_lensallrepos2 = /** @type {(inputs: Launcher_Lensallrepos2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`모든 저장소`)
};

const zh_cn2_launcher_lensallrepos2 = /** @type {(inputs: Launcher_Lensallrepos2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`所有仓库`)
};

const ru_launcher_lensallrepos2 = /** @type {(inputs: Launcher_Lensallrepos2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Все репозитории`)
};

/**
* | output |
* | --- |
* | "All repos" |
*
* @param {Launcher_Lensallrepos2Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const launcher_lensallrepos2 = /** @type {((inputs?: Launcher_Lensallrepos2Inputs, options?: { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Launcher_Lensallrepos2Inputs, { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_launcher_lensallrepos2(inputs)
	if (locale === "es") return es_launcher_lensallrepos2(inputs)
	if (locale === "pt-PT") return pt_pt2_launcher_lensallrepos2(inputs)
	if (locale === "fr") return fr_launcher_lensallrepos2(inputs)
	if (locale === "de") return de_launcher_lensallrepos2(inputs)
	if (locale === "ja") return ja_launcher_lensallrepos2(inputs)
	if (locale === "ko") return ko_launcher_lensallrepos2(inputs)
	if (locale === "zh-CN") return zh_cn2_launcher_lensallrepos2(inputs)
	return ru_launcher_lensallrepos2(inputs)
});
export { launcher_lensallrepos2 as "launcher_lensAllRepos" }