/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Launcher_Lensmissingtitle2Inputs */

const en_launcher_lensmissingtitle2 = /** @type {(inputs: Launcher_Lensmissingtitle2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`No lens to show`)
};

const es_launcher_lensmissingtitle2 = /** @type {(inputs: Launcher_Lensmissingtitle2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Sin lente que mostrar`)
};

const pt_launcher_lensmissingtitle2 = /** @type {(inputs: Launcher_Lensmissingtitle2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Sem lens para mostrar`)
};

const fr_launcher_lensmissingtitle2 = /** @type {(inputs: Launcher_Lensmissingtitle2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Aucune vue à afficher`)
};

const de_launcher_lensmissingtitle2 = /** @type {(inputs: Launcher_Lensmissingtitle2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Keine Lens vorhanden`)
};

const ja_launcher_lensmissingtitle2 = /** @type {(inputs: Launcher_Lensmissingtitle2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`表示するレンズがありません`)
};

const ko_launcher_lensmissingtitle2 = /** @type {(inputs: Launcher_Lensmissingtitle2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`표시할 렌즈 없음`)
};

const zh_cn2_launcher_lensmissingtitle2 = /** @type {(inputs: Launcher_Lensmissingtitle2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`无镜头可显示`)
};

const ru_launcher_lensmissingtitle2 = /** @type {(inputs: Launcher_Lensmissingtitle2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Нет линзы для отображения`)
};

/**
* | output |
* | --- |
* | "No lens to show" |
*
* @param {Launcher_Lensmissingtitle2Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const launcher_lensmissingtitle2 = /** @type {((inputs?: Launcher_Lensmissingtitle2Inputs, options?: { locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Launcher_Lensmissingtitle2Inputs, { locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_launcher_lensmissingtitle2(inputs)
	if (locale === "es") return es_launcher_lensmissingtitle2(inputs)
	if (locale === "pt") return pt_launcher_lensmissingtitle2(inputs)
	if (locale === "fr") return fr_launcher_lensmissingtitle2(inputs)
	if (locale === "de") return de_launcher_lensmissingtitle2(inputs)
	if (locale === "ja") return ja_launcher_lensmissingtitle2(inputs)
	if (locale === "ko") return ko_launcher_lensmissingtitle2(inputs)
	if (locale === "zh-CN") return zh_cn2_launcher_lensmissingtitle2(inputs)
	return ru_launcher_lensmissingtitle2(inputs)
});
export { launcher_lensmissingtitle2 as "launcher_lensMissingTitle" }