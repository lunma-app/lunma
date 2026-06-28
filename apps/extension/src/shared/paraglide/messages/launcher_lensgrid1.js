/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Launcher_Lensgrid1Inputs */

const en_launcher_lensgrid1 = /** @type {(inputs: Launcher_Lensgrid1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Grid`)
};

const es_launcher_lensgrid1 = /** @type {(inputs: Launcher_Lensgrid1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Cuadrícula`)
};

const pt_pt2_launcher_lensgrid1 = /** @type {(inputs: Launcher_Lensgrid1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Grelha`)
};

const fr_launcher_lensgrid1 = /** @type {(inputs: Launcher_Lensgrid1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Grille`)
};

const de_launcher_lensgrid1 = /** @type {(inputs: Launcher_Lensgrid1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Raster`)
};

const ja_launcher_lensgrid1 = /** @type {(inputs: Launcher_Lensgrid1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`グリッド`)
};

const ko_launcher_lensgrid1 = /** @type {(inputs: Launcher_Lensgrid1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`그리드`)
};

const zh_cn2_launcher_lensgrid1 = /** @type {(inputs: Launcher_Lensgrid1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`网格`)
};

const ru_launcher_lensgrid1 = /** @type {(inputs: Launcher_Lensgrid1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Сетка`)
};

/**
* | output |
* | --- |
* | "Grid" |
*
* @param {Launcher_Lensgrid1Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const launcher_lensgrid1 = /** @type {((inputs?: Launcher_Lensgrid1Inputs, options?: { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Launcher_Lensgrid1Inputs, { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_launcher_lensgrid1(inputs)
	if (locale === "es") return es_launcher_lensgrid1(inputs)
	if (locale === "pt-PT") return pt_pt2_launcher_lensgrid1(inputs)
	if (locale === "fr") return fr_launcher_lensgrid1(inputs)
	if (locale === "de") return de_launcher_lensgrid1(inputs)
	if (locale === "ja") return ja_launcher_lensgrid1(inputs)
	if (locale === "ko") return ko_launcher_lensgrid1(inputs)
	if (locale === "zh-CN") return zh_cn2_launcher_lensgrid1(inputs)
	return ru_launcher_lensgrid1(inputs)
});
export { launcher_lensgrid1 as "launcher_lensGrid" }