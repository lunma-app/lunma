/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Options_Openshortcuts1Inputs */

const en_options_openshortcuts1 = /** @type {(inputs: Options_Openshortcuts1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Open keyboard shortcuts`)
};

const es_options_openshortcuts1 = /** @type {(inputs: Options_Openshortcuts1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Abrir atajos de teclado`)
};

const pt_pt2_options_openshortcuts1 = /** @type {(inputs: Options_Openshortcuts1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Abrir atalhos de teclado`)
};

const fr_options_openshortcuts1 = /** @type {(inputs: Options_Openshortcuts1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Ouvrir les raccourcis clavier`)
};

const de_options_openshortcuts1 = /** @type {(inputs: Options_Openshortcuts1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Tastaturkürzel öffnen`)
};

const ja_options_openshortcuts1 = /** @type {(inputs: Options_Openshortcuts1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`キーボードショートカットを開く`)
};

const ko_options_openshortcuts1 = /** @type {(inputs: Options_Openshortcuts1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`키보드 단축키 열기`)
};

const zh_cn2_options_openshortcuts1 = /** @type {(inputs: Options_Openshortcuts1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`打开键盘快捷键`)
};

const ru_options_openshortcuts1 = /** @type {(inputs: Options_Openshortcuts1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Открыть горячие клавиши`)
};

/**
* | output |
* | --- |
* | "Open keyboard shortcuts" |
*
* @param {Options_Openshortcuts1Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const options_openshortcuts1 = /** @type {((inputs?: Options_Openshortcuts1Inputs, options?: { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Options_Openshortcuts1Inputs, { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_options_openshortcuts1(inputs)
	if (locale === "es") return es_options_openshortcuts1(inputs)
	if (locale === "pt-PT") return pt_pt2_options_openshortcuts1(inputs)
	if (locale === "fr") return fr_options_openshortcuts1(inputs)
	if (locale === "de") return de_options_openshortcuts1(inputs)
	if (locale === "ja") return ja_options_openshortcuts1(inputs)
	if (locale === "ko") return ko_options_openshortcuts1(inputs)
	if (locale === "zh-CN") return zh_cn2_options_openshortcuts1(inputs)
	return ru_options_openshortcuts1(inputs)
});
export { options_openshortcuts1 as "options_openShortcuts" }