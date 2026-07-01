/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Sidebar_Openlauncher1Inputs */

const en_sidebar_openlauncher1 = /** @type {(inputs: Sidebar_Openlauncher1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Open launcher`)
};

const es_sidebar_openlauncher1 = /** @type {(inputs: Sidebar_Openlauncher1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Abrir el lanzador`)
};

const pt_sidebar_openlauncher1 = /** @type {(inputs: Sidebar_Openlauncher1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Abrir launcher`)
};

const fr_sidebar_openlauncher1 = /** @type {(inputs: Sidebar_Openlauncher1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Ouvrir le lanceur`)
};

const de_sidebar_openlauncher1 = /** @type {(inputs: Sidebar_Openlauncher1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Launcher öffnen`)
};

const ja_sidebar_openlauncher1 = /** @type {(inputs: Sidebar_Openlauncher1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`ランチャーを開く`)
};

const ko_sidebar_openlauncher1 = /** @type {(inputs: Sidebar_Openlauncher1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`런처 열기`)
};

const zh_cn2_sidebar_openlauncher1 = /** @type {(inputs: Sidebar_Openlauncher1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`打开启动器`)
};

const ru_sidebar_openlauncher1 = /** @type {(inputs: Sidebar_Openlauncher1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Открыть лаунчер`)
};

/**
* | output |
* | --- |
* | "Open launcher" |
*
* @param {Sidebar_Openlauncher1Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const sidebar_openlauncher1 = /** @type {((inputs?: Sidebar_Openlauncher1Inputs, options?: { locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Sidebar_Openlauncher1Inputs, { locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_sidebar_openlauncher1(inputs)
	if (locale === "es") return es_sidebar_openlauncher1(inputs)
	if (locale === "pt") return pt_sidebar_openlauncher1(inputs)
	if (locale === "fr") return fr_sidebar_openlauncher1(inputs)
	if (locale === "de") return de_sidebar_openlauncher1(inputs)
	if (locale === "ja") return ja_sidebar_openlauncher1(inputs)
	if (locale === "ko") return ko_sidebar_openlauncher1(inputs)
	if (locale === "zh-CN") return zh_cn2_sidebar_openlauncher1(inputs)
	return ru_sidebar_openlauncher1(inputs)
});
export { sidebar_openlauncher1 as "sidebar_openLauncher" }