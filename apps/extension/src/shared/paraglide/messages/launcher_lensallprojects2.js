/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Launcher_Lensallprojects2Inputs */

const en_launcher_lensallprojects2 = /** @type {(inputs: Launcher_Lensallprojects2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`All projects`)
};

const es_launcher_lensallprojects2 = /** @type {(inputs: Launcher_Lensallprojects2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Todos los proyectos`)
};

const pt_pt2_launcher_lensallprojects2 = /** @type {(inputs: Launcher_Lensallprojects2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Todos os projetos`)
};

const fr_launcher_lensallprojects2 = /** @type {(inputs: Launcher_Lensallprojects2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Tous les projets`)
};

const de_launcher_lensallprojects2 = /** @type {(inputs: Launcher_Lensallprojects2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Alle Projekte`)
};

const ja_launcher_lensallprojects2 = /** @type {(inputs: Launcher_Lensallprojects2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`すべてのプロジェクト`)
};

const ko_launcher_lensallprojects2 = /** @type {(inputs: Launcher_Lensallprojects2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`모든 프로젝트`)
};

const zh_cn2_launcher_lensallprojects2 = /** @type {(inputs: Launcher_Lensallprojects2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`所有项目`)
};

const ru_launcher_lensallprojects2 = /** @type {(inputs: Launcher_Lensallprojects2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Все проекты`)
};

/**
* | output |
* | --- |
* | "All projects" |
*
* @param {Launcher_Lensallprojects2Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const launcher_lensallprojects2 = /** @type {((inputs?: Launcher_Lensallprojects2Inputs, options?: { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Launcher_Lensallprojects2Inputs, { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_launcher_lensallprojects2(inputs)
	if (locale === "es") return es_launcher_lensallprojects2(inputs)
	if (locale === "pt-PT") return pt_pt2_launcher_lensallprojects2(inputs)
	if (locale === "fr") return fr_launcher_lensallprojects2(inputs)
	if (locale === "de") return de_launcher_lensallprojects2(inputs)
	if (locale === "ja") return ja_launcher_lensallprojects2(inputs)
	if (locale === "ko") return ko_launcher_lensallprojects2(inputs)
	if (locale === "zh-CN") return zh_cn2_launcher_lensallprojects2(inputs)
	return ru_launcher_lensallprojects2(inputs)
});
export { launcher_lensallprojects2 as "launcher_lensAllProjects" }