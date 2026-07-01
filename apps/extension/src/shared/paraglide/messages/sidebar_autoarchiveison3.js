/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Sidebar_Autoarchiveison3Inputs */

const en_sidebar_autoarchiveison3 = /** @type {(inputs: Sidebar_Autoarchiveison3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Auto-archive is on.`)
};

const es_sidebar_autoarchiveison3 = /** @type {(inputs: Sidebar_Autoarchiveison3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`El archivo automático está activado.`)
};

const pt_sidebar_autoarchiveison3 = /** @type {(inputs: Sidebar_Autoarchiveison3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Arquivo automático ativo.`)
};

const fr_sidebar_autoarchiveison3 = /** @type {(inputs: Sidebar_Autoarchiveison3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`L'archivage auto est activé.`)
};

const de_sidebar_autoarchiveison3 = /** @type {(inputs: Sidebar_Autoarchiveison3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Automatisches Archivieren ist aktiv.`)
};

const ja_sidebar_autoarchiveison3 = /** @type {(inputs: Sidebar_Autoarchiveison3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`自動アーカイブが有効です。`)
};

const ko_sidebar_autoarchiveison3 = /** @type {(inputs: Sidebar_Autoarchiveison3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`자동 보관이 켜져 있습니다.`)
};

const zh_cn2_sidebar_autoarchiveison3 = /** @type {(inputs: Sidebar_Autoarchiveison3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`自动归档已开启`)
};

const ru_sidebar_autoarchiveison3 = /** @type {(inputs: Sidebar_Autoarchiveison3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Авто-архивирование включено.`)
};

/**
* | output |
* | --- |
* | "Auto-archive is on." |
*
* @param {Sidebar_Autoarchiveison3Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const sidebar_autoarchiveison3 = /** @type {((inputs?: Sidebar_Autoarchiveison3Inputs, options?: { locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Sidebar_Autoarchiveison3Inputs, { locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_sidebar_autoarchiveison3(inputs)
	if (locale === "es") return es_sidebar_autoarchiveison3(inputs)
	if (locale === "pt") return pt_sidebar_autoarchiveison3(inputs)
	if (locale === "fr") return fr_sidebar_autoarchiveison3(inputs)
	if (locale === "de") return de_sidebar_autoarchiveison3(inputs)
	if (locale === "ja") return ja_sidebar_autoarchiveison3(inputs)
	if (locale === "ko") return ko_sidebar_autoarchiveison3(inputs)
	if (locale === "zh-CN") return zh_cn2_sidebar_autoarchiveison3(inputs)
	return ru_sidebar_autoarchiveison3(inputs)
});
export { sidebar_autoarchiveison3 as "sidebar_autoArchiveIsOn" }