/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Sidebar_Moveright1Inputs */

const en_sidebar_moveright1 = /** @type {(inputs: Sidebar_Moveright1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Move right`)
};

const es_sidebar_moveright1 = /** @type {(inputs: Sidebar_Moveright1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Mover a la derecha`)
};

const pt_sidebar_moveright1 = /** @type {(inputs: Sidebar_Moveright1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Mover para a direita`)
};

const fr_sidebar_moveright1 = /** @type {(inputs: Sidebar_Moveright1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Déplacer vers la droite`)
};

const de_sidebar_moveright1 = /** @type {(inputs: Sidebar_Moveright1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Nach rechts`)
};

const ja_sidebar_moveright1 = /** @type {(inputs: Sidebar_Moveright1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`右に移動`)
};

const ko_sidebar_moveright1 = /** @type {(inputs: Sidebar_Moveright1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`오른쪽으로 이동`)
};

const zh_cn2_sidebar_moveright1 = /** @type {(inputs: Sidebar_Moveright1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`右移`)
};

const ru_sidebar_moveright1 = /** @type {(inputs: Sidebar_Moveright1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Вправо`)
};

/**
* | output |
* | --- |
* | "Move right" |
*
* @param {Sidebar_Moveright1Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const sidebar_moveright1 = /** @type {((inputs?: Sidebar_Moveright1Inputs, options?: { locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Sidebar_Moveright1Inputs, { locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_sidebar_moveright1(inputs)
	if (locale === "es") return es_sidebar_moveright1(inputs)
	if (locale === "pt") return pt_sidebar_moveright1(inputs)
	if (locale === "fr") return fr_sidebar_moveright1(inputs)
	if (locale === "de") return de_sidebar_moveright1(inputs)
	if (locale === "ja") return ja_sidebar_moveright1(inputs)
	if (locale === "ko") return ko_sidebar_moveright1(inputs)
	if (locale === "zh-CN") return zh_cn2_sidebar_moveright1(inputs)
	return ru_sidebar_moveright1(inputs)
});
export { sidebar_moveright1 as "sidebar_moveRight" }