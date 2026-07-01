/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Common_Deselectall1Inputs */

const en_common_deselectall1 = /** @type {(inputs: Common_Deselectall1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Deselect all`)
};

const es_common_deselectall1 = /** @type {(inputs: Common_Deselectall1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Deseleccionar todo`)
};

const pt_common_deselectall1 = /** @type {(inputs: Common_Deselectall1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Desmarcar tudo`)
};

const fr_common_deselectall1 = /** @type {(inputs: Common_Deselectall1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Tout désélectionner`)
};

const de_common_deselectall1 = /** @type {(inputs: Common_Deselectall1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Alle abwählen`)
};

const ja_common_deselectall1 = /** @type {(inputs: Common_Deselectall1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`すべて解除`)
};

const ko_common_deselectall1 = /** @type {(inputs: Common_Deselectall1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`모두 해제`)
};

const zh_cn2_common_deselectall1 = /** @type {(inputs: Common_Deselectall1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`取消全选`)
};

const ru_common_deselectall1 = /** @type {(inputs: Common_Deselectall1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Снять выбор`)
};

/**
* | output |
* | --- |
* | "Deselect all" |
*
* @param {Common_Deselectall1Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const common_deselectall1 = /** @type {((inputs?: Common_Deselectall1Inputs, options?: { locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Common_Deselectall1Inputs, { locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_common_deselectall1(inputs)
	if (locale === "es") return es_common_deselectall1(inputs)
	if (locale === "pt") return pt_common_deselectall1(inputs)
	if (locale === "fr") return fr_common_deselectall1(inputs)
	if (locale === "de") return de_common_deselectall1(inputs)
	if (locale === "ja") return ja_common_deselectall1(inputs)
	if (locale === "ko") return ko_common_deselectall1(inputs)
	if (locale === "zh-CN") return zh_cn2_common_deselectall1(inputs)
	return ru_common_deselectall1(inputs)
});
export { common_deselectall1 as "common_deselectAll" }