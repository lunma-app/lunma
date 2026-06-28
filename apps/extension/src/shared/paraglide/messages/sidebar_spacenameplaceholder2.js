/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Sidebar_Spacenameplaceholder2Inputs */

const en_sidebar_spacenameplaceholder2 = /** @type {(inputs: Sidebar_Spacenameplaceholder2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`e.g. Work, Reading, Personal`)
};

const es_sidebar_spacenameplaceholder2 = /** @type {(inputs: Sidebar_Spacenameplaceholder2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`p. ej. Trabajo, Lectura, Personal`)
};

const pt_pt2_sidebar_spacenameplaceholder2 = /** @type {(inputs: Sidebar_Spacenameplaceholder2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`ex.: Trabalho, Leitura, Pessoal`)
};

const fr_sidebar_spacenameplaceholder2 = /** @type {(inputs: Sidebar_Spacenameplaceholder2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`ex. Travail, Lecture, Personnel`)
};

const de_sidebar_spacenameplaceholder2 = /** @type {(inputs: Sidebar_Spacenameplaceholder2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`z. B. Arbeit, Lesen, Privat`)
};

const ja_sidebar_spacenameplaceholder2 = /** @type {(inputs: Sidebar_Spacenameplaceholder2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`例：仕事、読書、プライベート`)
};

const ko_sidebar_spacenameplaceholder2 = /** @type {(inputs: Sidebar_Spacenameplaceholder2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`예: 업무, 읽기, 개인`)
};

const zh_cn2_sidebar_spacenameplaceholder2 = /** @type {(inputs: Sidebar_Spacenameplaceholder2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`例如：工作、阅读、个人`)
};

const ru_sidebar_spacenameplaceholder2 = /** @type {(inputs: Sidebar_Spacenameplaceholder2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`напр. Работа, Чтение, Личное`)
};

/**
* | output |
* | --- |
* | "e.g. Work, Reading, Personal" |
*
* @param {Sidebar_Spacenameplaceholder2Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const sidebar_spacenameplaceholder2 = /** @type {((inputs?: Sidebar_Spacenameplaceholder2Inputs, options?: { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Sidebar_Spacenameplaceholder2Inputs, { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_sidebar_spacenameplaceholder2(inputs)
	if (locale === "es") return es_sidebar_spacenameplaceholder2(inputs)
	if (locale === "pt-PT") return pt_pt2_sidebar_spacenameplaceholder2(inputs)
	if (locale === "fr") return fr_sidebar_spacenameplaceholder2(inputs)
	if (locale === "de") return de_sidebar_spacenameplaceholder2(inputs)
	if (locale === "ja") return ja_sidebar_spacenameplaceholder2(inputs)
	if (locale === "ko") return ko_sidebar_spacenameplaceholder2(inputs)
	if (locale === "zh-CN") return zh_cn2_sidebar_spacenameplaceholder2(inputs)
	return ru_sidebar_spacenameplaceholder2(inputs)
});
export { sidebar_spacenameplaceholder2 as "sidebar_spaceNamePlaceholder" }